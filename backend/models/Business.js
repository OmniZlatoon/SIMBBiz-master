const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slug: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String }, // e.g. Real-Estate, Fashion
  location: { type: String },
  phone: { type: String },
  lang: { type: String, default: 'en' },
  currency: { type: String, default: 'USD' },
  pin_hash: { type: String },
  auto_lock_min: { type: Number, default: 0 },
  subscription_plan: { type: String, default: 'trial' },
  subscription_expiry: { type: Date },
  item_slots_available: { type: Number, default: 50 },
  applied_subscription_payment_ids: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPayment' }],
    default: [],
    select: false
  },
  isSuspended: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-generate slug from name if not provided
businessSchema.pre('validate', function(next) {
  if (this.name && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    // Append random string to ensure uniqueness if needed, but for now just use name
  }
  next();
});

module.exports = mongoose.model('Business', businessSchema);
