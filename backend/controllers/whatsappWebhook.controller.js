const { createHmac, timingSafeEqual } = require('node:crypto');
const { parseWhatsAppHandoffCode } = require('../OTP/PasswordReset/passwordReset.utils');

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

const maskRecipient = (recipient) => {
  if (typeof recipient !== 'string' || recipient.length < 5) {
    return 'unknown recipient';
  }
  return `${'*'.repeat(Math.max(0, recipient.length - 4))}${recipient.slice(-4)}`;
};

exports.verify = (req, res) => {
  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const suppliedToken = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (
    !verifyToken ||
    mode !== 'subscribe' ||
    typeof suppliedToken !== 'string' ||
    !safeEqual(suppliedToken, verifyToken) ||
    typeof challenge !== 'string'
  ) {
    return res.sendStatus(403);
  }

  return res.status(200).type('text/plain').send(challenge);
};

exports.receive = async (req, res) => {
  const appSecret = process.env.META_APP_SECRET;
  const signature = req.get('x-hub-signature-256');
  const rawBody = req.rawBody;

  if (!appSecret) {
    return res.status(503).json({ success: false, message: 'WhatsApp webhook is not configured' });
  }

  if (!Buffer.isBuffer(rawBody) || typeof signature !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid WhatsApp webhook request' });
  }

  const expectedSignature = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  if (!safeEqual(signature, expectedSignature)) {
    return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
  }

  const entries = req.body?.entry;
  if (!Array.isArray(entries)) {
    return res.status(400).json({ success: false, message: 'Invalid WhatsApp webhook payload' });
  }

  try {
    for (const entry of entries) {
      for (const change of Array.isArray(entry.changes) ? entry.changes : []) {
        for (const status of Array.isArray(change.value?.statuses) ? change.value.statuses : []) {
          const messageId = status.id || 'unknown message';
          const recipient = maskRecipient(status.recipient_id);
          const errors = (status.errors || [])
            .map((error) => `${error.code || 'unknown'}: ${error.title || error.message || 'delivery failed'}`)
            .join('; ');

          if (status.status === 'failed') {
            console.error(
              `[WhatsApp delivery] failed: message=${messageId}, recipient=${recipient}, errors=${errors || 'no error details'}`
            );
          } else {
            console.log(
              `[WhatsApp delivery] ${status.status || 'unknown'}: message=${messageId}, recipient=${recipient}`
            );
          }
        }

        for (const message of Array.isArray(change.value?.messages) ? change.value.messages : []) {
          if (
            change.value?.metadata?.phone_number_id !== process.env.WHATSAPP_PHONE_NUMBER_ID ||
            message.type !== 'text' ||
            !parseWhatsAppHandoffCode(message.text?.body)
          ) {
            continue;
          }
          const { processWhatsAppHandoff } = require('../services/passwordReset.service');
          const processed = await processWhatsAppHandoff({
            from: message.from,
            message: message.text.body
          });
          if (processed) {
            console.log(
              `[PASSWORD RESET] WhatsApp handoff accepted from ${maskRecipient(message.from)}`
            );
          }
        }
      }
    }
  } catch (error) {
    console.error(`[WhatsApp webhook] inbound processing failed: ${error.message}`);
    return res.sendStatus(500);
  }

  return res.sendStatus(200);
};
