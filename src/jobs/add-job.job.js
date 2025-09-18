const { scheduleJob } = require('../services/cron.service');
const { Job } = require('../models');
const { sendToAll } = require('../services/notification.service');
const logger = require('../config/logger');

async function publishNextJobAndNotify() {
  try {
    logger.info('[CRON] publishNextJobAndNotify Start');
    const job = await Job.findOneAndUpdate(
      { unpublished: true },
      { $set: { unpublished: false, publishedAt: new Date() } },
      { sort: { createdAt: 1 }, new: true }
    );

    if (!job) {
      logger.info('[CRON] No unpublished jobs to publish right now.');
      return;
    }

    const title = job.title;
    const body  = `📍 ${job.city}`;
    const data  = {
      type: 'JOB_PUBLISHED',
      jobId: String(job._id),
      city: job.city,
      title: job.title,
    };

    logger.info('[CRON] publishNextJobAndNotify Build ok');

    await sendToAll({
      title,
      body,
      data,
      imageUrl: job.companyLogoUrl || undefined,
    });

    logger.info('[CRON] Published and notified job', {
      id: String(job._id),
      title: job.title,
      city: job.city,
      imageUrl: job.companyLogoUrl || undefined,
    });
  } catch (err) {
    logger.error('[CRON] Error in publishNextJobAndNotify', { err });
  }
}

// Run every 1 hour
scheduleJob('0 0 * * * *', publishNextJobAndNotify);

module.exports = { publishNextJobAndNotify };
