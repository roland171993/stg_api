const mongoose = require('mongoose');
const { Schema } = mongoose;

// Adapted from original CvSchema :contentReference[oaicite:2]{index=2}
const ResumeSchema = new Schema({
  title:        { type: String, required: true },
  downloadUrl:  { type: String, required: true },
  content:      { type: String, required: true },
  unpublished:  { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Resume', ResumeSchema);