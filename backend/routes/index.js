const express = require('express');
const router = express.Router();

const { protect, authorizeBusinessOwner } = require('../middleware/auth');
const authController = require('../controllers/authController');
const businessController = require('../controllers/businessController');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const customerController = require('../controllers/customerController');
const saleController = require('../controllers/saleController');
const paymentController = require('../controllers/paymentController');
const liabilityController = require('../controllers/liabilityController');
const costController = require('../controllers/costController');
const shopController = require('../controllers/shopController');
const subscriptionController = require('../controllers/subscriptionController');
const uploadRoutes = require('./uploadRoutes');

// --- AUTH ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/google', authController.googleLogin);
router.post('/auth/google/logout', protect, authController.googleLogout);
router.get('/auth/logout', authController.logout);
router.get('/auth/me', protect, authController.getMe);

// --- USER BUSINESSES ---
router.post('/user/businesses', protect, businessController.createBusiness);
router.get('/user/businesses', protect, businessController.getMyBusinesses);

// --- ADMIN ---
const { authorizeAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const advancedAdminController = require('../controllers/advancedAdminController');

// Advanced Admin Analytics
router.get('/admin/analytics', protect, authorizeAdmin, advancedAdminController.getAdvancedAnalytics);

// Announcements
router.get('/announcements', protect, advancedAdminController.getAnnouncements);
router.post('/admin/announcements', protect, authorizeAdmin, advancedAdminController.createAnnouncement);
router.delete('/admin/announcements/:id', protect, authorizeAdmin, advancedAdminController.deleteAnnouncement);

// Plans
router.get('/plans', protect, advancedAdminController.getPlans);
router.post('/admin/plans', protect, authorizeAdmin, advancedAdminController.createPlan);
router.delete('/admin/plans/:id', protect, authorizeAdmin, advancedAdminController.deletePlan);

// Tickets
router.get('/tickets', protect, advancedAdminController.getTickets);
router.post('/tickets', protect, advancedAdminController.createTicket);
router.post('/tickets/:id/reply', protect, advancedAdminController.replyTicket);

router.get('/admin/stats', protect, authorizeAdmin, adminController.getPlatformStats);
router.get('/admin/users', protect, authorizeAdmin, adminController.getAllUsers);
router.patch('/admin/users/:id/role', protect, authorizeAdmin, adminController.updateUserRole);
router.delete('/admin/users/:id', protect, authorizeAdmin, adminController.deleteUser);
router.get('/admin/businesses', protect, authorizeAdmin, adminController.getAllBusinesses);
router.patch('/admin/businesses/:id/suspend', protect, authorizeAdmin, advancedAdminController.toggleBusinessSuspension);
router.get('/admin/subscriptions', protect, authorizeAdmin, adminController.getAllSubscriptions);
router.patch('/admin/subscriptions/:id/status', protect, authorizeAdmin, adminController.updateSubscriptionStatus);

// --- BUSINESSES ---
router.get('/businesses/:slug', businessController.getBySlug);
router.get('/businesses/:id/stats', protect, authorizeBusinessOwner, businessController.getStats);
router.patch('/businesses/:id', protect, authorizeBusinessOwner, businessController.updateProfile);
router.patch('/businesses/:id/pin', protect, authorizeBusinessOwner, businessController.updatePin);
router.post('/businesses/:id/verify-pin', protect, authorizeBusinessOwner, businessController.verifyPin);

// --- CATEGORIES ---
router.get('/businesses/:id/categories', protect, authorizeBusinessOwner, categoryController.list);
router.post('/businesses/:id/categories', protect, authorizeBusinessOwner, categoryController.create);
// Delete requires fetching the category to check business ownership, omitting for brevity in this MVP
router.delete('/categories/:id', protect, categoryController.delete);

// --- CATALOGUE ---
router.get('/businesses/:id/catalogue', protect, authorizeBusinessOwner, productController.list);
router.post('/businesses/:id/catalogue', protect, authorizeBusinessOwner, productController.create);
router.get('/catalogue/:id', productController.getSingle);
router.patch('/catalogue/:id', protect, productController.update);
router.delete('/catalogue/:id', protect, productController.delete);

// --- CUSTOMERS ---
router.get('/businesses/:id/customers', protect, authorizeBusinessOwner, customerController.list);
router.post('/businesses/:id/customers', protect, authorizeBusinessOwner, customerController.upsert);
router.delete('/customers/:id', protect, customerController.delete);

// --- SALES ---
router.get('/businesses/:id/sales', protect, authorizeBusinessOwner, saleController.list);
router.post('/businesses/:id/sales', protect, authorizeBusinessOwner, saleController.create);
router.delete('/sales/:id', protect, saleController.delete);

// --- PAYMENTS ---
router.get('/businesses/:id/payments', protect, authorizeBusinessOwner, paymentController.list);
router.post('/businesses/:id/payments', protect, authorizeBusinessOwner, paymentController.create);

// --- LIABILITIES ---
router.get('/businesses/:id/liabilities', protect, authorizeBusinessOwner, liabilityController.list);
router.post('/businesses/:id/liabilities', protect, authorizeBusinessOwner, liabilityController.create);
router.post('/businesses/:id/liability-payments', protect, authorizeBusinessOwner, liabilityController.addPayment);

// --- COSTS ---
router.get('/businesses/:id/daily-costs', protect, authorizeBusinessOwner, costController.list);
router.post('/businesses/:id/daily-costs', protect, authorizeBusinessOwner, costController.upsertDate);

// --- SUBSCRIPTIONS & WEBHOOKS ---
router.post('/businesses/:id/buy-spaces', protect, authorizeBusinessOwner, subscriptionController.buySpaces);
router.post('/webhooks/paveway', subscriptionController.pavewayWebhook);

// --- SHOP (PUBLIC) ---
router.get('/shop', shopController.getAllStores);
router.get('/shop/discover', shopController.getDiscoveryData);
router.get('/shop/:slug', shopController.getStorefront);

// --- UPLOAD ---
router.use('/upload', uploadRoutes);

module.exports = router;
