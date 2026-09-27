const argon2 = require('argon2');

async function hashOTP(otp) {
  try {
    return await argon2.hash(otp, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1
    });
  } catch (err) {
    console.error('Error hashing OTP:', err);
    throw new Error('Internal Security Error');
  }
}

module.exports = { hashOTP };
