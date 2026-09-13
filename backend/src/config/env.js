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
        ssl: process.env.DB_SSL === 'true' || (process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('sslmode=require') || process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_URL.includes('pooler') || process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('render.com'))) ? { rejectUnauthorized: false } : false,
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'super_secret_blood_donor_matching_jwt_key_2026_xyz',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
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
