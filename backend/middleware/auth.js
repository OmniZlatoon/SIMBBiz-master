const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

// Middleware to handle user authentication
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Attach user to req
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, error: 'The user belonging to this token no longer exists.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
};

const Business = require('../models/Business');

// Middleware to authorize business owners
const authorizeBusinessOwner = async (req, res, next) => {
  try {
    // Determine where the business ID is coming from (URL params 'id' or body 'business_id')
    const businessId = req.params.id || req.body.business_id;
    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Business ID is required' });
    }

    //Verify that the user is the owner of the business
    const business = await Business.findOne({ _id: businessId, owner_id: req.user._id });
    if (!business) {
      return res.status(403).json({ success: false, error: 'User does not own this business' });
    }

    next();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Authorization error' });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Not authorized as an admin' });
  }
};

module.exports = { protect, authorizeBusinessOwner, authorizeAdmin };
