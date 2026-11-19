const express = require('express');
const { db } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Helper to detect media type based on URL or parameter
function detectMediaType(url, requestedType) {
  if (!url || !url.trim()) return 'none';
  if (requestedType && ['image', 'video', 'audio'].includes(requestedType)) {
    return requestedType;
  }
  const cleanUrl = url.trim().toLowerCase();
  if (
    cleanUrl.includes('youtube.com/') ||
    cleanUrl.includes('youtu.be/') ||
    cleanUrl.includes('vimeo.com/') ||
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.ogg') ||
    cleanUrl.endsWith('.mov') ||
    cleanUrl.endsWith('.m4v')
  ) {
    return 'video';
  }
  if (
    cleanUrl.endsWith('.mp3') ||
    cleanUrl.endsWith('.wav') ||
    cleanUrl.endsWith('.aac') ||
    cleanUrl.endsWith('.flac')
  ) {
    return 'audio';
  }
  return 'image';
}

// Helper to assemble post query with author info and counts
function queryPosts({ feed = 'all', authorUsername = null, currentUserId = null, isReel = null, limit = 50, offset = 0 }) {
  let whereClauses = [];
  let params = [];

  if (feed === 'reels' || isReel === 1 || isReel === true) {
    whereClauses.push('p.is_reel = 1');
  } else if (authorUsername) {
    whereClauses.push('LOWER(u.username) = LOWER(?)');
    params.push(authorUsername);
  } else if (feed === 'following' && currentUserId) {
    // Show posts by users the current user follows + own posts
    whereClauses.push(`(
      p.user_id = ? OR p.user_id IN (
        SELECT following_id FROM followers WHERE follower_id = ?
      )
    )`);
    params.push(currentUserId, currentUserId);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT 
      p.id, p.content, p.image_url, p.media_type, p.is_reel, p.audio_track, p.audio_url, p.created_at,
      u.id as author_id, u.username as author_username, u.avatar_url as author_avatar,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
      CASE WHEN ? IS NOT NULL AND EXISTS (
        SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?
      ) THEN 1 ELSE 0 END as has_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ${whereSql}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [currentUserId, currentUserId, ...params, limit, offset];
  const posts = db.prepare(sql).all(...queryParams);

  return posts.map(p => ({
    id: p.id,
    content: p.content,
    image_url: p.image_url,
    media_url: p.image_url,
    media_type: p.media_type || detectMediaType(p.image_url),
    is_reel: Boolean(p.is_reel),
    audio_track: p.audio_track || 'Original Audio',
    audio_url: p.audio_url || null,
    created_at: p.created_at,
    like_count: p.like_count,
    comment_count: p.comment_count,
    has_liked: Boolean(p.has_liked),
    author: {
      id: p.author_id,
      username: p.author_username,
      avatar_url: p.author_avatar
    }
  }));
}

// GET /api/posts - Main feed / following feed / user posts
router.get('/', optionalAuth, (req, res) => {
  try {
    const { feed = 'all', author, limit = 50, offset = 0 } = req.query;
    const currentUserId = req.user ? req.user.id : null;

    if (feed === 'following' && !currentUserId) {
      return res.status(401).json({ error: 'Please log in to view posts from users you follow.' });
    }

    const posts = queryPosts({
      feed,
      authorUsername: author,
      currentUserId,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0
    });

    return res.json({ posts });
  } catch (err) {
    console.error('Fetch posts error:', err);
    return res.status(500).json({ error: 'Failed to fetch posts.' });
  }
});

// POST /api/posts - Create post
router.post('/', requireAuth, (req, res) => {
  try {
    const { content, image_url, media_url, media_type, is_reel, audio_track, audio_url } = req.body;

    const chosenUrl = (media_url || image_url || '').trim();
    const finalIsReel = (is_reel === true || is_reel === 1 || is_reel === '1') ? 1 : 0;
    const finalAudioTrack = (audio_track || '').trim() || (finalIsReel ? 'Original Audio' : '');
    const finalAudioUrl = (audio_url || '').trim() || null;

    if (finalIsReel && !chosenUrl) {
      return res.status(400).json({ error: 'Reels require a video file or video URL.' });
    }

    if (!content && !chosenUrl) {
      return res.status(400).json({ error: 'Post must contain either text or media.' });
    }

    if (content && content.trim().length > 1000) {
      return res.status(400).json({ error: 'Post content exceeds 1,000 characters.' });
    }

    const trimmedContent = (content || '').trim();
    const cleanMediaUrl = chosenUrl ? chosenUrl : null;
    const finalMediaType = finalIsReel ? 'video' : detectMediaType(cleanMediaUrl, media_type);

    const result = db.prepare(`
      INSERT INTO posts (user_id, content, image_url, media_type, is_reel, audio_track, audio_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, trimmedContent, cleanMediaUrl, finalMediaType, finalIsReel, finalAudioTrack, finalAudioUrl);

    const newPostId = result.lastInsertRowid;

    // Fetch the newly created post with author details
    const newPost = queryPosts({ currentUserId: req.user.id, limit: 10 }).find(p => p.id === newPostId) || {
      id: newPostId,
      content: trimmedContent,
      image_url: cleanMediaUrl,
      media_url: cleanMediaUrl,
      media_type: finalMediaType,
      is_reel: Boolean(finalIsReel),
      audio_track: finalAudioTrack,
      audio_url: finalAudioUrl,
      created_at: new Date().toISOString(),
      like_count: 0,
      comment_count: 0,
      has_liked: false,
      author: {
        id: req.user.id,
        username: req.user.username,
        avatar_url: ''
      }
    };

    return res.status(201).json({
      message: finalIsReel ? 'Reel published successfully!' : 'Post created successfully!',
      post: newPost
    });
  } catch (err) {
    console.error('Create post error:', err);
    return res.status(500).json({ error: 'Failed to create post.' });
  }
});

// DELETE /api/posts/:id - Delete post
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID.' });
    }

    const post = db.prepare('SELECT id, user_id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You are only allowed to delete your own posts.' });
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);

    return res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    console.error('Delete post error:', err);
    return res.status(500).json({ error: 'Failed to delete post.' });
  }
});

// POST /api/posts/:id/like - Toggle like/unlike
router.post('/:id/like', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID.' });
    }

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const existingLike = db.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?').get(userId, postId);

    let hasLiked = false;
    if (existingLike) {
      db.prepare('DELETE FROM likes WHERE id = ?').run(existingLike.id);
      hasLiked = false;
    } else {
      db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(userId, postId);
      hasLiked = true;
    }

    const likeCountResult = db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').get(postId);

    return res.json({
      has_liked: hasLiked,
      like_count: likeCountResult.count,
      message: hasLiked ? 'Post liked' : 'Post unliked'
    });
  } catch (err) {
    console.error('Like toggle error:', err);
    return res.status(500).json({ error: 'Failed to update like status.' });
  }
});

// GET /api/posts/:id/comments - Get all comments for a post
router.get('/:id/comments', (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID.' });
    }

    const comments = db.prepare(`
      SELECT 
        c.id, c.content, c.created_at,
        u.id as author_id, u.username as author_username, u.avatar_url as author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(postId);

    const formattedComments = comments.map(c => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      author: {
        id: c.author_id,
        username: c.author_username,
        avatar_url: c.author_avatar
      }
    }));

    return res.json({ comments: formattedComments });
  } catch (err) {
    console.error('Get comments error:', err);
    return res.status(500).json({ error: 'Failed to fetch comments.' });
  }
});

// POST /api/posts/:id/comments - Add comment
router.post('/:id/comments', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const { content } = req.body;

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID.' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty.' });
    }

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const insertResult = db.prepare(`
      INSERT INTO comments (post_id, user_id, content)
      VALUES (?, ?, ?)
    `).run(postId, req.user.id, content.trim());

    const user = db.prepare('SELECT id, username, avatar_url FROM users WHERE id = ?').get(req.user.id);
    const commentCount = db.prepare('SELECT COUNT(*) as count FROM comments WHERE post_id = ?').get(postId).count;

    const newComment = {
      id: insertResult.lastInsertRowid,
      content: content.trim(),
      created_at: new Date().toISOString(),
      author: {
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url
      }
    };

    return res.status(201).json({
      message: 'Comment added successfully!',
      comment: newComment,
      comment_count: commentCount
    });
  } catch (err) {
    console.error('Add comment error:', err);
    return res.status(500).json({ error: 'Failed to add comment.' });
  }
});

module.exports = router;
