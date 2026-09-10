const express = require('express');
const donorController = require('../controllers/donorController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

/**
 * @route   GET /api/donors/profile
 * @desc    Get logged in donor profile
 * @access  Private (Donor only)
 */
router.get(
    '/profile',
    authenticateToken,
    authorizeRoles(ROLES.DONOR),
    donorController.getProfile
);

/**
 * @route   PUT /api/donors/profile
 * @desc    Update donor profile details & coordinates
 * @access  Private (Donor only)
 */
router.put(
    '/profile',
    authenticateToken,
    authorizeRoles(ROLES.DONOR),
    donorController.updateProfile
);

/**
 * @route   PATCH /api/donors/availability
 * @desc    Toggle donor availability status (Available / Unavailable)
 * @access  Private (Donor only)
 */
router.patch(
    '/availability',
    authenticateToken,
    authorizeRoles(ROLES.DONOR),
    donorController.toggleAvailability
);

/**
 * @route   GET /api/donors/history
 * @desc    Get donor completed donation records
 * @access  Private (Donor only)
 */
router.get(
    '/history',
    authenticateToken,
    authorizeRoles(ROLES.DONOR),
    donorController.getDonationHistory
);

/**
 * @route   GET /api/donors/nearby
 * @desc    Search and browse available donors (PostGIS radius / filters)
 * @access  Private (Hospital, Patient, NGO, Admin, Donor)
 */
router.get(
    '/nearby',
    authenticateToken,
    donorController.getNearbyDonors
);

/**
 * @route   GET /api/donors/:id
 * @desc    Get public profile of a single donor
 * @access  Private
 */
router.get(
    '/:id',
    authenticateToken,
    donorController.getDonorById
);

module.exports = router;
