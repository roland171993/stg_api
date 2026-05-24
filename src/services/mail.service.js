/**
 * mail.service.js
 *
 * sendEmail({ to, subject, html })             → Promise<void>
 * sendCoverLetterEmail({ to, jobTitle, coverLetter }) → Promise<void>
 * sendPhotoEmail({ to, jobTitle, photoUrl })    → Promise<void>
 */

const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../config/logger');

const TAG = 'MailService';

/* ------------------------------------------------------------------ */
/* Transporter factory                                                  */
/* ------------------------------------------------------------------ */

function createTransporter() {
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: parseInt(config.smtp.port, 10),
    secure: parseInt(config.smtp.port, 10) === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  });
}

/* ------------------------------------------------------------------ */
/* sendEmail                                                           */
/* ------------------------------------------------------------------ */

async function sendEmail({ to, subject, html }) {
  if (!config.smtp.host) {
    logger.warn(`[${TAG}] SMTP_HOST not configured — skipping email to ${to}`);
    return;
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject,
    html
  });

  logger.info(`[${TAG}] Email sent to ${to} — subject: ${subject}`);
}

/* ------------------------------------------------------------------ */
/* sendCoverLetterEmail                                                */
/* ------------------------------------------------------------------ */

async function sendCoverLetterEmail({ to, jobTitle, coverLetter }) {
  const subject = `Votre lettre de motivation — ${jobTitle}`;

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; background: #f9f9f9; margin: 0; padding: 0; }
        .container { max-width: 680px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: #2563eb; color: #fff; padding: 24px 32px; }
        .header h1 { margin: 0; font-size: 20px; }
        .body { padding: 32px; }
        .letter { white-space: pre-wrap; line-height: 1.7; font-size: 15px; border-left: 4px solid #2563eb; padding-left: 16px; }
        .footer { padding: 16px 32px; background: #f1f5f9; font-size: 12px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Votre lettre de motivation</h1>
          <p style="margin:8px 0 0;">Poste : ${jobTitle}</p>
        </div>
        <div class="body">
          <p>Bonjour,</p>
          <p>Voici votre lettre de motivation générée pour le poste de <strong>${jobTitle}</strong> :</p>
          <div class="letter">${coverLetter}</div>
        </div>
        <div class="footer">Ce message a été généré automatiquement. Merci de ne pas y répondre.</div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to, subject, html });
}

/* ------------------------------------------------------------------ */
/* sendPhotoEmail                                                      */
/* ------------------------------------------------------------------ */

async function sendPhotoEmail({ to, jobTitle, photoUrl }) {
  const subject = `Votre photo professionnelle — ${jobTitle}`;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const fullPhotoUrl = `${baseUrl}${photoUrl}`;

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; background: #f9f9f9; margin: 0; padding: 0; }
        .container { max-width: 680px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: #2563eb; color: #fff; padding: 24px 32px; }
        .header h1 { margin: 0; font-size: 20px; }
        .body { padding: 32px; text-align: center; }
        .photo { max-width: 400px; width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .footer { padding: 16px 32px; background: #f1f5f9; font-size: 12px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Votre photo professionnelle</h1>
          <p style="margin:8px 0 0;">Poste : ${jobTitle}</p>
        </div>
        <div class="body">
          <p>Bonjour,</p>
          <p>Voici votre photo professionnelle générée pour le poste de <strong>${jobTitle}</strong> :</p>
          <img src="${fullPhotoUrl}" alt="Photo professionnelle" class="photo" />
          <p style="margin-top:16px;font-size:13px;color:#666;">
            Si l'image ne s'affiche pas, <a href="${fullPhotoUrl}">cliquez ici pour la voir</a>.
          </p>
        </div>
        <div class="footer">Ce message a été généré automatiquement. Merci de ne pas y répondre.</div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to, subject, html });
}

module.exports = { sendEmail, sendCoverLetterEmail, sendPhotoEmail };
