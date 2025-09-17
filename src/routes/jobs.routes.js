const express = require('express');
const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob
} = require('../controllers/job.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

// List & detail (public)
router.get('/', getAllJobs);
router.get('/:id', getJobById);

// Create, update, delete (protected)
router.post('/', auth.required, createJob);
router.put('/:id', auth.required, updateJob);
router.delete('/:id', auth.required, deleteJob);

module.exports = router;
