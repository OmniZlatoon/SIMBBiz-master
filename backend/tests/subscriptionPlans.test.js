const assert = require('node:assert/strict');
const test = require('node:test');
const {
  DAY_IN_MS,
  SUBSCRIPTION_PLANS,
  getPlan,
  getPlanExpiryDate,
  getSubscriptionState,
  getTrialWindow,
  getUnexpectedCheckoutFields
} = require('../services/subscriptionPlans');
const { findUntrustedSubscriptionFields } = require('../services/subscriptionSecurity');
const User = require('../models/User');
const { resolveUserSubscription } = require('../services/userSubscription');

test('exposes only the server-priced Basic and Pro plans', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => [
      key,
      { amount: plan.amount, uploads: plan.uploads, durationMonths: plan.durationMonths }
    ])),
    {
      basic: { amount: 3000, uploads: 50, durationMonths: 1 },
      pro: { amount: 10000, uploads: 500, durationMonths: 6 }
    }
  );
  assert.equal(getPlan('free'), null);
});

test('calculates the 30-day trial from the persistent signup timestamp', () => {
  const signupDate = new Date('2026-01-01T12:00:00.000Z');
  const inTrial = getTrialWindow(signupDate, new Date(signupDate.getTime() + 29 * DAY_IN_MS));
  const expired = getTrialWindow(signupDate, new Date(signupDate.getTime() + 30 * DAY_IN_MS));

  assert.equal(inTrial.active, true);
  assert.equal(inTrial.daysRemaining, 1);
  assert.equal(inTrial.endsAt.toISOString(), '2026-01-31T12:00:00.000Z');
  assert.equal(expired.active, false);
  assert.equal(expired.daysRemaining, 0);
});

test('uses the active paid plan before falling back to the signup trial', () => {
  const now = new Date('2026-02-01T00:00:00.000Z');
  const user = { createdAt: new Date('2026-01-25T00:00:00.000Z') };
  const business = {
    subscription_plan: 'pro',
    subscription_expiry: new Date('2026-08-01T00:00:00.000Z'),
    item_slots_available: 500
  };

  assert.equal(getSubscriptionState(business, user, now).status, 'active');
  assert.equal(getSubscriptionState(business, user, now).currentPlan, 'pro');
});

test('enforces user subscription schema attributes and plan values', async () => {
  const subscribedPath = User.schema.path('subscribed');
  const planPath = User.schema.path('subscribed_plan');

  assert.equal(subscribedPath.options.required, true);
  assert.equal(subscribedPath.options.default, false);
  assert.deepEqual(planPath.options.enum, ['trial', 'basic', 'pro', null]);
  assert.equal(planPath.options.default, null);

  const invalidSubscription = await new User({
    subscribed: true,
    subscribed_plan: 'trial'
  }).validate().catch((error) => error);
  assert.ok(invalidSubscription.errors.subscribed_plan);

  const validTrial = await new User({
    subscribed: false,
    subscribed_plan: 'trial'
  }).validate().catch((error) => error);
  assert.equal(validTrial.errors.subscribed_plan, undefined);
});

test('resolves subscribed user fields from paid plan and trial state', () => {
  const now = new Date('2026-02-01T00:00:00.000Z');
  const user = { createdAt: new Date('2026-01-25T00:00:00.000Z') };

  assert.deepEqual(resolveUserSubscription(user, [], now), {
    subscribed: false,
    subscribed_plan: 'trial'
  });
  assert.deepEqual(resolveUserSubscription(user, [{
    subscription_plan: 'basic',
    subscription_expiry: new Date('2026-03-01T00:00:00.000Z'),
    item_slots_available: 50
  }], now), {
    subscribed: true,
    subscribed_plan: 'basic'
  });
  assert.deepEqual(resolveUserSubscription({
    createdAt: new Date('2025-01-01T00:00:00.000Z')
  }, [], now), {
    subscribed: false,
    subscribed_plan: null
  });
});

test('expires monthly plans at the last valid day of the following month', () => {
  const expiry = getPlanExpiryDate('basic', new Date('2025-01-31T10:30:00.000Z'));
  assert.equal(expiry.toISOString(), '2025-02-28T10:30:00.000Z');
});

test('expires Pro plans after six calendar months', () => {
  const expiry = getPlanExpiryDate('pro', new Date('2025-01-15T10:30:00.000Z'));
  assert.equal(expiry.toISOString(), '2025-07-15T10:30:00.000Z');
});

test('rejects client-supplied prices, limits, and other checkout values', () => {
  assert.deepEqual(getUnexpectedCheckoutFields({ planKey: 'basic' }), []);
  assert.deepEqual(
    getUnexpectedCheckoutFields({ planKey: 'basic', amount: 1, uploads: 9999 }),
    ['amount', 'uploads']
  );
  assert.deepEqual(
    findUntrustedSubscriptionFields({ name: 'Store', item_slots_available: 9999, subscription_plan: 'pro' }),
    ['item_slots_available', 'subscription_plan']
  );
});
