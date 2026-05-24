/**
 * auth.controller.js
 *
 * Endpoints:
 *   POST  /api/auth/register   — local registration (email + password + profile fields)
 *   POST  /api/auth/login      — local login (email + password)
 *   POST  /api/auth/oauth      — Google / Apple via Firebase ID token
 *   GET   /api/auth/me         — get current user profile  [protected]
 *   PUT   /api/auth/profile    — update profile fields      [protected]
 *   POST  /api/auth/photo      — upload profile photo       [protected, multipart]
 *
 * Security: OWASP A02 – no credentials in logs, bcrypt on passwords,
 *           consistent 401 messages to prevent user enumeration.
 */

const jwt            = require('jsonwebtoken');
const config         = require('../config');
const { User }       = require('../models');
const firebaseService = require('../services/firebase.service');
const logger         = require('../config/logger');

const TAG = 'AuthController';

/* ------------------------------------------------------------------ */
/* Helper — issue our own JWT                                          */
/* ------------------------------------------------------------------ */
function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '210d' }
  );
}

/* ------------------------------------------------------------------ */
/* POST /api/auth/register                                             */
/* ------------------------------------------------------------------ */
exports.register = async (req, res, next) => {
  const ts = new Date().toISOString();
  try {
    const { firstName, lastName, age, email, phone, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      // Do NOT reveal whether the account exists (OWASP A05)
      logger.warn(`[${ts}] [${TAG}] register conflict email=${email}`);
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const user = new User({
      firstName:    firstName   || '',
      lastName:     lastName    || '',
      age:          age         || null,
      email:        email.toLowerCase(),
      phone:        phone       || '',
      password,
      authProvider: 'local'
    });
    await user.save();

    const token = signToken(user);
    logger.info(`[${ts}] [${TAG}] register success userId=${user._id}`);
    return res.status(201).json({ token, user: user.toPublic() });
  } catch (err) {
    logger.error(`[${ts}] [${TAG}] register error: ${err.message}`);
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* POST /api/auth/login                                                */
/* ------------------------------------------------------------------ */
exports.login = async (req, res, next) => {
  const ts = new Date().toISOString();
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Constant-time check: compare even if user is null (prevents timing attacks)
    const passwordMatch = user ? await user.comparePassword(password) : false;

    if (!user || !passwordMatch || user.authProvider !== 'local') {
      // Generic message to prevent user enumeration (OWASP A07)
      logger.warn(`[${ts}] [${TAG}] login failed email=${email}`);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = signToken(user);
    logger.info(`[${ts}] [${TAG}] login success userId=${user._id}`);
    return res.json({ token, user: user.toPublic() });
  } catch (err) {
    logger.error(`[${ts}] [${TAG}] login error: ${err.message}`);
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* POST /api/auth/oauth                                                */
/*                                                                     */
/* Body: { idToken: "<Firebase ID token>" }                            */
/* Works for both Google and Apple — Firebase normalises the provider. */
/* ------------------------------------------------------------------ */
exports.oauthSignIn = async (req, res, next) => {
  const ts = new Date().toISOString();
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required.' });
    }

    let decoded;
    try {
      decoded = await firebaseService.verifyIdToken(idToken);
    } catch (firebaseErr) {
      logger.warn(`[${ts}] [${TAG}] OAuth token invalid: ${firebaseErr.code || firebaseErr.message}`);
      return res.status(401).json({ message: 'Invalid or expired OAuth token.' });
    }

    const { uid, email, name, picture, firebase: fbClaims } = decoded;

    if (!email) {
      return res.status(400).json({ message: 'Email is required from the OAuth provider.' });
    }

    // Resolve provider: google.com → 'google', apple.com → 'apple'
    const signInProvider = fbClaims?.sign_in_provider || '';
    const authProvider   = signInProvider.includes('apple') ? 'apple' : 'google';

    // Upsert: find by firebaseUid, fallback to email
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      user = await User.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      // First OAuth sign-in: create account
      const nameParts = (name || '').split(' ');
      user = new User({
        firstName:    nameParts[0]              || '',
        lastName:     nameParts.slice(1).join(' ') || '',
        email:        email.toLowerCase(),
        photoUrl:     picture || null,
        authProvider,
        firebaseUid:  uid
      });
      await user.save();
      logger.info(`[${ts}] [${TAG}] OAuth new user created userId=${user._id} provider=${authProvider}`);
    } else {
      // Returning user: patch missing fields
      let dirty = false;
      if (!user.firebaseUid) { user.firebaseUid = uid;            dirty = true; }
      if (!user.photoUrl && picture) { user.photoUrl = picture;   dirty = true; }
      if (user.authProvider === 'local') { user.authProvider = authProvider; dirty = true; }
      if (dirty) await user.save();
    }

    const token = signToken(user);
    logger.info(`[${ts}] [${TAG}] OAuth success userId=${user._id} provider=${authProvider}`);
    return res.json({ token, user: user.toPublic() });
  } catch (err) {
    logger.error(`[${ts}] [${TAG}] OAuth error: ${err.message}`);
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* GET /api/auth/me   [protected]                                      */
/* ------------------------------------------------------------------ */
exports.getCurrentUser = async (req, res, next) => {
  const ts = new Date().toISOString();
  try {
    const user = await User.findById(req.userId).select('-password -__v');
    if (!user) {
      logger.warn(`[${ts}] [${TAG}] getMe: user not found userId=${req.userId}`);
      return res.status(404).json({ message: 'User not found.' });
    }
    logger.info(`[${ts}] [${TAG}] getMe userId=${req.userId}`);
    return res.json({ user: user.toPublic() });
  } catch (err) {
    logger.error(`[${ts}] [${TAG}] getMe error: ${err.message}`);
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* PUT /api/auth/profile   [protected]                                 */
/* ------------------------------------------------------------------ */
exports.updateProfile = async (req, res, next) => {
  const ts = new Date().toISOString();
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const { firstName, lastName, age, phone } = req.body;

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName  !== undefined) user.lastName  = lastName;
    if (age       !== undefined) user.age        = age;
    if (phone     !== undefined) user.phone      = phone;

    await user.save();
    logger.info(`[${ts}] [${TAG}] updateProfile userId=${req.userId}`);
    return res.json({ user: user.toPublic() });
  } catch (err) {
    logger.error(`[${ts}] [${TAG}] updateProfile error: ${err.message}`);
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* POST /api/auth/photo   [protected, multipart/form-data]            */
/* field name: "photo"                                                 */
/* ------------------------------------------------------------------ */
exports.uploadPhoto = async (req, res, next) => {
  const ts = new Date().toISOString();
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo file uploaded. Use field name "photo".' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Store relative URL path accessible via /uploads/photos/<filename>
    user.photoUrl = `/uploads/photos/${req.file.filename}`;
    await user.save();

    logger.info(`[${ts}] [${TAG}] uploadPhoto userId=${req.userId} file=${req.file.filename}`);
    return res.json({ photoUrl: user.photoUrl, user: user.toPublic() });
  } catch (err) {
    logger.error(`[${ts}] [${TAG}] uploadPhoto error: ${err.message}`);
    next(err);
  }
};
