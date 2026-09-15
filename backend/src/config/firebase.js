const admin = require('firebase-admin');
const env = require('./env');

if (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: env.firebase.projectId,
                clientEmail: env.firebase.clientEmail,
                privateKey: env.firebase.privateKey,
            }),
        });
        console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error.message);
    }
} else {
    console.log('Firebase Admin SDK not initialized: Missing credentials in environment.');
}

module.exports = admin;
