const express = require('express');
const {
  createResume,
  getAllResumes,
  getResumeById,
  updateResume,
  deleteResume
} = require('../controllers/resume.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

// List & detail (public)
router.get('/', getAllResumes);
router.get('/:id', getResumeById);

// Create, update, delete (protected)
router.post('/', auth.required, createResume);
router.put('/:id', auth.required, updateResume);
router.delete('/:id', auth.required, deleteResume);

module.exports = router;