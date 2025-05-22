jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
const jwt = require('jsonwebtoken');
const auth = require('../../middlewares/auth.middleware');

describe('Auth Middleware', () => {
  let req, res, next;
  beforeEach(() => {
    req = { headers:{} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jwt.verify.mockReset();
  });

  it('401 when header missing', () => {
    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('401 on invalid token', () => {
    req.headers.authorization = 'Bearer bad';
    jwt.verify.mockImplementation(() => { throw new Error(); });
    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('sets req.userId on valid token', () => {
    req.headers.authorization = 'Bearer good';
    jwt.verify.mockReturnValue({ sub:'u' });
    auth(req, res, next);
    expect(req.userId).toBe('u');
    expect(next).toHaveBeenCalled();
  });
});