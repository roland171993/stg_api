const request = require('supertest');
const express = require('express');

// Mocks (same paths used in push.routes.js) 
jest.mock('../services/device.service', () => ({
  upsertDevice: jest.fn(async (input) => ({ _id: 'devE2E', ...input })),
  updateOpt: jest.fn(async () => {}),
}));

jest.mock('../services/notification.service', () => ({
  sendToExternalUserIds: jest.fn(async (p) => ({ id: 'notifE2E', recipients: 1, ...p })),
}));

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

const deviceService = require('../services/device.service');
const notificationService = require('../services/notification.service');
const router = require('../push.routes');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/', router);
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => res.status(500).json({ error: err.message || 'error' }));
  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('E2E flow: register device (guest) -> register device (user) -> set opt -> admin test send', async () => {
  const app = makeApp();

  // guest registers a device
  const resGuest = await request(app)
    .post('/devices')
    .send({ playerId: 'pg-1', platform: 'web' })
    .expect(200);
  expect(resGuest.body).toMatchObject({ playerId: 'pg-1', platform: 'web' });

  // logged-in user registers a device
  const resUser = await request(app)
    .post('/devices')
    .set('x-user-id', 'U-55')
    .send({ playerId: 'pg-2', platform: 'android', tags: { city: 'Abidjan' } })
    .expect(200);
  expect(resUser.body).toMatchObject({ playerId: 'pg-2', platform: 'android' });
  expect(deviceService.upsertDevice).toHaveBeenLastCalledWith(expect.objectContaining({
    userId: 'U-55', playerId: 'pg-2', platform: 'android', tags: { city: 'Abidjan' }
  }));

  // same logged-in user updates opt-in categories
  await request(app)
    .post('/opt')
    .set('x-user-id', 'U-55')
    .send({ categories: { news: true, promos: false, jobs: true } })
    .expect(200, { ok: true });
  expect(deviceService.updateOpt).toHaveBeenCalledWith('U-55', { news: true, promos: false, jobs: true });

  // admin sends a test push to another user
  const resAdmin = await request(app)
    .post('/test')
    .set('x-admin', '1')
    .send({ userId: 'U-77' })
    .expect(200);
  expect(notificationService.sendToExternalUserIds).toHaveBeenCalledWith(expect.objectContaining({
    userIds: ['U-77'],
    data: { type: 'TEST' },
  }));
  expect(resAdmin.body).toMatchObject({ id: 'notifE2E' });
});
