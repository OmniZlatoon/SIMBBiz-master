// Middleware to verify Firebase Idtoken passed from the frontend
const { auth, admin } = require('../../firebase/initializeFirebase');

const verifyToken = async (req, res, next) => {
    if (req.method === 'OPTIONS') return next();

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error("❌ Token verification failed:", error.message);
        return res.status(401).json({
            error: 'Unauthorized: Invalid or expired token',
            detail: error.message
        });
    }
};

const validateGoogleToken = async (req, res) => {
    try {
        const decodedToken = req.user;
        const userRef = admin.firestore().collection('users').doc(decodedToken.uid);
        const doc = await userRef.get();

        if (!doc.exists) {
            console.log("📝 Creating new user document for:", decodedToken.uid);
            await userRef.set({
                uid: decodedToken.uid,
                email: decodedToken.email || null,
                displayName: decodedToken.name || null,
                photoURL: decodedToken.picture || null,
                provider: 'google',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                inspirePoints: 0,
                hasReceivedSignInBonus: false
            });
        }


        return res.status(200).json({
            message: 'User authenticated and verified successfully ✅',
            user: {
                uid: decodedToken.uid,
                email: decodedToken.email,
                displayName: decodedToken.name,
                photoURL: decodedToken.picture,
            },
        });
    } catch (error) {
        console.error("❌ Google Sync failed:", error.message);
        return res.status(500).json({ error: 'Server error during sync' });
    }
};

module.exports = { verifyToken, validateGoogleToken };
