const mongoose = require('mongoose');
const { Schema } = mongoose;

// Adapted from the original EmploiSchema 
const JobSchema = new Schema({
  title:          { type: String, required: true },
  description:    { type: String, required: true },
  dateAdded:      { type: Date, default: Date.now },
  authorEmail:    { type: String, required: true },
  authorWebsite:  { type: String },
  authorMobile1:  { type: String },
  authorMobile2:  { type: String },
  authorLongitude:{ type: String },
  authorLatitude: { type: String },
  company:        { type: String, required: true },
  companyLogoUrl: { type: String },
  salary:         { type: String },
  city:           { type: String, required: true },
  experience:     { type: String },
  educationLevel: { type: String, required: true },
  sector: {
    id:   { type: String },
    name: { type: String, required: true }
  },
  unpublished:    { type: Boolean, default: false },
  gender: {
    id:   { type: String },
    name: { type: String, required: true }
  },
  contractType: {
    id:   { type: String },
    name: { type: String, required: true }
  },
  workMode: {
    id:   { type: String },
    name: { type: String, required: true }
  },
  deadline:       { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
