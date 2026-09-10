const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initDatabase() {
    console.log('--- Initializing Hyperlocal Blood Donor Matching Database ---');
    console.log(`Connecting to PostgreSQL at ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}...`);

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
        console.log('Connected to PostgreSQL successfully.');

        // Verify PostGIS is installed/available
        try {
            await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
            const postgisCheck = await client.query('SELECT PostGIS_Version();');
            console.log(`PostGIS is active. Version: ${postgisCheck.rows[0].postgis_version}`);
        } catch (err) {
            console.error('\n⚠️  WARNING: Could not activate PostGIS extension.');
            console.error('Ensure PostGIS is installed on your PostgreSQL instance (e.g. via StackBuilder or apt install postgresql-16-postgis).');
            console.error(err.message);
        }

        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        console.log('Applying database schema...');
        await client.query(schemaSql);
        console.log('✅ Database schema and spatial indexes applied successfully!');

        // Check if seed file exists and ask or seed default admin
        const seedPath = path.join(__dirname, 'seed.sql');
        if (fs.existsSync(seedPath)) {
            const seedSql = fs.readFileSync(seedPath, 'utf-8');
            console.log('Seeding initial reference data...');
            await client.query(seedSql);
            console.log('✅ Initial seed data applied!');
        }

        client.release();
        await pool.end();
        console.log('--- Database Initialization Finished Successfully ---');
    } catch (error) {
        console.error('\n❌ Failed to initialize database:');
        if (error.code === 'ECONNREFUSED' || (error.errors && error.errors[0]?.code === 'ECONNREFUSED')) {
            console.error('   Could not connect to PostgreSQL server at ' + (process.env.DB_HOST || 'localhost') + ':' + (process.env.DB_PORT || '5432'));
            console.error('   -> PostgreSQL is not running or not installed on your machine.');
            console.error('   -> If using a local PostgreSQL, please start the service.');
            console.error('   -> If using a cloud database (e.g. Supabase, Neon, Render), update DB_* or DATABASE_URL in backend/.env');
        } else {
            console.error('   ' + (error.message || error));
        }
        process.exit(1);
    }
}

initDatabase();
