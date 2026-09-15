const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrateDatabase() {
    console.log('--- Migrating Database for OTP and FCM ---');

    const connectionString = process.env.DATABASE_URL || null;
    const ssl = process.env.DB_SSL === 'true' || (connectionString && connectionString.includes('sslmode=require')) ? { rejectUnauthorized: false } : false;

    const pool = new Pool(
        connectionString
            ? { connectionString, ssl }
            : {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432', 10),
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: process.env.DB_NAME || 'blood_donor_db',
                ssl,
              }
    );

    try {
        const client = await pool.connect();
        
        try {
            await client.query('ALTER TABLE users ADD COLUMN fcm_token VARCHAR(255);');
            console.log('Added fcm_token to users.');
        } catch (err) {
            console.log('fcm_token column may already exist: ', err.message);
        }

        try {
            await client.query('ALTER TABLE donor_matches ADD COLUMN otp_code VARCHAR(6);');
            await client.query('ALTER TABLE donor_matches ADD COLUMN otp_expires_at TIMESTAMP WITH TIME ZONE;');
            console.log('Added otp_code and otp_expires_at to donor_matches.');
        } catch (err) {
            console.log('otp_code columns may already exist: ', err.message);
        }

        client.release();
        await pool.end();
        console.log('--- Migration Finished Successfully ---');
    } catch (error) {
        console.error('Failed to migrate database:', error.message);
        process.exit(1);
    }
}

migrateDatabase();
