/**
 * ai.routes.js
 *
 * POST /api/ai/cover-letter         — generate a cover letter (auth required)
 * POST /api/ai/professional-photo   — generate a professional photo (auth required)
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { uploadAiDocumentsMiddleware, uploadAiPhotoMiddleware } = require('../services/file.service');
const { generateCoverLetter, generateProfessionalPhoto } = require('../controllers/ai.controller');

/* ------------------------------------------------------------------ */
/* Validation chains                                                   */
/* ------------------------------------------------------------------ */

const validateCoverLetter = [
  body('jobTitle').notEmpty().withMessage('jobTitle is required'),
  body('provider')
    .optional()
    .isIn(['openai', 'gemini', 'deepseek'])
    .withMessage('Invalid provider'),
  body('sendToEmail')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Invalid email')
];

const validateProPhoto = [
  body('sendToEmail')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Invalid email')
];

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */

router.post(
  '/cover-letter',
  auth.required,
  uploadAiDocumentsMiddleware,
  validateCoverLetter,
  validate,
  generateCoverLetter
);

router.post(
  '/professional-photo',
  auth.required,
  uploadAiPhotoMiddleware,
  validateProPhoto,
  validate,
  generateProfessionalPhoto
);

module.exports = router;
