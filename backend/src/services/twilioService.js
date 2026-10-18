const env = require('../config/env');

class TwilioService {
    constructor() {
        this.isConfigured = Boolean(
            env.twilio.accountSid &&
            env.twilio.authToken &&
            env.twilio.phoneNumber
        );

        if (this.isConfigured) {
            try {
                const twilio = require('twilio');
                this.client = twilio(env.twilio.accountSid, env.twilio.authToken);
            } catch (err) {
                console.warn('Twilio package not initialized:', err.message);
                this.isConfigured = false;
            }
        }
    }

    /**
     * Send SMS notification
     * @param {string} toPhone
     * @param {string} messageText
     */
    async sendSms(toPhone, messageText) {
        if (!this.isConfigured || !this.client) {
            return { sent: false, status: 'unconfigured' };
        }

        try {
            const message = await this.client.messages.create({
                body: messageText,
                from: env.twilio.phoneNumber,
                to: toPhone,
            });
            return { sent: true, sid: message.sid };
        } catch (error) {
            console.error('Twilio delivery failed:', error.code || 'provider_error');
            return { sent: false, error: error.message };
        }
    }
}

module.exports = new TwilioService();
