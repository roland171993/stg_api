const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const { connect } = require('./config/database');
const logger = require('./config/logger');
const apiRouter = require('./routes');

async function createApp() {
  // Connect to the database
  await connect();

  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // HTTP request logging forwarded to Winston
  app.use(
    morgan('combined', {
      stream: { write: msg => logger.info(msg.trim()) }
    })
  );

  // Mount all API routes under /api
  app.use('/api', apiRouter);

  // Centralized error handler
  app.use(require('./middlewares/error.middleware'));

  return app;
}

module.exports = createApp;