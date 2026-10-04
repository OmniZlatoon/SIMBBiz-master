const assert = require('node:assert/strict');
const test = require('node:test');
const axios = require('axios');
const { generateOTP } = require('../OTP/OTP/OTP.script');
const {
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
  normalizeEmail,
  keysFor,
  requestHasValidEmailFields
} = require('../OTP/PasswordReset/passwordReset.utils');
const {
  formatWhatsAppOtpMessage,
  getWhatsAppBusinessNumber,
  sendWhatsAppPasswordReset
} = require('../OTP/PasswordReset/sendWhatsAppPasswordReset');

test('normalizes email and validates recovery request fields', () => {
  assert.equal(normalizeEmail('  User@Example.com '), 'user@example.com');
  assert.equal(requestHasValidEmailFields({
    email: 'user@example.com',
    recoveryEmail: 'recovery@example.com'
  }), true);
  assert.equal(requestHasValidEmailFields({
    email: 'not-an-email',
    recoveryEmail: 'recovery@example.com'
  }), false);
});

test('keeps OTPs, attempts, and cooldowns independent by delivery channel', () => {
  const emailKeys = keysFor('user@example.com', 'email');
  const whatsappKeys = keysFor('user@example.com', 'whatsapp');

  assert.notEqual(emailKeys.otp, whatsappKeys.otp);
  assert.notEqual(emailKeys.attempts, whatsappKeys.attempts);
  assert.notEqual(emailKeys.cooldown, whatsappKeys.cooldown);
  assert.equal(emailKeys.resetToken, whatsappKeys.resetToken);
});

test('normalizes international WhatsApp numbers and rejects incomplete local numbers', () => {
  assert.equal(isValidWhatsAppNumber('+15551234567'), true);
  assert.equal(isValidWhatsAppNumber('15551234567'), false);
  assert.equal(isValidWhatsAppNumber('+01234567'), false);
  assert.equal(normalizeWhatsAppNumber('+234 801-234-5678'), '+2348012345678');
  assert.equal(normalizeWhatsAppNumber('00 44 (20) 1234-5678'), '+442012345678');
  assert.equal(normalizeWhatsAppNumber('123456789'), null);
  assert.equal(normalizeWhatsAppNumber('+0000000000'), null);
});

test('accepts only the exact WhatsApp recovery handoff command', () => {
  const { parseWhatsAppHandoffCode } = require('../OTP/PasswordReset/passwordReset.utils');
  assert.equal(parseWhatsAppHandoffCode('SIMBBIZ RESET ABCDEF1234567890ABCDEF12'), 'abcdef1234567890abcdef12');
  assert.equal(parseWhatsAppHandoffCode('hello SIMBBIZ RESET ABCDEF1234567890ABCDEF12'), null);
  assert.equal(parseWhatsAppHandoffCode('SIMBBIZ RESET ABCDEF1234'), null);
});

test('generates an eight-digit OTP', () => {
  assert.match(generateOTP(), /^\d{8}$/);
});

test('formats the configurable branded WhatsApp message', () => {
  const previousTemplate = process.env.WHATSAPP_OTP_MESSAGE_TEMPLATE;
  process.env.WHATSAPP_OTP_MESSAGE_TEMPLATE =
    'SIMBBiz code {{otp}} expires in {{expiresMinutes}} minutes';

  try {
    assert.equal(
      formatWhatsAppOtpMessage('01234567'),
      'SIMBBiz code *01234567* expires in 5 minutes'
    );
  } finally {
    if (previousTemplate === undefined) {
      delete process.env.WHATSAPP_OTP_MESSAGE_TEMPLATE;
    } else {
      process.env.WHATSAPP_OTP_MESSAGE_TEMPLATE = previousTemplate;
    }
  }
});

test('rejects custom WhatsApp text without an OTP placeholder', () => {
  const previousTemplate = process.env.WHATSAPP_OTP_MESSAGE_TEMPLATE;
  process.env.WHATSAPP_OTP_MESSAGE_TEMPLATE = 'SIMBBiz reset expires in {{expiresMinutes}} minutes';

  try {
    assert.throws(
      () => formatWhatsAppOtpMessage('01234567'),
      /must include {{otp}}/
    );
  } finally {
    if (previousTemplate === undefined) {
      delete process.env.WHATSAPP_OTP_MESSAGE_TEMPLATE;
    } else {
      process.env.WHATSAPP_OTP_MESSAGE_TEMPLATE = previousTemplate;
    }
  }
});

test('sends custom WhatsApp text using the configured Cloud API endpoint', async () => {
  const previousEnv = {
    META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    META_GRAPH_API_VERSION: process.env.META_GRAPH_API_VERSION,
    WHATSAPP_OTP_MESSAGE_TEMPLATE: process.env.WHATSAPP_OTP_MESSAGE_TEMPLATE
  };
  const originalPost = axios.post;
  let request;

  process.env.META_ACCESS_TOKEN = 'test-access-token';
  process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id';
  process.env.META_GRAPH_API_VERSION = 'v20.0';
  process.env.WHATSAPP_OTP_MESSAGE_TEMPLATE =
    'SIMBBiz password reset code: {{otp}}. It expires in {{expiresMinutes}} minutes. Do not share this code. If you did not request it, ignore this message.';
  axios.post = async (...args) => {
    request = args;
    return { data: { messages: [{ id: 'test-message-id' }] } };
  };

  try {
    const result = await sendWhatsAppPasswordReset('+15551234567', '01234567');
    assert.equal(request[0], 'https://graph.facebook.com/v20.0/test-phone-id/messages');
    assert.equal(request[1].to, '15551234567');
    assert.equal(
      request[1].text.body,
      'SIMBBiz password reset code: *01234567*. It expires in 5 minutes. Do not share this code. If you did not request it, ignore this message.'
    );
    assert.equal(request[2].headers.Authorization, 'Bearer test-access-token');
    assert.equal(result.messageId, 'test-message-id');
    assert.equal(result.recipientId, '15551234567');
  } finally {
    axios.post = originalPost;
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});

test('sends the default OTP message to the supplied WhatsApp number', async () => {
  const previousEnv = {
    META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    META_GRAPH_API_VERSION: process.env.META_GRAPH_API_VERSION,
    WHATSAPP_OTP_MESSAGE_TEMPLATE: process.env.WHATSAPP_OTP_MESSAGE_TEMPLATE
  };
  const originalPost = axios.post;
  let request;

  process.env.META_ACCESS_TOKEN = 'test-access-token';
  process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id';
  process.env.META_GRAPH_API_VERSION = 'v20.0';
  delete process.env.WHATSAPP_OTP_MESSAGE_TEMPLATE;
  axios.post = async (...args) => {
    request = args;
    return { data: { messages: [{ id: 'test-message-id' }] } };
  };

  try {
    await sendWhatsAppPasswordReset('+2348012345678', '01234567');
    assert.equal(request[1].to, '2348012345678');
    assert.equal(
      request[1].text.body,
      'SIMBBiz password reset code: *01234567*. It expires in 5 minutes. Do not share this code. If you did not request it, ignore this message.'
    );
  } finally {
    axios.post = originalPost;
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});

test('looks up the registered WhatsApp business number for the handoff link', async () => {
  const previousEnv = {
    META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    META_GRAPH_API_VERSION: process.env.META_GRAPH_API_VERSION
  };
  const originalGet = axios.get;
  let request;

  process.env.META_ACCESS_TOKEN = 'test-access-token';
  process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id';
  process.env.META_GRAPH_API_VERSION = 'v20.0';
  axios.get = async (...args) => {
    request = args;
    return { data: { display_phone_number: '+1 555-123-4567' } };
  };

  try {
    assert.equal(await getWhatsAppBusinessNumber(), '15551234567');
    assert.equal(request[0], 'https://graph.facebook.com/v20.0/test-phone-id');
    assert.equal(request[1].params.fields, 'display_phone_number');
    assert.equal(request[1].headers.Authorization, 'Bearer test-access-token');
  } finally {
    axios.get = originalGet;
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});

test('requires a Meta message ID before treating WhatsApp send as accepted', async () => {
  const previousEnv = {
    META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    META_GRAPH_API_VERSION: process.env.META_GRAPH_API_VERSION
  };
  const originalPost = axios.post;

  process.env.META_ACCESS_TOKEN = 'test-access-token';
  process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id';
  process.env.META_GRAPH_API_VERSION = 'v20.0';
  axios.post = async () => ({ data: { messages: [] } });

  try {
    await assert.rejects(
      sendWhatsAppPasswordReset('+15551234567', '01234567'),
      /did not return a message ID/
    );
  } finally {
    axios.post = originalPost;
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});

test('explains when Meta requires an approved WhatsApp template', async () => {
  const previousEnv = {
    META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    META_GRAPH_API_VERSION: process.env.META_GRAPH_API_VERSION
  };
  const originalPost = axios.post;

  process.env.META_ACCESS_TOKEN = 'test-access-token';
  process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id';
  process.env.META_GRAPH_API_VERSION = 'v20.0';
  axios.post = async () => {
    const error = new Error('Meta rejected the free-form message');
    error.response = { data: { error: { code: 131047 } } };
    throw error;
  };

  try {
    await assert.rejects(
      sendWhatsAppPasswordReset('+15551234567', '01234567'),
      /Meta-approved message template/
    );
  } finally {
    axios.post = originalPost;
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});
