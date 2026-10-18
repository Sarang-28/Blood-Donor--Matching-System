const router=require('express').Router();
const db=require('../config/db');
const {authenticateToken}=require('../middlewares/authMiddleware');
const {apiSuccess}=require('../utils/apiResponse');
const {fail}=require('../utils/security');
router.use(authenticateToken);
router.get('/preferences',async(req,res,next)=>{try{
 const r=await db.query('SELECT sms_consent, push_consent FROM users WHERE id=$1',[req.user.id]);
 return apiSuccess(res,{...r.rows[0],providers:{sms:require('../services/twilioService').isConfigured,push:Boolean(require('../config/firebase'))}});
}catch(e){next(e);}});
router.put('/preferences',async(req,res,next)=>{try{
 const {smsConsent,pushConsent}=req.body;
 if(typeof smsConsent!=='boolean'||typeof pushConsent!=='boolean')throw fail('Consent values must be boolean.');
 await db.query('UPDATE users SET sms_consent=$1,push_consent=$2 WHERE id=$3',[smsConsent,pushConsent,req.user.id]);
 return apiSuccess(res,null,'Notification preferences saved.');
}catch(e){next(e);}});
module.exports=router;
