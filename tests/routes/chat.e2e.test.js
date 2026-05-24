/**
 * tests/routes/chat.e2e.test.js
 *
 * End-to-end integration tests for the chat REST API.
 * Uses supertest + MongoMemoryServer — no real DB or network required.
 *
 * Socket.io is NOT tested here (it requires a live HTTP server).
 * Socket.io event logic is tested implicitly via the unit tests in
 * tests/controllers/chat.controller.test.js.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const jwt      = require('jsonwebtoken');
const path     = require('path');
const fs       = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');

/* ------------------------------------------------------------------ */
/* Env & mocks — declared before any module that imports config        */
/* ------------------------------------------------------------------ */
process.env.PORT              = '0';
process.env.JWT_SECRET        = 'a'.repeat(64);
process.env.ONESIGNAL_APP_ID  = 'test-app-id';
process.env.ONESIGNAL_API_KEY = 'test-api-key';
process.env.UPLOAD_DIR        = '/tmp/stg-chat-test-uploads/';

jest.mock('../../src/config/logger', () => ({
  info:  jest.fn(),
  warn:  jest.fn(),
  error: jest.fn()
}));

// Prevent Socket.io from broadcasting during HTTP tests
jest.mock('../../src/services/socket.service', () => ({
  init:           jest.fn(),
  getIO:          jest.fn().mockReturnValue(null),
  _resetForTests: jest.fn()
}));

let mongod;
let app;

/* ------------------------------------------------------------------ */
/* Helper — sign a JWT the same way the real controller does           */
/* ------------------------------------------------------------------ */
function signToken(userId, role = 'user') {
  return jwt.sign(
    { sub: userId, email: `${userId}@test.com`, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/* ------------------------------------------------------------------ */
/* Setup / Teardown                                                     */
/* ------------------------------------------------------------------ */
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.DB_URI = mongod.getUri();

  const createApp = require('../../src/app');
  app = await createApp();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

afterEach(async () => {
  const { Room, Message } = require('../../src/models');
  await Room.deleteMany({});
  await Message.deleteMany({});
});

/* ------------------------------------------------------------------ */
/* GET /api/chat/rooms                                                 */
/* ------------------------------------------------------------------ */
describe('GET /api/chat/rooms', () => {
  it('401 without token', async () => {
    const res = await request(app).get('/api/chat/rooms');
    expect(res.status).toBe(401);
  });

  it('user gets empty array when no room exists', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const token  = signToken(userId);
    const res    = await request(app)
      .get('/api/chat/rooms')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.rooms).toEqual([]);
  });

  it("user gets their own room after it's been created", async () => {
    const { Room } = require('../../src/models');
    const userId   = new mongoose.Types.ObjectId().toHexString();
    const roomId   = `support-${userId}`;
    await Room.create({ userId, roomId, status: 'open' });

    const token = signToken(userId);
    const res   = await request(app)
      .get('/api/chat/rooms')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.rooms).toHaveLength(1);
    expect(res.body.rooms[0].roomId).toBe(roomId);
  });

  it('admin gets all rooms', async () => {
    const { Room } = require('../../src/models');
    const uid1 = new mongoose.Types.ObjectId().toHexString();
    const uid2 = new mongoose.Types.ObjectId().toHexString();
    await Room.create([
      { userId: uid1, roomId: `support-${uid1}`, status: 'open' },
      { userId: uid2, roomId: `support-${uid2}`, status: 'open' }
    ]);

    const adminToken = signToken(new mongoose.Types.ObjectId().toHexString(), 'admin');
    const res = await request(app)
      .get('/api/chat/rooms')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.rooms).toHaveLength(2);
  });
});

/* ------------------------------------------------------------------ */
/* GET /api/chat/rooms/:roomId/messages                                */
/* ------------------------------------------------------------------ */
describe('GET /api/chat/rooms/:roomId/messages', () => {
  it('401 without token', async () => {
    const res = await request(app).get('/api/chat/rooms/support-abc/messages');
    expect(res.status).toBe(401);
  });

  it('403 when user requests another user room', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const token  = signToken(userId);
    const res    = await request(app)
      .get('/api/chat/rooms/support-someone-else/messages')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns empty message list for own room', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const token  = signToken(userId);
    const res    = await request(app)
      .get(`/api/chat/rooms/support-${userId}/messages`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.messages).toEqual([]);
  });

  it('returns messages in ascending order (oldest first)', async () => {
    const { Message } = require('../../src/models');
    const userId  = new mongoose.Types.ObjectId().toHexString();
    const roomId  = `support-${userId}`;

    await Message.create({ roomId, senderType: 'user',    content: 'first',  senderId: userId });
    await Message.create({ roomId, senderType: 'support', content: 'second', senderId: null  });

    const token = signToken(userId);
    const res   = await request(app)
      .get(`/api/chat/rooms/${roomId}/messages`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(2);
    expect(res.body.messages[0].content).toBe('first');
    expect(res.body.messages[1].content).toBe('second');
  });

  it('400 when limit param is out of range', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const token  = signToken(userId);
    const res    = await request(app)
      .get(`/api/chat/rooms/support-${userId}/messages?limit=999`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('400 when before param is not a valid ISO date', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const token  = signToken(userId);
    const res    = await request(app)
      .get(`/api/chat/rooms/support-${userId}/messages?before=not-a-date`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

/* ------------------------------------------------------------------ */
/* POST /api/chat/rooms/:roomId/files                                  */
/* ------------------------------------------------------------------ */
describe('POST /api/chat/rooms/:roomId/files', () => {
  // Create a tiny real temp file for multipart uploads
  const TMP_IMAGE = path.join('/tmp', 'chat_test_image.jpg');
  const TMP_PDF   = path.join('/tmp', 'chat_test_doc.pdf');

  beforeAll(() => {
    fs.writeFileSync(TMP_IMAGE, Buffer.alloc(100, 0xff));
    fs.writeFileSync(TMP_PDF,   Buffer.alloc(100, 0x25)); // %PDF header byte
  });

  it('401 without token', async () => {
    const res = await request(app)
      .post('/api/chat/rooms/support-abc/files')
      .attach('file', TMP_IMAGE);
    expect(res.status).toBe(401);
  });

  it('403 when user uploads to another room', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const token  = signToken(userId);
    const res    = await request(app)
      .post('/api/chat/rooms/support-someone-else/files')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', TMP_IMAGE);
    expect(res.status).toBe(403);
  });

  it('400 when no file attached', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const token  = signToken(userId);
    const res    = await request(app)
      .post(`/api/chat/rooms/support-${userId}/files`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('400 when file type is not allowed (.exe)', async () => {
    const exe = path.join('/tmp', 'bad.exe');
    fs.writeFileSync(exe, Buffer.alloc(10));

    const userId = new mongoose.Types.ObjectId().toHexString();
    const token  = signToken(userId);
    const res    = await request(app)
      .post(`/api/chat/rooms/support-${userId}/files`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', exe, 'bad.exe');
    expect(res.status).toBe(400);
  });

  it('201 + message created for image upload', async () => {
    const { Room } = require('../../src/models');
    const userId   = new mongoose.Types.ObjectId().toHexString();
    const roomId   = `support-${userId}`;
    await Room.create({ userId, roomId, status: 'open' });

    const token = signToken(userId);
    const res   = await request(app)
      .post(`/api/chat/rooms/${roomId}/files`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', TMP_IMAGE, 'photo.jpg');

    expect(res.status).toBe(201);
    expect(res.body.message).toMatchObject({
      roomId,
      senderType: 'user',
      fileType:   'image'
    });
    expect(res.body.message.fileUrl).toMatch(/^\/uploads\/chat\//);
  });

  it('201 + message created for PDF upload', async () => {
    const { Room } = require('../../src/models');
    const userId   = new mongoose.Types.ObjectId().toHexString();
    const roomId   = `support-${userId}`;
    await Room.create({ userId, roomId, status: 'open' });

    const token = signToken(userId);
    const res   = await request(app)
      .post(`/api/chat/rooms/${roomId}/files`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', TMP_PDF, 'report.pdf');

    expect(res.status).toBe(201);
    expect(res.body.message.fileType).toBe('document');
  });
});
