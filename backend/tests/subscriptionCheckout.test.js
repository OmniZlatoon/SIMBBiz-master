const assert = require('node:assert/strict');
const test = require('node:test');
const axios = require('axios');
const Business = require('../models/Business');
const SubscriptionPayment = require('../models/SubscriptionPayment');
const subscriptionController = require('../controllers/subscriptionController');

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    }
  };
}

test('initiates Fapshi checkout using existing API credentials and configured endpoint', async () => {
  const envKeys = [
    'API_USER',
    'API_SECRET',
    'FAPSHI_API_USER',
    'FAPSHI_API_SECRET',
    'FAPSHI_BASE_URL',
    'FRONTEND_URL'
  ];
  const previousEnv = Object.fromEntries(
    envKeys.map((key) => [key, process.env[key]])
  );
  const originalBusinessFindOne = Business.findOne;
  const originalPaymentFindOne = SubscriptionPayment.findOne;
  const originalPaymentSave = SubscriptionPayment.prototype.save;
  const originalAxiosPost = axios.post;
  let gatewayRequest;

  process.env.API_USER = 'test-fapshi-user';
  process.env.API_SECRET = 'test-fapshi-secret';
  delete process.env.FAPSHI_API_USER;
  delete process.env.FAPSHI_API_SECRET;
  process.env.FAPSHI_BASE_URL = 'https://gateway.fapshi.test/';
  process.env.FRONTEND_URL = 'http://localhost:5173';

  Business.findOne = async () => ({
    _id: '507f1f77bcf86cd799439011',
    owner_id: '507f1f77bcf86cd799439012',
    name: 'Test business',
    subscription_plan: 'basic',
    subscription_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    item_slots_available: 50
  });
  SubscriptionPayment.findOne = () => ({
    sort: async () => null
  });
  SubscriptionPayment.prototype.save = async function save() {};
  axios.post = async (url, payload, options) => {
    gatewayRequest = { url, payload, options };
    return { data: { link: 'https://payments.fapshi.test/checkout', transId: 'test-tx' } };
  };

  try {
    const response = createResponse();
    await subscriptionController.initiateCheckout({
      body: { planKey: 'basic' },
      params: { id: '507f1f77bcf86cd799439011' },
      user: {
        _id: '507f1f77bcf86cd799439012',
        email: 'customer@example.test'
      }
    }, response);

    assert.equal(response.statusCode, 201);
    assert.equal(gatewayRequest.url, 'https://gateway.fapshi.test/initiate-pay');
    assert.equal(gatewayRequest.options.headers.apiuser, 'test-fapshi-user');
    assert.equal(gatewayRequest.options.headers.apikey, 'test-fapshi-secret');
  } finally {
    for (const key of envKeys) {
      if (previousEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previousEnv[key];
      }
    }
    Business.findOne = originalBusinessFindOne;
    SubscriptionPayment.findOne = originalPaymentFindOne;
    SubscriptionPayment.prototype.save = originalPaymentSave;
    axios.post = originalAxiosPost;
  }
});
