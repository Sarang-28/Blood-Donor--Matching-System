const {test}=require('node:test');
const assert=require('node:assert/strict');
// Never point the integration suite at production: an explicit isolated *_test DB is required.
if(!process.env.TEST_DATABASE_URL || !new URL(process.env.TEST_DATABASE_URL).pathname.endsWith('_test')) throw new Error('Set TEST_DATABASE_URL to an isolated database with a name ending in _test');
process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
for (const key of ['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_PHONE_NUMBER','FIREBASE_PROJECT_ID','FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY']) process.env[key]='';
process.env.NODE_ENV='test';process.env.DB_SSL='false';process.env.JWT_SECRET='integration-test-only-secret-key-123456';
const db=require('../src/config/db');
const app=require('../src/app');
const migrate=require('../database/migrate');
const fs=require('node:fs');
const path=require('node:path');
const {initializeSocket}=require('../src/config/socket');
const {io:connectSocket}=require('socket.io-client');
const password='test-passphrase-1234';
const suffix=Date.now();
let counter=0;
test('PostGIS API security and donation lifecycle',async t=>{
 const client=await db.getClient();
 try{await client.query(fs.readFileSync(path.join(__dirname,'../database/schema.sql'),'utf8'));await migrate(client);await migrate(client);await client.query('TRUNCATE users,donors,patients,hospitals,blood_banks,blood_inventory,blood_requests,donor_matches,donations,notifications,verifications_log,audit_logs,request_status_history,notification_deliveries CASCADE');}finally{client.release();}
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const sockets=initializeSocket(server);
 const base=`http://127.0.0.1:${server.address().port}`;
 async function api(method,url,body,token){const res=await fetch(base+'/api'+url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:res.status,...await res.json()};}
 async function register(role,extra={}){
  counter++;const body={email:`test-${suffix}-${counter}@example.test`,password,role,phone:`+919${String(suffix).slice(-6)}${String(counter).padStart(3,'0')}`,fullName:'Synthetic Test User',organizationName:'Synthetic Hospital',bloodGroup:'O-',age:30,weightKg:65,location:'Synthetic area',latitude:18.52,longitude:73.85,locationConsent:true,hospitalRegistrationNumber:`TEST-${suffix}-${counter}`,licenseNumber:`TEST-${suffix}-${counter}`,...extra};
  const r=await api('POST','/auth/register',body);assert.equal(r.status,201,JSON.stringify(r));return {...r.data,password,email:body.email};
 }
 try{
  await t.test('unauthenticated donor root and untrusted origins denied',async()=>{assert.equal((await api('GET','/donors')).status,401);const r=await fetch(base+'/api/health',{headers:{Origin:'https://attacker.invalid'}});assert.equal(r.status,403);});
  await t.test('public admin escalation denied',async()=>{assert.equal((await api('POST','/auth/register',{role:'admin',email:'a@example.test',phone:'123',password})).status,400);});
  const donor=await register('donor');const patient=await register('patient');const stranger=await register('patient');const hospital=await register('hospital');const distant=await register('donor',{latitude:19.5,longitude:75});const cooldown=await register('donor',{lastDonationDate:new Date().toISOString().slice(0,10)});
  const admin=await register('patient');await db.query("UPDATE users SET role='admin' WHERE id=$1",[admin.user.id]);
  await t.test('invalid credentials and non-admin access denied',async()=>{assert.equal((await api('POST','/auth/login',{email:donor.email,password:'wrong'})).status,401);assert.equal((await api('GET','/admin/stats',null,patient.token)).status,403);});
  await t.test('hospital verification and audit record',async()=>{const r=await api('PATCH',`/admin/verifications/hospital/${hospital.profile.id}`,{action:'verified'},admin.token);assert.equal(r.status,200);assert.equal((await db.query('SELECT 1 FROM verifications_log WHERE target_id=$1',[hospital.profile.id])).rowCount,1);});
  let request;
  await t.test('create real location request, filter eligibility and geography',async()=>{
   const r=await api('POST','/blood-requests',{patientName:'Synthetic patient',hospitalName:'Synthetic Hospital',bloodGroup:'A+',unitsRequired:2,locationName:'Synthetic area',latitude:18.52,longitude:73.85,hospitalId:hospital.profile.id},patient.token);assert.equal(r.status,201,JSON.stringify(r));request=r.data.request;
   assert.equal(r.data.matchedDonorsCount,1);assert.equal(r.data.matchedDonors[0].phone,undefined);assert.equal(r.data.matchedDonors[0].email,undefined);
   const ids=(await db.query('SELECT donor_id FROM donor_matches WHERE blood_request_id=$1',[request.id])).rows.map(x=>x.donor_id);assert.deepEqual(ids,[donor.profile.id]);
  });
  await t.test('private request and cancellation protected from other users',async()=>{assert.equal((await api('GET',`/blood-requests/${request.id}`,null,stranger.token)).status,403);assert.equal((await api('PATCH',`/blood-requests/${request.id}/status`,{status:'cancelled'},stranger.token)).status,409);});
  await t.test('duplicate request and invalid coordinates denied',async()=>{const body={patientName:'Synthetic patient',hospitalName:'Synthetic Hospital',bloodGroup:'A+',unitsRequired:2,locationName:'area',latitude:18.52,longitude:73.85};assert.equal((await api('POST','/blood-requests',body,patient.token)).status,409);assert.equal((await api('POST','/blood-requests',{...body,latitude:999},patient.token)).status,400);});
  await t.test('matching reruns do not create duplicate invitations',async()=>{const before=await db.query('SELECT COUNT(*) FROM notifications WHERE user_id=$1',[donor.user.id]);await api('POST',`/matches/${request.id}/trigger`,{},admin.token);assert.equal((await db.query('SELECT COUNT(*) FROM notifications WHERE user_id=$1',[donor.user.id])).rows[0].count,before.rows[0].count);});
  let match,otp;
  await t.test('concurrent acceptance has a single winner and OTP never stored plaintext',async()=>{match=(await api('GET','/matches/my-alerts',null,donor.token)).data.find(m=>m.requestId===request.id);const responses=await Promise.all([api('PATCH',`/matches/${match.matchId}/respond`,{response:'accepted'},donor.token),api('PATCH',`/matches/${match.matchId}/respond`,{response:'accepted'},donor.token)]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);otp=responses.find(r=>r.status===200).data.otpCode;const saved=(await db.query('SELECT otp_code,otp_hash FROM donor_matches WHERE id=$1',[match.matchId])).rows[0];assert.equal(saved.otp_code,null);assert.notEqual(saved.otp_hash,otp);});
  await t.test('socket authentication and room ownership',async()=>{
   if (!match) return;
   const socket=connectSocket(base,{auth:{token:stranger.token},transports:['websocket']});
   await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});
   const result=await new Promise(resolve=>socket.emit('join_tracking_room',{matchId:match.matchId},resolve));assert.equal(result.success,false);socket.disconnect();
   const bad=connectSocket(base,{transports:['websocket'],reconnection:false});const error=await new Promise(resolve=>bad.once('connect_error',resolve));assert.match(error.message,/Authentication/);bad.disconnect();
  });
  await t.test('acceptance notifies the patient but keeps contact private until approval',async()=>{
   const alerts=await api('GET','/matches/my-alerts',null,donor.token);
   const pending=alerts.data.find(m=>m.matchId===match.matchId);
   assert.equal(pending.requesterDecision,'pending');assert.equal(pending.contactDetails,null);
   assert.equal(pending.contactPhone,undefined);assert.equal(pending.locationName,undefined);
   const feed=await api('GET','/blood-requests',null,donor.token);
   const summary=feed.data.find(r=>r.id===request.id);assert.equal(summary.latitude,undefined);assert.equal(summary.longitude,undefined);
   const notifications=await api('GET','/notifications',null,patient.token);
   assert.equal(notifications.data.notifications.filter(n=>n.payload.matchId===match.matchId && n.payload.action==='review_donor').length,1);
   for(const identity of [stranger,hospital,donor])assert.equal((await api('PATCH',`/matches/${match.matchId}/review`,{decision:'approved'},identity.token)).status,403);
   const before=await api('POST','/matches/record-donation',{bloodRequestId:request.id,donorId:donor.profile.id,otpCode:otp},hospital.token);assert.equal(before.status,400);
   const socket=connectSocket(base,{auth:{token:donor.token},transports:['websocket']});
   await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});
   try{const ack=await new Promise(resolve=>socket.emit('join_tracking_room',{matchId:match.matchId},resolve));assert.equal(ack.success,false);}finally{socket.disconnect();}
  });
  await t.test('patient approval atomically unlocks contact for only the approved donor',async()=>{
   const decisions=await Promise.all([api('PATCH',`/matches/${match.matchId}/review`,{decision:'approved'},patient.token),api('PATCH',`/matches/${match.matchId}/review`,{decision:'approved'},patient.token)]);
   assert.deepEqual(decisions.map(r=>r.status).sort(),[200,409]);
   const approved=(await api('GET','/matches/my-alerts',null,donor.token)).data.find(m=>m.matchId===match.matchId);
   assert.equal(approved.requesterDecision,'approved');assert.equal(approved.contactDetails.patientName,request.patient_name);
   assert.equal(approved.contactDetails.contactPhone,request.contact_phone);assert.equal(typeof approved.contactDetails.latitude,'number');
   const otherAlerts=await api('GET','/matches/my-alerts',null,cooldown.token);assert.ok(otherAlerts.data.every(m=>m.contactDetails===null));
   const notifications=await api('GET','/notifications',null,donor.token);assert.equal(notifications.data.notifications.filter(n=>n.payload.matchId===match.matchId && n.payload.action==='view_donor_portal').length,1);
   const socket=connectSocket(base,{auth:{token:donor.token},transports:['websocket']});
   await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});
   try{const ack=await new Promise(resolve=>socket.emit('join_tracking_room',{matchId:match.matchId},resolve));assert.equal(ack.success,true);}finally{socket.disconnect();}
  });
  await t.test('verified hospital confirms partial donation exactly once',async()=>{const payload={bloodRequestId:request.id,donorId:donor.profile.id,otpCode:otp,unitsDonated:1};const r=await Promise.all([api('POST','/matches/record-donation',payload,hospital.token),api('POST','/matches/record-donation',payload,hospital.token)]);assert.equal(r.filter(x=>x.status===201).length,1,JSON.stringify(r));assert.equal((await db.query('SELECT units_fulfilled FROM blood_requests WHERE id=$1',[request.id])).rows[0].units_fulfilled,1);assert.equal((await db.query('SELECT total_donations FROM donors WHERE id=$1',[donor.profile.id])).rows[0].total_donations,1);});
  await t.test('request cancellation has history and cannot reopen',async()=>{assert.equal((await api('PATCH',`/blood-requests/${request.id}/status`,{status:'cancelled'},patient.token)).status,200);assert.equal((await api('PATCH',`/blood-requests/${request.id}/status`,{status:'active'},patient.token)).status,400);assert.ok((await db.query('SELECT 1 FROM request_status_history WHERE blood_request_id=$1',[request.id])).rowCount>=2);});
  await t.test('donor profile privacy and history cannot be backdated',async()=>{
   const p=await api('GET','/donors/profile',null,donor.token);assert.equal(p.status,200);assert.equal(p.data.eligible,false);
   const update=await api('PUT','/donors/profile',{lastDonationDate:'2020-01-01'},donor.token);assert.equal(update.status,200);
   const date=(await db.query('SELECT last_donation_date::text AS date FROM donors WHERE id=$1',[donor.profile.id])).rows[0].date;assert.equal(date,new Date().toISOString().slice(0,10));
   const search=await api('GET','/donors',null,patient.token);assert.equal(search.status,200);assert.ok(search.data.donors.every(d=>!('phone' in d)&&!('latitude' in d)));
  });
  await t.test('new settings persist and non-admin settings changes are rejected',async()=>{
   assert.equal((await api('PUT','/settings',{radiusKm:8,cooldownDays:90},patient.token)).status,403);
   const save=await api('PUT','/settings',{radiusKm:10,cooldownDays:90},admin.token);assert.equal(save.status,200,JSON.stringify(save));
   assert.equal((await api('GET','/settings')).data.radiusKm,10);
  });
  await t.test('NGO verification and authorized assignment',async()=>{
   const ngo=await register('ngo');assert.ok(ngo.user.availableRoles.includes('ngo'));assert.ok(!ngo.user.availableRoles.includes('blood_bank'));
   const verification=await api('PATCH',`/admin/verifications/ngo/${ngo.profile.id}`,{action:'verified'},admin.token);assert.equal(verification.status,200,JSON.stringify(verification));
   assert.equal((await api('POST',`/blood-requests/${request.id}/assign-ngo`,{ngoId:ngo.profile.id},stranger.token)).status,409);
   assert.equal((await api('POST',`/blood-requests/${request.id}/assign-ngo`,{ngoId:ngo.profile.id},patient.token)).status,200);
   const assignments=await api('GET','/ngos/assignments',null,ngo.token);assert.equal(assignments.data.length,1);assert.equal(assignments.data[0].contact_phone,undefined);
  });
  await t.test('update active request and expire it with an auditable lifecycle',async()=>{
   const created=await api('POST','/blood-requests',{patientName:'Synthetic',hospitalName:'Other hospital',bloodGroup:'B+',unitsRequired:1,locationName:'Synthetic',latitude:18.52,longitude:73.85},patient.token);
   assert.equal(created.status,201);const id=created.data.request.id;
   const update=await api('PATCH',`/blood-requests/${id}`,{urgency:'Critical',unitsRequired:2},patient.token);assert.equal(update.status,200,JSON.stringify(update));
   await db.query("UPDATE blood_requests SET required_before=NOW()-INTERVAL '1 hour' WHERE id=$1",[id]);
   await require('../database/expireRequests')();assert.equal((await db.query('SELECT status FROM blood_requests WHERE id=$1',[id])).rows[0].status,'expired');
  });
  await t.test('suspension revokes sessions and admin cannot suspend self',async()=>{
   assert.equal((await api('PATCH',`/admin/users/${admin.user.id}/status`,{isActive:false},admin.token)).status,400);
   const update=await api('PATCH',`/admin/users/${distant.user.id}/status`,{isActive:false},admin.token);assert.equal(update.status,200,JSON.stringify(update));
   assert.equal((await api('GET','/auth/me',null,distant.token)).status,401);
  });
  await t.test('two accepted donors compete safely for one approval slot; rejection keeps contact private',async()=>{
   const first=await register('donor');const second=await register('donor');
   const created=await api('POST','/blood-requests',{patientName:'Private approval patient',hospitalName:'Approval concurrency hospital',bloodGroup:'AB+',unitsRequired:1,locationName:'Private meeting destination',latitude:18.52,longitude:73.85},patient.token);
   assert.equal(created.status,201);const id=created.data.request.id;
   const offers=await Promise.all([api('POST','/matches/manual-offer',{requestId:id},first.token),api('POST','/matches/manual-offer',{requestId:id},second.token)]);
   assert.ok(offers.every(r=>r.status===200),JSON.stringify(offers));
   const reviews=await Promise.all(offers.map(r=>api('PATCH',`/matches/${r.data.id}/review`,{decision:'approved'},patient.token)));
   assert.deepEqual(reviews.map(r=>r.status).sort(),[200,409]);
   const rejectedIndex=reviews.findIndex(r=>r.status===409), rejected=offers[rejectedIndex];
   assert.equal((await api('PATCH',`/matches/${rejected.data.id}/review`,{decision:'rejected'},patient.token)).status,200);
   const hidden=(await api('GET','/matches/my-alerts',null,[first,second][rejectedIndex].token)).data.find(m=>m.requestId===id);
   assert.equal(hidden.requesterDecision,'rejected');assert.equal(hidden.contactDetails,null);
   assert.equal((await api('PATCH',`/matches/${rejected.data.id}/review`,{decision:'approved'},patient.token)).status,409);
   await api('PATCH',`/blood-requests/${id}/status`,{status:'cancelled'},patient.token);
   const winner=(await api('GET','/matches/my-alerts',null,[first,second][1-rejectedIndex].token)).data.find(m=>m.requestId===id);assert.equal(winner.contactDetails,null);
  });
  await t.test('password change revokes old tokens and old password',async()=>{const r=await api('POST','/auth/change-password',{currentPassword:password,newPassword:'new-test-passphrase-1234'},stranger.token);assert.equal(r.status,200);assert.equal((await api('GET','/auth/me',null,stranger.token)).status,401);});
  await t.test('logout revokes token server-side',async()=>{assert.equal((await api('POST','/auth/logout',{},donor.token)).status,200);assert.equal((await api('GET','/auth/me',null,donor.token)).status,401);});
  await t.test('reports are aggregate and providers report unconfigured',async()=>{assert.equal((await api('GET','/admin/reports',null,admin.token)).status,200);const sms=await require('../src/services/twilioService').sendSms('+10000000000','test');assert.equal(sms.status,'unconfigured');});
 }finally{await new Promise(r=>sockets.close(r));await new Promise(r=>server.close(r));await db.pool.end();}
});
