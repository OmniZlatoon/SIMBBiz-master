const transporter = require('./Transporter');

const SendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: `"Inspire App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Inspire Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #4285F4;">Inspire Authentication</h2>
                <p>Hello,</p>
                <p>Your one-time password (OTP) for signing in is:</p>
                <div style="font-size: 24px; font-weight: bold; color: #34A853; padding: 10px; background: #f8f9fa; text-align: center; border-radius: 5px;">
                    ${otp}
                </div>
                <p>This code will expire in 1 minute.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #888;">&copy; 2026 Inspire Platform</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 OTP email sent to ${email}`);
    } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        throw new Error('Could not send verification email');
    }
};

module.exports = { SendOTPEmail };
