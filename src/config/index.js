require('dotenv').config();

/* ------------------------------------------------------------------ */
/* Required env vars (app won't start without them)                    */
/* ------------------------------------------------------------------ */
const required = [
  'PORT',
  'DB_URI',
  'JWT_SECRET',
  'ONESIGNAL_APP_ID',
  'ONESIGNAL_API_KEY'
];

required.forEach((key) => {
  if (!process.env[key]) {
    console.error(`[${new Date().toISOString()}] 🚨  Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

if (!/^[a-f0-9]{64}$/.test(process.env.JWT_SECRET)) {
  console.error(`[${new Date().toISOString()}] JWT_SECRET must be a 64-character hex string`);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Optional — warn if OAuth will be unavailable                        */
/* ------------------------------------------------------------------ */
if (!process.env.FIREBASE_PROJECT_ID) {
  console.warn(
    `[${new Date().toISOString()}] ⚠️  FIREBASE_PROJECT_ID not set — Google/Apple OAuth endpoints will fail at runtime.`
  );
}

/* ------------------------------------------------------------------ */
/* Optional AI & SMTP — warn if unavailable, no crash                 */
/* ------------------------------------------------------------------ */
['OPENAI_API_KEY', 'GEMINI_API_KEY', 'DEEPSEEK_API_KEY'].forEach((key) => {
  if (!process.env[key]) {
    console.warn(
      `[${new Date().toISOString()}] ⚠️  ${key} not set — AI features using this provider will fail at runtime.`
    );
  }
});

['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].forEach((key) => {
  if (!process.env[key]) {
    console.warn(
      `[${new Date().toISOString()}] ⚠️  ${key} not set — email sending will be disabled.`
    );
  }
});

/* ------------------------------------------------------------------ */
/* Config object                                                        */
/* ------------------------------------------------------------------ */
const config = {
  port:      parseInt(process.env.PORT, 10) || 3000,
  dbUri:     process.env.DB_URI,
  jwtSecret: process.env.JWT_SECRET,

  oneSignal: {
    appId:  process.env.ONESIGNAL_APP_ID,
    apiKey: process.env.ONESIGNAL_API_KEY
  },

  firebase: {
    projectId:      process.env.FIREBASE_PROJECT_ID      || null,
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || null   // base-64 JSON
  },

  upload: {
    dir:         process.env.UPLOAD_DIR || 'uploads/',
    maxSizeBytes: 5 * 1024 * 1024   // 5 MB
  },

  logLevel: process.env.LOG_LEVEL || 'info',

  ai: {
    openaiApiKey:    process.env.OPENAI_API_KEY    || null,
    geminiApiKey:    process.env.GEMINI_API_KEY    || null,
    deepseekApiKey:  process.env.DEEPSEEK_API_KEY  || null,
    defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'openai'
  },

  smtp: {
    host: process.env.SMTP_HOST || null,
    port: process.env.SMTP_PORT || '587',
    user: process.env.SMTP_USER || null,
    pass: process.env.SMTP_PASS || null,
    from: process.env.SMTP_FROM || process.env.SMTP_USER || null
  }
};

module.exports = config;
