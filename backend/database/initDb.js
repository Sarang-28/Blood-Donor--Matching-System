const fs = require('node:fs');
const path = require('node:path');
const { pool } = require('../src/config/db');
const migrate = require('./migrate');
(async () => {
    let client;
    try {
        client = await pool.connect();
        await client.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
        await migrate(client);
        console.log('Schema and migrations applied. No users or sample data were seeded.');
    } catch (error) { console.error('Initialization failed:', error.message); process.exitCode = 1; }
    finally { client?.release(); await pool.end(); }
})();
