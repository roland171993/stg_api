const OneSignal = require('onesignal-node');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Ensure we have proper credentials.
 * Expected:
 *   config.oneSignal.appId
 *   config.oneSignal.apiKey
 */
if (!config?.oneSignal?.appId || !config?.oneSignal?.apiKey) {
  // Fail fast so we don't silently succeed with bad credentials.
  // You can soften this to a warning if you want to noop in dev.
  throw new Error('[OneSignal] Missing appId/apiKey in config.oneSignal');
}

/**
 * Correct client initialization:
 *   new OneSignal.Client(appId, restApiKey)
 */
const client = new OneSignal.Client(
  config.oneSignal.appId,
  config.oneSignal.apiKey
);

/** Utility: accept either strings or {en, fr, ...} objects */
function toLocalized(head, body) {
  const headings =
    typeof head === 'string' ? { en: head } : (head || { en: '' });
  const contents =
    typeof body === 'string' ? { en: body } : (body || { en: '' });
  return { headings, contents };
}

/** Build a base notification payload */
function buildBasePayload({ title, body, data, url, ttl }) {
  const { headings, contents } = toLocalized(title, body);
  const payload = {
    app_id: config.oneSignal.appId,
    headings,
    contents,
  };
  if (data) payload.data = data;           // custom data for deep links, etc.
  if (url)  payload.url = url;             // optional: open URL when tapped
  if (ttl)  payload.ttl = ttl;             // seconds to live
  // Optional per-platform hints:
  if (config.oneSignal.android_channel_id)
    payload.android_channel_id = config.oneSignal.android_channel_id;
  if (config.oneSignal.ios_sound) payload.ios_sound = config.oneSignal.ios_sound;
  if (config.oneSignal.android_sound)
    payload.android_sound = config.oneSignal.android_sound;
  return payload;
}

/** Execute request with logging + optional idempotency */
async function execSend(notification, { idempotencyKey } = {}) {
  try {
    // onesignal-node accepts a 2nd arg with headers for idempotency
    const options = idempotencyKey
      ? { headers: { 'Idempotency-Key': idempotencyKey } }
      : undefined;

    const res = await client.createNotification(notification, options);
    const id = res?.body?.id || res?.body?.recipients || 'unknown';
    logger.info('[Push] sent', { id, audience: audienceLabel(notification) });
    return res.body;
  } catch (err) {
    const details = err?.body?.errors || err?.message || err;
    logger.error('[Push] send failed', { details });
    throw err;
  }
}

/** Pretty label for logs */
function audienceLabel(n) {
  if (n.include_external_user_ids) return `external_user_ids(${n.include_external_user_ids.length})`;
  if (n.include_player_ids) return `player_ids(${n.include_player_ids.length})`;
  if (n.included_segments) return `segments(${n.included_segments.join(',')})`;
  if (n.filters) return 'filters(tags)';
  return 'unknown';
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Backwards-compatible helper: send to everyone
 * @param {string|object} title
 * @param {string|object} message
 * @param {object} opts { data, url, ttl, idempotencyKey }
 */
async function sendNotification(title, message, opts = {}) {
  return sendToAll({ title, body: message, ...opts });
}

/**
 * Send to ALL (OneSignal segment)
 * @param {object} p { title, body, data, url, ttl, idempotencyKey }
 */
async function sendToAll(p) {
  const payload = buildBasePayload(p);
  payload.included_segments = ['All'];
  return execSend(payload, { idempotencyKey: p.idempotencyKey });
}

/**
 * Send to specific external user IDs (recommended strategy)
 * @param {object} p { userIds: string[], title, body, data, url, ttl, idempotencyKey }
 */
async function sendToExternalUserIds(p) {
  if (!Array.isArray(p.userIds) || p.userIds.length === 0) {
    throw new Error('[Push] sendToExternalUserIds requires non-empty userIds[]');
  }
  const payload = buildBasePayload(p);
  payload.include_external_user_ids = p.userIds;
  return execSend(payload, { idempotencyKey: p.idempotencyKey });
}

/**
 * Send to specific device/player IDs
 * @param {object} p { playerIds: string[], title, body, data, url, ttl, idempotencyKey }
 */
async function sendToPlayerIds(p) {
  if (!Array.isArray(p.playerIds) || p.playerIds.length === 0) {
    throw new Error('[Push] sendToPlayerIds requires non-empty playerIds[]');
  }
  const payload = buildBasePayload(p);
  payload.include_player_ids = p.playerIds;
  return execSend(payload, { idempotencyKey: p.idempotencyKey });
}

/**
 * Send to a tagged audience using OneSignal filters
 * Example filters:
 *   [{ field:'tag', key:'city', relation:'=', value:'Abidjan' }, 'AND',
 *    { field:'tag', key:'sector', relation:'=', value:'IT' }]
 * @param {object} p { filters: array, title, body, data, url, ttl, idempotencyKey }
 */
async function sendToTags(p) {
  if (!Array.isArray(p.filters) || p.filters.length === 0) {
    throw new Error('[Push] sendToTags requires non-empty filters[]');
  }
  const payload = buildBasePayload(p);
  payload.filters = p.filters;
  return execSend(payload, { idempotencyKey: p.idempotencyKey });
}

module.exports = {
  // compatibility
  sendNotification,
  // explicit methods
  sendToAll,
  sendToExternalUserIds,
  sendToPlayerIds,
  sendToTags,
};
