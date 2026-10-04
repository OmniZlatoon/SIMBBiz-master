const {
  requestHasValidEmailFields,
  requestOtp,
  createWhatsAppHandoff,
  getWhatsAppHandoffStatus,
  resetPassword,
  startRecovery,
  verifyResetOtp
} = require('../services/passwordReset.service');

const reportError = (res, error) => {
  console.error('Password recovery error:', error.message);
  return res.status(error.statusCode || 500).json({
    success: false,
    message: [400, 422, 429, 502, 503].includes(error.statusCode)
      ? error.message
      : 'Password recovery could not be completed'
  });
};

exports.validateAccount = async (req, res) => {
  const { email, recoveryEmail } = req.body;
  if (!requestHasValidEmailFields({ email, recoveryEmail })) {
    return res.status(400).json({
      success: false,
      message: 'A valid account email and recovery email are required'
    });
  }

  try {
    const { recoveryToken, email: accountEmail } = await startRecovery({ email, recoveryEmail });
    return res.status(200).json({
      success: true,
      message: 'Account verified. Choose an OTP delivery method.',
      recoveryToken,
      email: accountEmail
    });
  } catch (error) {
    return reportError(res, error);
  }
};

exports.sendEmailOtp = async (req, res) => {
  try {
    await requestOtp({ recoveryToken: req.body.recoveryToken, method: 'email' });
    return res.status(200).json({ success: true, message: 'Password reset code sent by email.' });
  } catch (error) {
    return reportError(res, error);
  }
};

exports.sendWhatsAppOtp = async (req, res) => {
  try {
    const result = await createWhatsAppHandoff({ recoveryToken: req.body.recoveryToken });
    return res.status(200).json({
      success: true,
      deliveryStatus: 'pending_user_message',
      message: 'Open WhatsApp and send the prefilled message from your registered number. We will send your OTP when it is received.',
      ...result
    });
  } catch (error) {
    return reportError(res, error);
  }
};

exports.getWhatsAppOtpStatus = async (req, res) => {
  try {
    const result = await getWhatsAppHandoffStatus(req.body);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return reportError(res, error);
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const result = await verifyResetOtp(req.body);
    return res.status(200).json({
      success: true,
      message: 'Code verified. You may now reset your password.',
      ...result
    });
  } catch (error) {
    return reportError(res, error);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    await resetPassword(req.body);
    return res.status(200).json({
      success: true,
      message: 'Password updated. Please sign in with your new password.'
    });
  } catch (error) {
    return reportError(res, error);
  }
};
