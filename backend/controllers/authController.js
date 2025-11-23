// controllers/authController.js
const bcrypt = require('bcryptjs'); // or bcrypt
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // adapt to your ORM/model path

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'username and password required' });

    const existing = await User.findOne({ username }).lean();
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const created = await User.create({ username, password });
    const safeUser = { id: created._id, username: created.username, role: created.role };

    if (!process.env.JWT_SECRET) {
      console.error('[Server] JWT_SECRET is not set!');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    const token = jwt.sign({ id: created._id, username: created.username, role: created.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ token, user: safeUser });
  } catch (err) {
    console.error('[Server] Register handler error:', err?.stack || err);
    if (err?.message === 'UserExists') return res.status(409).json({ message: 'User already exists' });
    return res.status(500).json({ message: 'Server error during register', details: err?.message });
  }
};

exports.login = async (req, res) => {
  console.log('[Server] login body:', req.body);
  try {
    // Basic validation
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }
    // Find user (accept username or email)
    const identifier = username;
    let user = await User.findOne({ username: identifier }).lean();
    console.log('[Server] lookup by username result:', !!user, user && { username: user.username, email: user.email });
    if (!user && identifier && identifier.includes('@')) {
      user = await User.findOne({ email: identifier }).lean();
      console.log('[Server] lookup by email result:', !!user, user && { username: user.username, email: user.email });
    }
    // fallback: try other common fields
    if (!user) {
      user = await User.findOne({ user: identifier }).lean();
    }
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const ok = await bcrypt.compare(password, user.passwordHash || user.password);
    console.log('[Server] password compare result for', user.username, ok);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Ensure JWT secret exists
    if (!process.env.JWT_SECRET) {
      console.error('[Server] JWT_SECRET is not set!');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const payload = { id: user._id, username: user.username, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Send minimal user object
    const safeUser = { id: user._id, username: user.username, role: user.role };
    return res.json({ token, user: safeUser });
  } catch (err) {
    // Log full stack on server console to find root cause
    console.error('[Server] Login handler error:', err?.stack || err);
    // If you want to expose stack in non-production only:
    const response = { message: 'Server error during login' };
    if (process.env.NODE_ENV !== 'production') {
      response.details = err?.message;
    }
    return res.status(500).json(response);
  }
};

// Dev-only: return demo users for debugging
exports.debugUsers = (req, res) => {
  try {
    const list = User.listAll ? User.listAll() : [];
    res.json({ users: list });
  } catch (err) {
    console.error('[Server] debugUsers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
