const fs = require('node:fs');
const path = require('node:path');
const { pool } = require('../src/config/db');
async function migrate(client) {
    await client.query("SELECT pg_advisory_lock(19384322)");
    try {
        await client.query('CREATE TABLE IF NOT EXISTS schema_migrations(name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
        for (const name of fs.readdirSync(path.join(__dirname, 'migrations')).filter(n => n.endsWith('.sql')).sort()) {
            if ((await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name])).rowCount) continue;
            await client.query('BEGIN');
            try {
                await client.query(fs.readFileSync(path.join(__dirname, 'migrations', name), 'utf8'));
                await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
                await client.query('COMMIT');
                console.log(`Applied ${name}`);
            } catch (err) { await client.query('ROLLBACK'); throw err; }
        }
    } finally { await client.query('SELECT pg_advisory_unlock(19384322)'); }
}
if (require.main === module) (async () => {
    let client;
    try { client = await pool.connect(); await migrate(client); }
    catch (error) { console.error('Migration failed:', error.message); process.exitCode = 1; }
    finally { client?.release(); await pool.end(); }
})();
module.exports = migrate;
