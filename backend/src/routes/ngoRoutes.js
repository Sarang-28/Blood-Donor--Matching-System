const router=require('express').Router();
const db=require('../config/db');
const {authenticateToken}=require('../middlewares/authMiddleware');
const {authorizeRoles}=require('../middlewares/roleMiddleware');
const {apiSuccess}=require('../utils/apiResponse');
const {fail}=require('../utils/security');
router.get('/',async(req,res,next)=>{try{const r=await db.query("SELECT id,ngo_name,service_area FROM ngos WHERE verification_status='verified' AND EXISTS(SELECT 1 FROM users WHERE id=ngos.user_id AND is_active)");return apiSuccess(res,r.rows);}catch(e){next(e);}});
router.use(authenticateToken,authorizeRoles('ngo'));
router.get('/profile',async(req,res,next)=>{try{const r=await db.query('SELECT *,ST_X(geom) AS longitude,ST_Y(geom) AS latitude FROM ngos WHERE user_id=$1',[req.user.id]);return apiSuccess(res,r.rows[0]);}catch(e){next(e);}});
router.put('/profile',async(req,res,next)=>{try{
 const {ngoName,address,serviceArea,coordinatorName}=req.body;
 if(!ngoName||!address)throw fail('NGO name and address are required.');
 const r=await db.query("UPDATE ngos SET ngo_name=$1,address=$2,service_area=$3,coordinator_name=COALESCE($4,coordinator_name),updated_at=NOW() WHERE user_id=$5 RETURNING id,ngo_name,address,service_area,coordinator_name,verification_status",[ngoName,address,serviceArea||'',coordinatorName,req.user.id]);return apiSuccess(res,r.rows[0]);
}catch(e){next(e);}});
router.get('/assignments',async(req,res,next)=>{try{
 const r=await db.query(`SELECT br.id,br.blood_group,br.hospital_name,br.location_name,br.status,br.urgency,br.units_required,br.units_fulfilled,
 (SELECT COUNT(*) FROM donor_matches dm WHERE dm.blood_request_id=br.id AND match_status='accepted') AS accepted_count
 FROM request_assignments ra JOIN ngos n ON n.id=ra.ngo_id JOIN blood_requests br ON br.id=ra.blood_request_id WHERE n.user_id=$1 AND n.verification_status='verified' ORDER BY br.created_at DESC`,[req.user.id]);return apiSuccess(res,r.rows);
}catch(e){next(e);}});
module.exports=router;
