const { scheduleJob } = require('../services/cron.service');
const { Job } = require('../models');
const logger = require('../config/logger');

// Every day at 00:00 – delete all jobs whose deadline has passed
async function deleteExpiredJobs() {
  try {
    const now = new Date();
    const { deletedCount } = await Job.deleteMany({ deadline: { $lt: now } });
    logger.info(`Deleted ${deletedCount} expired jobs`);
  } catch (err) {
    logger.error('Failed to delete expired jobs', err);
  }
}

scheduleJob('0 0 0 * * *', deleteExpiredJobs);