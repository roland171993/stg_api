/**
 * chat.controller.js
 *
 * REST endpoints for the customer-support chat feature.
 *
 * Routes:
 *   GET  /api/chat/rooms                        — list rooms (all for admin, own for user)
 *   GET  /api/chat/rooms/:roomId/messages        — paginated message history
 *   POST /api/chat/rooms/:roomId/files           — upload file attachment + broadcast via Socket.io
 */

const path            = require('path');
const { Room, Message } = require('../models');
const socketService   = require('../services/socket.service');
const logger          = require('../config/logger');

const TAG = 'ChatController';

/* ------------------------------------------------------------------ */
/* GET /api/chat/rooms                                                 */
/* ------------------------------------------------------------------ */

/**
 * Users see only their own room.
 * Admins see all rooms, sorted by most recent activity.
 */
async function getRooms(req, res, next) {
  const ts = new Date().toISOString();
  try {
    let rooms;
    if (req.user.role === 'admin') {
      rooms = await Room.find({})
        .sort({ lastMessageAt: -1 })
        .lean();
    } else {
      const roomId = `support-${req.userId}`;
      const room   = await Room.findOne({ roomId }).lean();
      rooms = room ? [room] : [];
    }
    res.json({ rooms });
  } catch (err) {
    logger.error(`[${ts}] [${TAG}] getRooms error: ${err.message}`);
    next(err);
  }
}

/* ------------------------------------------------------------------ */
/* GET /api/chat/rooms/:roomId/messages                                */
/* ------------------------------------------------------------------ */

/**
 * Returns paginated messages for a room.
 *
 * Query params:
 *   limit  (default 30, max 100)
 *   before  ISO timestamp — return messages older than this cursor
 */
async function getMessages(req, res, next) {
  const ts = new Date().toISOString();
  try {
    const { roomId } = req.params;

    // Access control: users can only query their own room
    if (req.user.role !== 'admin') {
      const expected = `support-${req.userId}`;
      if (roomId !== expected) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    const limit  = Math.min(parseInt(req.query.limit, 10)  || 30, 100);
    const before = req.query.before ? new Date(req.query.before) : null;

    const filter = { roomId };
    if (before && !isNaN(before.getTime())) {
      filter.createdAt = { $lt: before };
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Return in ascending order (oldest first) for the client to render top→bottom
    messages.reverse();

    res.json({ messages });
  } catch (err) {
    logger.error(`[${ts}] [${TAG}] getMessages error: ${err.message}`);
    next(err);
  }
}

/* ------------------------------------------------------------------ */
/* POST /api/chat/rooms/:roomId/files                                  */
/* ------------------------------------------------------------------ */

/**
 * Saves an uploaded file as a Message, updates Room summary,
 * then broadcasts `new_message` via Socket.io to the room and agents.
 *
 * The actual multer middleware is applied in the route definition.
 * If multer already rejected the file, this handler is never reached.
 */
async function uploadFile(req, res, next) {
  const ts = new Date().toISOString();
  try {
    const { roomId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file attached.' });
    }

    // Access control
    if (req.user.role !== 'admin') {
      const expected = `support-${req.userId}`;
      if (roomId !== expected) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    const senderType = req.user.role === 'admin' ? 'support' : 'user';
    const ext        = path.extname(req.file.originalname).toLowerCase();
    const imageExts  = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileType   = imageExts.includes(ext) ? 'image' : 'document';
    const fileUrl    = `/uploads/chat/${req.file.filename}`;

    const message = await Message.create({
      roomId,
      senderId:   req.userId,
      senderType,
      content:    '',
      fileUrl,
      fileName:   req.file.originalname,
      fileSize:   req.file.size,
      fileType
    });

    // Update Room summary
    const preview = `[${fileType === 'image' ? '📷 Image' : '📄 Document'}]`;
    await Room.findOneAndUpdate(
      { roomId },
      {
        lastMessage:   preview,
        lastMessageAt: new Date(),
        $inc: senderType === 'user'
          ? { unreadBySupport: 1 }
          : { unreadByUser:    1 }
      }
    );

    // Broadcast via Socket.io
    const io = socketService.getIO();
    if (io) {
      io.to(roomId).emit('new_message', { message });
      io.to('support-agents').emit('new_message', { message });
    }

    logger.info(`[${ts}] [${TAG}] file uploaded roomId=${roomId} type=${fileType} sender=${senderType}`);
    res.status(201).json({ message });
  } catch (err) {
    logger.error(`[${ts}] [${TAG}] uploadFile error: ${err.message}`);
    next(err);
  }
}

module.exports = { getRooms, getMessages, uploadFile };
