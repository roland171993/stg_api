const config = require('./config');
const logger = require('./config/logger');
const createApp = require('./app');


if (true) {
  // import lazily so the scheduler inside the module still registers as usual
  const { publishNextJobAndNotify } = require('./jobs/add-job.job');
  publishNextJobAndNotify()
    .then(() => logger.info('[BOOT] publishNextJobAndNotify() completed'))
    .catch((err) => logger.error('[BOOT] publishNextJobAndNotify() failed', { err }));
}

(async () => {
  const app = await createApp();

  // Load and start scheduled jobs
  require('./jobs/add-job.job');
  require('./jobs/delete-job.job');

  app.listen(config.port, () => {
    logger.info(`🚀 Server listening on port ${config.port}`);
  });
})();