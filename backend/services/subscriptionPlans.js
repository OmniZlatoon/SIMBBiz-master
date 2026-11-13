const DAY_IN_MS = 24 * 60 * 60 * 1000;

const SUBSCRIPTION_PLANS = Object.freeze({
  basic: Object.freeze({
    key: 'basic',
    name: 'Basic',
    amount: 3000,
    uploads: 50,
    durationMonths: 1,
    periodLabel: 'month'
  }),
  pro: Object.freeze({
    key: 'pro',
    name: 'Pro',
    amount: 10000,
    uploads: 500,
    durationMonths: 6,
    periodLabel: '6 months'
  })
});

const TRIAL_DURATION_DAYS = 30;
const CLIENT_CHECKOUT_FIELDS = new Set(['planKey']);

function getPlan(planKey) {
  return typeof planKey === 'string' ? SUBSCRIPTION_PLANS[planKey] || null : null;
}

function getUnexpectedCheckoutFields(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return ['body'];
  }

  return Object.keys(payload).filter((field) => !CLIENT_CHECKOUT_FIELDS.has(field));
}

function getTrialWindow(signupDate, now = new Date()) {
  const startedAt = signupDate ? new Date(signupDate) : null;
  if (!startedAt || Number.isNaN(startedAt.getTime())) {
    return {
      startedAt: null,
      endsAt: null,
      active: false,
      daysRemaining: 0
    };
  }

  const endsAt = new Date(startedAt.getTime() + TRIAL_DURATION_DAYS * DAY_IN_MS);
  const remainingMs = Math.max(0, endsAt.getTime() - now.getTime());

  return {
    startedAt,
    endsAt,
    active: now.getTime() < endsAt.getTime(),
    daysRemaining: Math.ceil(remainingMs / DAY_IN_MS)
  };
}

function getPlanExpiryDate(planKey, startDate = new Date()) {
  const plan = getPlan(planKey);
  if (!plan) {
    throw new Error('Unsupported subscription plan');
  }

  const expiry = new Date(startDate);
  const originalDay = expiry.getUTCDate();
  expiry.setUTCDate(1);
  expiry.setUTCMonth(expiry.getUTCMonth() + plan.durationMonths);
  const lastDayOfMonth = new Date(Date.UTC(
    expiry.getUTCFullYear(),
    expiry.getUTCMonth() + 1,
    0
  )).getUTCDate();
  expiry.setUTCDate(Math.min(originalDay, lastDayOfMonth));

  return expiry;
}

function getSubscriptionState(business, user, now = new Date()) {
  const plan = getPlan(business.subscription_plan);
  const expiresAt = business.subscription_expiry
    ? new Date(business.subscription_expiry)
    : null;
  const paidPlanActive = Boolean(
    plan &&
    expiresAt &&
    !Number.isNaN(expiresAt.getTime()) &&
    now.getTime() < expiresAt.getTime()
  );
  const trial = getTrialWindow(user.createdAt, now);

  if (paidPlanActive) {
    return {
      status: 'active',
      currentPlan: plan.key,
      planName: plan.name,
      trialStartedAt: trial.startedAt,
      trialEndsAt: trial.endsAt,
      trialDaysRemaining: trial.daysRemaining,
      expiresAt,
      itemSlotsAvailable: business.item_slots_available
    };
  }

  if (trial.active) {
    return {
      status: 'trial',
      currentPlan: 'trial',
      planName: '30-day trial',
      trialStartedAt: trial.startedAt,
      trialEndsAt: trial.endsAt,
      trialDaysRemaining: trial.daysRemaining,
      expiresAt: trial.endsAt,
      itemSlotsAvailable: business.item_slots_available
    };
  }

  return {
    status: 'expired',
    currentPlan: null,
    planName: 'No active plan',
    trialStartedAt: trial.startedAt,
    trialEndsAt: trial.endsAt,
    trialDaysRemaining: 0,
    expiresAt,
    itemSlotsAvailable: business.item_slots_available
  };
}

function getPublicPlans() {
  return Object.values(SUBSCRIPTION_PLANS).map((plan) => ({
    key: plan.key,
    name: plan.name,
    amount: plan.amount,
    uploads: plan.uploads,
    periodLabel: plan.periodLabel
  }));
}

module.exports = {
  DAY_IN_MS,
  SUBSCRIPTION_PLANS,
  TRIAL_DURATION_DAYS,
  getPlan,
  getPlanExpiryDate,
  getPublicPlans,
  getSubscriptionState,
  getTrialWindow,
  getUnexpectedCheckoutFields
};
