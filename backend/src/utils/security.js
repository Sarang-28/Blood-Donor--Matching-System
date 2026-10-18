const crypto = require('node:crypto');
const env = require('../config/env');
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const validPassword = value => typeof value === 'string' && value.length >= 12 && Buffer.byteLength(value, 'utf8') <= 72;
const hashOtp = value => crypto.createHmac('sha256', env.jwt.secret).update(String(value)).digest('hex');
const createOtp = () => crypto.randomInt(100000, 1000000).toString();
const safeDonor = donor => ({ donorId: donor.donorId, fullName: donor.fullName, bloodGroup: donor.bloodGroup,
    distanceKm: Math.round(donor.distanceKm), isExactMatch: donor.isExactMatch });
module.exports = { fail, validPassword, hashOtp, createOtp, safeDonor };
