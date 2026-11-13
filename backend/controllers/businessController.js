const Business = require('../models/Business');
const { getTrialWindow } = require('../services/subscriptionPlans');
const {
  findUntrustedSubscriptionFields,
  recordSubscriptionSecurityEvent
} = require('../services/subscriptionSecurity');
const { syncUserSubscription } = require('../services/userSubscription');

// Create a new business for the logged-in user
exports.createBusiness = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ success: false, error: 'Invalid store data' });
    }
    const untrustedFields = findUntrustedSubscriptionFields(req.body);
    if (untrustedFields.length > 0) {
      await recordSubscriptionSecurityEvent({
        userId: req.user._id,
        businessId: null,
        source: 'store_create',
        reason: 'client_attempted_to_set_subscription_values',
        fields: untrustedFields,
        req
      });
      return res.status(400).json({
        success: false,
        error: 'Subscription status and upload limits are managed by the server.'
      });
    }

    const { name, location, phone, lang, category, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'name is required' });
    const trial = getTrialWindow(req.user.createdAt);
    
    // Auto-generate slug handled by mongoose pre-validate hook
    const business = new Business({ 
      owner_id: req.user._id,
      name,
      description,
      category, 
      location, 
      phone, 
      lang: lang || 'en',
      subscription_plan: trial.active ? 'trial' : 'expired',
      item_slots_available: trial.active ? 50 : 0
    });
    
    await business.save();
    await syncUserSubscription(req.user);
    res.status(201).json({ success: true, data: business });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, error: 'A store with this generated URL already exists. Please choose a different name.' });
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all businesses owned by the logged-in user
exports.getMyBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find({ owner_id: req.user._id });
    res.json({ success: true, data: businesses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getBySlug = async (req, res) => {
  try {
    const business = await Business.findOne({ slug: req.params.slug });
    if (!business) return res.status(404).json({ success: false, error: 'Business not found' });
    res.json({ success: true, data: business });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'description', 'category', 'location', 'phone', 'lang', 'currency'];
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ success: false, error: 'Invalid store profile data' });
    }
    const untrustedFields = findUntrustedSubscriptionFields(req.body);
    if (untrustedFields.length > 0) {
      await recordSubscriptionSecurityEvent({
        userId: req.user._id,
        businessId: req.params.id,
        source: 'store_update',
        reason: 'client_attempted_to_set_subscription_values',
        fields: untrustedFields,
        req
      });
      return res.status(400).json({
        success: false,
        error: 'Subscription status and upload limits are managed by the server.'
      });
    }
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([field]) => allowedFields.includes(field))
    );
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No editable store profile fields were provided' });
    }
    const business = await Business.findOneAndUpdate(
      { _id: req.params.id, owner_id: req.user._id }, 
      updates,
      { new: true }
    );
    if (!business) return res.status(404).json({ success: false, error: 'Business not found or unauthorized' });
    res.json({ success: true, data: business });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updatePin = async (req, res) => {
  try {
    const { pin_hash } = req.body;
    if (!pin_hash) return res.status(400).json({ success: false, error: 'pin_hash is required' });
    const business = await Business.findOneAndUpdate({ _id: req.params.id, owner_id: req.user._id }, { pin_hash });
    if (!business) return res.status(404).json({ success: false, error: 'Business not found or unauthorized' });
    res.json({ success: true, data: { message: 'PIN updated' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.verifyPin = async (req, res) => {
  try {
    const { pin_hash } = req.body;
    const business = await Business.findOne({ _id: req.params.id, owner_id: req.user._id });
    if (!business) return res.status(404).json({ success: false, error: 'Business not found or unauthorized' });
    res.json({ success: true, data: { verified: business.pin_hash === pin_hash } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');

exports.getStats = async (req, res) => {
  try {
    const businessId = req.params.id;
    
    const [totalProducts, promoProducts, salesCount, customerCount] = await Promise.all([
      Product.countDocuments({ business_id: businessId }),
      Product.countDocuments({ business_id: businessId, is_promotion: true }),
      Sale.countDocuments({ business_id: businessId }),
      Customer.countDocuments({ business_id: businessId })
    ]);

    // Aggregate total revenue from Sales
    const sales = await Sale.aggregate([
      { $match: { business_id: new require('mongoose').Types.ObjectId(businessId) } },
      { $group: { _id: null, total: { $sum: "$total_amount" }, credit: { $sum: "$credit_amount" } } }
    ]);

    const stats = {
      total_products: totalProducts,
      promo_products: promoProducts,
      sale_count: salesCount,
      customer_count: customerCount,
      total_revenue: sales.length ? sales[0].total : 0,
      total_credit: sales.length ? sales[0].credit : 0,
    };

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
