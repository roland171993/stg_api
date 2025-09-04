// tests/routes/health.routes.test.js
const request = require('supertest');
const express = require('express');

// ✅ mock the real file path
jest.mock('../../src/utils/system.utils', () => ({
  getMemoryInfo: () => ({ freeBytes: 111 * 1024 * 1024, totalBytes: 222 * 1024 * 1024 }),
  getDiskInfo: () => Promise.resolve({ availableBytes: 333 * 1024 * 1024, totalBytes: 444 * 1024 * 1024 }),
  bytesToMB: (bytes) => Math.round(bytes / (1024 * 1024)),
}));

// ✅ import the route using its real path
const healthRoutes = require('../../src/routes/health.routes');

function makeApp() {
  const app = express();
  app.use('/', healthRoutes);
  return app;
}

describe('Health routes', () => {
  test('GET /health returns ok with memory and storage in MB', async () => {
    const app = makeApp();
    const res = await request(app).get('/health').expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptimeSeconds');
    expect(res.body.memory).toEqual({ freeMB: 111, totalMB: 222 });
    expect(res.body.storage).toEqual({ availableMB: 333, totalMB: 444 });
  });

  test('GET /isServerConnectedToInternet always true', async () => {
    const app = makeApp();
    const res = await request(app).get('/isServerConnectedToInternet').expect(200);
    expect(res.body).toEqual({ connected: true });
  });
});
