const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const config = require('../config');
const logger = require('../config/logger');

const TAG       = 'FileService';
const uploadDir = config.upload.dir;
const maxSize   = config.upload.maxSizeBytes;

/* ------------------------------------------------------------------ */
/* Ensure upload directories exist on startup                          */
/* ------------------------------------------------------------------ */
['resumes/', 'photos/', 'chat/'].forEach((sub) => {
  const dir = path.join(uploadDir, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`[${new Date().toISOString()}] [${TAG}] Created upload dir: ${dir}`);
  }
});

/* ------------------------------------------------------------------ */
/* Shared storage engine                                               */
/* ------------------------------------------------------------------ */
function makeStorage(subDir) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(uploadDir, subDir)),
    filename:    (req, file, cb) => {
      const ts  = Date.now();
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path.basename(file.originalname, ext)
        .replace(/\s+/g, '-')
        .toLowerCase()
        .substring(0, 40);   // cap length to avoid FS issues
      cb(null, `${ts}-${base}${ext}`);
    }
  });
}

/* ------------------------------------------------------------------ */
/* Resume upload  (field: "resumeFile")                                */
/* ------------------------------------------------------------------ */
const resumeFilter = (req, file, cb) => {
  const allowed = /\.(doc|docx|html|htm|pdf)$/i;
  if (allowed.test(file.originalname)) return cb(null, true);
  cb(new Error('Only Word, HTML, and PDF files are allowed'), false);
};

const uploadResume = multer({
  storage:    makeStorage('resumes/'),
  fileFilter: resumeFilter,
  limits:     { fileSize: maxSize }
}).single('resumeFile');

/* ------------------------------------------------------------------ */
/* Profile photo upload  (field: "photo")                              */
/* ------------------------------------------------------------------ */
const photoFilter = (req, file, cb) => {
  const allowed = /\.(jpg|jpeg|png|webp|gif)$/i;
  if (allowed.test(file.originalname)) return cb(null, true);
  cb(new Error('Only image files are allowed: jpg, jpeg, png, webp, gif'), false);
};

const uploadPhoto = multer({
  storage:    makeStorage('photos/'),
  fileFilter: photoFilter,
  limits:     { fileSize: maxSize }
}).single('photo');

/* ------------------------------------------------------------------ */
/* Express-compatible middleware wrappers (handle multer cb errors)    */
/* ------------------------------------------------------------------ */
function wrapMulter(multerFn) {
  return (req, res, next) => {
    multerFn(req, res, (err) => {
      if (!err) return next();

      const ts = new Date().toISOString();
      if (err instanceof multer.MulterError) {
        logger.warn(`[${ts}] [${TAG}] Multer error: ${err.code} — ${err.message}`);
        return res.status(400).json({ message: err.message });
      }
      logger.warn(`[${ts}] [${TAG}] File filter error: ${err.message}`);
      return res.status(400).json({ message: err.message });
    });
  };
}

/* ------------------------------------------------------------------ */
/* Chat file upload  (field: "file")  — images + documents            */
/* ------------------------------------------------------------------ */
const chatFileFilter = (req, file, cb) => {
  const allowed = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|txt)$/i;
  if (allowed.test(file.originalname)) return cb(null, true);
  cb(new Error('File type not allowed. Allowed: images, PDF, Word, Excel, text.'), false);
};

const uploadChatFile = multer({
  storage:    makeStorage('chat/'),
  fileFilter: chatFileFilter,
  limits:     { fileSize: maxSize }
}).single('file');

/* ------------------------------------------------------------------ */
/* AI documents and photos upload directories                         */
/* ------------------------------------------------------------------ */
const aiDocsDir = path.join(uploadDir, 'ai-docs');
const aiPhotosDir = path.join(uploadDir, 'ai-photos');
if (!fs.existsSync(aiDocsDir)) fs.mkdirSync(aiDocsDir, { recursive: true });
if (!fs.existsSync(aiPhotosDir)) fs.mkdirSync(aiPhotosDir, { recursive: true });

/* ------------------------------------------------------------------ */
/* Multer AI documents  (field: "documents", up to 5 files)           */
/* ------------------------------------------------------------------ */
const uploadAiDocuments = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, aiDocsDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Type de fichier non autorisé'));
  }
});
const uploadAiDocumentsMiddleware = uploadAiDocuments.array('documents', 5);

/* ------------------------------------------------------------------ */
/* Multer AI photo  (field: "photo", single file)                     */
/* ------------------------------------------------------------------ */
const uploadAiPhoto = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, aiPhotosDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Image uniquement'));
  }
});
const uploadAiPhotoMiddleware = uploadAiPhoto.single('photo');

module.exports = {
  uploadResume:            wrapMulter(uploadResume),
  uploadPhotoMiddleware:   wrapMulter(uploadPhoto),
  uploadChatFileMiddleware: wrapMulter(uploadChatFile),

  uploadAiDocumentsMiddleware,
  uploadAiPhotoMiddleware,

  // Raw multer instances — exposed for tests that need req.file populated
  _rawUploadResume:    uploadResume,
  _rawUploadPhoto:     uploadPhoto,
  _rawUploadChatFile:  uploadChatFile
};
