const express = require('express');
const { register, login, getCurrentUser } = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware'); // same path; now an object

const router = express.Router();

// Public
router.post('/register', register);
router.post('/login', login);

// Protected
router.get('/me', auth.required, getCurrentUser);

module.exports = router;
