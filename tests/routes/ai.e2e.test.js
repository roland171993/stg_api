/**
 * tests/routes/ai.e2e.test.js
 *
 * End-to-end integration tests for the AI REST API.
 * Uses supertest + MongoMemoryServer — no real DB, AI APIs, or network required.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const jwt      = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

/* ------------------------------------------------------------------ */
/* Env — declared before any module that imports config               */
/* ------------------------------------------------------------------ */
process.env.PORT              = '0';
process.env.JWT_SECRET        = 'b'.repeat(64);
process.env.ONESIGNAL_APP_ID  = 'test-app-id';
process.env.ONESIGNAL_API_KEY = 'test-api-key';
process.env.UPLOAD_DIR        = '/tmp/stg-ai-test-uploads/';

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */
jest.mock('../../src/config/logger', () => ({
  info:  jest.fn(),
  warn:  jest.fn(),
  error: jest.fn()
}));

jest.mock('../../src/services/socket.service', () => ({
  init:           jest.fn(),
  getIO:          jest.fn().mockReturnValue(null),
  _resetForTests: jest.fn()
}));

jest.mock('../../src/services/ai.service', () => ({
  generateText:  jest.fn(),
  generateImage: jest.fn()
}));

jest.mock('../../src/services/mail.service', () => ({
  sendCoverLetterEmail: jest.fn(),
  sendPhotoEmail:       jest.fn()
}));

jest.mock('axios', () => ({
  get: jest.fn()
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn()
}));

/* ------------------------------------------------------------------ */
/* Lazy imports (after env & mocks are set up)                        */
/* ------------------------------------------------------------------ */
const aiService = require('../../src/services/ai.service');
const axios     = require('axios');
const fs        = require('fs');

let mongod;
let app;

/* ------------------------------------------------------------------ */
/* Helper — sign a JWT                                                */
/* ------------------------------------------------------------------ */
function signToken(userId, role = 'user') {
  return jwt.sign(
    { sub: userId, email: `${userId}@test.com`, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/* ------------------------------------------------------------------ */
/* Setup / Teardown                                                    */
/* ------------------------------------------------------------------ */
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.DB_URI = mongod.getUri();

  // Ensure upload dirs exist for the app startup
  const realFs = jest.requireActual('fs');
  const path   = require('path');
  [
    '/tmp/stg-ai-test-uploads',
    '/tmp/stg-ai-test-uploads/ai-docs',
    '/tmp/stg-ai-test-uploads/ai-photos',
    '/tmp/stg-ai-test-uploads/resumes',
    '/tmp/stg-ai-test-uploads/photos',
    '/tmp/stg-ai-test-uploads/chat'
  ].forEach((dir) => {
    if (!realFs.existsSync(dir)) realFs.mkdirSync(dir, { recursive: true });
  });

  const createApp = require('../../src/app');
  app = await createApp();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

beforeEach(() => {
  jest.clearAllMocks();
  // Default mock behaviour
  aiService.generateText.mockResolvedValue('Lettre de motivation générée');
  aiService.generateImage.mockResolvedValue('https://dalle.openai.com/image/test.jpg');
  axios.get.mockResolvedValue({ data: Buffer.from('fake-image-bytes') });
  fs.writeFileSync.mockImplementation(() => {});
});

/* ------------------------------------------------------------------ */
/* POST /api/ai/cover-letter                                          */
/* ------------------------------------------------------------------ */
describe('POST /api/ai/cover-letter', () => {
  it('1. returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/ai/cover-letter')
      .send({ jobTitle: 'Développeur' });
    expect(res.status).toBe(401);
  });

  it('2. returns 200 with { success, coverLetter } when auth + valid body', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const token  = signToken(userId);

    const res = await request(app)
      .post('/api/ai/cover-letter')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobTitle: 'Développeur Full-Stack', provider: 'openai' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, coverLetter: expect.any(String) });
  });

  it('3. returns 400 when jobTitle is empty', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const token  = signToken(userId);

    const res = await request(app)
      .post('/api/ai/cover-letter')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobTitle: '' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('4. returns 400 when sendToEmail is invalid', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const token  = signToken(userId);

    const res = await request(app)
      .post('/api/ai/cover-letter')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobTitle: 'Designer', sendToEmail: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('5. returns 200 with provider="gemini"', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const token  = signToken(userId);

    const res = await request(app)
      .post('/api/ai/cover-letter')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobTitle: 'Chef de projet', provider: 'gemini' });

    expect(res.status).toBe(200);
    expect(aiService.generateText).toHaveBeenCalledWith(
      expect.any(String),
      'gemini'
    );
  });
});

/* ------------------------------------------------------------------ */
/* POST /api/ai/professional-photo                                    */
/* ------------------------------------------------------------------ */
describe('POST /api/ai/professional-photo', () => {
  it('6. returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/ai/professional-photo')
      .send({ jobTitle: 'Consultant' });
    expect(res.status).toBe(401);
  });

  it('7. returns 200 with { success, photoUrl } when auth + valid body', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const token  = signToken(userId);

    const res = await request(app)
      .post('/api/ai/professional-photo')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobTitle: 'Ingénieur', style: 'professional office' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success:  true,
      photoUrl: expect.stringMatching(/^\/uploads\/ai-photos\//)
    });
  });

  it('8. returns 400 when sendToEmail is invalid', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const token  = signToken(userId);

    const res = await request(app)
      .post('/api/ai/professional-photo')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobTitle: 'Analyste', sendToEmail: 'bad-email' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});
