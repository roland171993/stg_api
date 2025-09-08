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
    // Read page number from query string, default to 1
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 15;                     // items per page
    const skip = (page - 1) * limit;

    // Fetch the requested page of CoverLetters and the total count in parallel
    const [coverLetters, total] = await Promise.all([
      CoverLetter
        .find()
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      CoverLetter.countDocuments()
    ]);

    // Calculate total pages (a.k.a. lastPage)
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Derive neighbors
    const previousPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;

    // Send response
    res.json({
      coverLetters,
      pagination: {
        total,            // total number of jobs in collection
        limit,            // items per page
        currentPage: page,
        lastPage: totalPages,
        previousPage,     // null if you're on the first page
        nextPage          // null if you're on the last page
      }
    });
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