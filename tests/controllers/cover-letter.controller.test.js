const {
  createCoverLetter,
  getAllCoverLetters,
  getCoverLetterById,
  updateCoverLetter,
  deleteCoverLetter
} = require('../../src/controllers/cover-letter.controller');

jest.mock('../../src/models', () => {
  class CoverLetter {
    constructor(data) {
      Object.assign(this, data);
      this._id = '1';
    }

    save() {
      return Promise.resolve(this);
    }
  }

  CoverLetter.find = jest.fn();
  CoverLetter.countDocuments = jest.fn();
  CoverLetter.findById = jest.fn();
  CoverLetter.findByIdAndUpdate = jest.fn();
  CoverLetter.findByIdAndDelete = jest.fn();

  return { CoverLetter };
});

const { CoverLetter: CL } = require('../../src/models');

describe('Cover Letter Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      end: jest.fn()
    };
    next = jest.fn();

    CL.find.mockReset();
    CL.countDocuments.mockReset();
    CL.findById.mockReset();
    CL.findByIdAndUpdate.mockReset();
    CL.findByIdAndDelete.mockReset();
  });

  describe('createCoverLetter', () => {
    it('creates & returns a cover letter', async () => {
      req.body = { title: 'C' };

      await createCoverLetter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        coverLetter: expect.objectContaining({
          _id: '1',
          title: 'C'
        })
      });
    });

    it('forwards errors', async () => {
      const err = new Error('fail');
      CL.prototype.save = jest.fn().mockRejectedValue(err);

      await createCoverLetter(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('getAllCoverLetters', () => {
    it('returns cover letters list', async () => {
      const arr = [{ _id: '1' }];
      req.query = { page: '1' };

      CL.find.mockReturnValueOnce({
        sort: () => ({
          skip: () => ({
            limit: () => Promise.resolve(arr)
          })
        })
      });
      CL.countDocuments.mockResolvedValueOnce(1);

      await getAllCoverLetters(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        coverLetters: arr,
        pagination: {
          total: 1,
          page: 1,
          totalPages: 1,
          limit: 15
        }
      });
    });

    it('forwards list errors', async () => {
      const err = new Error('fail');
      req.query = { page: '1' };

      CL.find.mockImplementation(() => {
        throw err;
      });

      await getAllCoverLetters(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
