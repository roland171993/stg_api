const express    = require('express');
const { body }   = require('express-validator');

const {
  register,
  login,
  oauthSignIn,
  getCurrentUser,
  updateProfile,
  uploadPhoto
} = require('../controllers/auth.controller');

const auth       = require('../middlewares/auth.middleware');
const validate   = require('../middlewares/validation.middleware');
const fileService = require('../services/file.service');

const router = express.Router();

/* ------------------------------------------------------------------ */
/* Validation rule sets                                                 */
/* ------------------------------------------------------------------ */
const registerRules = [
  body('email')
    .isEmail().withMessage('A valid email is required.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('firstName').optional().isLength({ max: 60 }).trim(),
  body('lastName').optional().isLength({ max: 60 }).trim(),
  body('age').optional().isInt({ min: 1, max: 150 }).withMessage('Age must be between 1 and 150.'),
  body('phone').optional().isLength({ max: 25 }).trim()
];

const loginRules = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.')
];

const oauthRules = [
  body('idToken').notEmpty().withMessage('idToken is required.')
];

const updateProfileRules = [
  body('firstName').optional().isLength({ max: 60 }).trim(),
  body('lastName').optional().isLength({ max: 60 }).trim(),
  body('age').optional().isInt({ min: 1, max: 150 }).withMessage('Age must be between 1 and 150.'),
  body('phone').optional().isLength({ max: 25 }).trim()
];

/* ------------------------------------------------------------------ */
/* Public routes                                                        */
/* ------------------------------------------------------------------ */
router.post('/register', registerRules, validate, register);
router.post('/login',    loginRules,    validate, login);
router.post('/oauth',    oauthRules,    validate, oauthSignIn);

/* ------------------------------------------------------------------ */
/* Protected routes                                                     */
/* ------------------------------------------------------------------ */
router.get('/me',      auth.required,                           getCurrentUser);
router.put('/profile', auth.required, updateProfileRules, validate, updateProfile);
router.post('/photo',  auth.required, fileService.uploadPhotoMiddleware, uploadPhoto);

module.exports = router;
