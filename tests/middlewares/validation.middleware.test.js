jest.mock('express-validator', () => ({ validationResult: jest.fn() }));
const { validationResult } = require('express-validator');
const validate = require('../../src/middlewares/validation.middleware');

describe('Validation Middleware', () => {
  let req, res, next;
  beforeEach(() => {
    req = {};
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    validationResult.mockReset();
  });

  it('400 on validation errors', () => {
    validationResult.mockReturnValue({ isEmpty:() => false, array:() => [{ msg:'e' }] });
    validate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors:[{ msg:'e' }] });
  });

  it('calls next when no errors', () => {
    validationResult.mockReturnValue({ isEmpty:() => true });
    validate(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});