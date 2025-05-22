const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
  // Log full error for internal debugging
  logger.error(err.stack || err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
};