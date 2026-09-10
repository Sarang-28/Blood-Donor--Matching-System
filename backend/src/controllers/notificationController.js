const db = require('../config/db');
const { apiSuccess, apiError } = require('../utils/apiResponse');

/**
 * Get user notifications and unread count
 */
const getNotifications = async (req, res, next) => {
    try {
        const query = `
            SELECT id, title, body, type, data_payload AS payload, is_read AS "isRead", created_at AS "createdAt"
            FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 50;
        `;
        const countQuery = `
            SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE;
        `;

        const [listRes, countRes] = await Promise.all([
            db.query(query, [req.user.id]),
            db.query(countQuery, [req.user.id]),
        ]);

        return apiSuccess(res, {
            notifications: listRes.rows,
            unreadCount: parseInt(countRes.rows[0].count, 10),
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateSql = `
            UPDATE notifications
            SET is_read = TRUE
            WHERE id = $1 AND user_id = $2
            RETURNING id, is_read AS "isRead";
        `;
        const result = await db.query(updateSql, [id, req.user.id]);
        if (result.rows.length === 0) {
            return apiError(res, 'Notification not found', 404);
        }
        return apiSuccess(res, result.rows[0], 'Notification marked as read.');
    } catch (error) {
        next(error);
    }
};

/**
 * Mark all notifications as read for current user
 */
const markAllAsRead = async (req, res, next) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
            [req.user.id]
        );
        return apiSuccess(res, null, 'All notifications marked as read.');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
};
