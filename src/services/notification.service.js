const OneSignal = require('onesignal-node');
const config = require('../config');
const logger = require('../config/logger');

const client = new OneSignal.Client(config.oneSignal);

/**
 * Send a push notification via OneSignal.
 * @param {string} title - Notification title
 * @param {string} [message] - Notification body (defaults to title)
 * @returns {Promise<Object>} - OneSignal API response body
 */
async function sendNotification(title, message) {
  try {
    const notification = {
      app_id: config.oneSignal.appId,
      included_segments: ['All'],
      headings: { en: title },
      contents: { en: message || title },
      data: { title }
    };

    const response = await client.createNotification(notification);
    logger.info(`Notification sent (id=${response.body.id})`);
    return response.body;
  } catch (error) {
    logger.error('Failed to send OneSignal notification', error);
    throw error;
  }
}

module.exports = {
  sendNotification
};