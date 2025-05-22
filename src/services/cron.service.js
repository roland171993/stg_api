const cron = require('node-cron');
const logger = require('../config/logger');

/**
 * Schedule and start a cron job.
 * @param {string} schedule - Cron expression (e.g. '0 0 * * *' for midnight daily)
 * @param {Function} task - Async function to execute on schedule
 * @param {Object} [options] - Optional node-cron options
 * @returns {CronTask} - The scheduled job
 */
function scheduleJob(schedule, task, options = {}) {
  const job = cron.schedule(
    schedule,
    async () => {
      try {
        await task();
        logger.info(`Cron job succeeded: ${schedule}`);
      } catch (err) {
        logger.error(`Cron job error (${schedule}):`, err);
      }
    },
    { scheduled: true, timezone: 'UTC', ...options }
  );

  return job;
}

module.exports = {
  scheduleJob
};