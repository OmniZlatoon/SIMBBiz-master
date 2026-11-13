const mongoose = require('mongoose');

const subscriptionPaymentSchema = new mongoose.Schema({
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  payment_method: { type: String, enum: ['MTN', 'ORANGE', 'VIRTUAL_CARD', 'FAPSHI'], required: true },
  transaction_reference: { type: String, unique: true },
  payment_status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  plan_or_spaces: { type: String, required: true }, // e.g. '10_slots', 'Pro_Plan'
  slots_added: { type: Number, default: 0 },
  plan_key: { type: String, enum: ['basic', 'pro'] },
  gateway_transaction_id: { type: String, unique: true, sparse: true },
  checkout_url: { type: String },
  gateway_status: { type: String },
  last_status_check_at: { type: Date },
  security_flagged: { type: Boolean, default: false },
  security_flag_reason: { type: String },
  payment_date: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionPayment', subscriptionPaymentSchema);
