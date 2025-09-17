const express = require('express');
const {
  createCoverLetter,
  getAllCoverLetters,
  getCoverLetterById,
  updateCoverLetter,
  deleteCoverLetter
} = require('../controllers/cover-letter.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

// List & detail (public)
router.get('/', getAllCoverLetters);
router.get('/:id', getCoverLetterById);

// Create, update, delete (protected)
router.post('/', auth.required, createCoverLetter);
router.put('/:id', auth.required, updateCoverLetter);
router.delete('/:id', auth.required, deleteCoverLetter);

module.exports = router;