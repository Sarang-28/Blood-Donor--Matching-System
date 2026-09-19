const { initializeApp, cert } = require('firebase-admin/app');
const env = require('./env');

let app = null;

if (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey) {
    try {
        app = initializeApp({
            credential: cert({
                projectId: env.firebase.projectId,
                clientEmail: env.firebase.clientEmail,
                privateKey: env.firebase.privateKey.replace(/\\n/g, '\n'),
            }),
        });
        console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error.message);
    }
} else {
    console.log('Firebase Admin SDK not initialized: Missing credentials in environment.');
}

module.exports = app;
