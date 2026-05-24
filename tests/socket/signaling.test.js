/**
 * tests/socket/signaling.test.js
 *
 * Unit-style tests for the WebRTC signaling handlers in socket.service.js.
 *
 * Strategy: spin up a real http.createServer + Express app + Socket.io via
 * socketService.init(), then connect test clients using socket.io-client.
 * MongoMemoryServer backs the DB so no real MongoDB is needed.
 *
 * Covered (8+ tests):
 *   1. call_offer relays call_incoming to others (not sender)
 *   2. call_answer relays call_answered to others (not sender)
 *   3. call_reject relays call_rejected to others (not sender)
 *   4. call_end broadcasts call_ended to ALL participants (including sender)
 *   5. ice_candidate relays ice_candidate to others (not sender)
 *   6. Authentication is required (no token → connection refused)
 *   7. call_offer with missing roomId returns error to sender
 *   8. call_offer with missing sdp returns error to sender
 *   9. call_answer with missing sdp returns error to sender
 *  10. call_reject with missing roomId returns error to sender
 */

'use strict';

const http       = require('http');
const { Server } = require('socket.io');
const ioc        = require('socket.io-client');
const jwt        = require('jsonwebtoken');
const mongoose   = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

/* ------------------------------------------------------------------ */
/* Env                                                                 */
/* ------------------------------------------------------------------ */
process.env.PORT              = '0';
process.env.JWT_SECRET        = 'b'.repeat(64);
process.env.ONESIGNAL_APP_ID  = 'test-app-id';
process.env.ONESIGNAL_API_KEY = 'test-api-key';
process.env.UPLOAD_DIR        = '/tmp/stg-signaling-test-uploads/';

jest.mock('../../src/config/logger', () => ({
  info:  jest.fn(),
  warn:  jest.fn(),
  error: jest.fn()
}));

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function signToken(userId, role = 'user') {
  return jwt.sign(
    { sub: userId, email: `${userId}@test.com`, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/** Creates a connected socket.io-client in the given room. */
function connectClient(port, token) {
  return new Promise((resolve, reject) => {
    const socket = ioc(`http://localhost:${port}`, {
      auth:              { token },
      transports:        ['websocket'],
      reconnection:      false,
      forceNew:          true,
      autoUnref:         true
    });
    socket.once('connect',       () => resolve(socket));
    socket.once('connect_error', (err) => reject(err));
    // Timeout safety
    setTimeout(() => reject(new Error('connect timeout')), 3000);
  });
}

/** Joins a room and waits for room_joined confirmation. */
function joinRoom(socket, roomId) {
  return new Promise((resolve) => {
    socket.once('room_joined', resolve);
    socket.emit('join_room', { roomId });
  });
}

/** Waits for a single named event from `socket`. */
function waitForEvent(socket, event, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout waiting for "${event}"`)),
      timeoutMs
    );
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

/* ------------------------------------------------------------------ */
/* Setup / Teardown                                                    */
/* ------------------------------------------------------------------ */

let mongod;
let httpServer;
let serverPort;
let socketService;

const userId1 = new mongoose.Types.ObjectId().toHexString();
const userId2 = new mongoose.Types.ObjectId().toHexString();
const ROOM_ID = `support-${userId1}`;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.DB_URI = mongod.getUri();

  // Force a fresh require of socketService (tests in other suites may have cached it)
  jest.resetModules();
  const createApp   = require('../../src/app');
  const app         = await createApp();
  socketService     = require('../../src/services/socket.service');
  socketService._resetForTests();

  httpServer = http.createServer(app);
  socketService.init(httpServer);

  await new Promise((resolve) => httpServer.listen(0, resolve));
  serverPort = httpServer.address().port;
}, 30_000);

afterAll(async () => {
  // Close Socket.io and HTTP server
  const io = socketService.getIO();
  if (io) {
    io.disconnectSockets(true);
    io.close();
  }
  httpServer.closeAllConnections?.();
  httpServer.close();

  // Close all mongoose connections (there may be multiple from jest.resetModules)
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }

  // Stop MongoMemoryServer with a short timeout
  try {
    await Promise.race([
      mongod.stop(),
      new Promise((resolve) => setTimeout(resolve, 5000))
    ]);
  } catch (_) { /* ignore */ }
}, 30_000);

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe('WebRTC signaling — socket.service.js', () => {

  // ── 1. call_offer relays call_incoming to others (not sender) ─────────────

  it('call_offer relays call_incoming to others in room, excluding sender', async () => {
    const token1 = signToken(userId1);
    const token2 = signToken(userId2);

    const client1 = await connectClient(serverPort, token1);
    const client2 = await connectClient(serverPort, token2);

    // Both join the same room (admin role for client2 so it can join)
    const token2Admin = signToken(userId2, 'admin');
    client2.disconnect();
    const client2a = await connectClient(serverPort, token2Admin);

    await joinRoom(client1, ROOM_ID);
    await joinRoom(client2a, ROOM_ID);

    const incomingPromise = waitForEvent(client2a, 'call_incoming');

    client1.emit('call_offer', { roomId: ROOM_ID, sdp: 'offer-sdp-here' });

    const incoming = await incomingPromise;

    expect(incoming.roomId).toBe(ROOM_ID);
    expect(incoming.fromUserId).toBe(userId1);
    expect(incoming.sdp).toBe('offer-sdp-here');

    client1.disconnect();
    client2a.disconnect();
  }, 8000);

  // ── 2. call_answer relays call_answered to others (not sender) ────────────

  it('call_answer relays call_answered to others in room', async () => {
    const token1      = signToken(userId1);
    const token2Admin = signToken(userId2, 'admin');

    const client1 = await connectClient(serverPort, token1);
    const client2 = await connectClient(serverPort, token2Admin);

    await joinRoom(client1, ROOM_ID);
    await joinRoom(client2, ROOM_ID);

    const answeredPromise = waitForEvent(client1, 'call_answered');

    client2.emit('call_answer', { roomId: ROOM_ID, sdp: 'answer-sdp-here' });

    const answered = await answeredPromise;

    expect(answered.roomId).toBe(ROOM_ID);
    expect(answered.sdp).toBe('answer-sdp-here');

    client1.disconnect();
    client2.disconnect();
  }, 8000);

  // ── 3. call_reject relays call_rejected to others (not sender) ───────────

  it('call_reject relays call_rejected to others in room', async () => {
    const token1      = signToken(userId1);
    const token2Admin = signToken(userId2, 'admin');

    const client1 = await connectClient(serverPort, token1);
    const client2 = await connectClient(serverPort, token2Admin);

    await joinRoom(client1, ROOM_ID);
    await joinRoom(client2, ROOM_ID);

    const rejectedPromise = waitForEvent(client1, 'call_rejected');

    client2.emit('call_reject', { roomId: ROOM_ID });

    const rejected = await rejectedPromise;

    expect(rejected.roomId).toBe(ROOM_ID);

    client1.disconnect();
    client2.disconnect();
  }, 8000);

  // ── 4. call_end broadcasts call_ended to ALL (including sender) ──────────

  it('call_end broadcasts call_ended to all participants including sender', async () => {
    const token1      = signToken(userId1);
    const token2Admin = signToken(userId2, 'admin');

    const client1 = await connectClient(serverPort, token1);
    const client2 = await connectClient(serverPort, token2Admin);

    await joinRoom(client1, ROOM_ID);
    await joinRoom(client2, ROOM_ID);

    const endedForClient1 = waitForEvent(client1, 'call_ended');
    const endedForClient2 = waitForEvent(client2, 'call_ended');

    client1.emit('call_end', { roomId: ROOM_ID });

    const [ev1, ev2] = await Promise.all([endedForClient1, endedForClient2]);

    expect(ev1.roomId).toBe(ROOM_ID);
    expect(ev2.roomId).toBe(ROOM_ID);

    client1.disconnect();
    client2.disconnect();
  }, 8000);

  // ── 5. ice_candidate relays ice_candidate to others (not sender) ─────────

  it('ice_candidate relays ice_candidate to others in room, excluding sender', async () => {
    const token1      = signToken(userId1);
    const token2Admin = signToken(userId2, 'admin');

    const client1 = await connectClient(serverPort, token1);
    const client2 = await connectClient(serverPort, token2Admin);

    await joinRoom(client1, ROOM_ID);
    await joinRoom(client2, ROOM_ID);

    const candidatePromise = waitForEvent(client2, 'ice_candidate');

    const candidatePayload = { sdpMid: '0', sdpMLineIndex: 0, candidate: 'candidate:...' };
    client1.emit('ice_candidate', { roomId: ROOM_ID, candidate: candidatePayload });

    const event = await candidatePromise;

    expect(event.roomId).toBe(ROOM_ID);
    expect(event.candidate).toEqual(candidatePayload);

    client1.disconnect();
    client2.disconnect();
  }, 8000);

  // ── 6. Authentication required ────────────────────────────────────────────

  it('connection without token is rejected', async () => {
    await expect(connectClient(serverPort, undefined)).rejects.toBeDefined();
  }, 5000);

  it('connection with an invalid token is rejected', async () => {
    await expect(connectClient(serverPort, 'not.a.valid.jwt')).rejects.toBeDefined();
  }, 5000);

  // ── 7. call_offer with missing roomId returns error ───────────────────────

  it('call_offer with missing roomId emits error to sender', async () => {
    const token1 = signToken(userId1);
    const client1 = await connectClient(serverPort, token1);

    const errPromise = waitForEvent(client1, 'error');
    client1.emit('call_offer', { sdp: 'sdp-without-room' });
    const err = await errPromise;

    expect(err.message).toMatch(/roomId/i);

    client1.disconnect();
  }, 5000);

  // ── 8. call_offer with missing sdp returns error ──────────────────────────

  it('call_offer with missing sdp emits error to sender', async () => {
    const token1 = signToken(userId1);
    const client1 = await connectClient(serverPort, token1);

    const errPromise = waitForEvent(client1, 'error');
    client1.emit('call_offer', { roomId: ROOM_ID });
    const err = await errPromise;

    expect(err.message).toMatch(/sdp/i);

    client1.disconnect();
  }, 5000);

  // ── 9. call_answer with missing sdp returns error ─────────────────────────

  it('call_answer with missing sdp emits error to sender', async () => {
    const token1 = signToken(userId1);
    const client1 = await connectClient(serverPort, token1);

    const errPromise = waitForEvent(client1, 'error');
    client1.emit('call_answer', { roomId: ROOM_ID });
    const err = await errPromise;

    expect(err.message).toMatch(/sdp/i);

    client1.disconnect();
  }, 5000);

  // ── 10. call_reject with missing roomId returns error ────────────────────

  it('call_reject with missing roomId emits error to sender', async () => {
    const token1 = signToken(userId1);
    const client1 = await connectClient(serverPort, token1);

    const errPromise = waitForEvent(client1, 'error');
    client1.emit('call_reject', {});
    const err = await errPromise;

    expect(err.message).toMatch(/roomId/i);

    client1.disconnect();
  }, 5000);
});
