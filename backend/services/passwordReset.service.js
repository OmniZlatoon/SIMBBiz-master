const { createHash, randomBytes, timingSafeEqual } = require('node:crypto');
const User = require('../models/User');
const { auth } = require('../firebase/initializeFirebase');
const redisClient = require('../OTP/RedisConfig/redis.setup');
const { hashOTP } = require('../OTP/HashOTP/hashing_otp');
const { OTPverify } = require('../OTP/HashOTP/verifyStoredOTP');
const { generateOTP } = require('../OTP/OTP/OTP.script');
const { sendPasswordResetEmail } = require('../OTP/PasswordReset/sendPasswordResetEmail');
const {
  getWhatsAppBusinessNumber,
  sendWhatsAppPasswordReset
} = require('../OTP/PasswordReset/sendWhatsAppPasswordReset');
const {
  keysFor,
  normalizeWhatsAppNumber,
  normalizeEmail,
  parseWhatsAppHandoffCode,
  requestHasValidEmailFields
} = require('../OTP/PasswordReset/passwordReset.utils');

const OTP_TTL_SECONDS = 5 * 60;
const RESET_TOKEN_TTL_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;
const RECOVERY_FLOW_TTL_SECONDS = 5 * 60;
const WHATSAPP_HANDOFF_TTL_SECONDS = 5 * 60;
const WHATSAPP_HANDOFF_COOLDOWN_SECONDS = 60;
const otpExpiryTimers = new Map();

const isOtpDebugLoggingEnabled = () => (
  process.env.NODE_ENV !== 'production' &&
  process.env.OTP_DEBUG_LOGGING !== 'false'
);

const maskEmail = (email) => {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 1)}***@${domain}`;
};

const clearOtpExpiryTimer = (key) => {
  const timer = otpExpiryTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    otpExpiryTimers.delete(key);
  }
};

const scheduleOtpExpiryLog = (key, email, otp, method) => {
  clearOtpExpiryTimer(key);
  const timer = setTimeout(() => {
    otpExpiryTimers.delete(key);
    console.log(`[PASSWORD RESET] ${method} OTP expired for ${maskEmail(email)}: ${otp}`);
  }, OTP_TTL_SECONDS * 1000);
  timer.unref();
  otpExpiryTimers.set(key, timer);
};

const findEligibleUser = async (email, recoveryEmail) => User.findOne({
  email,
  recoveryEmail,
  authProvider: 'local'
});

const ensureRedisReady = () => {
  if (redisClient.isReady) {
    return;
  }

  const error = new Error('Password recovery is temporarily unavailable');
  error.statusCode = 503;
  throw error;
};

const startRecovery = async ({ email: rawEmail, recoveryEmail: rawRecoveryEmail }) => {
  if (!requestHasValidEmailFields({ email: rawEmail, recoveryEmail: rawRecoveryEmail })) {
    const error = new Error('A valid account email and recovery email are required');
    error.statusCode = 400;
    throw error;
  }

  const email = normalizeEmail(rawEmail);
  const recoveryEmail = normalizeEmail(rawRecoveryEmail);
  ensureRedisReady();

  const user = await findEligibleUser(email, recoveryEmail);
  if (!user) {
    const error = new Error('The account email and recovery email could not be verified');
    error.statusCode = 400;
    throw error;
  }

  const recoveryToken = randomBytes(32).toString('hex');
  const flowTokenHash = createHash('sha256').update(recoveryToken).digest('hex');
  await redisClient.set(
    `password-reset:flow-token:${flowTokenHash}`,
    email,
    { EX: RECOVERY_FLOW_TTL_SECONDS }
  );
  return { recoveryToken, email: user.email };
};

const getRecoveryFlow = async (recoveryToken) => {
  if (typeof recoveryToken !== 'string' || !/^[a-f0-9]{64}$/i.test(recoveryToken)) {
    const error = new Error('A valid recovery token is required');
    error.statusCode = 400;
    throw error;
  }

  ensureRedisReady();
  const tokenDigest = createHash('sha256').update(recoveryToken).digest('hex');
  const flowKey = `password-reset:flow-token:${tokenDigest}`;
  const email = await redisClient.get(flowKey);

  if (!email) {
    const error = new Error('The recovery session is invalid or has expired');
    error.statusCode = 400;
    throw error;
  }

  return { email, flowKey };
};

const sendOtpForUser = async ({ user, email, method, whatsappNumber }) => {
  const keys = keysFor(email, method);
  const cooldown = await redisClient.set(keys.cooldown, '1', {
    EX: RESEND_COOLDOWN_SECONDS,
    NX: true
  });

  if (cooldown !== 'OK') {
    const error = new Error(`An OTP was requested through ${method} recently. Wait one minute before trying again.`);
    error.statusCode = 429;
    throw error;
  }

  let providerResult;
  try {
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    await redisClient.set(keys.otp, otpHash, { EX: OTP_TTL_SECONDS });
    await redisClient.del(keys.attempts, keys.resetToken);
    if (isOtpDebugLoggingEnabled()) {
      console.log(`[PASSWORD RESET] ${method} OTP generated for ${maskEmail(user.email)}: ${otp}`);
      scheduleOtpExpiryLog(keys.otp, user.email, otp, method);
    }

    if (method === 'email') {
      await sendPasswordResetEmail(user.email, otp);
    } else {
      providerResult = await sendWhatsAppPasswordReset(whatsappNumber, otp);
      console.log(
        `[WhatsApp delivery] accepted by Meta: message=${providerResult.messageId}`
      );
    }
  } catch (error) {
    clearOtpExpiryTimer(keys.otp);
    await redisClient.del(keys.otp, keys.cooldown);
    throw error;
  }

  return { sent: true, ...providerResult };
};

const requestOtp = async ({ recoveryToken, method }) => {
  if (method !== 'email' && method !== 'whatsapp') {
    const error = new Error('OTP delivery method must be email or whatsapp');
    error.statusCode = 400;
    throw error;
  }

  const flow = await getRecoveryFlow(recoveryToken);
  const user = await User.findOne({ email: flow.email, authProvider: 'local' });
  if (!user) {
    const error = new Error('The recovery session is invalid or has expired');
    error.statusCode = 400;
    throw error;
  }

  const whatsappNumber = normalizeWhatsAppNumber(user.whatsappNumber);
  if (method === 'whatsapp' && !whatsappNumber) {
    const error = new Error(
      'The WhatsApp number saved for this account is missing a valid international country code (E.164 format)'
    );
    error.statusCode = 422;
    throw error;
  }

  return sendOtpForUser({ user, email: flow.email, method, whatsappNumber });
};

const handoffCodeKey = (codeHash) => `password-reset:whatsapp-handoff:${codeHash}`;
const handoffStatusKey = (tokenHash) => `password-reset:whatsapp-handoff-status:${tokenHash}`;
const handoffCooldownKey = (email) => (
  `password-reset:whatsapp-handoff-cooldown:${createHash('sha256').update(email).digest('hex')}`
);

const createWhatsAppHandoff = async ({ recoveryToken }) => {
  const flow = await getRecoveryFlow(recoveryToken);
  const user = await User.findOne({ email: flow.email, authProvider: 'local' });
  const whatsappNumber = normalizeWhatsAppNumber(user?.whatsappNumber);
  if (!user || !whatsappNumber) {
    const error = new Error(
      'The WhatsApp number saved for this account is missing a valid international country code (E.164 format)'
    );
    error.statusCode = 422;
    throw error;
  }

  const cooldown = await redisClient.set(handoffCooldownKey(flow.email), '1', {
    EX: WHATSAPP_HANDOFF_COOLDOWN_SECONDS,
    NX: true
  });
  if (cooldown !== 'OK') {
    const error = new Error('A WhatsApp reset link was created recently. Wait one minute before trying again.');
    error.statusCode = 429;
    throw error;
  }

  try {
    const businessNumber = await getWhatsAppBusinessNumber();
    const code = randomBytes(12).toString('hex');
    const handoffToken = randomBytes(32).toString('hex');
    const codeHash = createHash('sha256').update(code).digest('hex');
    const tokenHash = createHash('sha256').update(handoffToken).digest('hex');
    const codeKey = handoffCodeKey(codeHash);
    const statusKey = handoffStatusKey(tokenHash);
    const message = `SIMBBIZ RESET ${code.toUpperCase()}`;
    const waLink = `https://wa.me/${businessNumber}?text=${encodeURIComponent(message)}`;
    const handoff = {
      email: flow.email,
      flowKey: flow.flowKey,
      phoneNumber: whatsappNumber,
      status: 'pending'
    };

    await redisClient.multi()
      .set(codeKey, JSON.stringify(handoff), { EX: WHATSAPP_HANDOFF_TTL_SECONDS })
      .set(statusKey, codeHash, { EX: WHATSAPP_HANDOFF_TTL_SECONDS })
      .exec();

    return {
      handoffToken,
      waLink,
      expiresInSeconds: WHATSAPP_HANDOFF_TTL_SECONDS
    };
  } catch (error) {
    await redisClient.del(handoffCooldownKey(flow.email));
    throw error;
  }
};

const updateWhatsAppHandoff = async (key, handoff) => {
  const remainingTtl = await redisClient.ttl(key);
  if (remainingTtl <= 0) {
    return;
  }
  await redisClient.set(key, JSON.stringify(handoff), { EX: remainingTtl });
};

const processWhatsAppHandoff = async ({ from, message }) => {
  const code = parseWhatsAppHandoffCode(message);
  const sender = normalizeWhatsAppNumber(typeof from === 'string' ? `+${from}` : from);
  if (!code || !sender) {
    return false;
  }

  ensureRedisReady();
  const codeHash = createHash('sha256').update(code).digest('hex');
  const codeKey = handoffCodeKey(codeHash);
  const serializedHandoff = await redisClient.get(codeKey);
  if (!serializedHandoff) {
    return false;
  }

  const handoff = JSON.parse(serializedHandoff);
  if (handoff.status !== 'pending' || handoff.phoneNumber !== sender) {
    return false;
  }

  const lockKey = `${codeKey}:processing`;
  const acquired = await redisClient.set(lockKey, '1', { EX: 30, NX: true });
  if (acquired !== 'OK') {
    return false;
  }

  try {
    const currentValue = await redisClient.get(codeKey);
    if (!currentValue) {
      return false;
    }
    const currentHandoff = JSON.parse(currentValue);
    if (currentHandoff.status !== 'pending' || currentHandoff.phoneNumber !== sender) {
      return false;
    }

    const activeFlowEmail = await redisClient.get(currentHandoff.flowKey);
    const user = activeFlowEmail === currentHandoff.email
      ? await User.findOne({ email: currentHandoff.email, authProvider: 'local' })
      : null;
    const currentPhone = normalizeWhatsAppNumber(user?.whatsappNumber);
    if (!user || currentPhone !== sender) {
      currentHandoff.status = 'failed';
      currentHandoff.message = 'This WhatsApp recovery request has expired. Start again from the password recovery page.';
      await updateWhatsAppHandoff(codeKey, currentHandoff);
      return true;
    }

    currentHandoff.status = 'processing';
    await updateWhatsAppHandoff(codeKey, currentHandoff);

    try {
      const result = await sendOtpForUser({
        user,
        email: currentHandoff.email,
        method: 'whatsapp',
        whatsappNumber: currentPhone
      });
      currentHandoff.status = 'sent';
      currentHandoff.messageId = result.messageId;
      await updateWhatsAppHandoff(codeKey, currentHandoff);
    } catch (error) {
      currentHandoff.status = 'failed';
      currentHandoff.message = error.statusCode === 429
        ? error.message
        : 'WhatsApp could not send your code. Start again or choose email delivery.';
      await updateWhatsAppHandoff(codeKey, currentHandoff);
      console.error(`[PASSWORD RESET] WhatsApp handoff delivery failed: ${error.message}`);
    }
    return true;
  } finally {
    await redisClient.del(lockKey);
  }
};

const getWhatsAppHandoffStatus = async ({ recoveryToken, handoffToken }) => {
  const flow = await getRecoveryFlow(recoveryToken);
  if (typeof handoffToken !== 'string' || !/^[a-f0-9]{64}$/i.test(handoffToken)) {
    const error = new Error('A valid WhatsApp handoff token is required');
    error.statusCode = 400;
    throw error;
  }

  const tokenHash = createHash('sha256').update(handoffToken).digest('hex');
  const codeHash = await redisClient.get(handoffStatusKey(tokenHash));
  if (!codeHash) {
    return { status: 'expired' };
  }
  const serializedHandoff = await redisClient.get(handoffCodeKey(codeHash));
  if (!serializedHandoff) {
    return { status: 'expired' };
  }

  const handoff = JSON.parse(serializedHandoff);
  if (handoff.email !== flow.email) {
    return { status: 'expired' };
  }
  return {
    status: handoff.status,
    message: handoff.message || (
      handoff.status === 'sent' ? 'Your OTP was sent to your WhatsApp number.' : undefined
    )
  };
};

const verifyResetOtp = async ({ recoveryToken, otp }) => {
  if (
    typeof recoveryToken !== 'string' ||
    !/^\d{8}$/.test(otp || '')
  ) {
    const error = new Error('A valid recovery token and 8-digit code are required');
    error.statusCode = 400;
    throw error;
  }

  ensureRedisReady();
  const flow = await getRecoveryFlow(recoveryToken);
  const email = flow.email;
  const channels = ['email', 'whatsapp'];
  const channelKeys = channels.map((channel) => ({
    channel,
    ...keysFor(email, channel)
  }));
  const activeOtps = [];
  for (const channelKey of channelKeys) {
    const storedHash = await redisClient.get(channelKey.otp);
    if (storedHash) {
      activeOtps.push({ ...channelKey, storedHash });
    }
  }

  if (activeOtps.length === 0) {
    for (const channelKey of channelKeys) {
      clearOtpExpiryTimer(channelKey.otp);
    }
    console.log(`[PASSWORD RESET] OTP expired or unavailable for ${maskEmail(email)}`);
    const error = new Error('The code is invalid or has expired');
    error.statusCode = 400;
    throw error;
  }

  let matchedOtp;
  for (const activeOtp of activeOtps) {
    if (await OTPverify(activeOtp.storedHash, otp)) {
      matchedOtp = activeOtp;
      break;
    }
  }

  if (!matchedOtp) {
    for (const activeOtp of activeOtps) {
      const attempts = await redisClient.incr(activeOtp.attempts);
      if (attempts === 1) {
        await redisClient.expire(activeOtp.attempts, OTP_TTL_SECONDS);
      }
      if (attempts >= MAX_OTP_ATTEMPTS) {
        await redisClient.del(activeOtp.otp, activeOtp.attempts);
        clearOtpExpiryTimer(activeOtp.otp);
      }
    }
    const error = new Error('The code is invalid or has expired');
    error.statusCode = 400;
    throw error;
  }

  const consumed = await redisClient.multi()
    .get(flow.flowKey)
    .get(matchedOtp.otp)
    .del(flow.flowKey)
    .del(channelKeys[0].otp, channelKeys[1].otp)
    .del(channelKeys[0].attempts, channelKeys[1].attempts)
    .exec();

  if (!consumed || consumed[0] !== email || consumed[1] !== matchedOtp.storedHash) {
    const error = new Error('The code is invalid or has expired');
    error.statusCode = 400;
    throw error;
  }
  for (const channelKey of channelKeys) {
    clearOtpExpiryTimer(channelKey.otp);
  }
  if (isOtpDebugLoggingEnabled()) {
    console.log(`[PASSWORD RESET] ${matchedOtp.channel} OTP validated for ${maskEmail(email)}: ${otp}`);
  }

  const resetToken = randomBytes(32).toString('hex');
  const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
  const resetKeys = keysFor(email, 'email');
  await redisClient.set(resetKeys.resetToken, resetTokenHash, { EX: RESET_TOKEN_TTL_SECONDS });

  return { resetToken };
};

const resetPassword = async ({
  email: rawEmail,
  resetToken,
  newPassword,
  confirmPassword
}) => {
  if (
    typeof rawEmail !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail.trim()) ||
    typeof resetToken !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(resetToken) ||
    typeof newPassword !== 'string' ||
    typeof confirmPassword !== 'string' ||
    newPassword.length < 8
  ) {
    const error = new Error('A valid reset token and password of at least 8 characters are required');
    error.statusCode = 400;
    throw error;
  }

  if (newPassword !== confirmPassword) {
    const error = new Error('Passwords do not match');
    error.statusCode = 400;
    throw error;
  }

  ensureRedisReady();
  const email = normalizeEmail(rawEmail);
  const keys = keysFor(email, 'email');
  const storedTokenHash = await redisClient.get(keys.resetToken);
  const suppliedTokenHash = createHash('sha256').update(resetToken).digest('hex');

  if (
    !storedTokenHash ||
    !/^[a-f0-9]{64}$/i.test(storedTokenHash) ||
    !timingSafeEqual(Buffer.from(storedTokenHash), Buffer.from(suppliedTokenHash))
  ) {
    const error = new Error('The reset token is invalid or has expired');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email, authProvider: 'local' }).select('+password');
  if (!user) {
    const error = new Error('The account could not be updated');
    error.statusCode = 404;
    throw error;
  }

  if (!auth) {
    const error = new Error('Password recovery is temporarily unavailable');
    error.statusCode = 503;
    throw error;
  }

  const firebaseUser = user.firebaseUid
    ? await auth.getUser(user.firebaseUid)
    : await auth.getUserByEmail(email);
  const previousPasswordHash = user.password;

  const consumed = await redisClient.multi()
    .get(keys.resetToken)
    .del(keys.resetToken)
    .exec();

  if (!consumed || consumed[0] !== storedTokenHash) {
    const error = new Error('The reset token is invalid or has expired');
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  await user.save();

  try {
    await auth.updateUser(firebaseUser.uid, { password: newPassword });
  } catch (firebaseError) {
    try {
      user.password = previousPasswordHash;
      await user.save();
    } catch (rollbackError) {
      throw new AggregateError(
        [firebaseError, rollbackError],
        'Firebase password update failed and the MongoDB password rollback also failed'
      );
    }
    throw firebaseError;
  }
};

module.exports = {
  findEligibleUser,
  normalizeEmail,
  requestHasValidEmailFields,
  startRecovery,
  requestOtp,
  createWhatsAppHandoff,
  getWhatsAppHandoffStatus,
  processWhatsAppHandoff,
  resetPassword,
  verifyResetOtp
};
