/**
 * tests/routes/auth.e2e.test.js
 *
 * End-to-end integration tests using supertest + MongoMemoryServer.
 * Firebase is mocked — the suite runs without any network access.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

/* ------------------------------------------------------------------ */
/* Mocks — declared before any module that imports config/index.js     */
/* ------------------------------------------------------------------ */
process.env.PORT              = '0';
process.env.JWT_SECRET        = 'a'.repeat(64);
process.env.ONESIGNAL_APP_ID  = 'test-app-id';
process.env.ONESIGNAL_API_KEY = 'test-api-key';

jest.mock('../../src/services/firebase.service', () => ({
  verifyIdToken: jest.fn()
}));
jest.mock('../../src/config/logger', () => ({
  info:  jest.fn(),
  warn:  jest.fn(),
  error: jest.fn()
}));

const firebaseService = require('../../src/services/firebase.service');

let mongod;
let app;

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
  const { User } = require('../../src/models');
  await User.deleteMany({});
});

/* ------------------------------------------------------------------ */
/* POST /api/auth/register                                             */
/* ------------------------------------------------------------------ */
describe('POST /api/auth/register', () => {
  const valid = {
    firstName: 'Alice',
    lastName:  'Dupont',
    age:       30,
    email:     'alice@example.com',
    phone:     '+2250700000001',
    password:  'SecurePass1'
  };

  it('201 — creates user and returns token + user object', async () => {
    const res = await request(app).post('/api/auth/register').send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(valid.email);
    expect(res.body.user.firstName).toBe('Alice');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('400 — rejects weak password (< 8 chars)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...valid, password: 'weak' });
    expect(res.status).toBe(400);
  });

  it('400 — rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...valid, email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('409 — rejects duplicate email', async () => {
    await request(app).post('/api/auth/register').send(valid);
    const res = await request(app).post('/api/auth/register').send(valid);
    expect(res.status).toBe(409);
  });
});

/* ------------------------------------------------------------------ */
/* POST /api/auth/login                                                */
/* ------------------------------------------------------------------ */
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      email:    'bob@example.com',
      password: 'Password123'
    });
  });

  it('200 — returns token for valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email:    'bob@example.com',
      password: 'Password123'
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('401 — wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email:    'bob@example.com',
      password: 'WrongPass1'
    });
    expect(res.status).toBe(401);
  });

  it('401 — unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email:    'nobody@example.com',
      password: 'Password123'
    });
    expect(res.status).toBe(401);
  });
});

/* ------------------------------------------------------------------ */
/* POST /api/auth/oauth                                                */
/* ------------------------------------------------------------------ */
describe('POST /api/auth/oauth', () => {
  beforeEach(() => firebaseService.verifyIdToken.mockReset());

  it('200 — creates account on first Google sign-in', async () => {
    firebaseService.verifyIdToken.mockResolvedValue({
      uid:      'google-uid-1',
      email:    'carol@gmail.com',
      name:     'Carol Martin',
      picture:  'https://photo.url',
      firebase: { sign_in_provider: 'google.com' }
    });

    const res = await request(app)
      .post('/api/auth/oauth')
      .send({ idToken: 'valid.firebase.token' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('carol@gmail.com');
    expect(res.body.user.authProvider).toBe('google');
  });

  it('200 — Apple provider is detected correctly', async () => {
    firebaseService.verifyIdToken.mockResolvedValue({
      uid:      'apple-uid-1',
      email:    'dan@icloud.com',
      firebase: { sign_in_provider: 'apple.com' }
    });

    const res = await request(app)
      .post('/api/auth/oauth')
      .send({ idToken: 'apple.firebase.token' });

    expect(res.status).toBe(200);
    expect(res.body.user.authProvider).toBe('apple');
  });

  it('200 — existing user found by firebaseUid on second sign-in', async () => {
    firebaseService.verifyIdToken.mockResolvedValue({
      uid:      'google-uid-2',
      email:    'eva@gmail.com',
      firebase: { sign_in_provider: 'google.com' }
    });
    await request(app).post('/api/auth/oauth').send({ idToken: 'tok' });
    const res = await request(app).post('/api/auth/oauth').send({ idToken: 'tok' });
    expect(res.status).toBe(200);
  });

  it('401 — invalid Firebase token', async () => {
    firebaseService.verifyIdToken.mockRejectedValue(
      Object.assign(new Error('expired'), { code: 'auth/id-token-expired' })
    );
    const res = await request(app).post('/api/auth/oauth').send({ idToken: 'bad' });
    expect(res.status).toBe(401);
  });

  it('400 — missing idToken', async () => {
    const res = await request(app).post('/api/auth/oauth').send({});
    expect(res.status).toBe(400);
  });
});

/* ------------------------------------------------------------------ */
/* GET /api/auth/me  (protected)                                       */
/* ------------------------------------------------------------------ */
describe('GET /api/auth/me', () => {
  let token;

  beforeEach(async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: 'eve@example.com', password: 'Password123'
    });
    token = reg.body.token;
  });

  it('200 — returns profile (no password field)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('eve@example.com');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('401 — no token', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
  });

  it('401 — malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(401);
  });
});

/* ------------------------------------------------------------------ */
/* PUT /api/auth/profile  (protected)                                  */
/* ------------------------------------------------------------------ */
describe('PUT /api/auth/profile', () => {
  let token;

  beforeEach(async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: 'frank@example.com', password: 'Password123'
    });
    token = reg.body.token;
  });

  it('200 — updates all editable fields', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Frank', lastName: 'Castle', age: 35, phone: '+2250700000099' });

    expect(res.status).toBe(200);
    expect(res.body.user.firstName).toBe('Frank');
    expect(res.body.user.lastName).toBe('Castle');
    expect(res.body.user.age).toBe(35);
    expect(res.body.user.phone).toBe('+2250700000099');
  });

  it('400 — rejects invalid age', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ age: 200 });
    expect(res.status).toBe(400);
  });

  it('401 — no token', async () => {
    const res = await request(app).put('/api/auth/profile').send({ firstName: 'X' });
    expect(res.status).toBe(401);
  });
});
