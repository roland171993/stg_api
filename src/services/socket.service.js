/**
 * socket.service.js
 *
 * Initialises Socket.io and registers all real-time chat event handlers.
 *
 * Architecture:
 *   - Each user joins a private room named "support-{userId}".
 *   - Support agents join a global "support-agents" room and can address any user room.
 *   - JWT is verified on every connection (handshake middleware).
 *
 * Events (client → server):
 *   join_room         { roomId }                 — enter the support room
 *   send_message      { roomId, content }         — text message
 *   mark_read         { roomId }                 — mark all incoming msgs as read
 *   typing            { roomId, isTyping }        — typing indicator
 *
 *   WebRTC signaling:
 *   call_offer        { roomId, sdp }             — relay offer to others in room
 *   call_answer       { roomId, sdp }             — relay answer to others in room
 *   call_reject       { roomId }                  — relay rejection to others in room
 *   call_end          { roomId }                  — broadcast end to all in room
 *   ice_candidate     { roomId, candidate }       — relay ICE candidate to others
 *
 * Events (server → client):
 *   room_joined       { room }                   — room metadata on join
 *   new_message       { message }                — new message in this room
 *   messages_read     { roomId, readAt }          — acknowledgement of mark_read
 *   user_typing       { roomId, isTyping, sender }
 *   error             { message }                — any business-logic error
 *
 *   WebRTC signaling:
 *   call_incoming     { roomId, fromUserId, sdp } — incoming call offer
 *   call_answered     { roomId, sdp }             — remote peer accepted
 *   call_rejected     { roomId }                  — remote peer rejected
 *   call_ended        { roomId }                  — call ended by either party
 *   ice_candidate     { roomId, candidate }       — ICE candidate from remote peer
 */

const { Server }   = require('socket.io');
const jwt          = require('jsonwebtoken');
const config       = require('../config');
const logger       = require('../config/logger');
const { Room, Message } = require('../models');

const TAG = 'SocketService';

let _io = null;

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Attaches Socket.io to an existing HTTP server.
 * Call once from server.js after createApp().
 *
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function init(httpServer) {
  if (_io) return _io;

  _io = new Server(httpServer, {
    cors:            { origin: '*', methods: ['GET', 'POST'] },
    maxHttpBufferSize: 10e6   // 10 MB max file payload per message
  });

  // ── JWT auth middleware ──────────────────────────────────────────
  _io.use((socket, next) => {
    const token = socket.handshake.auth?.token ||
                  socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication token required.'));
    }
    try {
      const payload    = jwt.verify(token, config.jwtSecret);
      socket.userId    = payload.sub;
      socket.userEmail = payload.email;
      socket.userRole  = payload.role || 'user';
      next();
    } catch {
      next(new Error('Invalid or expired token.'));
    }
  });

  _io.on('connection', (socket) => {
    const ts = new Date().toISOString();
    logger.info(`[${ts}] [${TAG}] connected socketId=${socket.id} userId=${socket.userId}`);

    // Support agents auto-join the agents room so they receive all rooms' events
    if (socket.userRole === 'admin') {
      socket.join('support-agents');
      logger.info(`[${ts}] [${TAG}] admin joined support-agents room`);
    }

    // ── join_room ────────────────────────────────────────────────
    socket.on('join_room', async ({ roomId } = {}) => {
      const ts = new Date().toISOString();
      try {
        if (!roomId) return socket.emit('error', { message: 'roomId is required.' });

        // Users can only join their own room; admins can join any room
        if (socket.userRole !== 'admin') {
          const expected = `support-${socket.userId}`;
          if (roomId !== expected) {
            return socket.emit('error', { message: 'Access denied.' });
          }
        }

        // Upsert room
        let room = await Room.findOne({ roomId });
        if (!room) {
          room = await Room.create({
            userId: socket.userId,
            roomId,
            status: 'open'
          });
          logger.info(`[${ts}] [${TAG}] new room created roomId=${roomId}`);
        }

        await socket.join(roomId);
        socket.emit('room_joined', { room });
        logger.info(`[${ts}] [${TAG}] socketId=${socket.id} joined roomId=${roomId}`);
      } catch (err) {
        logger.error(`[${ts}] [${TAG}] join_room error: ${err.message}`);
        socket.emit('error', { message: 'Failed to join room.' });
      }
    });

    // ── send_message ─────────────────────────────────────────────
    socket.on('send_message', async ({ roomId, content } = {}) => {
      const ts = new Date().toISOString();
      try {
        if (!roomId)  return socket.emit('error', { message: 'roomId is required.' });
        if (!content?.trim()) return socket.emit('error', { message: 'content is required.' });

        const senderType = socket.userRole === 'admin' ? 'support' : 'user';

        const message = await Message.create({
          roomId,
          senderId:   socket.userId,
          senderType,
          content:    content.trim()
        });

        // Update room summary
        await Room.findOneAndUpdate(
          { roomId },
          {
            lastMessage:   content.trim().substring(0, 100),
            lastMessageAt: new Date(),
            $inc: senderType === 'user'
              ? { unreadBySupport: 1 }
              : { unreadByUser:    1 }
          }
        );

        // Broadcast to everyone in the room (user + agents)
        _io.to(roomId).emit('new_message', { message });
        // Also notify all agents (in case an agent is not in this specific room)
        _io.to('support-agents').emit('new_message', { message });

        logger.info(`[${ts}] [${TAG}] message sent roomId=${roomId} sender=${senderType}`);
      } catch (err) {
        logger.error(`[${ts}] [${TAG}] send_message error: ${err.message}`);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    // ── mark_read ────────────────────────────────────────────────
    socket.on('mark_read', async ({ roomId } = {}) => {
      const ts   = new Date().toISOString();
      const now  = new Date();
      try {
        if (!roomId) return;

        const senderType = socket.userRole === 'admin' ? 'user' : 'support';
        await Message.updateMany(
          { roomId, senderType, readAt: null },
          { readAt: now }
        );

        const unreadField = socket.userRole === 'admin' ? 'unreadBySupport' : 'unreadByUser';
        await Room.findOneAndUpdate({ roomId }, { [unreadField]: 0 });

        _io.to(roomId).emit('messages_read', { roomId, readAt: now });
        logger.info(`[${ts}] [${TAG}] mark_read roomId=${roomId}`);
      } catch (err) {
        logger.error(`[${ts}] [${TAG}] mark_read error: ${err.message}`);
      }
    });

    // ── typing ───────────────────────────────────────────────────
    socket.on('typing', ({ roomId, isTyping } = {}) => {
      if (!roomId) return;
      const sender = socket.userRole === 'admin' ? 'support' : 'user';
      socket.to(roomId).emit('user_typing', { roomId, isTyping: !!isTyping, sender });
    });

    // ── WebRTC signaling ─────────────────────────────────────────

    // call_offer: relay incoming call offer to all others in the room
    socket.on('call_offer', ({ roomId, sdp } = {}) => {
      const ts = new Date().toISOString();
      if (!roomId) return socket.emit('error', { message: 'roomId is required.' });
      if (!sdp)    return socket.emit('error', { message: 'sdp is required.' });
      socket.to(roomId).emit('call_incoming', {
        roomId,
        fromUserId: socket.userId,
        sdp
      });
      logger.info(`[${ts}] [${TAG}] call_offer relayed roomId=${roomId} from=${socket.userId}`);
    });

    // call_answer: relay answer SDP to all others in the room
    socket.on('call_answer', ({ roomId, sdp } = {}) => {
      const ts = new Date().toISOString();
      if (!roomId) return socket.emit('error', { message: 'roomId is required.' });
      if (!sdp)    return socket.emit('error', { message: 'sdp is required.' });
      socket.to(roomId).emit('call_answered', { roomId, sdp });
      logger.info(`[${ts}] [${TAG}] call_answer relayed roomId=${roomId}`);
    });

    // call_reject: relay rejection to all others in the room
    socket.on('call_reject', ({ roomId } = {}) => {
      const ts = new Date().toISOString();
      if (!roomId) return socket.emit('error', { message: 'roomId is required.' });
      socket.to(roomId).emit('call_rejected', { roomId });
      logger.info(`[${ts}] [${TAG}] call_reject relayed roomId=${roomId}`);
    });

    // call_end: broadcast end to ALL participants including sender
    socket.on('call_end', ({ roomId } = {}) => {
      const ts = new Date().toISOString();
      if (!roomId) return socket.emit('error', { message: 'roomId is required.' });
      _io.to(roomId).emit('call_ended', { roomId });
      logger.info(`[${ts}] [${TAG}] call_end broadcast roomId=${roomId}`);
    });

    // ice_candidate: relay ICE candidate to all others in the room
    socket.on('ice_candidate', ({ roomId, candidate } = {}) => {
      const ts = new Date().toISOString();
      if (!roomId) return socket.emit('error', { message: 'roomId is required.' });
      socket.to(roomId).emit('ice_candidate', { roomId, candidate });
      logger.info(`[${ts}] [${TAG}] ice_candidate relayed roomId=${roomId}`);
    });

    // ── disconnect ───────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.info(`[${new Date().toISOString()}] [${TAG}] disconnected socketId=${socket.id} reason=${reason}`);
    });
  });

  logger.info(`[${new Date().toISOString()}] [${TAG}] Socket.io server initialised`);
  return _io;
}

/** Returns the Socket.io instance (null if not yet initialised). */
function getIO() { return _io; }

/** Reset for tests */
function _resetForTests() { _io = null; }

module.exports = { init, getIO, _resetForTests };
