/**
 * ai.controller.js
 *
 * REST endpoints for AI-powered features.
 *
 * Routes:
 *   POST /api/ai/cover-letter         — generate a cover letter
 *   POST /api/ai/professional-photo   — generate a professional photo
 */

const path = require('path');
const axios = require('axios');
const fs = require('fs');
const aiService = require('../services/ai.service');
const mailService = require('../services/mail.service');
const logger = require('../config/logger');

const TAG = 'AiController';

/* ------------------------------------------------------------------ */
/* POST /api/ai/cover-letter                                           */
/* ------------------------------------------------------------------ */

async function generateCoverLetter(req, res, next) {
  try {
    const {
      jobTitle,
      jobDescription = '',
      jobCompany = '',
      ocrTexts = [],
      voiceTranscript = '',
      provider = 'openai',
      sendToEmail
    } = req.body;

    // Build prompt sections
    const ocrSection = Array.isArray(ocrTexts) && ocrTexts.length
      ? `\nInformations extraites des documents du candidat :\n${ocrTexts.join('\n---\n')}`
      : '';
    const voiceSection = voiceTranscript
      ? `\nInstructions supplémentaires du candidat : ${voiceTranscript}`
      : '';

    const prompt = `Tu es un expert en rédaction de lettres de motivation professionnelles en français.\n\nOffre d'emploi :\n- Titre : ${jobTitle}\n- Entreprise : ${jobCompany}\n- Description : ${jobDescription}${ocrSection}${voiceSection}\n\nGénère une lettre de motivation professionnelle, personnalisée, convaincante et complète pour ce poste. La lettre doit inclure une introduction accrocheuse, la mise en valeur des compétences pertinentes, et une conclusion avec appel à l'action.`;

    const coverLetter = await aiService.generateText(prompt, provider);

    if (sendToEmail) {
      await mailService.sendCoverLetterEmail({ to: sendToEmail, jobTitle, coverLetter });
    }

    logger.info(`[${TAG}] generateCoverLetter success — provider=${provider} sendToEmail=${!!sendToEmail}`);
    res.status(200).json({ success: true, coverLetter });
  } catch (err) {
    logger.error(`[${TAG}] generateCoverLetter error: ${err.message}`);
    next(err);
  }
}

/* ------------------------------------------------------------------ */
/* POST /api/ai/professional-photo                                     */
/* ------------------------------------------------------------------ */

async function generateProfessionalPhoto(req, res, next) {
  try {
    const {
      style = 'professional office blur',
      voiceDescription = '',
      withSuit = 'true',
      sendToEmail,
      jobTitle = ''
    } = req.body;

    const suitStyle = withSuit === 'true' || withSuit === true
      ? 'formal business suit'
      : 'smart casual attire';

    const prompt = `Professional LinkedIn headshot portrait photo, high quality, photorealistic, 8k. The subject wears ${suitStyle}. Background: ${style}. ${voiceDescription ? 'Additional details: ' + voiceDescription + '.' : ''} The person looks confident, friendly and professional. Perfect lighting, studio quality.`;

    const imageUrl = await aiService.generateImage(prompt);

    // Download image and save locally
    const filename = `ai-photo-${Date.now()}.jpg`;
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const destPath = path.join(uploadDir, 'ai-photos', filename);

    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(destPath, response.data);

    const photoUrl = `/uploads/ai-photos/${filename}`;

    if (sendToEmail) {
      await mailService.sendPhotoEmail({ to: sendToEmail, jobTitle, photoUrl });
    }

    logger.info(`[${TAG}] generateProfessionalPhoto success — sendToEmail=${!!sendToEmail}`);
    res.status(200).json({ success: true, photoUrl });
  } catch (err) {
    logger.error(`[${TAG}] generateProfessionalPhoto error: ${err.message}`);
    next(err);
  }
}

module.exports = { generateCoverLetter, generateProfessionalPhoto };
