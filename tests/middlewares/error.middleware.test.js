jest.mock('../../config/logger', () => ({ error: jest.fn() }));
const logger = require('../../config/logger');
const handleError = require('../../middlewares/error.middleware');

describe('Error Middleware', () => {
  let err, req, res, next;
  beforeEach(() => {
    req = {};
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    logger.error.mockReset();
  });

  it('500 on generic error', () => {
    err = new Error('oops');
    handleError(err, req, res, next);
    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message:'Internal Server Error' });
  });

  it('uses err.status/message when present', () => {
    err = new Error('bad'); err.status = 400;
    handleError(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message:'bad' });
  });
});