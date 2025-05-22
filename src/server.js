const config = require('./config');
const logger = require('./config/logger');
const createApp = require('./app');

(async () => {
  const app = await createApp();

  // Load and start scheduled jobs
  require('./jobs/add-job.job');
  require('./jobs/delete-job.job');

  app.listen(config.port, () => {
    logger.info(`🚀 Server listening on port ${config.port}`);
  });
})();