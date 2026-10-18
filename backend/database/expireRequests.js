const db=require('../src/config/db');
async function expireRequests(){
 const client=await db.getClient();
 try{await client.query('BEGIN');
 const expired=await client.query("UPDATE blood_requests SET status='expired',updated_at=NOW() WHERE status IN ('active','matching') AND required_before<=NOW() RETURNING id");
 await client.query("UPDATE donor_matches SET match_status='expired',otp_hash=NULL WHERE match_status IN ('notified','accepted') AND blood_request_id=ANY($1::uuid[])",[expired.rows.map(r=>r.id)]);
 await client.query('COMMIT');return expired.rowCount;
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
if(require.main===module) expireRequests().then(n=>console.log(`Expired ${n} requests`)).catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>db.pool.end());
module.exports=expireRequests;
