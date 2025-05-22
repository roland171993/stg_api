// src/config/database.js
const mongoose = require('mongoose');
const { dbUri } = require('./index');
const logger = require('./logger');

async function connect() {
  try {
    await mongoose.connect(dbUri);
    logger.info('✅ Connected to MongoDB');
  } catch (err) {
    logger.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = { connect };
