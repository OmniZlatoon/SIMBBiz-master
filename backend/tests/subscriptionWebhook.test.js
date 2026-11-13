const assert = require('node:assert/strict');
const test = require('node:test');
const subscriptionController = require('../controllers/subscriptionController');

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(value) {
      this.body = value;
      return this;
    }
  };
}

async function withWebhookSecret(secret, callback) {
  const previousSecret = process.env.FAPSHI_WEBHOOK_SECRET;
  const previousWarn = console.warn;
  const previousError = console.error;
  if (secret === undefined) {
    delete process.env.FAPSHI_WEBHOOK_SECRET;
  } else {
    process.env.FAPSHI_WEBHOOK_SECRET = secret;
  }
  console.warn = () => {};
  console.error = () => {};

  try {
    await callback();
  } finally {
    console.warn = previousWarn;
    console.error = previousError;
    if (previousSecret === undefined) {
      delete process.env.FAPSHI_WEBHOOK_SECRET;
    } else {
      process.env.FAPSHI_WEBHOOK_SECRET = previousSecret;
    }
  }
}

test('rejects Fapshi webhooks when the shared secret is not configured', async () => {
  await withWebhookSecret(undefined, async () => {
    const response = createResponse();
    await subscriptionController.fapshiWebhook({
      get: () => 'provided-secret',
      body: {}
    }, response);

    assert.equal(response.statusCode, 503);
    assert.equal(response.body, 'Webhook is not configured');
  });
});

test('rejects Fapshi webhooks with an incorrect shared secret', async () => {
  await withWebhookSecret('expected-secret', async () => {
    const response = createResponse();
    await subscriptionController.fapshiWebhook({
      get: () => 'incorrect-secret',
      body: {}
    }, response);

    assert.equal(response.statusCode, 401);
    assert.equal(response.body, 'Invalid webhook secret');
  });
});

test('accepts the configured webhook secret before validating the notification payload', async () => {
  await withWebhookSecret('expected-secret', async () => {
    const response = createResponse();
    await subscriptionController.fapshiWebhook({
      get: () => 'expected-secret',
      body: { status: 'PENDING' }
    }, response);

    assert.equal(response.statusCode, 400);
    assert.equal(response.body, 'Invalid payment notification');
  });
});
