const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

    db: {
        connectionString: process.env.DATABASE_URL || null,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'blood_donor_db',
        ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: true, ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') } : {}) } : false,
    },

    jwt: {
        secret: process.env.JWT_SECRET || require('node:crypto').randomBytes(48).toString('hex'),
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    },

    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },

    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
    }
};

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('super_secret'))) {
    throw new Error('Configure a unique JWT_SECRET of at least 32 characters.');
}
module.exports.matching = { radiusKm: Number(process.env.MATCH_RADIUS_KM || 10), cooldownDays: Number(process.env.DONATION_COOLDOWN_DAYS || 90) };
if (module.exports.matching.radiusKm < 1 || module.exports.matching.radiusKm > 100 || !Number.isFinite(module.exports.matching.radiusKm) || !Number.isInteger(module.exports.matching.cooldownDays) || module.exports.matching.cooldownDays < 1) throw new Error('Invalid matching configuration');
module.exports.allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(value => value.trim());
// URL TLS parameters override pg SSL options: remove them so certificate verification cannot be disabled.
if (module.exports.db.connectionString) {
    const url = new URL(module.exports.db.connectionString);
    const useTls = url.searchParams.has('sslmode') && url.searchParams.get('sslmode') !== 'disable';
    for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key);
    module.exports.db.connectionString = url.toString();
    if (useTls && !module.exports.db.ssl) module.exports.db.ssl = { rejectUnauthorized: true };
}
