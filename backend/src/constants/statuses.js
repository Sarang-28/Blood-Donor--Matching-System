const REQUEST_STATUS = {
    ACTIVE: 'active',
    MATCHING: 'matching',
    FULFILLED: 'fulfilled',
    CANCELLED: 'cancelled',
};

const URGENCY_LEVEL = {
    NORMAL: 'Normal',
    URGENT: 'Urgent',
    CRITICAL: 'Critical',
};

const MATCH_STATUS = {
    NOTIFIED: 'notified',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
    COMPLETED: 'completed',
    EXPIRED: 'expired',
};

const VERIFICATION_STATUS = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
};

const NOTIFICATION_TYPE = {
    MATCH_ALERT: 'match_alert',
    REQUEST_UPDATE: 'request_update',
    VERIFICATION: 'verification',
    SYSTEM: 'system',
};

module.exports = {
    REQUEST_STATUS,
    URGENCY_LEVEL,
    MATCH_STATUS,
    VERIFICATION_STATUS,
    NOTIFICATION_TYPE,
};
