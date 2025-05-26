const { Resume } = require('../models');

exports.createResume = async (req, res, next) => {
  try {
    const resume = new Resume(req.body);
    await resume.save();
    res.status(201).json({ resume });
  } catch (err) {
    next(err);
  }
};

exports.getAllResumes = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page, 10) || 1;
    const limit = 15;
    const skip  = (page - 1) * limit;

    const [resumes, total] = await Promise.all([
      Resume
        .find()
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Resume.countDocuments()
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      resumes,
      pagination: {
        total,
        page,
        totalPages,
        limit
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found.' });
    }
    res.json({ resume });
  } catch (err) {
    next(err);
  }
};

exports.updateResume = async (req, res, next) => {
  try {
    const resume = await Resume.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found.' });
    }
    res.json({ resume });
  } catch (err) {
    next(err);
  }
};

exports.deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findByIdAndDelete(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found.' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};