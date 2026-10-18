const router=require('express').Router();
const db=require('../config/db');
const {apiSuccess}=require('../utils/apiResponse');
router.get('/summary',async(req,res,next)=>{try{
 const [stats,requests,settings]=await Promise.all([
 db.query(`SELECT (SELECT COUNT(*) FROM donors d JOIN users u ON u.id=d.user_id WHERE u.is_active) AS donors,
 (SELECT COUNT(*) FROM blood_requests WHERE status='fulfilled') AS fulfilled,
 (SELECT COUNT(*) FROM blood_requests WHERE status IN ('active','matching') AND (required_before IS NULL OR required_before>NOW())) AS active`),
 db.query(`SELECT br.id,br.blood_group AS "group",br.units_required-br.units_fulfilled AS units,h.hospital_name AS hospital,br.urgency
 FROM blood_requests br JOIN hospitals h ON h.id=br.assigned_hospital_id
 WHERE br.status IN ('active','matching') AND (br.required_before IS NULL OR br.required_before>NOW()) AND h.verification_status='verified' ORDER BY br.created_at DESC LIMIT 4`),
 require('../services/settingsService')()]);
 return apiSuccess(res,{...stats.rows[0],requests:requests.rows,settings});
}catch(e){next(e);}});
module.exports=router;
