const db = require('../config/db');
const donorMatchingService = require('../services/donorMatchingService');
const { apiSuccess, apiError } = require('../utils/apiResponse');

/**
 * Get match alerts sent to current logged in donor
 */
const getMyMatchAlerts = async (req, res, next) => {
    try {
        const query = `
            SELECT
                dm.id AS "matchId",
                dm.distance_meters AS "distanceMeters",
                ROUND((dm.distance_meters / 1000.0)::numeric, 2) AS "distanceKm",
                dm.is_exact_group AS "isExactGroup",
                dm.match_status AS "matchStatus",
                dm.requester_decision AS "requesterDecision",
                dm.notified_at AS "notifiedAt",
                dm.responded_at AS "respondedAt",

                dm.otp_expires_at AS "otpExpiresAt",
                br.id AS "requestId",
                br.blood_group AS "bloodGroup",
                br.units_required AS "unitsRequired",
                br.urgency,
                br.hospital_name AS "hospitalName",
                CASE WHEN dm.match_status='accepted' AND dm.requester_decision='approved'
                    AND br.status IN ('active','matching') AND (br.required_before IS NULL OR br.required_before>NOW())
                    THEN jsonb_build_object('patientName',br.patient_name,'contactPhone',br.contact_phone,
                        'locationName',br.location_name,'latitude',ST_Y(br.geom),'longitude',ST_X(br.geom),
                        'hospitalName',br.hospital_name) ELSE NULL END AS "contactDetails",
                br.status AS "requestStatus",
                br.required_before AS "requiredBefore"
            FROM donor_matches dm
            JOIN donors d ON dm.donor_id = d.id
            JOIN blood_requests br ON dm.blood_request_id = br.id
            WHERE d.user_id = $1
            ORDER BY
                CASE WHEN dm.match_status = 'notified' THEN 1 ELSE 2 END,
                dm.notified_at DESC;
        `;
        const result = await db.query(query, [req.user.id]);
        return apiSuccess(res, result.rows);
    } catch (error) {
        next(error);
    }
};


const { fail, createOtp, hashOtp, safeDonor } = require('../utils/security');
const { getCompatibleDonorGroups } = require('../constants/bloodCompatibility');
const { isValidCoordinates } = require('../utils/geoUtils');
async function transaction(work) {
    const client = await db.getClient();
    try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; }
    catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
}
async function lockRequest(client, id) {
    const r = await client.query('SELECT * FROM blood_requests WHERE id=$1 FOR UPDATE', [id]);
    if (!r.rowCount) throw fail('Request not found.', 404);
    const request = r.rows[0];
    if (!['active','matching'].includes(request.status) || (request.required_before && new Date(request.required_before) <= new Date())) throw fail('Request is closed or expired.', 409);
    return request;
}
async function eligibleDonor(client, userId, request) {
    const result = await client.query(`SELECT *, (last_donation_date IS NULL OR last_donation_date <= CURRENT_DATE - $2::integer) AS eligible
        FROM donors WHERE user_id=$1 FOR UPDATE`, [userId, (await require('../services/settingsService')()).cooldownDays]);
    const d = result.rows[0];
    if (!d || d.availability_status !== 'Available' || !d.eligible || d.location_consent === false || d.age < 18 || d.age > 65 || !d.age || Number(d.weight_kg) < 45 || !getCompatibleDonorGroups(request.blood_group).includes(d.blood_group)) throw fail('Donor is unavailable, incompatible, or outside configured eligibility rules.', 409);
    return d;
}
const respondToMatch = async (req, res, next) => {
    try {
        if (!['accepted','declined'].includes(req.body.response)) throw fail('Response must be accepted or declined.');
        const result = await transaction(async client => {
            const lookup = await client.query('SELECT blood_request_id FROM donor_matches WHERE id=$1', [req.params.matchId]);
            if (!lookup.rowCount) throw fail('Match not found.',404);
            const request = await lockRequest(client, lookup.rows[0].blood_request_id);
            const m = await client.query('SELECT dm.* FROM donor_matches dm JOIN donors d ON d.id=dm.donor_id WHERE dm.id=$1 AND d.user_id=$2 FOR UPDATE OF dm', [req.params.matchId, req.user.id]);
            if (!m.rowCount) throw fail('Match not found.',404);
            if (m.rows[0].match_status !== 'notified') throw fail('This invitation has already been answered.',409);
            if (req.body.response === 'accepted') await eligibleDonor(client, req.user.id, request);
            const otpCode = req.body.response === 'accepted' ? createOtp() : null;
            await client.query(`UPDATE donor_matches SET match_status=$1, responded_at=NOW(), otp_hash=$2, otp_expires_at=NOW()+INTERVAL '12 hours', otp_attempts=0 WHERE id=$3`, [req.body.response, otpCode ? hashOtp(otpCode) : null, req.params.matchId]);
            await client.query(`INSERT INTO notifications(user_id,title,body,type,data_payload) VALUES($1,'Donor response',$2,'request_update',$3)`, [request.requester_user_id, req.body.response === 'accepted' ? 'A donor accepted your request. Review the donor and approve to share your contact number and destination.' : 'A donor declined your invitation.', JSON.stringify({requestId: request.id, matchId: req.params.matchId, action: 'review_donor'})]);
            return { id:req.params.matchId, matchStatus:req.body.response, otpCode };
        });
        return apiSuccess(res,{...result,requesterDecision:'pending'},'Response recorded. Wait for requester approval before contacting or travelling. Keep your confirmation code for the hospital.');
    } catch (error) { next(error); }
};
const manualOffer = async (req,res,next) => {
    try {
        const result = await transaction(async client => {
            const request = await lockRequest(client, req.body.requestId);
            const donor = await eligibleDonor(client, req.user.id, request);
            const distance = await client.query('SELECT ST_Distance(d.geom::geography,br.geom::geography) AS meters FROM donors d CROSS JOIN blood_requests br WHERE d.id=$1 AND br.id=$2', [donor.id,request.id]);
            if (Number(distance.rows[0].meters) > (await require('../services/settingsService')()).radiusKm * 1000) throw fail('Request is outside the configured matching radius.',409);
            const otpCode=createOtp();
            const m=await client.query(`INSERT INTO donor_matches(blood_request_id,donor_id,distance_meters,is_exact_group,match_status,responded_at,otp_hash,otp_expires_at)
                VALUES($1,$2,$3,$4,'accepted',NOW(),$5,NOW()+INTERVAL '12 hours')
                ON CONFLICT(blood_request_id,donor_id) DO UPDATE SET match_status='accepted',responded_at=NOW(),otp_hash=EXCLUDED.otp_hash,otp_expires_at=EXCLUDED.otp_expires_at
                WHERE donor_matches.match_status='notified' RETURNING id`, [request.id,donor.id,distance.rows[0].meters,donor.blood_group===request.blood_group,hashOtp(otpCode)]);
            if (!m.rowCount) throw fail('Invitation already answered. Check your donor portal.',409);
            await client.query(`INSERT INTO notifications(user_id,title,body,type,data_payload) VALUES($1,'Donor accepted','A donor offered to help. Review and approve to share your contact number and destination.','request_update',$2)`,[request.requester_user_id,JSON.stringify({requestId:request.id,matchId:m.rows[0].id,action:'review_donor'})]);
            return {...m.rows[0],otpCode,matchStatus:'accepted',requesterDecision:'pending'};
        });
        return apiSuccess(res,result,'Offer recorded. Waiting for requester approval. Save the confirmation code for the hospital.');
    } catch(error) {next(error);}
};
const matchRequest=async(req,res,next)=>{
    try {
        const r=await db.query('SELECT * FROM blood_requests WHERE id=$1',[req.params.requestId]);
        if(!r.rowCount) throw fail('Request not found.',404);
        if(req.user.role!=='admin' && r.rows[0].requester_user_id!==req.user.id) throw fail('Only the request owner can trigger matching.',403);
        const result=await donorMatchingService.matchAndNotifyDonors(r.rows[0], req.body.radiusKm);
        return apiSuccess(res,{...result,donors:result.donors.map(safeDonor)});
    }catch(error){next(error);}
};
const recordDonation=async(req,res,next)=>{
    try {
        const {bloodRequestId, donorId, otpCode, unitsDonated=1, notes=''}=req.body;
        if(!bloodRequestId || !/^\d{6}$/.test(String(otpCode))) throw fail('Request and six digit donor confirmation code are required.');
        const result=await transaction(async client=>{
            const request=await lockRequest(client,bloodRequestId);
            const h=await client.query("SELECT id FROM hospitals WHERE user_id=$1 AND verification_status='verified'",[req.user.id]);
            if(!h.rowCount || (request.requester_user_id!==req.user.id && request.assigned_hospital_id!==h.rows[0].id)) throw fail('Only the assigned verified hospital can confirm this request.',403);
            const matches=await client.query(`SELECT * FROM donor_matches WHERE blood_request_id=$1 AND match_status='accepted' AND requester_decision='approved' AND ($2::uuid IS NULL OR donor_id=$2) FOR UPDATE`,[bloodRequestId,donorId||null]);
            const match=matches.rows.find(m=>m.otp_hash===hashOtp(otpCode));
            if(!match || match.otp_attempts>=5 || !match.otp_expires_at || new Date(match.otp_expires_at)<=new Date()) {
                await client.query("UPDATE donor_matches SET otp_attempts=otp_attempts+1 WHERE blood_request_id=$1 AND match_status='accepted'",[bloodRequestId]);
                return {invalidCode:true}; // Commit attempt counter, then report failure outside the transaction.
            }
            if(Number(unitsDonated)>request.units_required-request.units_fulfilled) throw fail('Donation exceeds remaining units.',409);
            const reservations=await client.query("SELECT COUNT(*)::integer AS count FROM donor_matches WHERE blood_request_id=$1 AND match_status='accepted' AND requester_decision='approved' AND id<>$2",[bloodRequestId,match.id]);
            if(Number(unitsDonated)>request.units_required-request.units_fulfilled-reservations.rows[0].count) throw fail('Units are reserved for other approved donors.',409);
            const donor=await client.query('SELECT user_id FROM donors WHERE id=$1',[match.donor_id]);
            await eligibleDonor(client,donor.rows[0].user_id,request);
            const donation=await client.query(`INSERT INTO donations(blood_request_id,donor_id,hospital_id,units_donated,certificate_number,notes) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[bloodRequestId,match.donor_id,h.rows[0].id,unitsDonated,require('node:crypto').randomUUID(),notes]);
            await client.query('UPDATE donors SET last_donation_date=CURRENT_DATE,total_donations=total_donations+1 WHERE id=$1',[match.donor_id]);
            await client.query("UPDATE donor_matches SET match_status='completed',otp_hash=NULL,otp_code=NULL WHERE id=$1",[match.id]);
            await client.query(`UPDATE blood_requests SET units_fulfilled=units_fulfilled+$1,status=CASE WHEN units_fulfilled+$1=units_required THEN 'fulfilled'::request_status ELSE status END,
                fulfilled_at=CASE WHEN units_fulfilled+$1=units_required THEN NOW() ELSE NULL END,updated_at=NOW() WHERE id=$2`,[unitsDonated,bloodRequestId]);
            await client.query("INSERT INTO audit_logs(actor_user_id,action,target_id) VALUES($1,'donation.confirmed',$2)",[req.user.id,donation.rows[0].id]);
            await client.query(`INSERT INTO notifications(user_id,title,body,type,data_payload) SELECT id,'Donation confirmed','A hospital verified a donation for your request.','request_update',$3 FROM users WHERE id IN ($1,$2)`,[request.requester_user_id,donor.rows[0].user_id,JSON.stringify({requestId:bloodRequestId})]);
            return donation.rows[0];
        });
        if(result.invalidCode) throw fail('Invalid, expired or locked confirmation code.',400);
        return apiSuccess(res,result,'Donation verified.',201);
    }catch(error){next(error);}
};
const reviewDonor = async (req,res,next) => {
    try {
        const {decision}=req.body;
        if(!['approved','rejected'].includes(decision)) throw fail('Decision must be approved or rejected.');
        const result=await transaction(async client=>{
            const lookup=await client.query('SELECT blood_request_id FROM donor_matches WHERE id=$1',[req.params.matchId]);
            if(!lookup.rowCount) throw fail('Match not found.',404);
            const request=await lockRequest(client,lookup.rows[0].blood_request_id);
            if(request.requester_user_id!==req.user.id) throw fail('Only the request creator can approve contact sharing.',403);
            const matches=await client.query(`SELECT dm.*,d.user_id FROM donor_matches dm JOIN donors d ON d.id=dm.donor_id WHERE dm.id=$1 FOR UPDATE OF dm`,[req.params.matchId]);
            const match=matches.rows[0];
            if(match.match_status!=='accepted' || match.requester_decision!=='pending') throw fail('Only an accepted donor awaiting review can be decided.',409);
            if(decision==='approved') {
                const active=await client.query('SELECT is_active FROM users WHERE id=$1',[match.user_id]);
                if(!active.rows[0]?.is_active) throw fail('This donor account is unavailable.',409);
                await eligibleDonor(client,match.user_id,request);
                const reserved=await client.query("SELECT COUNT(*)::integer AS count FROM donor_matches WHERE blood_request_id=$1 AND match_status='accepted' AND requester_decision='approved'",[request.id]);
                if(reserved.rows[0].count>=request.units_required-request.units_fulfilled) throw fail('All remaining donor slots are already approved.',409);
            }
            await client.query(`UPDATE donor_matches SET requester_decision=$1,requester_decided_at=NOW(),requester_decided_by=$2,
                otp_hash=CASE WHEN $1='rejected' THEN NULL ELSE otp_hash END WHERE id=$3`,[decision,req.user.id,match.id]);
            await client.query(`INSERT INTO notifications(user_id,title,body,type,data_payload) VALUES($1,$2,$3,'request_update',$4)`,[
                match.user_id,decision==='approved'?'Donation offer approved':'Donation offer not selected',
                decision==='approved'?'The requester approved your offer. Open your donor portal to view the contact number and destination.':'Your offer was not selected. Contact details remain private.',
                JSON.stringify({requestId:request.id,matchId:match.id,action:'view_donor_portal'})]);
            await client.query("INSERT INTO audit_logs(actor_user_id,action,target_id,metadata) VALUES($1,'match.requester_review',$2,$3)",[req.user.id,match.id,JSON.stringify({decision})]);
            return {matchId:match.id,requesterDecision:decision};
        });
        return apiSuccess(res,result,result.requesterDecision==='approved'?'Donor approved. Your request contact number and destination are now shared with this donor.':'Donor rejected. Contact details remain private.');
    } catch(error) {next(error);}
};

const updateLiveLocation = async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const { latitude, longitude } = req.body;
        if (!isValidCoordinates(latitude, longitude)) {
            throw fail('Valid latitude and longitude are required.', 400);
        }
        const matchRes = await db.query(`
            SELECT dm.id FROM donor_matches dm
            JOIN donors d ON d.id = dm.donor_id
            JOIN blood_requests br ON br.id = dm.blood_request_id
            WHERE dm.id = $1 AND d.user_id = $2
              AND dm.match_status = 'accepted' AND dm.requester_decision = 'approved'
              AND br.status IN ('active', 'matching')
        `, [matchId, req.user.id]);
        if (!matchRes.rowCount) throw fail('Live tracking is not active or authorized for this match.', 403);

        await db.query(`
            UPDATE donor_matches
            SET current_latitude = $1, current_longitude = $2, last_tracked_at = NOW()
            WHERE id = $3
        `, [latitude, longitude, matchId]);

        return apiSuccess(res, { matchId, latitude, longitude, updated: true }, 'Live location updated.');
    } catch (error) {
        next(error);
    }
};

const getLiveLocation = async (req, res, next) => {
    try {
        const { matchId } = req.params;
        const matchRes = await db.query(`
            SELECT
                dm.id,
                dm.current_latitude AS latitude,
                dm.current_longitude AS longitude,
                dm.last_tracked_at AS "lastTrackedAt",
                (dm.last_tracked_at IS NOT NULL AND dm.last_tracked_at > NOW() - INTERVAL '2 minutes') AS "isLive",
                d.full_name AS "donorName",
                br.hospital_name AS "hospitalName"
            FROM donor_matches dm
            JOIN donors d ON d.id = dm.donor_id
            JOIN blood_requests br ON br.id = dm.blood_request_id
            WHERE dm.id = $1
              AND (d.user_id = $2 OR br.requester_user_id = $2)
              AND dm.match_status = 'accepted' AND dm.requester_decision = 'approved'
        `, [matchId, req.user.id]);
        if (!matchRes.rowCount) throw fail('Tracking data not found or unauthorized.', 403);

        const row = matchRes.rows[0];
        return apiSuccess(res, {
            matchId: row.id,
            latitude: row.latitude ? parseFloat(row.latitude) : null,
            longitude: row.longitude ? parseFloat(row.longitude) : null,
            lastTrackedAt: row.lastTrackedAt,
            isLive: row.isLive,
            donorName: row.donorName,
            hospitalName: row.hospitalName
        });
    } catch (error) {
        next(error);
    }
};

const stopLiveLocation = async (req, res, next) => {
    try {
        const { matchId } = req.params;
        await db.query(`
            UPDATE donor_matches dm
            SET current_latitude = NULL, current_longitude = NULL, last_tracked_at = NULL
            FROM donors d
            WHERE dm.id = $1 AND dm.donor_id = d.id AND d.user_id = $2
        `, [matchId, req.user.id]);
        return apiSuccess(res, { matchId, stopped: true }, 'Live tracking stopped.');
    } catch (error) {
        next(error);
    }
};

module.exports={getMyMatchAlerts,respondToMatch,manualOffer,matchRequest,recordDonation,reviewDonor,updateLiveLocation,getLiveLocation,stopLiveLocation};
