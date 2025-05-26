const { Job } = require('../models');

exports.createJob = async (req, res, next) => {
  try {
    const job = new Job(req.body);
    await job.save();
    res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
};

exports.getAllJobs = async (req, res, next) => {
  try {
    // Read page number from query string, default to 1
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 15;                     // items per page
    const skip = (page - 1) * limit;

    // Fetch the requested page of jobs and the total count in parallel
    const [jobs, total] = await Promise.all([
      Job
        .find()
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Job.countDocuments()
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Send response
    res.json({
      jobs,
      pagination: {
        total,         // total number of jobs in collection
        page,          // current page number
        totalPages,    // total number of pages
        limit          // items per page
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    res.json({ job });
  } catch (err) {
    next(err);
  }
};

exports.updateJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    res.json({ job });
  } catch (err) {
    next(err);
  }
};

exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};