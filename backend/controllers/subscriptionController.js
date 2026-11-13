const axios = require('axios');
const crypto = require('crypto');
const Business = require('../models/Business');
const User = require('../models/User');
const SubscriptionPayment = require('../models/SubscriptionPayment');
const { ensureTrialBusinessAllowance } = require('../services/subscriptionEntitlements');
const { syncUserSubscription } = require('../services/userSubscription');
const {
  getPlan,
  getPlanExpiryDate,
  getPublicPlans,
  getSubscriptionState,
  getUnexpectedCheckoutFields
} = require('../services/subscriptionPlans');
const {
  recordSubscriptionSecurityEvent
} = require('../services/subscriptionSecurity');

const WEBHOOK_STATUS = new Set(['SUCCESSFUL', 'FAILED', 'EXPIRED']);
const STATUS_CHECK_INTERVAL_MS = 15 * 1000;

function getFapshiBaseUrl() {
  return (process.env.FAPSHI_BASE_URL || (
    process.env.NODE_ENV === 'production'
      ? 'https://live.fapshi.com'
      : 'https://sandbox.fapshi.com'
  )).replace(/\/+$/, '');
}

function getFapshiCredentials() {
  const apiUser = process.env.FAPSHI_API_USER;
  const apiSecret = process.env.FAPSHI_API_SECRET;
  if (!apiUser || !apiSecret) return null;

  return {
    apiuser: apiUser,
    apikey: apiSecret
  };
}

function safeCompare(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

async function flagPayment(payment, reason, fields = []) {
  if (payment.security_flagged) return;

  const business = await Business.findById(payment.business_id).select('owner_id');
  await SubscriptionPayment.updateOne(
    { _id: payment._id },
    { $set: { security_flagged: true, security_flag_reason: reason } }
  );

  if (business) {
    await recordSubscriptionSecurityEvent({
      userId: business.owner_id,
      businessId: payment.business_id,
      source: 'fapshi_webhook',
      reason,
      fields
    });
  } else {
    console.error(`[subscription security] ${reason} for payment=${payment._id}; business not found`);
  }
}

async function fetchFapshiTransaction(transId) {
  const credentials = getFapshiCredentials();
  if (!credentials) {
    const error = new Error('Fapshi API credentials are not configured');
    error.statusCode = 503;
    throw error;
  }

  const response = await axios.get(
    `${getFapshiBaseUrl()}/payment-status/${encodeURIComponent(transId)}`,
    { headers: credentials, timeout: 10000 }
  );
  return response.data;
}

async function activateSubscription(payment, status) {
  if (payment.payment_status !== 'pending') return;

  const plan = getPlan(payment.plan_key);
  if (!plan || payment.amount !== plan.amount || payment.slots_added !== plan.uploads) {
    await flagPayment(payment, 'stored_plan_values_do_not_match_catalogue', [
      'amount',
      'slots_added',
      'plan_key'
    ]);
    return;
  }

  const expiresAt = getPlanExpiryDate(plan.key, new Date());
  const updatedBusiness = await Business.findOneAndUpdate(
    {
      _id: payment.business_id,
      applied_subscription_payment_ids: { $ne: payment._id }
    },
    {
      $inc: { item_slots_available: plan.uploads },
      $set: {
        subscription_plan: plan.key,
        subscription_expiry: expiresAt
      },
      $addToSet: { applied_subscription_payment_ids: payment._id }
    },
    { new: true }
  );

  if (!updatedBusiness) {
    const alreadyApplied = await Business.exists({
      _id: payment.business_id,
      applied_subscription_payment_ids: payment._id
    });
    if (!alreadyApplied) {
      throw new Error('Business could not be found while activating a subscription');
    }
  }

  const business = await Business.findById(payment.business_id).select('owner_id');
  if (!business) {
    throw new Error('Business owner could not be found while updating subscription status');
  }
  const user = await User.findById(business.owner_id);
  if (!user) {
    throw new Error('Subscription owner could not be found');
  }
  await syncUserSubscription(user);
  await SubscriptionPayment.updateOne(
    { _id: payment._id, payment_status: 'pending' },
    { $set: { payment_status: 'completed', gateway_status: status } }
  );
}

async function applyGatewayStatus(payment, status) {
  if (payment.payment_status !== 'pending') return;

  if (status === 'SUCCESSFUL') {
    await activateSubscription(payment, status);
    return;
  }

  if (status === 'FAILED' || status === 'EXPIRED') {
    await SubscriptionPayment.updateOne(
      { _id: payment._id, payment_status: 'pending' },
      { $set: { payment_status: 'failed', gateway_status: status } }
    );
    return;
  }

  await SubscriptionPayment.updateOne(
    { _id: payment._id, payment_status: 'pending' },
    { $set: { gateway_status: status } }
  );
}

async function verifyAndApplyTransaction(payment, expectedStatus, webhookPayload) {
  if (payment.security_flagged) return false;

  const transaction = await fetchFapshiTransaction(payment.gateway_transaction_id);
  const business = await Business.findById(payment.business_id).select('owner_id');
  const mismatchFields = [];

  if (!business) mismatchFields.push('business_id');
  if (transaction.transId !== payment.gateway_transaction_id) mismatchFields.push('transId');
  if (transaction.externalId !== String(payment._id)) mismatchFields.push('externalId');
  if (Number(transaction.amount) !== payment.amount) mismatchFields.push('amount');
  if (!business || String(transaction.userId) !== String(business.owner_id)) mismatchFields.push('userId');

  if (webhookPayload) {
    if (webhookPayload.transId !== transaction.transId) mismatchFields.push('webhook.transId');
    if (webhookPayload.externalId !== transaction.externalId) mismatchFields.push('webhook.externalId');
    if (Number(webhookPayload.amount) !== payment.amount) mismatchFields.push('webhook.amount');
    if (String(webhookPayload.userId) !== String(business?.owner_id)) mismatchFields.push('webhook.userId');
  }

  const gatewayStatus = String(transaction.status || '').toUpperCase();
  if (expectedStatus && gatewayStatus !== expectedStatus) mismatchFields.push('status');
  if (!['CREATED', 'PENDING', 'SUCCESSFUL', 'FAILED', 'EXPIRED'].includes(gatewayStatus)) {
    mismatchFields.push('status');
  }

  if (mismatchFields.length > 0) {
    await flagPayment(payment, 'gateway_transaction_values_do_not_match', mismatchFields);
    return false;
  }

  await applyGatewayStatus(payment, gatewayStatus);
  return true;
}

function getCheckoutRedirectBaseUrl() {
  if (!process.env.FRONTEND_URL) return undefined;
  const baseUrl = new URL(process.env.FRONTEND_URL);
  if (baseUrl.protocol !== 'https:' && baseUrl.hostname !== 'localhost' && baseUrl.hostname !== '127.0.0.1') {
    const error = new Error('FRONTEND_URL must use HTTPS');
    error.statusCode = 503;
    throw error;
  }
  return baseUrl;
}

exports.initiateCheckout = async (req, res) => {
  try {
    const fields = getUnexpectedCheckoutFields(req.body);
    const plan = getPlan(req.body?.planKey);
    if (fields.length > 0 || !plan) {
      const attemptedFields = [...fields];
      if (!plan && !attemptedFields.includes('planKey')) attemptedFields.push('planKey');
      await recordSubscriptionSecurityEvent({
        userId: req.user._id,
        businessId: req.params.id,
        source: 'checkout',
        reason: fields.length > 0 ? 'client_supplied_untrusted_checkout_values' : 'unsupported_plan_key',
        fields: attemptedFields,
        req
      });
      return res.status(400).json({
        success: false,
        error: 'Choose a supported subscription plan. Prices and upload limits are set by the server.'
      });
    }

    let business = await Business.findOne({
      _id: req.params.id,
      owner_id: req.user._id
    });
    if (!business) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }
    business = await ensureTrialBusinessAllowance(business, req.user);
    if (!business) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }

    const credentials = getFapshiCredentials();
    if (!credentials) {
      return res.status(503).json({
        success: false,
        error: 'Fapshi payments are not configured on the server.'
      });
    }
    let redirectBaseUrl;
    try {
      redirectBaseUrl = getCheckoutRedirectBaseUrl();
    } catch (configurationError) {
      return res.status(configurationError.statusCode || 503).json({
        success: false,
        error: configurationError.message
      });
    }

    const pendingPayment = await SubscriptionPayment.findOne({
      business_id: business._id,
      payment_status: 'pending'
    }).sort({ createdAt: -1 });
    if (pendingPayment) {
      return res.status(409).json({
        success: false,
        error: 'A payment is already being processed for this store.',
        data: {
          link: pendingPayment.checkout_url,
          planKey: pendingPayment.plan_key
        }
      });
    }

    const payment = new SubscriptionPayment({
      business_id: business._id,
      amount: plan.amount,
      payment_method: 'FAPSHI',
      transaction_reference: `SIMBBIZ-${Date.now()}-${crypto.randomBytes(5).toString('hex')}`,
      plan_or_spaces: plan.name,
      plan_key: plan.key,
      slots_added: plan.uploads,
      payment_status: 'pending'
    });
    await payment.save();

    const checkoutPayload = {
      amount: plan.amount,
      email: req.user.email,
      userId: String(req.user._id),
      externalId: String(payment._id),
      message: `${plan.name} subscription for ${business.name}`
    };
    const redirectUrl = redirectBaseUrl
      ? new URL(`/dashboard/billing?payment=${encodeURIComponent(payment._id)}`, redirectBaseUrl).toString()
      : undefined;
    if (redirectUrl) checkoutPayload.redirectUrl = redirectUrl;

    let response;
    try {
      response = await axios.post(
        `${getFapshiBaseUrl()}/initiate-pay`,
        checkoutPayload,
        { headers: credentials, timeout: 15000 }
      );
    } catch (gatewayError) {
      if (gatewayError.response) {
        await SubscriptionPayment.updateOne(
          { _id: payment._id, payment_status: 'pending' },
          { $set: { payment_status: 'failed', gateway_status: 'INITIATION_FAILED' } }
        );
        console.error('[Fapshi] Payment link request rejected:', gatewayError.response.status);
        return res.status(502).json({
          success: false,
          error: 'Fapshi could not create the payment link. Please try again.'
        });
      }

      console.error('[Fapshi] Payment link request outcome is unknown:', gatewayError.message);
      await SubscriptionPayment.updateOne(
        { _id: payment._id, payment_status: 'pending' },
        { $set: { gateway_status: 'INITIATION_UNCONFIRMED' } }
      );
      return res.status(502).json({
        success: false,
        error: 'Fapshi did not confirm whether the payment link was created. Check Billing before retrying.'
      });
    }

    if (!response.data?.link || !response.data?.transId) {
      await SubscriptionPayment.updateOne(
        { _id: payment._id, payment_status: 'pending' },
        { $set: { payment_status: 'failed', gateway_status: 'INVALID_INITIATION_RESPONSE' } }
      );
      return res.status(502).json({
        success: false,
        error: 'Fapshi returned an invalid payment link response.'
      });
    }

    payment.gateway_transaction_id = String(response.data.transId);
    payment.checkout_url = response.data.link;
    payment.gateway_status = 'CREATED';
    await payment.save();

    return res.status(201).json({
      success: true,
      data: {
        link: payment.checkout_url,
        transactionId: payment.gateway_transaction_id,
        planKey: plan.key,
        amount: plan.amount
      }
    });
  } catch (error) {
    console.error('[subscription] Checkout initiation failed:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Could not start the subscription checkout.'
    });
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const business = await Business.findOne({
      _id: req.params.id,
      owner_id: req.user._id
    });
    if (!business) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }

    const latestPending = await SubscriptionPayment.findOne({
      business_id: business._id,
      payment_status: 'pending',
      gateway_transaction_id: { $exists: true }
    }).sort({ createdAt: -1 });

    if (latestPending) {
      const checkAfter = new Date(Date.now() - STATUS_CHECK_INTERVAL_MS);
      const claim = await SubscriptionPayment.findOneAndUpdate(
        {
          _id: latestPending._id,
          payment_status: 'pending',
          $or: [
            { last_status_check_at: { $exists: false } },
            { last_status_check_at: { $lte: checkAfter } }
          ]
        },
        { $set: { last_status_check_at: new Date() } },
        { new: true }
      );
      if (claim) {
        await verifyAndApplyTransaction(claim, null, null);
      }
    }

    const [refreshedBusiness, statusPayment, mostRecentPayment] = await Promise.all([
      Business.findById(business._id),
      SubscriptionPayment.findOne({
        business_id: business._id,
        payment_status: 'pending'
      }).sort({ createdAt: -1 }),
      SubscriptionPayment.findOne({ business_id: business._id }).sort({ createdAt: -1 })
    ]);

    if (!refreshedBusiness) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }

    const subscriptionState = getSubscriptionState(refreshedBusiness, req.user);
    await syncUserSubscription(req.user);

    return res.json({
      success: true,
      data: {
        ...subscriptionState,
        subscribed: req.user.subscribed,
        subscribed_plan: req.user.subscribed_plan,
        plans: getPublicPlans(),
        pendingPayment: statusPayment ? {
          planKey: statusPayment.plan_key,
          gatewayStatus: statusPayment.gateway_status,
          checkoutUrl: statusPayment.checkout_url,
          securityFlagged: statusPayment.security_flagged
        } : null,
        latestPayment: mostRecentPayment ? {
          status: mostRecentPayment.payment_status,
          planKey: mostRecentPayment.plan_key,
          createdAt: mostRecentPayment.createdAt
        } : null
      }
    });
  } catch (error) {
    console.error('[subscription] Status check failed:', error.message);
    const statusCode = error.statusCode || (error.isAxiosError ? 502 : 500);
    return res.status(statusCode).json({
      success: false,
      error: statusCode === 503
        ? error.message
        : 'Could not refresh subscription status.'
    });
  }
};

exports.fapshiWebhook = async (req, res) => {
  const secret = process.env.FAPSHI_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Fapshi webhook] FAPSHI_WEBHOOK_SECRET is not configured');
    return res.status(503).send('Webhook is not configured');
  }

  if (!safeCompare(req.get('x-wh-secret'), secret)) {
    console.warn('[Fapshi webhook] Rejected request with an invalid webhook secret');
    return res.status(401).send('Invalid webhook secret');
  }

  const payload = req.body;
  const transId = payload?.transId;
  const status = String(payload?.status || '').toUpperCase();
  if (!transId || !WEBHOOK_STATUS.has(status)) {
    return res.status(400).send('Invalid payment notification');
  }

  try {
    const payment = await SubscriptionPayment.findOne({
      gateway_transaction_id: String(transId)
    });
    if (!payment) return res.status(404).send('Payment not found');

    const processed = await verifyAndApplyTransaction(payment, status, payload);
    if (!processed) return res.status(400).send('Payment details do not match');

    return res.status(200).send('OK');
  } catch (error) {
    console.error('[Fapshi webhook] Payment notification processing failed:', error.message);
    return res.status(502).send('Payment notification could not be verified');
  }
};
