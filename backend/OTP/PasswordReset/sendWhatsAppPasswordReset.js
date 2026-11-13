const axios = require('axios');

const DEFAULT_MESSAGE_TEMPLATE =
  'SIMBBiz password reset code: {{otp}}. It expires in {{expiresMinutes}} minutes. Do not share this code. If you did not request it, ignore this message.';

const formatWhatsAppOtpMessage = (otp) => {
  const template = process.env.WHATSAPP_OTP_MESSAGE_TEMPLATE || DEFAULT_MESSAGE_TEMPLATE;
  const placeholders = template.match(/{{[^{}]+}}/g) || [];
  if (
    !placeholders.includes('{{otp}}') ||
    placeholders.some((placeholder) => !['{{otp}}', '{{expiresMinutes}}'].includes(placeholder))
  ) {
    throw new Error('WhatsApp OTP message template must include {{otp}} and use supported placeholders only');
  }

  const message = template
    .replaceAll('*{{otp}}*', '{{otp}}')
    .replaceAll('{{otp}}', `*${otp}*`)
    .replaceAll('{{expiresMinutes}}', '5');

  return message;
};

const getWhatsAppBusinessNumber = async () => {
  const {
    META_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID,
    META_GRAPH_API_VERSION = 'v20.0'
  } = process.env;

  if (!META_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    const error = new Error('WhatsApp password reset is not configured');
    error.statusCode = 503;
    throw error;
  }
  if (!/^v\d+\.\d+$/.test(META_GRAPH_API_VERSION)) {
    const error = new Error('META_GRAPH_API_VERSION must use the format v<number>.<number>');
    error.statusCode = 503;
    throw error;
  }

  try {
    const response = await axios.get(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}`,
      {
        headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}` },
        params: { fields: 'display_phone_number' },
        timeout: 10000
      }
    );
    const displayNumber = response.data?.display_phone_number;
    const digits = typeof displayNumber === 'string'
      ? displayNumber.replace(/\D/g, '')
      : '';

    if (!/^[1-9]\d{7,14}$/.test(digits)) {
      const error = new Error('Meta did not return a valid WhatsApp business number');
      error.statusCode = 502;
      throw error;
    }
    return digits;
  } catch (error) {
    if (error.statusCode === 502 && error.message === 'Meta did not return a valid WhatsApp business number') {
      throw error;
    }
    const metaCode = error.response?.data?.error?.code;
    const lookupError = new Error(
      metaCode
        ? `WhatsApp business number lookup failed (Meta error ${metaCode})`
        : 'WhatsApp business number lookup failed'
    );
    lookupError.statusCode = 502;
    throw lookupError;
  }
};

const sendWhatsAppPasswordReset = async (phoneNumber, otp) => {
  const {
    META_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID,
    META_GRAPH_API_VERSION = 'v20.0'
  } = process.env;

  if (!META_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    const error = new Error('WhatsApp password reset is not configured');
    error.statusCode = 503;
    throw error;
  }

  if (!/^v\d+\.\d+$/.test(META_GRAPH_API_VERSION)) {
    const error = new Error('META_GRAPH_API_VERSION must use the format v<number>.<number>');
    error.statusCode = 503;
    throw error;
  }

  const url = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phoneNumber.slice(1),
    type: 'text',
    text: {
      preview_url: false,
      body: formatWhatsAppOtpMessage(otp)
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    const messageId = response.data?.messages?.[0]?.id;
    if (typeof messageId !== 'string' || !messageId) {
      const deliveryError = new Error('WhatsApp API did not return a message ID');
      deliveryError.statusCode = 502;
      throw deliveryError;
    }

    return {
      messageId,
      recipientId: response.data?.contacts?.[0]?.wa_id || phoneNumber.slice(1)
    };
  } catch (error) {
    if (error.statusCode === 502 && error.message === 'WhatsApp API did not return a message ID') {
      throw error;
    }
    const metaError = error.response?.data?.error;
    const metaCode = metaError?.code;
    if (metaCode === 131047) {
      const deliveryError = new Error(
        'WhatsApp requires a Meta-approved message template because no customer-service window is open'
      );
      deliveryError.statusCode = 503;
      throw deliveryError;
    }
    const deliveryError = new Error(
      metaCode
        ? `WhatsApp delivery failed (Meta error ${metaCode})`
        : 'WhatsApp delivery failed'
    );
    deliveryError.statusCode = 502;
    throw deliveryError;
  }
};

module.exports = {
  formatWhatsAppOtpMessage,
  getWhatsAppBusinessNumber,
  sendWhatsAppPasswordReset
};
