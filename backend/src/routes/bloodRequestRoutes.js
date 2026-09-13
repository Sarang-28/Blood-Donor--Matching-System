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

module.exports = router;
