const db = require('../config/db');
const { NOTIFICATION_TYPE } = require('../constants/statuses');
const twilioService = require('./twilioService');

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
    }

    /**
     * Send status update to blood requester
     */
    async notifyRequesterStatusUpdate({ userId, title, body, requestId, newStatus }) {
        return this.createInAppNotification({
            userId,
            title,
            body,
            type: NOTIFICATION_TYPE.REQUEST_UPDATE,
            payload: { requestId, newStatus },
        });
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

        return this.createInAppNotification({
            userId,
            title,
            body,
            type: NOTIFICATION_TYPE.VERIFICATION,
            payload: { status, remarks },
        });
    }
}

module.exports = new NotificationService();
