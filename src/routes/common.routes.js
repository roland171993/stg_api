const express = require('express');
const {
  getSectors,
  getGenders,
  getContractTypes,
  getWorkModes
} = require('../controllers/common.controller');

const router = express.Router();

// Lookup endpoints (public)
router.get('/sectors', getSectors);
router.get('/genders', getGenders);
router.get('/contract-types', getContractTypes);
router.get('/work-modes', getWorkModes);

module.exports = router;