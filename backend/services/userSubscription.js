const Business = require('../models/Business');
const User = require('../models/User');
const { getSubscriptionState, getTrialWindow } = require('./subscriptionPlans');

function resolveUserSubscription(user, businesses, now = new Date()) {
  const activePaidPlan = businesses
    .map((business) => getSubscriptionState(business, user, now))
    .find((state) => state.status === 'active');
  if (activePaidPlan) {
    return {
      subscribed: true,
      subscribed_plan: activePaidPlan.currentPlan
    };
  }

  return {
    subscribed: false,
    subscribed_plan: getTrialWindow(user.createdAt, now).active ? 'trial' : null
  };
}

async function syncUserSubscription(user, now = new Date()) {
  const businesses = await Business.find({ owner_id: user._id })
    .select('subscription_plan subscription_expiry item_slots_available');
  const subscription = resolveUserSubscription(user, businesses, now);
  const persistedFields = await User.collection.findOne(
    { _id: user._id },
    { projection: { subscribed: 1, subscribed_plan: 1 } }
  );
  const fieldsMissing = !persistedFields ||
    !Object.prototype.hasOwnProperty.call(persistedFields, 'subscribed') ||
    !Object.prototype.hasOwnProperty.call(persistedFields, 'subscribed_plan');

  if (
    fieldsMissing ||
    user.subscribed !== subscription.subscribed ||
    user.subscribed_plan !== subscription.subscribed_plan
  ) {
    user.subscribed = subscription.subscribed;
    user.subscribed_plan = subscription.subscribed_plan;
    await user.save();
  }

  return subscription;
}

module.exports = { resolveUserSubscription, syncUserSubscription };
