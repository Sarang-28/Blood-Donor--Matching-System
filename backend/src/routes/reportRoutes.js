const router=require('express').Router();
const db=require('../config/db');
const {authenticateToken}=require('../middlewares/authMiddleware');
const {authorizeRoles}=require('../middlewares/roleMiddleware');
const {apiSuccess}=require('../utils/apiResponse');
router.use(authenticateToken,authorizeRoles('admin'));
router.get('/audit-logs',async(req,res,next)=>{try{const result=await db.query('SELECT id,actor_user_id,action,target_id,metadata,created_at FROM audit_logs ORDER BY created_at DESC LIMIT 100');return apiSuccess(res,result.rows);}catch(e){next(e);}});
router.get('/reports',async(req,res,next)=>{try{
 const [requests,matches,delivery]=await Promise.all([
 db.query('SELECT blood_group,urgency,status,COUNT(*)::integer AS count, SUM(units_fulfilled)::integer AS units_fulfilled FROM blood_requests GROUP BY blood_group,urgency,status ORDER BY blood_group,urgency,status'),
 db.query('SELECT match_status,COUNT(*)::integer AS count FROM donor_matches GROUP BY match_status'),
 db.query('SELECT channel,status,COUNT(*)::integer AS count FROM notification_deliveries GROUP BY channel,status')]);
 if(req.query.format==='csv') {
   await db.query("INSERT INTO audit_logs(actor_user_id,action) VALUES($1,'reports.export')",[req.user.id]);
   res.set('Content-Type','text/csv');res.set('Content-Disposition','attachment; filename="bloodmatch-aggregate-report.csv"');
   return res.send('blood_group,urgency,status,count,units_fulfilled\n'+requests.rows.map(r=>[r.blood_group,r.urgency,r.status,r.count,r.units_fulfilled].join(',')).join('\n'));
 }
 return apiSuccess(res,{requests:requests.rows,matches:matches.rows,delivery:delivery.rows});
}catch(e){next(e);}});
module.exports=router;
