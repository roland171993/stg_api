const { scheduleJob } = require('../services/cron.service');
const { Job } = require('../models');
const { sendNotification } = require('../services/notification.service');
const logger = require('../config/logger');

// Every hour at minute 0, second 0 – re‐publish one unpublished job
// (based on cronAddEmploi.js schedule & logic) :contentReference[oaicite:1]{index=1}
async function republishStaleJobs() {
  try {
    const job = await Job.findOne({ unpublished: true });
    if (job) {
      job.unpublished = false;
      await job.save();
      await sendNotification(
        `Job published: ${job.title}`,
        job.description
      );
      logger.info(`Republished job ${job._id}`);
    }
  } catch (err) {
    logger.error('Error in republishStaleJobs', err);
  }
}

scheduleJob('0 0 * * * *', republishStaleJobs);