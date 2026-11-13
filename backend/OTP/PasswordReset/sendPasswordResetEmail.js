const transporter = require('../NodeMailer/Transporter');

const sendPasswordResetEmail = async (email, otp) => {
  const { EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_USER || !EMAIL_PASS) {
    const error = new Error('Password reset email is not configured');
    error.statusCode = 503;
    throw error;
  }

  try {
    await transporter.sendMail({
      from: `"SIMBBiz" `,
      to: email,
      subject: 'Your SIMBBiz password reset code',
      text: `Your SIMBBiz password reset code is ${otp}. It expires in 5 minutes. Do not share it with anyone.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #17202a;">
          <h1 style="color: #071f4d;">SIMBBiz password reset</h1>
          <p>Use this one-time code to reset your password:</p>
          <p style="font-size: 30px; letter-spacing: 6px; padding: 16px; background: #f2f7f5; text-align: center;"><strong>${otp}</strong></p>
          <p>This code expires in 5 minutes. Never share it with anyone.</p>
          <p>If you did not request a password reset, you can ignore this email.</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Password reset email delivery failed:', error.message);
    const deliveryError = new Error('Password reset email delivery failed');
    deliveryError.statusCode = 502;
    throw deliveryError;
  }
};

module.exports = { sendPasswordResetEmail };
