const { isValidCoordinates } = require('../utils/geoUtils');
const { ALL_BLOOD_GROUPS } = require('../constants/bloodCompatibility');
const { apiError } = require('../utils/apiResponse');
module.exports = (req, res, next) => {
    const body = req.body || {};
    if (body.latitude !== undefined || body.longitude !== undefined) {
        if (!isValidCoordinates(body.latitude, body.longitude)) return apiError(res, 'Provide valid latitude and longitude together.', 400);
    }
    if (body.bloodGroup && !ALL_BLOOD_GROUPS.includes(body.bloodGroup)) return apiError(res, 'Invalid blood group.', 400);
    for (const key of ['unitsRequired', 'unitsDonated']) {
        if (body[key] !== undefined && (!Number.isInteger(Number(body[key])) || Number(body[key]) < 1 || Number(body[key]) > 100)) return apiError(res, `${key} must be an integer between 1 and 100.`, 400);
    }
    if (body.lastDonationDate && (!/^\d{4}-\d{2}-\d{2}$/.test(body.lastDonationDate) || !Number.isFinite(Date.parse(body.lastDonationDate)) || Date.parse(body.lastDonationDate) > Date.now())) return apiError(res, 'Last donation date must be a valid past date.', 400);
    for (const [key, value] of Object.entries(body)) {
        if (typeof value === 'string' && value.length > (['notes', 'medicalCondition', 'fcmToken'].includes(key) ? 2000 : 500)) return apiError(res, 'An input exceeds its permitted length.', 400);
    }
    const { lat, lng, radiusKm, limit, page } = req.query;
    if ((lat !== undefined || lng !== undefined) && !isValidCoordinates(lat, lng)) return apiError(res, 'Invalid search coordinates.', 400);
    for (const [key, value, max] of [['radiusKm', radiusKm ?? body.radiusKm, 100], ['limit', limit, 100], ['page', page, 100000]]) {
        if (value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 1 || Number(value) > max || (key !== 'radiusKm' && !Number.isInteger(Number(value))))) return apiError(res, `Invalid ${key}.`, 400);
    }
    next();
};
