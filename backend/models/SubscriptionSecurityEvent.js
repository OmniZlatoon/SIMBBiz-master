const mongoose = require('mongoose');

const subscriptionSecurityEventSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', index: true },
  source: { type: String, enum: ['checkout', 'fapshi_webhook', 'store_update', 'store_create'], required: true },
  reason: { type: String, required: true },
  attempted_fields: [{ type: String }],
  ip_address: { type: String },
  user_agent: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionSecurityEvent', subscriptionSecurityEventSchema);
