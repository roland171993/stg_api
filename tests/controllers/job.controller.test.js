const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob
} = require('../../src/controllers/job.controller');

jest.mock('../../src/models', () => {
  class Job {
    constructor(data) {
      Object.assign(this, data);
      this._id = '1';
    }

    save() {
      return Promise.resolve(this);
    }
  }

  Job.find = jest.fn();
  Job.countDocuments = jest.fn();
  Job.findById = jest.fn();
  Job.findByIdAndUpdate = jest.fn();
  Job.findByIdAndDelete = jest.fn();

  return { Job };
});

const { Job: JobMock } = require('../../src/models');

describe('Job Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      end: jest.fn()
    };
    next = jest.fn();

    JobMock.find.mockReset();
    JobMock.countDocuments.mockReset();
    JobMock.findById.mockReset();
    JobMock.findByIdAndUpdate.mockReset();
    JobMock.findByIdAndDelete.mockReset();
  });

  describe('createJob', () => {
    it('creates & returns a job', async () => {
      req.body = { title: 'Developer' };
      await createJob(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        job: expect.objectContaining({
          _id: '1',
          title: 'Developer'
        })
      });
    });
  });

  describe('getAllJobs', () => {
    it('returns paginated jobs', async () => {
      const jobs = [{ _id: '1', title: 'Dev' }];
      JobMock.find.mockReturnValueOnce({
        sort: () => ({
          skip: () => ({
            limit: () => Promise.resolve(jobs)
          })
        })
      });
      JobMock.countDocuments.mockResolvedValueOnce(1);
      req.query.page = '1';

      await getAllJobs(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        jobs,
        pagination: {
          total: 1,
          page: 1,
          totalPages: 1,
          limit: 15
        }
      });
    });
  });

  describe('getJobById', () => {
    it('returns job if found', async () => {
      const job = { _id: '123', title: 'Test Job' };
      req.params.id = '123';
      JobMock.findById.mockResolvedValueOnce(job);

      await getJobById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ job });
    });

    it('returns 404 if job not found', async () => {
      req.params.id = '123';
      JobMock.findById.mockResolvedValueOnce(null);

      await getJobById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Job not found.' });
    });
  });

  describe('updateJob', () => {
    it('returns updated job if found', async () => {
      const updatedJob = { _id: '123', title: 'Updated' };
      req.params.id = '123';
      req.body = { title: 'Updated' };

      JobMock.findByIdAndUpdate.mockResolvedValueOnce(updatedJob);

      await updateJob(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ job: updatedJob });
    });

    it('returns 404 if job not found for update', async () => {
      req.params.id = '123';
      JobMock.findByIdAndUpdate.mockResolvedValueOnce(null);

      await updateJob(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Job not found.' });
    });
  });

  describe('deleteJob', () => {
    it('deletes job if found', async () => {
      const job = { _id: '123' };
      req.params.id = '123';

      JobMock.findByIdAndDelete.mockResolvedValueOnce(job);

      await deleteJob(req, res, next);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });

    it('returns 404 if job not found for deletion', async () => {
      req.params.id = '123';
      JobMock.findByIdAndDelete.mockResolvedValueOnce(null);

      await deleteJob(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Job not found.' });
    });
  });
});
