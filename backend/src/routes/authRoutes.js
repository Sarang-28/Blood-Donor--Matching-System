const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validatorMiddleware');
const { ALL_ROLES } = require('../constants/roles');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user and role profile
 * @access  Public
 */
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Please provide a valid email address'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long'),
        body('role')
            .isIn(ALL_ROLES.filter(r => r !== 'admin'))
            .withMessage('Invalid role selected'),
        body('phone').notEmpty().withMessage('Phone number is required'),
        validate,
    ],
    authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    User login (Donor, Hospital, Patient, NGO)
 * @access  Public
 */
router.post(
    '/login',
    [
        body('password').notEmpty().withMessage('Password is required'),
        validate,
    ],
    authController.login
);

/**
 * @route   POST /api/auth/admin-login
 * @desc    Admin login
 * @access  Public
 */
router.post(
    '/admin-login',
    [
        body('password').notEmpty().withMessage('Password is required'),
        validate,
    ],
    authController.adminLogin
);

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user & profile
 * @access  Private
 */
router.get('/me', authenticateToken, authController.getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout acknowledgment
 * @access  Private
 */
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
