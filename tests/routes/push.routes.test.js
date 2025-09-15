/**
 * Unit-style tests for push.routes.js using supertest + jest.
 * We mock services and auth middleware to isolate the router behavior.
 */
const request = require('supertest');
const express = require('express');

// ---- Mocks (match the paths used inside push.routes.js) ----
jest.mock('../services/device.service', () => ({
  upsertDevice: jest.fn(async (input) => ({ _id: 'dev1', ...input })),
  updateOpt: jest.fn(async () => {}),
}));

jest.mock('../services/notification.service', () => ({
  sendToExternalUserIds: jest.fn(async (p) => ({ id: 'notif1', recipients: 1, ...p })),
}));

// Minimal auth middlewares for testing the router contract
jest.mock('../middlewares/auth', () => ({
  optional: (req, res, next) => {
    const uid = req.headers['x-user-id'];
    if (uid) req.user = { id: uid };
    next();
  },
  required: (req, res, next) => {
    const uid = req.headers['x-user-id'];
    if (uid) { req.user = { id: uid }; return next(); }
    return res.sendStatus(401);
  },
  requireAdmin: (req, res, next) => {
    if (req.headers['x-admin'] === '1') {
      const uid = req.headers['x-user-id'] || 'admin';
      req.user = { id: uid, role: 'admin' };
      return next();
    }
    return res.sendStatus(403);
  }
}));

// Bring in mocks to assert calls
const deviceService = require('../services/device.service');
const notificationService = require('../services/notification.service');

// Router under test
const router = require('../push.routes');

// helper to spin an express app with the router
function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/', router);
  // error handler to surface thrown errors as 500
  // express needs 4 args to recognize an error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message || 'error' });
  });
  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /devices', () => {
  test('saves a device for guest (no user)', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/devices')
      .send({ playerId: 'p123', platform: 'web' })
      .expect(200);
    expect(res.body).toMatchObject({ playerId: 'p123', platform: 'web' });
    expect(deviceService.upsertDevice).toHaveBeenCalledWith(expect.objectContaining({
      userId: undefined,
      playerId: 'p123',
      platform: 'web',
    }));
  });

  test('attaches userId when logged in (auth.optional)', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/devices')
      .set('x-user-id', 'u1')
      .send({ playerId: 'p999', platform: 'ios' })
      .expect(200);
    expect(res.body).toMatchObject({ playerId: 'p999', platform: 'ios' });
    expect(deviceService.upsertDevice).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u1',
      playerId: 'p999',
      platform: 'ios',
    }));
  });
});

describe('POST /opt', () => {
  test('requires auth (401 without header)', async () => {
    const app = makeApp();
    await request(app)
      .post('/opt')
      .send({ categories: { news: true } })
      .expect(401);
    expect(deviceService.updateOpt).not.toHaveBeenCalled();
  });

  test('updates user categories when authenticated', async () => {
    const app = makeApp();
    await request(app)
      .post('/opt')
      .set('x-user-id', 'u42')
      .send({ categories: { news: true, promos: false } })
      .expect(200, { ok: true });
    expect(deviceService.updateOpt).toHaveBeenCalledWith('u42', { news: true, promos: false });
  });
});

describe('POST /test', () => {
  test('requires admin (403 without header)', async () => {
    const app = makeApp();
    await request(app)
      .post('/test')
      .send({ userId: 'u100' })
      .expect(403);
    expect(notificationService.sendToExternalUserIds).not.toHaveBeenCalled();
  });

  test('sends a test notification as admin', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/test')
      .set('x-admin', '1')
      .send({ userId: 'u100' })
      .expect(200);
    expect(notificationService.sendToExternalUserIds).toHaveBeenCalledWith(expect.objectContaining({
      userIds: ['u100'],
      title: 'Test notification',
      body: 'Hello from backend 👋',
      data: { type: 'TEST' },
    }));
    expect(res.body).toMatchObject({ id: 'notif1' });
  });
});
