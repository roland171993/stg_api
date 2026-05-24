const http          = require('http');
const config        = require('./config');
const logger        = require('./config/logger');
const createApp     = require('./app');
const socketService = require('./services/socket.service');

(async () => {
  const app        = await createApp();
  const httpServer = http.createServer(app);

  // Attach Socket.io to the HTTP server
  socketService.init(httpServer);

  // Load and start scheduled jobs
  require('./jobs/add-job.job');
  require('./jobs/delete-job.job');

  httpServer.listen(config.port, () => {
    logger.info(`🚀 Server listening on port ${config.port}`);
  });
})();
