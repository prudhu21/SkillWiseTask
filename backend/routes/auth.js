const express = require('express');
const router = express.Router();
const { register, login, debugUsers } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// Dev-only: list demo users to help debugging (remove in production)
router.get('/debug-users', debugUsers);

module.exports = router;
