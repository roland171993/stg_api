const mongoose = require('mongoose');
const { Schema } = mongoose;

// Adapted from original LettreMotivationSchema :contentReference[oaicite:3]{index=3}
const CoverLetterSchema = new Schema({
  title:       { type: String, required: true },
  content:     { type: String, required: true },
  unpublished: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('CoverLetter', CoverLetterSchema);
js
Copy
Edit
// src/models/index.js
const User        = require('./user.model');
const Job         = require('./job.model');
const Resume      = require('./resume.model');
const CoverLetter = require('./cover-letter.model');

module.exports = {
  User,
  Job,
  Resume,
  CoverLetter
};