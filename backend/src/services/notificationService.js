const db = require('../config/db');
const { NOTIFICATION_TYPE } = require('../constants/statuses');
const twilioService = require('./twilioService');
const firebaseAdmin = require('../config/firebase');
class NotificationService {
    /**
     * Store in-app notification in PostgreSQL
     */
    async createInAppNotification({ userId, title, body, type = NOTIFICATION_TYPE.SYSTEM, payload = {} }) {
        try {
            const sql = `
                INSERT INTO notifications (user_id, title, body, type, data_payload)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, title, body, type, is_read, created_at;
            `;
            const res = await db.query(sql, [userId, title, body, type, JSON.stringify(payload)]);
            return res.rows[0];
        } catch (error) {
            console.error('Failed to create in-app notification:', error.message);
            return null;
        }
    }

    /**
     * Send emergency match alert to donor across available channels
     */
    async notifyDonorMatch({
        userId,
        phone,
        donorName,
        bloodGroup,
        units,
        urgency,
        hospitalName,
        locationName,
        distanceKm,
        requestId,
    }) {
        const title = `🚨 Emergency ${bloodGroup} Blood Needed (${distanceKm} km away)`;
        const body = `Urgent request for ${units} unit(s) of ${bloodGroup} at ${hospitalName}, ${locationName}. You are a compatible nearby donor!`;

        // 1. In-App Notification
        await this.createInAppNotification({
            userId,
            title,
            body,
            type: NOTIFICATION_TYPE.MATCH_ALERT,
            payload: { requestId, urgency, distanceKm, hospitalName, bloodGroup },
        });

        // 2. SMS Notification via Twilio
        if (phone) {
            const smsText = `EMERGENCY BLOOD ALERT: ${units} unit(s) of ${bloodGroup} needed at ${hospitalName} (${distanceKm}km away). Please check your Blood Donor app to respond.`;
            await twilioService.sendSms(phone, smsText);
        }

        // 3. FCM Push Notification
        await this.sendFcmPushNotification(userId, title, body, { requestId, type: NOTIFICATION_TYPE.MATCH_ALERT });
    }

    /**
     * Helper: Fetch user FCM token and send push notification
     */
    async sendFcmPushNotification(userId, title, body, payload = {}) {
        if (!firebaseAdmin || !firebaseAdmin.apps.length) return; // Not configured

        try {
            const res = await db.query('SELECT fcm_token FROM users WHERE id = $1', [userId]);
            if (res.rows.length && res.rows[0].fcm_token) {
                await firebaseAdmin.messaging().send({
                    token: res.rows[0].fcm_token,
                    notification: {
                        title,
                        body,
                    },
                    data: {
                        ...payload,
                        click_action: 'FLUTTER_NOTIFICATION_CLICK', // standard fallback
                    },
                });
            }
        } catch (error) {
            console.error(`Failed to send FCM to user ${userId}:`, error.message);
        }
    }

    /**
     * Send status update to blood requester
     */
    async notifyRequesterStatusUpdate({ userId, title, body, requestId, newStatus }) {
        await this.createInAppNotification({
            userId,
            title,
            body,
            type: NOTIFICATION_TYPE.REQUEST_UPDATE,
            payload: { requestId, newStatus },
        });

        await this.sendFcmPushNotification(userId, title, body, { requestId, newStatus, type: NOTIFICATION_TYPE.REQUEST_UPDATE });
    }

    /**
     * Send verification status update to hospital or NGO
     */
    async notifyVerificationStatus({ userId, institutionName, status, remarks }) {
        const isApproved = status === 'verified';
        const title = isApproved ? '✅ Institutional Verification Approved' : '❌ Verification Review Update';
        const body = isApproved
            ? `Congratulations! ${institutionName} has been verified by administrators.`
            : `Your verification request was reviewed: ${remarks || 'Please update your details.'}`;

        await this.createInAppNotification({
            userId,
            title,
            body,
            type: NOTIFICATION_TYPE.VERIFICATION,
            payload: { status, remarks },
        });

        await this.sendFcmPushNotification(userId, title, body, { status, type: NOTIFICATION_TYPE.VERIFICATION });
    }
}

module.exports = new NotificationService();
