const {
  createResume,
  getAllResumes,
  getResumeById,
  updateResume,
  deleteResume
} = require('../../src/controllers/resume.controller');

jest.mock('../../src/models', () => {
  class Resume {
    constructor(data) {
      Object.assign(this, data);
      this._id = '1';
    }

    save() {
      return Promise.resolve(this);
    }
  }

  Resume.find = jest.fn();
  Resume.countDocuments = jest.fn();
  Resume.findById = jest.fn();
  Resume.findByIdAndUpdate = jest.fn();
  Resume.findByIdAndDelete = jest.fn();

  return { Resume };
});

const { Resume: ResumeMock } = require('../../src/models');

describe('Resume Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      end: jest.fn()
    };
    next = jest.fn();

    ResumeMock.find.mockReset();
    ResumeMock.countDocuments.mockReset();
    ResumeMock.findById.mockReset();
    ResumeMock.findByIdAndUpdate.mockReset();
    ResumeMock.findByIdAndDelete.mockReset();
  });

  describe('createResume', () => {
    it('creates & returns a resume', async () => {
      req.body = { name: 'John' };
      await createResume(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        resume: expect.objectContaining({
          _id: '1',
          name: 'John'
        })
      });
    });
  });

  describe('getAllResumes', () => {
    it('returns paginated resumes with metadata', async () => {
      const mockResumes = [{ _id: '1', name: 'John' }];
      ResumeMock.find.mockReturnValueOnce({
        sort: () => ({
          skip: () => ({
            limit: () => Promise.resolve(mockResumes)
          })
        })
      });
      ResumeMock.countDocuments.mockResolvedValue(1);
      req.query.page = '1';

      await getAllResumes(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        resumes: mockResumes,
        pagination: {
          total: 1,
          page: 1,
          totalPages: 1,
          limit: 15
        }
      });
    });
  });

  describe('getResumeById', () => {
    it('returns 404 if resume not found', async () => {
      ResumeMock.findById.mockResolvedValue(null);
      req.params.id = '123';

      await getResumeById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Resume not found.' });
    });
  });

  describe('updateResume', () => {
    it('returns 404 if resume to update is not found', async () => {
      ResumeMock.findByIdAndUpdate.mockResolvedValue(null);
      req.params.id = '123';
      req.body = { name: 'Updated' };

      await updateResume(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Resume not found.' });
    });
  });
});
