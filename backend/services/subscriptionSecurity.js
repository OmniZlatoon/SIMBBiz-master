const SubscriptionSecurityEvent = require('../models/SubscriptionSecurityEvent');

const UNTRUSTED_SUBSCRIPTION_FIELDS = new Set([
  'amount',
  'price',
  'slots',
  'slots_added',
  'item_slots_available',
  'subscription_plan',
  'subscription_expiry',
  'subscription_status',
  'planKey',
  'plan_key',
  'upload_limit',
  'max_uploads',
  'plan_or_spaces',
  'duration'
]);

function findUntrustedSubscriptionFields(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return [];
  return Object.keys(payload).filter((field) => UNTRUSTED_SUBSCRIPTION_FIELDS.has(field));
}

async function recordSubscriptionSecurityEvent({ userId, businessId, source, reason, fields = [], req }) {
  const event = await SubscriptionSecurityEvent.create({
    user_id: userId,
    business_id: businessId,
    source,
    reason,
    attempted_fields: fields,
    ip_address: req?.ip,
    user_agent: req?.get?.('user-agent')
  });
  console.warn(`[subscription security] ${source} ${reason} event=${event._id} user=${userId} business=${businessId}`);
}

module.exports = {
  findUntrustedSubscriptionFields,
  recordSubscriptionSecurityEvent
};
