// logout controller for google signin
// this controller will be called by the frontend
// it will revoke the refresh tokens for the specified user
// and then send a response to the frontend
// the response should be a JSON object with a success message
// the response should also include the user ID


const { admin } = require('../../firebase/initialize_firebase');

/**
 * Handles user logout by revoking Firebase refresh tokens.
 * This ensures that even if the client-side session is cleared,
 * the existing tokens cannot be used to refresh the session.
 */
const logout = async (req, res) => {
    try {
        // req.user is populated by the validateGoogleToken middleware
        const uid = req.user.uid;

        if (!uid) {
            return res.status(400).json({ error: 'User UID not found in request' });
        }

        // Revoke all refresh tokens for the specified user
        await admin.auth().revokeRefreshTokens(uid);

        console.log(`✅ Revoked refresh tokens for user: ${uid}`);

        res.status(200).json({
            message: 'User logged out and tokens revoked successfully from backend ✅',
            uid: uid
        });
    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({
            error: 'Failed to log out user and revoke tokens',
            detail: error.message
        });
    }
};

module.exports = { logout };
