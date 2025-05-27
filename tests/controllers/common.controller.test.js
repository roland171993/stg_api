const { Job } = require('../../models');
const ctrl = require('../../controllers/common.controller');

jest.mock('../../models', () => ({
  Job: { aggregate: jest.fn() }
}));

describe('Common Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    next = jest.fn();
    Job.aggregate.mockReset();
  });

  const testLookup = (field, endpoint) => {
    it(`get${endpoint} uses correct pipeline`, async () => {
      const mockResult = [{ id: '1', name: 'Test' }];
      Job.aggregate.mockResolvedValue(mockResult);

      await ctrl[`get${endpoint}`](req, res, next);
      
      expect(Job.aggregate).toHaveBeenCalledWith([
        { $group: { _id: `$${field}.id`, name: { $first: `$${field}.name` } } },
        { $project: { id: '$_id', name: 1, _id: 0 } },
        { $sort: { name: 1 } }
      ]);
      expect(res.json).toHaveBeenCalledWith({ [endpoint.toLowerCase()]: mockResult });
    });
  };

  testLookup('sector', 'Sectors');
  testLookup('gender', 'Genders');
  testLookup('contractType', 'ContractTypes');
  testLookup('workMode', 'WorkModes');

  it('forwards aggregation errors', async () => {
    const err = new Error('Aggregation failed');
    Job.aggregate.mockRejectedValue(err);
    await ctrl.getSectors(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});