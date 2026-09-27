const argon2 = require('argon2');

async function OTPverify(storedHash, otp) {
  try {
    return await argon2.verify(storedHash, otp);
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return false;
  }
}

module.exports = { OTPverify };
