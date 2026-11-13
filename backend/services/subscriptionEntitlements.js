const Business = require('../models/Business');
const Product = require('../models/Product');
const { getSubscriptionState } = require('./subscriptionPlans');

async function ensureTrialBusinessAllowance(business, user) {
  const subscription = getSubscriptionState(business, user);
  if (
    subscription.status !== 'trial' ||
    business.subscription_plan !== 'free' ||
    business.subscription_expiry
  ) {
    return business;
  }

  const existingProducts = await Product.countDocuments({ business_id: business._id });
  const remainingAllowance = Math.max(
    Number(business.item_slots_available) || 0,
    50 - existingProducts
  );
  const updatedBusiness = await Business.findOneAndUpdate(
    {
      _id: business._id,
      subscription_plan: 'free',
      subscription_expiry: null
    },
    {
      $set: {
        subscription_plan: 'trial',
        item_slots_available: remainingAllowance
      }
    },
    { new: true }
  );

  return updatedBusiness || Business.findById(business._id);
}

module.exports = { ensureTrialBusinessAllowance };
