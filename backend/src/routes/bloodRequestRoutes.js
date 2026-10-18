const express = require('express');
const { body } = require('express-validator');
const bloodRequestController = require('../controllers/bloodRequestController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { validate } = require('../middlewares/validatorMiddleware');
const { ROLES } = require('../constants/roles');
const { ALL_BLOOD_GROUPS } = require('../constants/bloodCompatibility');
const { URGENCY_LEVEL } = require('../constants/statuses');

const router = express.Router();

/**
 * @route   POST /api/blood-requests
 * @desc    Create new blood request and trigger hyperlocal PostGIS matching
 * @access  Private (Hospital, Patient, Blood Bank, NGO, Donor)
 */
router.post(
    '/',
    authenticateToken,
    authorizeRoles(ROLES.HOSPITAL, ROLES.PATIENT, ROLES.BLOOD_BANK, ROLES.NGO, ROLES.ADMIN, ROLES.DONOR),
    [
        body('bloodGroup')
            .isIn(ALL_BLOOD_GROUPS)
            .withMessage(`Blood group must be one of: ${ALL_BLOOD_GROUPS.join(', ')}`),
        body('unitsRequired')
            .isInt({ min: 1 })
            .withMessage('Units required must be an integer of at least 1'),
        body('urgency')
            .optional()
            .isIn(Object.values(URGENCY_LEVEL))
            .withMessage(`Urgency must be: ${Object.values(URGENCY_LEVEL).join(', ')}`),
        validate,
    ],
    bloodRequestController.createRequest
);

/**
 * @route   GET /api/blood-requests
 * @desc    Get all active blood requests with filter (Blood group, Urgency, Search)
 * @access  Private
 */
router.get('/', authenticateToken, bloodRequestController.getAllRequests);

/**
 * @route   GET /api/blood-requests/my
 * @desc    Get requests initiated by currently logged in user
 * @access  Private
 */
router.get('/my', authenticateToken, bloodRequestController.getMyRequests);

/**
 * @route   GET /api/blood-requests/:id
 * @desc    Get single request details and matched donors
 * @access  Private
 */
router.get('/:id', authenticateToken, bloodRequestController.getRequestById);

/**
 * @route   PATCH /api/blood-requests/:id/status
 * @desc    Update request status (fulfill or cancel)
 * @access  Private (Hospital, Patient, NGO, Admin)
 */
router.patch(
    '/:id/status',
    authenticateToken,
    authorizeRoles(ROLES.HOSPITAL, ROLES.PATIENT, ROLES.BLOOD_BANK, ROLES.NGO, ROLES.ADMIN, ROLES.DONOR),
    [
        body('status').notEmpty().withMessage('Status is required'),
        validate,
    ],
    bloodRequestController.updateRequestStatus
);

router.post('/:id/assign-ngo',authenticateToken,async(req,res,next)=>{
 const db=require('../config/db');const {apiSuccess,apiError}=require('../utils/apiResponse');
 try {
  const r=await db.query(`INSERT INTO request_assignments(blood_request_id,ngo_id,assigned_by)
   SELECT br.id,n.id,$3 FROM blood_requests br CROSS JOIN ngos n WHERE br.id=$1 AND n.id=$2 AND n.verification_status='verified'
   AND (br.requester_user_id=$3 OR $4::boolean) ON CONFLICT DO NOTHING RETURNING *`,[req.params.id,req.body.ngoId,req.user.id,req.user.role==='admin']);
  if(!r.rowCount)return apiError(res,'Assignment not permitted, NGO unverified, or already assigned.',409);
  return apiSuccess(res,r.rows[0]);
 }catch(e){next(e);}
});
router.patch('/:id',authenticateToken,async(req,res,next)=>{
 const db=require('../config/db');const {apiSuccess,apiError}=require('../utils/apiResponse');
 const {urgency,unitsRequired,requiredBefore}=req.body;
 if(urgency && !['Normal','Urgent','Critical'].includes(urgency))return apiError(res,'Invalid urgency.',400);
 if(requiredBefore && (!Number.isFinite(Date.parse(requiredBefore)) || Date.parse(requiredBefore)<=Date.now()))return apiError(res,'Required time must be in the future.',400);
 try {
  const r=await db.query(`WITH changed AS (UPDATE blood_requests SET urgency=COALESCE($1,urgency),units_required=COALESCE($2,units_required),required_before=COALESCE($3,required_before),updated_at=NOW()
   WHERE id=$4 AND requester_user_id=$5 AND status IN ('active','matching')
   AND ($2::integer IS NULL OR $2>=units_fulfilled+(SELECT COUNT(*) FROM donor_matches dm WHERE dm.blood_request_id=blood_requests.id AND dm.match_status='accepted' AND dm.requester_decision='approved')) RETURNING *)
   , logged AS (INSERT INTO audit_logs(actor_user_id,action,target_id) SELECT $5,'request.updated',id FROM changed RETURNING id) SELECT * FROM changed`,[urgency||null,unitsRequired||null,requiredBefore||null,req.params.id,req.user.id]);
  if(!r.rowCount)return apiError(res,'Request cannot be updated.',409);
  return apiSuccess(res,r.rows[0]);
 }catch(e){next(e);}
});
module.exports = router;
