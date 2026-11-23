const express = require('express');
const bcrypt = require('bcryptjs');
const { db, saveDataSnapshot } = require('../db');
const { requireAuth, signToken } = require('../middleware/auth');

const router = express.Router();

// Helper to sanitize user object for response
function sanitizeUser(userRow) {
  const { password_hash, ...safeUser } = userRow;
  return safeUser;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, bio, avatar_url } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    // Username format validation: 3-20 chars alphanumeric + underscore
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmedUsername)) {
      return res.status(400).json({
        error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores.'
      });
    }

    // Basic email validation
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if username or email already exists
    const existing = db.prepare('SELECT id, username, email FROM users WHERE username = ? OR email = ?').get(trimmedUsername, trimmedEmail);
    if (existing) {
      if (existing.username.toLowerCase() === trimmedUsername) {
        return res.status(409).json({ error: 'Username is already taken. If this is your account, please log in.', code: 'USER_EXISTS' });
      }
      return res.status(409).json({ error: 'Email is already registered. Please log in with your password.', code: 'USER_EXISTS' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const defaultAvatar = avatar_url && avatar_url.trim() 
      ? avatar_url.trim() 
      : `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(trimmedUsername)}`;

    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, bio, avatar_url)
      VALUES (?, ?, ?, ?, ?)
    `).run(trimmedUsername, trimmedEmail, passwordHash, (bio || '').trim(), defaultAvatar);

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = signToken(newUser);

    // Save snapshot so newly registered user persists across server restarts
    saveDataSnapshot();

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be username or email

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email and password are required.' });
    }

    const trimmedIdentifier = identifier.trim().toLowerCase();

    const user = db.prepare(`
      SELECT * FROM users 
      WHERE LOWER(username) = ? OR LOWER(email) = ?
    `).get(trimmedIdentifier, trimmedIdentifier);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Password does not match.' });
    }

    const token = signToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    const fullUser = db.prepare(`
      SELECT u.id, u.username, u.email, u.bio, u.avatar_url, u.created_at,
        (SELECT COUNT(*) FROM followers WHERE following_id = u.id) as follower_count,
        (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count
      FROM users u
      WHERE u.id = ?
    `).get(user.id);

    return res.json({
      message: 'Logged in successfully!',
      token,
      user: fullUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT u.id, u.username, u.email, u.bio, u.avatar_url, u.created_at,
        (SELECT COUNT(*) FROM followers WHERE following_id = u.id) as follower_count,
        (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count
      FROM users u
      WHERE u.id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('Fetch me error:', err);
    return res.status(500).json({ error: 'Failed to fetch current user profile.' });
  }
});

module.exports = router;
