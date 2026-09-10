const express = require('express');
const matchingController = require('../controllers/matchingController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

/**
 * @route   GET /api/matches/my-alerts
 * @desc    Get match alerts received by current donor
 * @access  Private (Donor only)
 */
router.get(
    '/my-alerts',
    authenticateToken,
    authorizeRoles(ROLES.DONOR),
    matchingController.getMyMatchAlerts
);

/**
 * @route   PATCH /api/matches/:matchId/respond
 * @desc    Donor accepts or declines an emergency match
 * @access  Private (Donor only)
 */
router.patch(
    '/:matchId/respond',
    authenticateToken,
    authorizeRoles(ROLES.DONOR),
    matchingController.respondToMatch
);

/**
 * @route   POST /api/matches/:requestId/trigger
 * @desc    Manually trigger or re-run PostGIS matching for a blood request
 * @access  Private (Hospital, Admin)
 */
router.post(
    '/:requestId/trigger',
    authenticateToken,
    authorizeRoles(ROLES.HOSPITAL, ROLES.ADMIN),
    matchingController.matchRequest
);

/**
 * @route   POST /api/matches/record-donation
 * @desc    Hospital records and verifies completed donation
 * @access  Private (Hospital, Admin)
 */
router.post(
    '/record-donation',
    authenticateToken,
    authorizeRoles(ROLES.HOSPITAL, ROLES.ADMIN),
    matchingController.recordDonation
);

module.exports = router;
