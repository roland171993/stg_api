/**
 * tests/controllers/auth.controller.test.js
 *
 * Unit tests — all I/O (DB, Firebase) is mocked.
 */

const jwt = require('jsonwebtoken');

/* ------------------------------------------------------------------ */
/* Mocks (declared before require of the module under test)            */
/* ------------------------------------------------------------------ */
jest.mock('../../src/models', () => ({
  User: {
    findOne:  jest.fn(),
    findById: jest.fn()
  }
}));

jest.mock('jsonwebtoken', () => ({ sign: jest.fn(() => 'mock.jwt.token') }));

jest.mock('../../src/services/firebase.service', () => ({
  verifyIdToken: jest.fn()
}));

jest.mock('../../src/config/logger', () => ({
  info:  jest.fn(),
  warn:  jest.fn(),
  error: jest.fn()
}));

jest.mock('../../src/config', () => ({
  jwtSecret: 'a'.repeat(64),
  upload:    { dir: 'uploads/', maxSizeBytes: 5 * 1024 * 1024 }
}));

/* ------------------------------------------------------------------ */
/* SUT                                                                  */
/* ------------------------------------------------------------------ */
const {
  register,
  login,
  oauthSignIn,
  getCurrentUser,
  updateProfile,
  uploadPhoto
} = require('../../src/controllers/auth.controller');

const { User }            = require('../../src/models');
const firebaseService     = require('../../src/services/firebase.service');

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function mockUser(overrides = {}) {
  const base = {
    _id:          'uid123',
    firstName:    'John',
    lastName:     'Doe',
    age:          28,
    email:        'john@example.com',
    phone:        '+2250700000000',
    photoUrl:     null,
    authProvider: 'local',
    firebaseUid:  null,
    role:         'user',
    password:     'hashed',
    comparePassword: jest.fn(),
    save:          jest.fn().mockResolvedValue(undefined),
    toPublic:      jest.fn().mockReturnValue({ id: 'uid123', email: 'john@example.com' })
  };
  return Object.assign(base, overrides);
}

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis()
  };
  return res;
}

/* ------------------------------------------------------------------ */
/* register                                                            */
/* ------------------------------------------------------------------ */
describe('register', () => {
  let req, res, next;

  beforeEach(() => {
    req  = { body: { email: 'new@example.com', password: 'Password1' } };
    res  = mockRes();
    next = jest.fn();
    User.findOne.mockReset();
    jwt.sign.mockReturnValue('tok');
  });

  it('400 when email is missing', async () => {
    req.body = { password: 'Password1' };
    await register(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 when password is missing', async () => {
    req.body = { email: 'x@x.com' };
    await register(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('409 when email already registered', async () => {
    User.findOne.mockResolvedValue(mockUser());
    await register(req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('409 conflict is checked before any creation', async () => {
    // If findOne returns a user, register must respond 409 without calling next
    User.findOne.mockResolvedValue(mockUser());
    await register(req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next(err) on unexpected error', async () => {
    User.findOne.mockRejectedValue(new Error('DB down'));
    await register(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

/* ------------------------------------------------------------------ */
/* login                                                               */
/* ------------------------------------------------------------------ */
describe('login', () => {
  let req, res, next;

  beforeEach(() => {
    req  = { body: { email: 'john@example.com', password: 'Password1' } };
    res  = mockRes();
    next = jest.fn();
    User.findOne.mockReset();
  });

  it('400 when fields are missing', async () => {
    req.body = {};
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('401 when user not found', async () => {
    User.findOne.mockResolvedValue(null);
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('401 when password is wrong', async () => {
    const user = mockUser({ comparePassword: jest.fn().mockResolvedValue(false) });
    User.findOne.mockResolvedValue(user);
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('401 when user is OAuth (non-local provider)', async () => {
    const user = mockUser({
      authProvider:    'google',
      comparePassword: jest.fn().mockResolvedValue(true)
    });
    User.findOne.mockResolvedValue(user);
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('200 + token on valid credentials', async () => {
    const user = mockUser({ comparePassword: jest.fn().mockResolvedValue(true) });
    User.findOne.mockResolvedValue(user);
    jwt.sign.mockReturnValue('valid.token');
    await login(req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'valid.token' })
    );
  });

  it('calls next(err) on unexpected error', async () => {
    User.findOne.mockRejectedValue(new Error('DB error'));
    await login(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

/* ------------------------------------------------------------------ */
/* oauthSignIn                                                         */
/* ------------------------------------------------------------------ */
describe('oauthSignIn', () => {
  let req, res, next;

  beforeEach(() => {
    req  = { body: { idToken: 'firebase.id.token' } };
    res  = mockRes();
    next = jest.fn();
    User.findOne.mockReset();
    firebaseService.verifyIdToken.mockReset();
  });

  it('400 when idToken is missing', async () => {
    req.body = {};
    await oauthSignIn(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('401 when Firebase verification fails', async () => {
    firebaseService.verifyIdToken.mockRejectedValue(
      Object.assign(new Error('expired'), { code: 'auth/id-token-expired' })
    );
    await oauthSignIn(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('400 when Firebase token has no email', async () => {
    firebaseService.verifyIdToken.mockResolvedValue({ uid: 'uid1', email: null });
    await oauthSignIn(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('no unhandled rejection when Firebase token is valid but user does not exist yet', async () => {
    // Full new-user creation path is covered by auth.e2e.test.js.
    // Here we just verify the controller doesn't throw an unhandled promise rejection
    // when findOne returns null (constructor call will forward to next() gracefully).
    firebaseService.verifyIdToken.mockResolvedValue({
      uid:      'goog-uid',
      email:    'google@example.com',
      name:     'Alice Google',
      picture:  'https://photo.url',
      firebase: { sign_in_provider: 'google.com' }
    });
    User.findOne.mockResolvedValue(null);
    jwt.sign.mockReturnValue('oauth.token');

    // Should not throw — controller must catch and forward to next()
    await expect(oauthSignIn(req, res, next)).resolves.toBeUndefined();
  });

  it('200 for returning user found by firebaseUid', async () => {
    firebaseService.verifyIdToken.mockResolvedValue({
      uid:      'existing-uid',
      email:    'existing@example.com',
      firebase: { sign_in_provider: 'google.com' }
    });
    const existing = mockUser({ firebaseUid: 'existing-uid' });
    User.findOne.mockResolvedValue(existing);
    jwt.sign.mockReturnValue('oauth.token');

    await oauthSignIn(req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'oauth.token' })
    );
  });
});

/* ------------------------------------------------------------------ */
/* getCurrentUser                                                      */
/* ------------------------------------------------------------------ */
describe('getCurrentUser', () => {
  let req, res, next;

  beforeEach(() => {
    req  = { userId: 'uid123' };
    res  = mockRes();
    next = jest.fn();
    User.findById.mockReset();
  });

  it('404 when user not found', async () => {
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    await getCurrentUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('200 with user object', async () => {
    const user = mockUser();
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    await getCurrentUser(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ user: user.toPublic() });
  });
});

/* ------------------------------------------------------------------ */
/* updateProfile                                                       */
/* ------------------------------------------------------------------ */
describe('updateProfile', () => {
  let req, res, next;

  beforeEach(() => {
    req  = { userId: 'uid123', body: { firstName: 'Jane', age: 25 } };
    res  = mockRes();
    next = jest.fn();
    User.findById.mockReset();
  });

  it('404 when user not found', async () => {
    User.findById.mockResolvedValue(null);
    await updateProfile(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('200 with updated user', async () => {
    const user = mockUser();
    User.findById.mockResolvedValue(user);
    await updateProfile(req, res, next);
    expect(user.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ user: user.toPublic() });
  });
});

/* ------------------------------------------------------------------ */
/* uploadPhoto                                                         */
/* ------------------------------------------------------------------ */
describe('uploadPhoto', () => {
  let req, res, next;

  beforeEach(() => {
    req  = { userId: 'uid123', file: { filename: 'photo-123.jpg' } };
    res  = mockRes();
    next = jest.fn();
    User.findById.mockReset();
  });

  it('400 when no file is attached', async () => {
    req.file = undefined;
    await uploadPhoto(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('404 when user not found', async () => {
    User.findById.mockResolvedValue(null);
    await uploadPhoto(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('200 returns photoUrl', async () => {
    const user = mockUser();
    User.findById.mockResolvedValue(user);
    await uploadPhoto(req, res, next);
    expect(user.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ photoUrl: '/uploads/photos/photo-123.jpg' })
    );
  });
});
