const express = require('express');
const router = express.Router();
const { register, login, debugUsers } = require('../controllers/authController');

router.post('/register', register);

router.post('/login', login);

router.get('/debug-users', debugUsers);

module.exports = router;
