const express = require('express');
const { login, getCurrentUser } = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

// Public
router.post('/login', login);

// Protected
router.get('/me', auth, getCurrentUser);

module.exports = router;