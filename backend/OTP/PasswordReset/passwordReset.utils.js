const { createHash } = require('node:crypto');

const normalizeEmail = (value) => value.trim().toLowerCase();
const emailKey = (email) => createHash('sha256').update(email).digest('hex');

const keysFor = (email, channel) => {
  if (channel !== 'email' && channel !== 'whatsapp') {
    throw new Error('Password reset channel must be email or whatsapp');
  }

  const digest = emailKey(email);
  return {
    otp: `password-reset:otp:${digest}:${channel}`,
    attempts: `password-reset:attempts:${digest}:${channel}`,
    cooldown: `password-reset:cooldown:${digest}:${channel}`,
    resetToken: `password-reset:token:${digest}`
  };
};

const requestHasValidEmailFields = ({ email, recoveryEmail }) => (
  typeof email === 'string' &&
  typeof recoveryEmail === 'string' &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail.trim())
);

const normalizeWhatsAppNumber = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  let number = value.trim().replace(/[\s()./-]/g, '');
  if (number.startsWith('00')) {
    number = `+${number.slice(2)}`;
  }

  return /^\+[1-9]\d{7,14}$/.test(number) ? number : null;
};

const isValidWhatsAppNumber = (number) => normalizeWhatsAppNumber(number) !== null;

const parseWhatsAppHandoffCode = (message) => {
  if (typeof message !== 'string') {
    return null;
  }

  const match = message.trim().match(/^SIMBBIZ RESET ([a-f0-9]{24})$/i);
  return match ? match[1].toLowerCase() : null;
};

module.exports = {
  isValidWhatsAppNumber,
  keysFor,
  normalizeWhatsAppNumber,
  normalizeEmail,
  parseWhatsAppHandoffCode,
  requestHasValidEmailFields
};
