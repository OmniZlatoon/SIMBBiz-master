const { randomBytes } = require('node:crypto');

const generateOTP = () => {
    const length = 8;
    const charset = '0123456789';
    let result = '';
    const bytes = randomBytes(length);

    for (let i = 0; i < length; i++) {
        result += charset[bytes[i] % charset.length];
    }
    return result;
};

module.exports = { generateOTP };
