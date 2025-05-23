require('dotenv').config();

const requiredEnv = [
  'PORT',
  'DB_URI',
  'JWT_SECRET',
  'ONESIGNAL_APP_ID',
  'ONESIGNAL_API_KEY'
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`🚨  Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

if (!/^[a-f0-9]{64}$/.test(process.env.JWT_SECRET)) {
  console.error('JWT_SECRET must be a 64-character hex string');
  process.exit(1);
}

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  dbUri: process.env.DB_URI,
  jwtSecret: process.env.JWT_SECRET,
  oneSignal: {
    appId: process.env.ONESIGNAL_APP_ID,
    apiKey: process.env.ONESIGNAL_API_KEY
  },
  logLevel: process.env.LOG_LEVEL || 'info'
};

module.exports = config;
