/**
 * tests/routes/auth.routes.test.js
 *
 * Verifies that all expected routes are registered with the correct methods.
 */

// Set required env vars BEFORE any module that imports config/index.js
process.env.PORT              = '3000';
process.env.DB_URI            = 'mongodb://localhost:27017/test';
process.env.JWT_SECRET        = 'a'.repeat(64);
process.env.ONESIGNAL_APP_ID  = 'test-app-id';
process.env.ONESIGNAL_API_KEY = 'test-api-key';

// Prevent real DB / Firebase connections from firing
jest.mock('../../src/config/database', () => ({ connect: jest.fn() }));
jest.mock('../../src/services/firebase.service', () => ({ verifyIdToken: jest.fn() }));
jest.mock('../../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const authRoutes = require('../../src/routes/auth.routes');

function routePaths() {
  return authRoutes.stack
    .map((l) => l.route && l.route.path)
    .filter(Boolean);
}

function hasMethod(p, method) {
  const layer = authRoutes.stack.find((l) => l.route?.path === p);
  return layer?.route?.methods?.[method] === true;
}

describe('Auth Routes — registration', () => {
  it('exposes POST /register', () => {
    expect(routePaths()).toContain('/register');
    expect(hasMethod('/register', 'post')).toBe(true);
  });

  it('exposes POST /login', () => {
    expect(routePaths()).toContain('/login');
    expect(hasMethod('/login', 'post')).toBe(true);
  });

  it('exposes POST /oauth', () => {
    expect(routePaths()).toContain('/oauth');
    expect(hasMethod('/oauth', 'post')).toBe(true);
  });
});

describe('Auth Routes — protected', () => {
  it('exposes GET /me', () => {
    expect(routePaths()).toContain('/me');
    expect(hasMethod('/me', 'get')).toBe(true);
  });

  it('exposes PUT /profile', () => {
    expect(routePaths()).toContain('/profile');
    expect(hasMethod('/profile', 'put')).toBe(true);
  });

  it('exposes POST /photo', () => {
    expect(routePaths()).toContain('/photo');
    expect(hasMethod('/photo', 'post')).toBe(true);
  });
});
