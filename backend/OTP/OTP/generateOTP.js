const { generateOTP } = require("./OTP.script");
const { hashOTP } = require("../HashOTP/hashing_otp");
const { SendOTPEmail } = require('../NodeMailer/SendOTPEmail');
const redisClient = require('../RedisConfig/redis.setup');



// create a function to generate OTP and send to the user's Email
async function generateandSendOTP(email) {
    try {

        // Create the 6-character OTP
        const otp = generateOTP();

        // hash OTP before sending to Redis
        const hashedOTP = await hashOTP(otp);

        // Store the hash OTP in Redis
        await redisClient.set(email, hashedOTP, 'EX', 60); // Store OTP with a 60-second expiration

        //delete the OTP after expiration ( to not use of space in the Redis DB)
        setTimeout(async () => {
            await redisClient.del(email);
        }, 60000); // Delete OTP after 60 seconds (1 minute)


        // Send the  original OTP to the user's email
        await SendOTPEmail(email, otp);
        console.log(`OTP generated for ${email}: ${otp}`);

    } catch (error) {
        console.error('Error in generateandSendOTP:', error);
        throw error;
    }

};

module.exports = { generateandSendOTP };