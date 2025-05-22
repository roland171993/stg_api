const express = require('express');
const authRoutes = require('./auth.routes');
const jobsRoutes = require('./jobs.routes');
const resumesRoutes = require('./resumes.routes');
const coverLettersRoutes = require('./cover-letters.routes');
const commonRoutes = require('./common.routes');

const router = express.Router();

// Mount feature routers under /api in app.js
router.use('/auth', authRoutes);
router.use('/jobs', jobsRoutes);
router.use('/resumes', resumesRoutes);
router.use('/cover-letters', coverLettersRoutes);

// Common lookups at root: /sectors, /genders, etc.
router.use('/', commonRoutes);

module.exports = router;