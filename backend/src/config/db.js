const { Pool } = require('pg');
const env = require('./env');

const poolConfig = env.db.connectionString
    ? {
        connectionString: env.db.connectionString,
        ssl: env.db.ssl,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
    : {
        host: env.db.host,
        port: env.db.port,
        user: env.db.user,
        password: env.db.password,
        database: env.db.database,
        ssl: env.db.ssl,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

const query = async (text, params) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (env.nodeEnv === 'development' && duration > 200) {
        console.log('Executed slow query', { text: text.slice(0, 80), duration, rows: res.rowCount });
    }
    return res;
};

const getClient = async () => {
    const client = await pool.connect();
    return client;
};

const checkConnection = async () => {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT current_database(), version();');
        console.log(`✅ Connected to database: ${res.rows[0].current_database}`);
        
        try {
            const postgis = await client.query('SELECT PostGIS_Version();');
            console.log(`✅ PostGIS extension detected: v${postgis.rows[0].postgis_version}`);
        } catch (pgisErr) {
            console.warn('⚠️ PostGIS is not yet installed in this database. Run `npm run init-db` to configure.');
        }

        client.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

module.exports = {
    pool,
    query,
    getClient,
    checkConnection
};
