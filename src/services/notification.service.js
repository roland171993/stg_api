const OneSignal = require('onesignal-node');
const config = require('../config');
const logger = require('../config/logger');

/** Required config */
if (!config?.oneSignal?.appId || !config?.oneSignal?.apiKey) {
  throw new Error('[OneSignal] Missing appId/apiKey in config.oneSignal');
}


const client = new OneSignal.Client(config.oneSignal.appId, config.oneSignal.apiKey);


function toLocalized(head, body) {
  const headings = typeof head === 'string' ? { en: head } : (head || { en: '' });
  const contents = typeof body === 'string' ? { en: body } : (body || { en: '' });
  return { headings, contents };
}

// Build notification JSON (now supports imageUrl) 
function buildBasePayload({ title, body, data, url, ttl, imageUrl }) {
  const { headings, contents } = toLocalized(title, body);
  const payload = {
    app_id: config.oneSignal.appId,
    headings,
    contents,
  };
  if (data) payload.data = data;
  if (url)  payload.url = url;
  if (ttl)  payload.ttl = ttl;

  if (imageUrl) {
    payload.big_picture = imageUrl;             // Android (expanded)
    payload.chrome_big_picture = imageUrl;      // Chrome/Web
    payload.ios_attachments = { id1: imageUrl };// iOS
    payload.mutable_content = true;             // iOS: allow rich push
  }

  
  if (config.oneSignal.android_channel_id)
    payload.android_channel_id = config.oneSignal.android_channel_id;
  if (config.oneSignal.ios_sound)
    payload.ios_sound = config.oneSignal.ios_sound;
  if (config.oneSignal.android_sound)
    payload.android_sound = config.oneSignal.android_sound;

  return payload;
}

function audienceLabel(n) {
  if (n.include_external_user_ids) return `external_user_ids(${n.include_external_user_ids.length})`;
  if (n.include_player_ids) return `player_ids(${n.include_player_ids.length})`;
  if (n.included_segments) return `segments(${n.included_segments.join(',')})`;
  if (n.filters) return 'filters(tags)';
  return 'unknown';
}



async function execSend(payload) {
  try {
    logger.info('[CRON] sendToAll execSend strat');

    logger.info('[Push][DRY-RUN] would send', {
        audience: audienceLabel(payload),
        preview: {
          title: payload.headings?.en,
          body: payload.contents?.en,
          data: payload.data,
          imageUrl: payload.big_picture,
        },
      });

    const res = await client.createNotification(payload);
    logger.info('[CRON] sendToAll execSend res',res);
    const id = res?.body?.id || res?.body?.recipients || 'unknown';
    logger.info('[Push] sent (createNotification)', { id, audience: audienceLabel(payload) });
    return res.body;
  } catch (err) {
    logger.info('[CRON] sendToAll execSend Error',err);
    const details = err?.body || err?.response?.data || err?.message || err;
    logger.error('[Push] send failed', { details });
    throw err;
  }
}



async function sendNotification(title, message, opts = {}) {
  return sendToAll({ title, body: message, ...opts });
}

async function sendToAll(p) {
  logger.info('[CRON] sendToAll Start');
  const payload = buildBasePayload(p);
  payload.included_segments = ['All'];
  return execSend(payload);
}

async function sendToExternalUserIds(p) {
  if (!Array.isArray(p.userIds) || p.userIds.length === 0) {
    throw new Error('[Push] sendToExternalUserIds requires non-empty userIds[]');
  }
  const payload = buildBasePayload(p);
  payload.include_external_user_ids = p.userIds;
  return execSend(payload);
}

async function sendToPlayerIds(p) {
  if (!Array.isArray(p.playerIds) || p.playerIds.length === 0) {
    throw new Error('[Push] sendToPlayerIds requires non-empty playerIds[]');
  }
  const payload = buildBasePayload(p);
  payload.include_player_ids = p.playerIds;
  return execSend(payload);
}

async function sendToTags(p) {
  if (!Array.isArray(p.filters) || p.filters.length === 0) {
    throw new Error('[Push] sendToTags requires non-empty filters[]');
  }
  const payload = buildBasePayload(p);
  payload.filters = p.filters;
  return execSend(payload);
}

module.exports = {
  sendNotification,
  sendToAll,
  sendToExternalUserIds,
  sendToPlayerIds,
  sendToTags,
};
