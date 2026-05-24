/**
 * chat.routes.js
 *
 * Mounted at /api/chat by routes/index.js
 *
 *   GET  /rooms                        — list rooms
 *   GET  /rooms/:roomId/messages       — message history (paginated)
 *   POST /rooms/:roomId/files          — upload file attachment
 */

const express  = require('express');
const { param, query } = require('express-validator');
const auth     = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { uploadChatFileMiddleware } = require('../services/file.service');
const {
  getRooms,
  getMessages,
  uploadFile
} = require('../controllers/chat.controller');

const router = express.Router();

/* GET /api/chat/rooms */
router.get('/rooms',
  auth.required,
  getRooms
);

/* GET /api/chat/rooms/:roomId/messages */
router.get(
  '/rooms/:roomId/messages',
  auth.required,
  [
    param('roomId').notEmpty().withMessage('roomId is required.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100.'),
    query('before').optional().isISO8601().withMessage('before must be an ISO 8601 date.')
  ],
  validate,
  getMessages
);

/* POST /api/chat/rooms/:roomId/files */
router.post(
  '/rooms/:roomId/files',
  auth.required,
  uploadChatFileMiddleware,
  [
    param('roomId').notEmpty().withMessage('roomId is required.')
  ],
  validate,
  uploadFile
);

module.exports = router;
