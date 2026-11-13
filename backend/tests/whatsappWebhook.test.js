const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const test = require('node:test');
const webhookController = require('../controllers/whatsappWebhook.controller');

const createResponse = () => ({
  statusCode: null,
  body: null,
  contentType: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  type(value) {
    this.contentType = value;
    return this;
  },
  send(value) {
    this.body = value;
    return this;
  },
  sendStatus(code) {
    this.statusCode = code;
    return this;
  },
  json(value) {
    this.body = value;
    return this;
  }
});

test('verifies Meta webhook subscription challenge', () => {
  const previousToken = process.env.WEBHOOK_VERIFY_TOKEN;
  process.env.WEBHOOK_VERIFY_TOKEN = 'verify-token-for-test';
  const response = createResponse();

  try {
    webhookController.verify({
      query: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'verify-token-for-test',
        'hub.challenge': 'challenge-value'
      }
    }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body, 'challenge-value');
    assert.equal(response.contentType, 'text/plain');
  } finally {
    if (previousToken === undefined) {
      delete process.env.WEBHOOK_VERIFY_TOKEN;
    } else {
      process.env.WEBHOOK_VERIFY_TOKEN = previousToken;
    }
  }
});

test('rejects WhatsApp status webhook with an invalid signature', () => {
  const previousSecret = process.env.META_APP_SECRET;
  process.env.META_APP_SECRET = 'test-app-secret';
  const rawBody = Buffer.from('{"entry":[]}');
  const response = createResponse();

  try {
    webhookController.receive({
      rawBody,
      body: { entry: [] },
      get: () => 'sha256=invalid'
    }, response);

    assert.equal(response.statusCode, 401);
    assert.equal(response.body.message, 'Invalid webhook signature');
  } finally {
    if (previousSecret === undefined) {
      delete process.env.META_APP_SECRET;
    } else {
      process.env.META_APP_SECRET = previousSecret;
    }
  }
});

test('accepts a correctly signed delivery status webhook', () => {
  const previousSecret = process.env.META_APP_SECRET;
  const previousLog = console.log;
  process.env.META_APP_SECRET = 'test-app-secret';
  const rawBody = Buffer.from('{"entry":[{"changes":[]}]}');
  const signature = `sha256=${createHmac('sha256', process.env.META_APP_SECRET)
    .update(rawBody)
    .digest('hex')}`;
  const response = createResponse();
  console.log = () => {};

  try {
    webhookController.receive({
      rawBody,
      body: {
        entry: [{
          changes: [{
            value: {
              statuses: [{
                id: 'wamid.test',
                recipient_id: '15551234567',
                status: 'delivered'
              }]
            }
          }]
        }]
      },
      get: () => signature
    }, response);

    assert.equal(response.statusCode, 200);
  } finally {
    console.log = previousLog;
    if (previousSecret === undefined) {
      delete process.env.META_APP_SECRET;
    } else {
      process.env.META_APP_SECRET = previousSecret;
    }
  }
});

test('processes a signed inbound reset handoff message from the configured WhatsApp number', async () => {
  const previousSecret = process.env.META_APP_SECRET;
  const previousPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const previousLog = console.log;
  const servicePath = require.resolve('../services/passwordReset.service');
  const previousServiceModule = require.cache[servicePath];
  const received = [];
  process.env.META_APP_SECRET = 'test-app-secret';
  process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id';
  const body = {
    entry: [{
      changes: [{
        value: {
          metadata: { phone_number_id: 'test-phone-id' },
          messages: [{
            from: '15551234567',
            type: 'text',
            text: { body: 'SIMBBIZ RESET ABCDEF1234567890ABCDEF12' }
          }]
        }
      }]
    }]
  };
  const rawBody = Buffer.from(JSON.stringify(body));
  const signature = `sha256=${createHmac('sha256', process.env.META_APP_SECRET)
    .update(rawBody)
    .digest('hex')}`;
  const response = createResponse();
  console.log = () => {};
  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: {
      processWhatsAppHandoff: async (handoff) => {
        received.push(handoff);
        return true;
      }
    }
  };

  try {
    await webhookController.receive({
      rawBody,
      body,
      get: () => signature
    }, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(received, [{
      from: '15551234567',
      message: 'SIMBBIZ RESET ABCDEF1234567890ABCDEF12'
    }]);
  } finally {
    console.log = previousLog;
    if (previousServiceModule) {
      require.cache[servicePath] = previousServiceModule;
    } else {
      delete require.cache[servicePath];
    }
    if (previousSecret === undefined) {
      delete process.env.META_APP_SECRET;
    } else {
      process.env.META_APP_SECRET = previousSecret;
    }
    if (previousPhoneId === undefined) {
      delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    } else {
      process.env.WHATSAPP_PHONE_NUMBER_ID = previousPhoneId;
    }
  }
});
