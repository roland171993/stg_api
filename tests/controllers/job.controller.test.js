const { Job } = require('../../models');
const {
  createJob, getAllJobs, getJobById,
  updateJob, deleteJob
} = require('../../controllers/job.controller');

jest.mock('../../models', () => ({ Job: function(data) { this.data = data; } }));
const JobMock = require('../../models').Job;
JobMock.find = jest.fn();
JobMock.findById = jest.fn();
JobMock.findByIdAndUpdate = jest.fn();
JobMock.findByIdAndDelete = jest.fn();
JobMock.prototype.save = jest.fn();

describe('Job Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn(), end: jest.fn() };
    next = jest.fn();
    [ JobMock.find, JobMock.findById, JobMock.findByIdAndUpdate, JobMock.findByIdAndDelete ].forEach(fn => fn.mockReset());
    JobMock.prototype.save.mockReset();
  });

  describe('createJob', () => {
    it('creates & returns a job', async () => {
      req.body = { title: 'T' };
      JobMock.prototype.save.mockResolvedValue({ _id: '1', title: 'T' });

      await createJob(req, res, next);
      expect(JobMock.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ job: { _id: '1', title: 'T' } });
    });

    it('forwards save errors', async () => {
      const err = new Error('fail');
      JobMock.prototype.save.mockRejectedValue(err);

      await createJob(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('getAllJobs', () => {
    it('returns jobs list', async () => {
      const jobs = [{}, {}];
      const mockSort = jest.fn().mockResolvedValue(jobs);
      JobMock.find.mockReturnValue({ sort: mockSort });

      await getAllJobs(req, res, next);
      expect(mockSort).toHaveBeenCalledWith('-createdAt');
      expect(res.json).toHaveBeenCalledWith({ jobs });
    });

    it('forwards find errors', async () => {
      const err = new Error('fail');
      JobMock.find.mockImplementation(() => { throw err; });

      await getAllJobs(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('getJobById', () => {
    it('returns a job when found', async () => {
      const job = { _id: '1' };
      req.params.id = '1';
      JobMock.findById.mockResolvedValue(job);

      await getJobById(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ job });
    });

    it('404 when not found', async () => {
      req.params.id = '1';
      JobMock.findById.mockResolvedValue(null);

      await getJobById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Job not found.' });
    });

    it('forwards findById errors', async () => {
      const err = new Error('fail');
      JobMock.findById.mockRejectedValue(err);

      await getJobById(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('updateJob', () => {
    it('updates & returns a job', async () => {
      req.params.id = '1'; req.body = { title: 'New' };
      const updated = { _id: '1', title: 'New' };
      JobMock.findByIdAndUpdate.mockResolvedValue(updated);

      await updateJob(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ job: updated });
    });

    it('404 when update target missing', async () => {
      req.params.id = '1';
      JobMock.findByIdAndUpdate.mockResolvedValue(null);

      await updateJob(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Job not found.' });
    });

    it('forwards update errors', async () => {
      const err = new Error('fail');
      JobMock.findByIdAndUpdate.mockRejectedValue(err);

      await updateJob(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('deleteJob', () => {
    it('deletes a job', async () => {
      req.params.id = '1';
      JobMock.findByIdAndDelete.mockResolvedValue({ _id: '1' });

      await deleteJob(req, res, next);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });

    it('404 when delete target missing', async () => {
      req.params.id = '1';
      JobMock.findByIdAndDelete.mockResolvedValue(null);

      await deleteJob(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Job not found.' });
    });

    it('forwards delete errors', async () => {
      const err = new Error('fail');
      JobMock.findByIdAndDelete.mockRejectedValue(err);

      await deleteJob(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});