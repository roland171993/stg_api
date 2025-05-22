const ctrl = require('../../controllers/common.controller');
const Sector = require('../../models/secteurActiviteModel');
const Gender = require('../../models/sexeModel');
const ContractType = require('../../models/typeTravailModel');
const WorkMode = require('../../models/modeTravailModel');

describe('Common Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    next = jest.fn();
    [Sector, Gender, ContractType, WorkMode].forEach(M => { M.find = jest.fn(); });
  });

  it('getSectors returns list', async () => {
    const arr = [{ name: 'IT' }];
    Sector.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(arr) });
    await ctrl.getSectors(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ sectors: arr });
  });

  it('getGenders returns list', async () => {
    const arr = [{ name: 'Male' }];
    Gender.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(arr) });
    await ctrl.getGenders(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ genders: arr });
  });

  it('getContractTypes returns list', async () => {
    const arr = [{ name: 'Full-time' }];
    ContractType.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(arr) });
    await ctrl.getContractTypes(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ contractTypes: arr });
  });

  it('getWorkModes returns list', async () => {
    const arr = [{ name: 'Remote' }];
    WorkMode.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(arr) });
    await ctrl.getWorkModes(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ workModes: arr });
  });

  it('forwards errors in getSectors', async () => {
    const err = new Error();
    Sector.find.mockImplementation(() => { throw err; });
    await ctrl.getSectors(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});