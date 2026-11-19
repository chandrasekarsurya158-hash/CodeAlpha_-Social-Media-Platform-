const express = require('express');
const { db } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/profile/:username - Get user profile details
router.get('/profile/:username', optionalAuth, (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    const user = db.prepare(`
      SELECT id, username, email, bio, avatar_url, created_at,
        (SELECT COUNT(*) FROM followers WHERE following_id = users.id) as follower_count,
        (SELECT COUNT(*) FROM followers WHERE follower_id = users.id) as following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = users.id) as post_count
      FROM users
      WHERE LOWER(username) = LOWER(?)
    `).get(username);

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    let isFollowing = false;
    let isSelf = false;

    if (currentUserId) {
      isSelf = (currentUserId === user.id);
      if (!isSelf) {
        const followCheck = db.prepare(`
          SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ?
        `).get(currentUserId, user.id);
        isFollowing = !!followCheck;
      }
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        bio: user.bio,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        follower_count: user.follower_count,
        following_count: user.following_count,
        post_count: user.post_count,
        is_following: isFollowing,
        is_self: isSelf
      }
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
});

// PUT /api/users/profile - Update current user bio & avatar
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { bio, avatar_url } = req.body;
    const currentUserId = req.user.id;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(currentUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updatedBio = bio !== undefined ? bio.trim() : user.bio;
    const updatedAvatar = avatar_url !== undefined && avatar_url.trim() !== ''
      ? avatar_url.trim() 
      : user.avatar_url;

    db.prepare(`
      UPDATE users
      SET bio = ?, avatar_url = ?
      WHERE id = ?
    `).run(updatedBio, updatedAvatar, currentUserId);

    const updatedUser = db.prepare(`
      SELECT id, username, email, bio, avatar_url, created_at,
        (SELECT COUNT(*) FROM followers WHERE following_id = users.id) as follower_count,
        (SELECT COUNT(*) FROM followers WHERE follower_id = users.id) as following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = users.id) as post_count
      FROM users WHERE id = ?
    `).get(currentUserId);

    return res.json({
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// POST /api/users/:id/follow - Toggle follow / unfollow
router.post('/:id/follow', requireAuth, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const currentUserId = req.user.id;

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user does not exist.' });
    }

    // Check if already following
    const existing = db.prepare(`
      SELECT id FROM followers WHERE follower_id = ? AND following_id = ?
    `).get(currentUserId, targetUserId);

    let isFollowing = false;
    if (existing) {
      // Unfollow
      db.prepare('DELETE FROM followers WHERE id = ?').run(existing.id);
      isFollowing = false;
    } else {
      // Follow
      db.prepare('INSERT INTO followers (follower_id, following_id) VALUES (?, ?)').run(currentUserId, targetUserId);
      isFollowing = true;
    }

    // Get updated follower count for target user
    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM followers WHERE following_id = ?) as follower_count,
        (SELECT COUNT(*) FROM followers WHERE follower_id = ?) as following_count
    `).get(targetUserId, currentUserId);

    return res.json({
      message: isFollowing ? `You are now following @${targetUser.username}` : `Unfollowed @${targetUser.username}`,
      is_following: isFollowing,
      target_follower_count: stats.follower_count,
      current_user_following_count: stats.following_count
    });
  } catch (err) {
    console.error('Follow toggle error:', err);
    return res.status(500).json({ error: 'Failed to update follow status.' });
  }
});

// GET /api/users/suggested - List of recommended users to follow
router.get('/suggested/list', optionalAuth, (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : 0;
    const suggested = db.prepare(`
      SELECT u.id, u.username, u.bio, u.avatar_url,
        (SELECT COUNT(*) FROM followers WHERE following_id = u.id) as follower_count,
        CASE WHEN EXISTS (
          SELECT 1 FROM followers WHERE follower_id = ? AND following_id = u.id
        ) THEN 1 ELSE 0 END as is_following
      FROM users u
      WHERE u.id != ?
      ORDER BY follower_count DESC, u.created_at DESC
      LIMIT 5
    `).all(currentUserId, currentUserId);

    return res.json({ users: suggested });
  } catch (err) {
    console.error('Suggested users error:', err);
    return res.status(500).json({ error: 'Failed to load suggested users.' });
  }
});

module.exports = router;
