const Device = require('../models/device'); 
const OneSignal = require('onesignal-node');
const config = require('../config/index');
const client = new OneSignal.Client({
  app: { appAuthKey: config.oneSignal.apiKey, appId: config.oneSignal.appId }
});

async function upsertDevice({ userId, playerId, platform, tags = {}, appVersion, deviceInfo }) {
  const doc = await Device.findOneAndUpdate(
    { playerId },
    { userId, platform, tags, appVersion, deviceInfo, lastActiveAt: new Date() },
    { upsert: true, new: true }
  );
  // Sync tags to OneSignal (non-blocking is fine)
  if (tags && Object.keys(tags).length) {
    // Use OneSignal REST to set tags on this playerId if needed
  }
  return doc;
}

async function updateOpt(userId, categories) {
  await Device.updateMany({ userId }, { $set: { ...Object.fromEntries(Object.entries(categories).map(([k,v]) => [`opt.${k}`, !!v])) }});
}

module.exports = { upsertDevice, updateOpt };
