const mongoose = require('mongoose');
const { Schema } = mongoose;

const CoverLetterSchema = new Schema({
  title:       { type: String, required: true },
  content:     { type: String, required: true },
  unpublished: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('CoverLetter', CoverLetterSchema);