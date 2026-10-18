const db = require('../config/db');
const { NOTIFICATION_TYPE } = require('../constants/statuses');
const twilioService = require('./twilioService');
const firebaseApp = require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');
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
        const body = `Request for ${units} unit(s) of ${bloodGroup} at ${hospitalName}. Contact details and the exact destination are shared after requester approval.`;

        const notification = await this.createInAppNotification({userId,title,body,type:NOTIFICATION_TYPE.MATCH_ALERT,payload:{requestId,urgency,distanceKm,hospitalName,bloodGroup}});
        if (!notification) return;
        const preferences = (await db.query('SELECT sms_consent,push_consent FROM users WHERE id=$1',[userId])).rows[0];
        const sms = preferences?.sms_consent ? await twilioService.sendSms(phone, 'A nearby blood request needs your response. Open BloodMatch for details.') : {status:'no_consent'};
        const push = await this.sendFcmPushNotification(userId, 'BloodMatch invitation', 'Open BloodMatch for details.', {requestId});
        for(const [channel,result] of [['sms',sms],['push',push]]) {
            await db.query('INSERT INTO notification_deliveries(notification_id,channel,status) VALUES($1,$2,$3)', [notification.id,channel,result.status || (result.sent?'sent':'failed')]);
        }
    }

    /**
     * Helper: Fetch user FCM token and send push notification
     */
    async sendFcmPushNotification(userId, title, body, payload = {}) {
        if (!firebaseApp) return { status: 'unconfigured' }; // Not configured

        try {
            const res = await db.query('SELECT fcm_token, push_consent FROM users WHERE id = $1', [userId]);
            if (!res.rows[0]?.push_consent || !res.rows[0]?.fcm_token) return {status:'no_consent'};
            if (res.rows.length && res.rows[0].fcm_token) {
                await getMessaging(firebaseApp).send({
                    token: res.rows[0].fcm_token,
                    notification: { title: 'BloodMatch update', body: 'Open the app to view this update.' },
                    data: {
                        ...payload,
                        click_action: 'FLUTTER_NOTIFICATION_CLICK', // standard fallback
                    },
                });
                return {status:'sent'};
            }
        } catch (error) {
            return {status:'failed'};
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
