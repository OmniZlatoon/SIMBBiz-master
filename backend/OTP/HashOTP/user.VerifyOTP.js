const redisClient = require('../RedisConfig/redis.setup');
const {OTPverify} = require('./verifyStoredOTP');
const { admin } = require('../../firebase/initialize_firebase');

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // 1. GUARD: Check if variables exist before touching Redis
        if (!email || !otp) {
            return res.status(400).json({
                message: '[ERROR] - Email and OTP are required in the request body.'
            });
        }
        // Retrieve the hashed OTP from Redis
        const storedHash = await redisClient.get(email);
        if (!storedHash) {
             // delete the OTP from Redis after expiration or invalidation
            await redisClient.del(email);
            console.log(` - OTP for ${email}, has expired!`)
            return res.status(410).json({ message: ' [INFO] - OTP has expired or is invalid' });

        }
        // Verify the provided OTP against the stored hash
        const isOTPValid = await OTPverify(storedHash, otp);
        if (!isOTPValid) {
            return res.status(400).json({ message: ' [ERROR] - Invalid OTP' });
        }

        // 3. Generate Firebase Custom Token
        const userRecord = await admin.auth().getUserByEmail(email);
        const customToken = await admin.auth().createCustomToken(userRecord.uid);

        // Delete the OTP from Redis after Verification
        await redisClient.del(email);

        // 4. Gamification: Award 200 Inspire Points on first sign-in
        const userRef = admin.firestore().collection('users').doc(userRecord.uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            // Check if they haven't received the bonus (false) or if it's undefined (legacy user)
            if (userData.hasReceivedSignInBonus === false || userData.hasReceivedSignInBonus === undefined) {
                const currentPoints = userData.inspirePoints || 0;
                await userRef.update({
                    inspirePoints: currentPoints + 200,
                    hasReceivedSignInBonus: true
                });
                console.log(`[GAMIFICATION] Granted 200 Inspire Points to ${email}`);
            }
        }

        res.status(200).json({
            message: '[INFO] - OTP verified successfully ✅',
            customToken: customToken,
            user: {
                uid: userRecord.uid,
                email: userRecord.email
            }
        });
        console.log(" Otp verified  ✅")
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: '[ERROR] - Internal server error' });
    }
};
