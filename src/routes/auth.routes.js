const express = require('express');
const { register, login, getCurrentUser } = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

// Public
router.post('/register', register);
router.post('/login', login);

// Protected
router.get('/me', auth, getCurrentUser);

module.exports = router;