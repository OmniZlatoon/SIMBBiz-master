const argon2 = require('argon2');

async function OTPverify(storedHash, otp) {
  return argon2.verify(storedHash, otp);
}

module.exports = { OTPverify };
