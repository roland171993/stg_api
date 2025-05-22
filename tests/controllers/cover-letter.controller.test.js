const { CoverLetter } = require('../../models');
const {
  createCoverLetter, getAllCoverLetters,
  getCoverLetterById, updateCoverLetter, deleteCoverLetter
} = require('../../controllers/cover-letter.controller');

jest.mock('../../models', () => ({ CoverLetter: function(data) { this.data = data; } }));
const CL = require('../../models').CoverLetter;
CL.find = jest.fn();
CL.findById = jest.fn();
CL.findByIdAndUpdate = jest.fn();
CL.findByIdAndDelete = jest.fn();
CL.prototype.save = jest.fn();

describe('Cover Letter Controller', () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn(), end: jest.fn() };
    next = jest.fn();
    [CL.find, CL.findById, CL.findByIdAndUpdate, CL.findByIdAndDelete].forEach(fn => fn.mockReset());
    CL.prototype.save.mockReset();
  });

  describe('createCoverLetter', () => {
    it('creates & returns a cover letter', async () => {
      req.body = { title: 'C' };
      CL.prototype.save.mockResolvedValue({ _id: '1', title: 'C' });

      await createCoverLetter(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ coverLetter: { _id: '1', title: 'C' } });
    });

    it('forwards errors', async () => {
      const err = new Error('fail');
      CL.prototype.save.mockRejectedValue(err);

      await createCoverLetter(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('getAllCoverLetters', () => {
    it('returns cover letters list', async () => {
      const arr = [{}];
      const mockSort = jest.fn().mockResolvedValue(arr);
      CL.find.mockReturnValue({ sort: mockSort });

      await getAllCoverLetters(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ coverLetters: arr });
    });

    it('forwards list errors', async () => {
      const err = new Error('fail');
      CL.find.mockImplementation(() => { throw err; });

      await getAllCoverLetters(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('getCoverLetterById', () => {
    it('returns one cover letter', async () => {
      const doc = { _id: '1' };
      req.params.id = '1';
      CL.findById.mockResolvedValue(doc);

      await getCoverLetterById(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ coverLetter: doc });
    });

    it('404 when missing', async () => {
      req.params.id = '1';
      CL.findById.mockResolvedValue(null);

      await getCoverLetterById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cover letter not found.' });
    });

    it('forwards find errors', async () => {
      const err = new Error('fail');
      CL.findById.mockRejectedValue(err);

      await getCoverLetterById(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('updateCoverLetter', () => {
    it('updates & returns cover letter', async () => {
      req.params.id = '1'; req.body = { title: 'New' };
      const updated = { _id: '1', title: 'New' };
      CL.findByIdAndUpdate.mockResolvedValue(updated);

      await updateCoverLetter(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ coverLetter: updated });
    });

    it('404 when missing', async () => {
      req.params.id = '1';
      CL.findByIdAndUpdate.mockResolvedValue(null);

      await updateCoverLetter(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cover letter not found.' });
    });

    it('forwards update errors', async () => {
      const err = new Error('fail');
      CL.findByIdAndUpdate.mockRejectedValue(err);

      await updateCoverLetter(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('deleteCoverLetter', () => {
    it('deletes a cover letter', async () => {
      req.params.id = '1';
      CL.findByIdAndDelete.mockResolvedValue({ _id: '1' });

      await deleteCoverLetter(req, res, next);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });

    it('404 when missing', async () => {
      req.params.id = '1';
      CL.findByIdAndDelete.mockResolvedValue(null);

      await deleteCoverLetter(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cover letter not found.' });
    });

    it('forwards delete errors', async () => {
      const err = new Error('fail');
      CL.findByIdAndDelete.mockRejectedValue(err);

      await deleteCoverLetter(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});