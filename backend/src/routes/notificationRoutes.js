const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications and unread count
 * @access  Private
 */
router.get('/', notificationController.getNotifications);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
router.patch('/:id/read', notificationController.markAsRead);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all user notifications as read
 * @access  Private
 */
router.patch('/read-all', notificationController.markAllAsRead);

module.exports = router;
