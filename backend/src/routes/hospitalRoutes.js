const express = require('express');
const hospitalController = require('../controllers/hospitalController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

/**
 * @route   GET /api/hospitals/profile
 * @desc    Get logged in hospital profile
 * @access  Private (Hospital)
 */
router.get(
    '/profile',
    authenticateToken,
    authorizeRoles(ROLES.HOSPITAL),
    hospitalController.getProfile
);

/**
 * @route   PUT /api/hospitals/profile
 * @desc    Update hospital profile
 * @access  Private (Hospital)
 */
router.put(
    '/profile',
    authenticateToken,
    authorizeRoles(ROLES.HOSPITAL),
    hospitalController.updateProfile
);

/**
 * @route   GET /api/hospitals
 * @desc    Public list of registered & verified hospitals
 * @access  Public / Authenticated
 */
router.get('/', hospitalController.getHospitalList);

/**
 * @route   GET /api/hospitals/:id
 * @desc    Get single hospital details
 * @access  Public / Authenticated
 */
router.get('/:id', hospitalController.getHospitalById);

module.exports = router;
