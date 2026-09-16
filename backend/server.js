const app = require('./src/app');
const env = require('./src/config/env');
const db = require('./src/config/db');
const http = require('http');
const { initializeSocket } = require('./src/config/socket');

const PORT = env.port || 5000;

const startServer = async () => {
    console.log('====================================================');
    console.log('  Hyperlocal Blood Donor Matching Backend Server   ');
    console.log('====================================================');

    // Test Database connection
    await db.checkConnection();

    const server = http.createServer(app);
    initializeSocket(server);

    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📡 Base API URL: http://localhost:${PORT}/api`);
        console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
        console.log('====================================================');
    });
};

startServer();
