const router=require('express').Router();
const db=require('../config/db');
const settings=require('../services/settingsService');
const {authenticateToken}=require('../middlewares/authMiddleware');
const {authorizeRoles}=require('../middlewares/roleMiddleware');
const {apiSuccess}=require('../utils/apiResponse');
const {fail}=require('../utils/security');
router.get('/',async(req,res,next)=>{try{return apiSuccess(res,await settings());}catch(e){next(e);}});
router.put('/',authenticateToken,authorizeRoles('admin'),async(req,res,next)=>{try{
 const {radiusKm,cooldownDays}=req.body;
 if(!Number.isFinite(radiusKm)||radiusKm<1||radiusKm>100||!Number.isInteger(cooldownDays)||cooldownDays<1||cooldownDays>365)throw fail('Radius must be 1–100 km and interval 1–365 days. Clinical policy must be approved by your institution.');
 await db.query(`WITH updated AS (INSERT INTO system_settings(key,value) VALUES('matching',$1) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW() RETURNING key)
 INSERT INTO audit_logs(actor_user_id,action,metadata) SELECT $2,'settings.updated',$1 FROM updated`,[JSON.stringify({radiusKm,cooldownDays}),req.user.id]);
 return apiSuccess(res,{radiusKm,cooldownDays});
}catch(e){next(e);}});
module.exports=router;
