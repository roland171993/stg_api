const jwt = require('jsonwebtoken');
const { User } = require('../../src/models');
const { login, getCurrentUser } = require('../../src/controllers/auth.controller');

jest.mock('../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    findById: jest.fn()
  }
}));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    User.findOne.mockReset();
    User.findById.mockReset();
    jwt.sign.mockReset();
  });

  describe('login', () => {
    // — your existing login tests go here —
    // e.g.
    // it('returns 404 if user not found', async () => { … });
    // it('returns 401 if password invalid', async () => { … });
    // it('returns token on successful login', async () => { … });
  });

  describe('getCurrentUser', () => {
    it('responds 404 if user not found', async () => {
      req.userId = '1';
      // Mock findById(...).select(...) ⇒ Promise<null>
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await getCurrentUser(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found.' });
    });

    it('returns user without password', async () => {
      const mockUser = { _id: '1', username: 'u' };
      req.userId = '1';
      // Mock findById(...).select(...) ⇒ Promise<mockUser>
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await getCurrentUser(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({ user: mockUser });
    });
  });
});
