const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require('./firebaseConfig.json');

const initializeFirebase = () => {
    try {
        if (admin.getApps().length === 0) {
            admin.initializeApp({
                credential: admin.cert(serviceAccount)
            });
            console.log('✅ Firebase Admin SDK initialized successfully.');
        }

        const auth = getAuth();
        console.log('✅ Firebase Auth ready');

        return { auth, admin };
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
        return { auth: null, admin };
    }
};

module.exports = initializeFirebase();
