const { CoverLetter } = require('../models');

exports.createCoverLetter = async (req, res, next) => {
  try {
    const coverLetter = new CoverLetter(req.body);
    await coverLetter.save();
    res.status(201).json({ coverLetter });
  } catch (err) {
    next(err);
  }
};

exports.getAllCoverLetters = async (req, res, next) => {
  try {
    const coverLetters = await CoverLetter.find().sort('-createdAt');
    res.json({ coverLetters });
  } catch (err) {
    next(err);
  }
};

exports.getCoverLetterById = async (req, res, next) => {
  try {
    const coverLetter = await CoverLetter.findById(req.params.id);
    if (!coverLetter) {
      return res.status(404).json({ message: 'Cover letter not found.' });
    }
    res.json({ coverLetter });
  } catch (err) {
    next(err);
  }
};

exports.updateCoverLetter = async (req, res, next) => {
  try {
    const coverLetter = await CoverLetter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!coverLetter) {
      return res.status(404).json({ message: 'Cover letter not found.' });
    }
    res.json({ coverLetter });
  } catch (err) {
    next(err);
  }
};

exports.deleteCoverLetter = async (req, res, next) => {
  try {
    const coverLetter = await CoverLetter.findByIdAndDelete(req.params.id);
    if (!coverLetter) {
      return res.status(404).json({ message: 'Cover letter not found.' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};