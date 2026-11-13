const Product = require('../models/Product');
const Business = require('../models/Business');
const User = require('../models/User');
const { ensureTrialBusinessAllowance } = require('../services/subscriptionEntitlements');
const { getSubscriptionState } = require('../services/subscriptionPlans');


exports.list = async (req, res) => {
  try {
    const { category_id, in_stock } = req.query;
    const query = { business_id: req.params.id };
    if (category_id) query.category_id = category_id;
    if (in_stock === 'true') query.in_stock = true;

    const products = await Product.find(query).populate('category_id', 'name').sort('-added_date -createdAt');
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSingle = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category_id', 'name').populate('business_id', 'name phone');
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { category_id, name, description, price, image_url, in_stock, stock_qty, discount, min_qty, max_qty } = req.body;
    if (!name || price == null || price < 0) return res.status(400).json({ success: false, error: 'Valid name and price are required' });
    let business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ success: false, error: 'Business not found' });

    const owner = await User.findById(business.owner_id)
      .select('createdAt trial_uploads_used trial_uploads_initialized');
    if (!owner) return res.status(404).json({ success: false, error: 'Business owner not found' });
    business = await ensureTrialBusinessAllowance(business, owner);
    if (!business) return res.status(404).json({ success: false, error: 'Business not found' });
    const subscription = getSubscriptionState(business, owner);
    if (subscription.status === 'expired') {
      return res.status(403).json({
        success: false,
        error: 'Your 30-day trial has ended. Choose Basic or Pro to continue adding items.'
      });
    }

    let trialSlotReserved = false;
    if (subscription.status === 'trial') {
      const ownerBusinesses = await Business.find({ owner_id: owner._id }).select('_id');
      if (!owner.trial_uploads_initialized) {
        const existingTrialUploads = await Product.countDocuments({
          business_id: { $in: ownerBusinesses.map((store) => store._id) }
        });
        await User.updateOne(
          { _id: owner._id, trial_uploads_initialized: { $ne: true } },
          {
            $set: {
              trial_uploads_used: existingTrialUploads,
              trial_uploads_initialized: true
            }
          }
        );
      }

      const trialReservation = await User.findOneAndUpdate(
        { _id: owner._id, trial_uploads_used: { $lt: 50 } },
        { $inc: { trial_uploads_used: 1 } },
        { new: true }
      );
      if (!trialReservation) {
        return res.status(403).json({
          success: false,
          error: 'The 50-item trial upload limit has been reached. Choose Basic or Pro to add more items.'
        });
      }
      trialSlotReserved = true;
    }

    let reservedBusiness;
    try {
      reservedBusiness = await Business.findOneAndUpdate(
        { _id: business._id, item_slots_available: { $gt: 0 } },
        { $inc: { item_slots_available: -1 } },
        { new: true }
      );
    } catch (error) {
      if (trialSlotReserved) {
        await User.updateOne({ _id: owner._id }, { $inc: { trial_uploads_used: -1 } });
      }
      throw error;
    }
    if (!reservedBusiness) {
      if (trialSlotReserved) {
        await User.updateOne({ _id: owner._id }, { $inc: { trial_uploads_used: -1 } });
      }
      return res.status(403).json({ success: false, error: 'Item limit reached. Choose Basic or Pro to add more items.' });
    }

    let product;
    try {
      product = new Product({
        business_id: req.params.id,
        category_id: category_id || null,
        name,
        description,
        price,
        image_url,
        in_stock: in_stock ?? true,
        stock_qty,
        discount,
        min_qty,
        max_qty
      });
      await product.save();
    } catch (error) {
      await Business.updateOne({ _id: business._id }, { $inc: { item_slots_available: 1 } });
      if (trialSlotReserved) {
        await User.updateOne({ _id: owner._id }, { $inc: { trial_uploads_used: -1 } });
      }
      throw error;
    }

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const business = await Business.findOne({ _id: product.business_id, owner_id: req.user._id });
    if (!business) return res.status(403).json({ success: false, error: 'User does not own this product' });

    const owner = await User.findById(business.owner_id)
      .select('createdAt trial_uploads_used trial_uploads_initialized');
    if (!owner) return res.status(404).json({ success: false, error: 'Business owner not found' });
    const subscription = getSubscriptionState(business, owner);

    if (subscription.status === 'trial' && !owner.trial_uploads_initialized) {
      const ownerBusinesses = await Business.find({ owner_id: owner._id }).select('_id');
      const existingTrialUploads = await Product.countDocuments({
        business_id: { $in: ownerBusinesses.map((store) => store._id) }
      });
      await User.updateOne(
        { _id: owner._id, trial_uploads_initialized: { $ne: true } },
        {
          $set: {
            trial_uploads_used: existingTrialUploads,
            trial_uploads_initialized: true
          }
        }
      );
    }

    await Product.findByIdAndDelete(req.params.id);
    await Business.updateOne({ _id: business._id }, { $inc: { item_slots_available: 1 } });
    if (subscription.status === 'trial') {
      await User.updateOne(
        { _id: owner._id, trial_uploads_used: { $gt: 0 } },
        { $inc: { trial_uploads_used: -1 } }
      );
    }

    res.json({ success: true, data: { message: 'Product deleted and slot restored' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
