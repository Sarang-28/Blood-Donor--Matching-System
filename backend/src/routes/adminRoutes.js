const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// All routes under /api/admin require Admin role
router.use(authenticateToken);
router.use(authorizeRoles(ROLES.ADMIN));

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard metrics, pending verifications, and emergency feeds
 * @access  Private (Admin only)
 */
router.get('/stats', adminController.getStats);

/**
 * @route   GET /api/admin/users
 * @desc    List all platform users with role filter and pagination
 * @access  Private (Admin only)
 */
router.get('/users', adminController.getUsers);

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Activate or suspend a user account
 * @access  Private (Admin only)
 */
router.patch('/users/:id/status', adminController.updateUserStatus);
router.post('/users/:id/status', adminController.updateUserStatus);

/**
 * @route   PATCH /api/admin/verifications/:type/:id
 * @desc    Approve or reject hospital / NGO verification
 * @access  Private (Admin only)
 */
router.patch('/verifications/:type/:id', adminController.verifyInstitution);
router.post('/verifications/:type/:id', adminController.verifyInstitution);

/**
 * @route   GET /api/admin/requests/critical
 * @desc    Real-time feed of ongoing critical/urgent requests
 * @access  Private (Admin only)
 */
router.get('/requests/critical', adminController.getCriticalRequests);

module.exports = router;
