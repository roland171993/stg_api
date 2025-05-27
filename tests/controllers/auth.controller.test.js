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
    req = { body: {}, headers: {}, userId: null };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jwt.sign.mockReset();
    User.findOne.mockReset();
    User.findById.mockReset();
  });

  describe('login', () => {
    it('responds 400 when missing credentials', async () => {
      req.body = {};
      await login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Username and password are required.' });
    });

    it('responds 401 on invalid credentials', async () => {
      req.body = { username: 'u', password: 'p' };
      User.findOne.mockResolvedValue(null);
      await login(req, res, next);
      expect(User.findOne).toHaveBeenCalledWith({ username: 'u' });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials.' });
    });

    it('returns JWT on valid credentials', async () => {
      const mockUser = { _id: '1', username: 'u', comparePassword: jest.fn().mockResolvedValue(true) };
      const token = 'tok123';
      req.body = { username: 'u', password: 'p' };
      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue(token);

      await login(req, res, next);

      expect(mockUser.comparePassword).toHaveBeenCalledWith('p');
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: mockUser._id, username: mockUser.username },
        expect.any(String),
        { expiresIn: '210d' }
      );
      expect(res.json).toHaveBeenCalledWith({ token });
    });
  });

  describe('getCurrentUser', () => {
    it('responds 404 if user not found', async () => {
      req.userId = '1';
      User.findById.mockResolvedValue(null);

      await getCurrentUser(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found.' });
    });

    it('returns user without password', async () => {
      const mockUser = { _id: '1', username: 'u' };
      req.userId = '1';
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await getCurrentUser(req, res, next);
      expect(User.findById).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({ user: mockUser });
    });
  });
});