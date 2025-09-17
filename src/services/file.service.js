const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../config/logger');

const uploadDir = config.uploadDir || 'uploads/';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage engine: filenames prefixed with timestamp and slugified.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/\s+/g, '-')
      .toLowerCase();
    cb(null, `${timestamp}-${base}${ext}`);
  }
});

// Filter to allow only Word, HTML, or PDF documents.
function fileFilter(req, file, cb) {
  const allowed = /\.(doc|docx|html|htm|pdf)$/i;
  if (allowed.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('Only Word, HTML, and PDF files are allowed'), false);
  }
}

// Middleware to handle single resume upload on field "resumeFile".
// Use in your route as: fileService.uploadResume(req, res, next)

const uploadResume = multer({ storage, fileFilter }).single('resumeFile');

module.exports = {
  storage,
  fileFilter,
  uploadResume
};