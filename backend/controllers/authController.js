const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { auth } = require('../firebase/initializeFirebase');

// -----------------------------------------------------------------------------
// APP SESSION TOKEN CREATION
// -----------------------------------------------------------------------------
// This creates the app's own JWT after a successful login/registration.
// Firebase is not used as the long-lived app session token; JWT is.
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE
  });

  const options = {
    expires: new Date(Date.now() + config.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    path: '/'
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      authProvider: user.authProvider
    }
  });
};

// -----------------------------------------------------------------------------
// EMAIL NORMALIZATION
// -----------------------------------------------------------------------------
// Normalizes incoming email values to a consistent lowercase format before
// validation and database storage.
const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

// -----------------------------------------------------------------------------
// FIREBASE EMAIL OWNERSHIP VALIDATION
// -----------------------------------------------------------------------------
// Firebase is used here to verify that the authenticated Firebase user owns the
// email being used for local sign-up or account verification. This is the bridge
// between Firebase identity and the app's own local user record.
const verifyFirebaseEmailOwnership = async ({ email, firebaseIdToken, emailVerified }) => {
  if (!email) {
    return 'Sign-in email is required';
  }

  const normalizedEmail = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return 'Please provide a valid email address';
  }

  if (!firebaseIdToken) {
    return 'Firebase ID token is required before local registration can be saved';
  }

  try {
    const decodedToken = await auth.verifyIdToken(firebaseIdToken);
    const firebaseEmail = normalizeEmail(decodedToken.email || '');

    if (!firebaseEmail) {
      return 'Firebase token does not contain a valid email';
    }

    if (firebaseEmail !== normalizedEmail) {
      return 'The Firebase verified email must match the local sign-in email';
    }

    if (!decodedToken.email_verified && !emailVerified) {
      return 'The sign-in email must be verified in Firebase before saving the account';
    }

    return null;
  } catch (error) {
    return `Firebase email verification failed: ${error.message}`;
  }
};

// -----------------------------------------------------------------------------
// LOCAL REGISTRATION VALIDATION
// -----------------------------------------------------------------------------
// Validates the data coming in from the local signup form before we perform any
// Firebase verification or save a new user record.
const validateLocalRegistrationPayload = (payload) => {
  const {
    name,
    email,
    password,
    confirmPassword,
    recoveryEmail,
    whatsappNumber,
    dateOfBirth,
    nationality,
    countryOfResidence
  } = payload;

  if (!name || !email || !password || !confirmPassword || !recoveryEmail || !whatsappNumber) {
    return 'name, email, password, confirmPassword, recoveryEmail, and whatsappNumber are required';
  }

  if (password !== confirmPassword) {
    return 'Password and confirmPassword do not match';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Please provide a valid email address';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) {
    return 'Please provide a valid recovery email';
  }

  return null;
};

// -----------------------------------------------------------------------------
// LOCAL REGISTRATION
// -----------------------------------------------------------------------------
// This endpoint handles traditional email/password account creation.
// Before the app saves the user, it validates the Firebase token to ensure the
// email being registered belongs to the same authenticated Firebase user.
exports.register = async (req, res) => {
  try {
    const validationError = validateLocalRegistrationPayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const name = String(req.body.name).trim();
    const email = normalizeEmail(req.body.email);
    const recoveryEmail = normalizeEmail(req.body.recoveryEmail);
    const whatsappNumber = String(req.body.whatsappNumber).trim();
    const password = String(req.body.password);
    const confirmPassword = String(req.body.confirmPassword);
    const firebaseIdToken = req.body.firebaseIdToken;
    const emailVerified = Boolean(req.body.emailVerified);

    const firebaseEmailError = await verifyFirebaseEmailOwnership({ email, firebaseIdToken, emailVerified });
    if (firebaseEmailError) {
      return res.status(400).json({ success: false, error: firebaseEmailError });
    }

    if (recoveryEmail !== email && !req.body.recoveryEmailVerified) {
      return res.status(400).json({
        success: false,
        error: 'The recovery email must be verified before it can be stored for account recovery'
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email },
        { recoveryEmail }
      ]
    });

    if (existingUser) {
      return res.status(409).json({ success: false, error: 'A user with this email  already exists' });
    }

    const user = new User({
      name,
      email,
      password,
      recoveryEmail,
      whatsappNumber,
      authProvider: 'local',
      emailVerified: true,
      recoveryEmailVerified: recoveryEmail === email ? true : Boolean(req.body.recoveryEmailVerified),
      dateOfBirth: req.body.dateOfBirth || null,
      nationality: req.body.nationality || null,
      countryOfResidence: req.body.countryOfResidence || null,
      confirmPassword
    });

    await user.save();
    sendTokenResponse(user, 201, res);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'Email already exists' });
    }

    res.status(500).json({ success: false, error: err.message });
  }
};

// -----------------------------------------------------------------------------
// LOCAL SIGN-IN
// -----------------------------------------------------------------------------
// This is the app's regular email/password login flow.
// When successful, we issue the app JWT that the frontend will use for all
// authenticated API requests.
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({
      email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      authProvider: 'local'
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// -----------------------------------------------------------------------------
// GOOGLE SIGN-IN
// -----------------------------------------------------------------------------
// Firebase is used as the source of truth for Google authentication.
// We verify the Firebase ID token, map it to a user record, and then issue the
// app JWT that the rest of the backend will use for authorization.
exports.googleLogin = async (req, res) => {
  try {
    const { googleidToken } = req.body;

    if (!googleidToken) {
      return res.status(400).json({ success: false, error: 'Firebase ID token is required' });
    }

    const decodedToken = await admin.auth().verifyIdToken(googleidToken);
    const email = normalizeEmail(decodedToken.email|| '');

    if (!email) {
      return res.status(400).json({ success: false, error: 'Google account email is required' });
    }

    let user = await User.findOne({
      $or: [
        { email },
        { firebaseUid: decodedToken.uid }
      ]
    });

    // Create user document if user not found in the DB
    if (!user) {
      user = new User({
        name: decodedToken.name || 'Google User',
        email,
        recoveryEmail: email,
        whatsappNumber: '+0000000000',
        authProvider: 'google',
        firebaseUid: decodedToken.uid,
        emailVerified: Boolean(decodedToken.email_verified),
        recoveryEmailVerified: Boolean(decodedToken.email_verified),
        dateOfBirth: null,
        nationality: null,
        countryOfResidence: null,
        password: null
      });

      await user.save();
    } else {
      user.authProvider = 'google';
      user.firebaseUid = decodedToken.uid;
      user.emailVerified = Boolean(decodedToken.email_verified);
      if (!user.recoveryEmail) user.recoveryEmail = email;
      if (!user.recoveryEmailVerified) user.recoveryEmailVerified = Boolean(decodedToken.email_verified);
      await user.save();
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// -----------------------------------------------------------------------------
// APP SESSION LOGOUT
// -----------------------------------------------------------------------------
// Clears the app JWT cookie from the browser. Firebase logout is handled in a
// separate Google-specific flow when a Firebase UID is available.
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    path: '/'
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};

// -----------------------------------------------------------------------------
// FIREBASE-GOOGLE LOGOUT
// -----------------------------------------------------------------------------
// This revokes the Firebase refresh tokens so the Google-authenticated session is
// invalidated at Firebase level as well as in the app's own JWT cookie.
exports.googleLogout = async (req, res) => {
  try {
    const uid = req.user?.uid || req.body.uid;

    if (!uid) {
      return res.status(400).json({ success: false, error: 'User UID is required for Google logout' });
    }

    await admin.auth().revokeRefreshTokens(uid);

    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/'
    });

    res.status(200).json({
      success: true,
      message: 'User logged out and Firebase tokens revoked successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// -----------------------------------------------------------------------------
// CURRENT USER PROFILE
// -----------------------------------------------------------------------------
// Exposes the currently authenticated user pulled from the JWT session.
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
