const express = require('express');
const matchingController = require('../controllers/matchingController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();
router.patch('/:matchId/review', authenticateToken, matchingController.reviewDonor);

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
 * @route   POST /api/matches/manual-offer
 * @desc    Donor manually volunteers for a public blood request
 * @access  Private (Donor only)
 */
router.post(
    '/manual-offer',
    authenticateToken,
    authorizeRoles(ROLES.DONOR),
    matchingController.manualOffer
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

/**
 * Live location tracking endpoints (works over HTTP polling on serverless/Vercel)
 */
router.post('/:matchId/live-location', authenticateToken, matchingController.updateLiveLocation);
router.get('/:matchId/live-location', authenticateToken, matchingController.getLiveLocation);
router.delete('/:matchId/live-location', authenticateToken, matchingController.stopLiveLocation);

module.exports = router;
