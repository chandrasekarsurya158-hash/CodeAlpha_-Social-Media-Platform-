const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const snapshotPath = path.join(__dirname, 'data_snapshot.json');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function saveDataSnapshot() {
  try {
    const users = db.prepare('SELECT id, username, email, password_hash, bio, avatar_url, created_at FROM users').all();
    const posts = db.prepare('SELECT id, user_id, content, image_url, media_type, is_reel, audio_track, audio_url, created_at FROM posts').all();
    const comments = db.prepare('SELECT id, post_id, user_id, content, created_at FROM comments').all();
    const likes = db.prepare('SELECT id, user_id, post_id, created_at FROM likes').all();
    const followers = db.prepare('SELECT id, follower_id, following_id, created_at FROM followers').all();

    const snapshot = {
      timestamp: new Date().toISOString(),
      users,
      posts,
      comments,
      likes,
      followers
    };

    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save data snapshot:', err.message);
  }
}

function restoreFromSnapshot() {
  if (!fs.existsSync(snapshotPath)) return;
  try {
    const raw = fs.readFileSync(snapshotPath, 'utf8');
    const snapshot = JSON.parse(raw);
    if (!snapshot || !Array.isArray(snapshot.users)) return;

    const existingUsers = new Set(db.prepare('SELECT username FROM users').all().map(u => u.username.toLowerCase()));
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (id, username, email, password_hash, bio, avatar_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const updateUser = db.prepare(`
      UPDATE users SET bio = COALESCE(NULLIF(?, ''), bio), avatar_url = COALESCE(NULLIF(?, ''), avatar_url)
      WHERE LOWER(username) = LOWER(?)
    `);

    snapshot.users.forEach(u => {
      if (!existingUsers.has(u.username.toLowerCase())) {
        insertUser.run(u.id, u.username, u.email, u.password_hash, u.bio || '', u.avatar_url || '', u.created_at || new Date().toISOString());
      } else if (u.avatar_url || u.bio) {
        updateUser.run(u.bio || '', u.avatar_url || '', u.username);
      }
    });

    const existingPosts = new Set(db.prepare('SELECT id FROM posts').all().map(p => p.id));
    const insertPost = db.prepare(`
      INSERT OR IGNORE INTO posts (id, user_id, content, image_url, media_type, is_reel, audio_track, audio_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    if (Array.isArray(snapshot.posts)) {
      snapshot.posts.forEach(p => {
        if (!existingPosts.has(p.id)) {
          insertPost.run(p.id, p.user_id, p.content, p.image_url, p.media_type || 'image', p.is_reel ? 1 : 0, p.audio_track || 'Original Audio', p.audio_url || null, p.created_at || new Date().toISOString());
        }
      });
    }

    if (Array.isArray(snapshot.comments)) {
      const insertComment = db.prepare(`
        INSERT OR IGNORE INTO comments (id, post_id, user_id, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      snapshot.comments.forEach(c => {
        insertComment.run(c.id, c.post_id, c.user_id, c.content, c.created_at || new Date().toISOString());
      });
    }

    if (Array.isArray(snapshot.likes)) {
      const insertLike = db.prepare(`
        INSERT OR IGNORE INTO likes (id, user_id, post_id, created_at)
        VALUES (?, ?, ?, ?)
      `);
      snapshot.likes.forEach(l => {
        insertLike.run(l.id, l.user_id, l.post_id, l.created_at || new Date().toISOString());
      });
    }

    if (Array.isArray(snapshot.followers)) {
      const insertFollow = db.prepare(`
        INSERT OR IGNORE INTO followers (id, follower_id, following_id, created_at)
        VALUES (?, ?, ?, ?)
      `);
      snapshot.followers.forEach(f => {
        insertFollow.run(f.id, f.follower_id, f.following_id, f.created_at || new Date().toISOString());
      });
    }

    console.log('Restored data snapshot successfully.');
  } catch (err) {
    console.error('Failed to restore data snapshot:', err.message);
  }
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      bio TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      media_type TEXT DEFAULT 'image',
      is_reel INTEGER DEFAULT 0,
      audio_track TEXT DEFAULT 'Original Audio',
      audio_url TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS followers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id),
      CHECK (follower_id != following_id),
      FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts (user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id);
    CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes (post_id);
    CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers (follower_id);
    CREATE INDEX IF NOT EXISTS idx_followers_following ON followers (following_id);
  `);

  // Ensure media_type, is_reel, audio_track columns exist for existing tables
  try {
    const postColumns = db.prepare("PRAGMA table_info(posts)").all();
    const colNames = postColumns.map(col => col.name);
    if (!colNames.includes('media_type')) {
      db.exec("ALTER TABLE posts ADD COLUMN media_type TEXT DEFAULT 'image'");
    }
    if (!colNames.includes('is_reel')) {
      db.exec("ALTER TABLE posts ADD COLUMN is_reel INTEGER DEFAULT 0");
    }
    if (!colNames.includes('audio_track')) {
      db.exec("ALTER TABLE posts ADD COLUMN audio_track TEXT DEFAULT 'Original Audio'");
    }
    if (!colNames.includes('audio_url')) {
      db.exec("ALTER TABLE posts ADD COLUMN audio_url TEXT DEFAULT NULL");
    }
    // Update existing sample reels with working audio if needed
    db.exec(`
      UPDATE posts SET audio_url = '/audio/acoustic.mp3', audio_track = 'Calm Coastal Breeze · Sunshine Vibes' WHERE is_reel = 1 AND image_url LIKE '%nature.mp4' AND (audio_url IS NULL OR audio_url = '');
      UPDATE posts SET audio_url = '/audio/chillhop.mp3', audio_track = 'Lo-Fi Coding Beats · Study Chill' WHERE is_reel = 1 AND image_url LIKE '%flower.mp4' AND (audio_url IS NULL OR audio_url = '');
      UPDATE posts SET audio_url = '/audio/synthwave.mp3', audio_track = 'Electronic Energy · SynthWave Beat' WHERE is_reel = 1 AND image_url LIKE '%mov_bbb.mp4' AND (audio_url IS NULL OR audio_url = '');
    `);
  } catch (err) {
    console.error('Migration error for columns:', err);
  }

  // Ensure sample reels are seeded
  try {
    const reelCount = db.prepare('SELECT COUNT(*) as c FROM posts WHERE is_reel = 1').get().c;
    if (reelCount === 0) {
      const alex = db.prepare('SELECT id FROM users WHERE username = ?').get('alex_tech');
      const sarah = db.prepare('SELECT id FROM users WHERE username = ?').get('sarah_design');
      const marcus = db.prepare('SELECT id FROM users WHERE username = ?').get('marcus_lens');

      const insertReel = db.prepare(`
        INSERT INTO posts (user_id, content, image_url, media_type, is_reel, audio_track, audio_url, created_at)
        VALUES (?, ?, ?, 'video', 1, ?, ?, datetime('now', ?))
      `);

      if (marcus) {
        insertReel.run(
          marcus.id,
          'Sunset over the crashing ocean tides 🌊 Always chase golden hour! #reels #ocean #nature #travel',
          '/samples/nature.mp4',
          'Calm Coastal Breeze · Sunshine Vibes',
          '/audio/acoustic.mp3',
          '-2 hours'
        );
      }

      if (sarah) {
        insertReel.run(
          sarah.id,
          'Crafting responsive glassmorphic cards in Figma ✨ Which color accent is your favorite? 🎨 #design #ux #figma',
          '/samples/flower.mp4',
          'Lo-Fi Coding Beats · Study Chill',
          '/audio/chillhop.mp3',
          '-1 hour'
        );
      }

      if (alex) {
        insertReel.run(
          alex.id,
          'Fast full-stack architecture demo with SQLite + Express! Speed is everything ⚡🚀 #coding #javascript #webdev',
          '/samples/mov_bbb.mp4',
          'Electronic Energy · SynthWave Beat',
          '/audio/synthwave.mp3',
          '-30 minutes'
        );
      }
      console.log('Sample reels seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding reels:', err);
  }

  seedDatabase();
  restoreFromSnapshot();
  saveDataSnapshot();
}

function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return;
  }

  console.log('Seeding initial sample data into database...');

  const passwordHash = bcrypt.hashSync('password123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password_hash, bio, avatar_url)
    VALUES (?, ?, ?, ?, ?)
  `);

  const alex = insertUser.run(
    'alex_tech',
    'alex@example.com',
    passwordHash,
    'Full-stack developer & open-source enthusiast 💻 Building the future with JavaScript & AI.',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  );

  const sarah = insertUser.run(
    'sarah_design',
    'sarah@example.com',
    passwordHash,
    'UI/UX designer crafting clean, human-centered interfaces ✨ Coffee, Figma & photography.',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'
  );

  const marcus = insertUser.run(
    'marcus_lens',
    'marcus@example.com',
    passwordHash,
    'Travel photographer exploring quiet corners of the world 🌍 Canon R5.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
  );

  const alexId = alex.lastInsertRowid;
  const sarahId = sarah.lastInsertRowid;
  const marcusId = marcus.lastInsertRowid;

  // Follow relationships:
  // Alex follows Sarah & Marcus
  // Sarah follows Alex
  // Marcus follows Sarah
  const insertFollow = db.prepare(`
    INSERT INTO followers (follower_id, following_id) VALUES (?, ?)
  `);
  insertFollow.run(alexId, sarahId);
  insertFollow.run(alexId, marcusId);
  insertFollow.run(sarahId, alexId);
  insertFollow.run(marcusId, sarahId);

  // Posts
  const insertPost = db.prepare(`
    INSERT INTO posts (user_id, content, image_url, media_type, created_at)
    VALUES (?, ?, ?, ?, datetime('now', ?))
  `);

  const p1 = insertPost.run(
    alexId,
    'Just launched our new Mini Social Media Platform! Built with pure vanilla JS on the frontend and Express + SQLite on the backend. Zero frameworks, pure speed! 🚀 #webdev #javascript #buildinpublic',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
    'image',
    '-3 hours'
  );

  const p2 = insertPost.run(
    sarahId,
    'Working on a new design system inspired by minimalist typography and soft neutral palettes. What do you all think of airy glassmorphic navigation bars? 🎨🖌️',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
    'image',
    '-2 hours'
  );

  const p3 = insertPost.run(
    marcusId,
    'Sunrise over the mist-covered valleys this morning in the mountains. Sometimes getting up at 4:30 AM is worth every freezing second. 🌄📸',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    'image',
    '-1 hour'
  );

  const pVideo = insertPost.run(
    alexId,
    'Check out this stunning demo video showcasing nature and digital design in motion! 🎥✨ You can now post photos, videos, and media files directly.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'video',
    '-45 minutes'
  );

  const p4 = insertPost.run(
    alexId,
    'Tip for developers: Keep your state management as close to your UI elements as possible. Simplicity wins every single time! 💡',
    null,
    'none',
    '-30 minutes'
  );

  // Comments
  const insertComment = db.prepare(`
    INSERT INTO comments (post_id, user_id, content, created_at)
    VALUES (?, ?, ?, datetime('now', ?))
  `);

  insertComment.run(p1.lastInsertRowid, sarahId, 'Looks fantastic Alex! Loving the clean responsive card layout.', '-2 hours');
  insertComment.run(p1.lastInsertRowid, marcusId, 'Blazing fast too. Awesome job!', '-1 hour');
  insertComment.run(p2.lastInsertRowid, alexId, 'Big fan of subtle blur and high contrast typography. Looks super sleek!', '-1 hour');
  insertComment.run(p3.lastInsertRowid, sarahId, 'Breathtaking capture Marcus! The light gradient is stunning.', '-45 minutes');

  // Likes
  const insertLike = db.prepare(`
    INSERT INTO likes (user_id, post_id) VALUES (?, ?)
  `);

  insertLike.run(sarahId, p1.lastInsertRowid);
  insertLike.run(marcusId, p1.lastInsertRowid);
  insertLike.run(alexId, p2.lastInsertRowid);
  insertLike.run(alexId, p3.lastInsertRowid);
  insertLike.run(sarahId, p3.lastInsertRowid);
  insertLike.run(marcusId, p4.lastInsertRowid);

  console.log('Sample database seeding completed successfully.');
}

module.exports = {
  db,
  initDb,
  saveDataSnapshot
};
