const { Resume } = require('../../models');
const {
  createResume, getAllResumes, getResumeById,
  updateResume, deleteResume
} = require('../../controllers/resume.controller');

jest.mock('../../models', () => ({ Resume: function(data) { this.data = data; } }));
const ResumeMock = require('../../models').Resume;
ResumeMock.find = jest.fn();
ResumeMock.findById = jest.fn();
ResumeMock.findByIdAndUpdate = jest.fn();
ResumeMock.findByIdAndDelete = jest.fn();
ResumeMock.prototype.save = jest.fn();

describe('Resume Controller', () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn(), end: jest.fn() };
    next = jest.fn();
    [ResumeMock.find, ResumeMock.findById, ResumeMock.findByIdAndUpdate, ResumeMock.findByIdAndDelete]
      .forEach(fn => fn.mockReset());
    ResumeMock.prototype.save.mockReset();
  });

  describe('createResume', () => {
    it('creates & returns a resume', async () => {
      req.body = { title: 'R' };
      const saved = { _id: '1', title: 'R' };
      ResumeMock.prototype.save.mockResolvedValue(saved);

      await createResume(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ resume: saved });
    });

    it('forwards create errors', async () => {
      const err = new Error('fail');
      ResumeMock.prototype.save.mockRejectedValue(err);

      await createResume(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('getAllResumes', () => {
    it('returns resumes list', async () => {
      const arr = [{}];
      const mockSort = jest.fn().mockResolvedValue(arr);
      ResumeMock.find.mockReturnValue({ sort: mockSort });

      await getAllResumes(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ resumes: arr });
    });

    it('forwards list errors', async () => {
      const err = new Error('fail');
      ResumeMock.find.mockImplementation(() => { throw err; });

      await getAllResumes(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('getResumeById', () => {
    it('returns a resume', async () => {
      const doc = { _id: '1' };
      req.params.id = '1';
      ResumeMock.findById.mockResolvedValue(doc);

      await getResumeById(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ resume: doc });
    });

    it('404 when missing', async () => {
      req.params.id = '1';
      ResumeMock.findById.mockResolvedValue(null);

      await getResumeById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Resume not found.' });
    });

    it('forwards findById errors', async () => {
      const err = new Error('fail');
      ResumeMock.findById.mockRejectedValue(err);

      await getResumeById(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('updateResume', () => {
    it('updates & returns resume', async () => {
      req.params.id = '1'; req.body = { title: 'New' };
      const updated = { _id: '1', title: 'New' };
      ResumeMock.findByIdAndUpdate.mockResolvedValue(updated);

      await updateResume(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ resume: updated });
    });

    it('404 when missing', async () => {
      req.params.id = '1';
      ResumeMock.findByIdAndUpdate.mockResolvedValue(null);

      await updateResume(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Resume not found.' });
    });

    it('forwards update errors', async () => {
      const err = new Error('fail');
      ResumeMock.findByIdAndUpdate.mockRejectedValue(err);

      await updateResume(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('deleteResume', () => {
    it('deletes a resume', async () => {
      req.params.id = '1';
      ResumeMock.findByIdAndDelete.mockResolvedValue({ _id: '1' });

      await deleteResume(req, res, next);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });

    it('404 when missing', async () => {
      req.params.id = '1';
      ResumeMock.findByIdAndDelete.mockResolvedValue(null);

      await deleteResume(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Resume not found.' });
    });

    it('forwards delete errors', async () => {
      const err = new Error('fail');
      ResumeMock.findByIdAndDelete.mockRejectedValue(err);

      await deleteResume(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});