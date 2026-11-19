# Pulse — Mini Social Media Platform 🚀

A full-stack, responsive Mini Social Media Platform built with **Vanilla HTML5/CSS3/JavaScript** on the frontend and **Node.js, Express.js, and SQLite (`better-sqlite3`)** on the backend. Zero frontend framework dependencies, instant response times, and zero external database setup required.

---

## 🌟 Key Features

1. **Authentication & User Profiles**:
   - Register new accounts with alphanumeric usernames and password validation.
   - Secure login and session management powered by JWT tokens (`Authorization: Bearer <token>` and HTTP-only cookies) and `bcryptjs` password hashing.
   - User profile pages (`#profile/:username`) displaying bio, avatar, joined timestamp, follower count, following count, and all posts by that user.
   - In-app profile editor allowing users to modify their bio and avatar image URL.

2. **Interactive Feed & Multi-Media Posts**:
   - Central feed with "All Posts" and "Following" tabs.
   - **Post Photos, Videos, and Files**:
     - 📷 **Photos**: Attach image URLs or upload local images (JPG, PNG, GIF, WebP).
     - 🎥 **Videos**: Post direct video files (MP4, WebM, OGG) with native HTML5 controls, or paste YouTube/Vimeo links to render responsive embedded players.
     - 📁 **Direct Device Upload**: Drag & drop or pick files directly from your computer (up to 50MB) via `multer`.
     - Quick sample presets for both photos and videos for instant one-click testing.
     - Interactive live preview with remove button before posting.
   - Author controls to delete their own posts with immediate DOM removal.
   - Dynamic commenting system: write and read comments under any post in real-time without full page reloads.

3. **📱 Reels & Shorts System (NEW)**:
   - Dedicated **Reels** tab in the navigation with a vertical 9:16 video experience.
   - Pre-seeded high-definition sample reels (Ocean Waves 🌊, Mountain Escape 🌲, SynthWave Animation 🎬).
   - Logged-in users can click **"➕ Create Reel"** to upload their own short video (MP4/WebM) or paste a video URL.
   - Custom audio title and caption support (`🎵 Audio Track - @creator`).
   - Interactive Like counter, speech bubble comments, and tap-to-pause video player.

3. **Like & Follow System**:
   - Instant like/unlike toggle on every post with immediate counter update and heart animations.
   - Follow/unfollow toggle button on user profiles and in the "Who to Follow" recommendations card.
   - Filter feed between **All Posts** and **Following** (posts only from people you follow plus yourself).

4. **Zero-Config Database**:
   - SQLite embedded database (`database.sqlite`) initialized automatically on startup.
   - Automatic seeding of sample users (`alex_tech`, `sarah_design`, `marcus_lens`), sample posts, comments, likes, and follow relationships.

---

## 🏗️ Project Architecture

```
MiniSocialMediaPlatform/
├── package.json
├── server.js                # Express server & static asset server
├── database.sqlite          # SQLite database (auto-created & seeded)
├── src/
│   ├── db.js                # SQLite tables schema, constraints & seed logic
│   ├── middleware/
│   │   └── auth.js          # JWT authentication (requireAuth & optionalAuth)
│   └── routes/
│       ├── auth.js          # /api/auth (register, login, logout, me)
│       ├── posts.js         # /api/posts (feeds, create, delete, like, comments)
│       └── users.js         # /api/users (profiles, edit bio/avatar, follow/unfollow)
├── public/
│   ├── index.html           # Single-page interface (Feed, Profiles, Modals)
│   ├── css/
│   │   └── styles.css       # Clean, modern, responsive CSS design
│   └── js/
│       ├── api.js           # Fetch API wrapper with error handling & auth
│       └── app.js           # Client application state & DOM rendering
└── test/
    └── api.test.js          # Complete 12-step automated integration test suite
```

---

## 🗄️ Database Schema

### 1. `users`
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `username`: TEXT UNIQUE NOT NULL
- `email`: TEXT UNIQUE NOT NULL
- `password_hash`: TEXT NOT NULL
- `bio`: TEXT DEFAULT ''
- `avatar_url`: TEXT DEFAULT ''
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### 2. `posts`
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `user_id`: INTEGER NOT NULL (FK -> `users.id` ON DELETE CASCADE)
- `content`: TEXT NOT NULL
- `image_url`: TEXT (optional)
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### 3. `comments`
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `post_id`: INTEGER NOT NULL (FK -> `posts.id` ON DELETE CASCADE)
- `user_id`: INTEGER NOT NULL (FK -> `users.id` ON DELETE CASCADE)
- `content`: TEXT NOT NULL
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### 4. `likes`
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `user_id`: INTEGER NOT NULL (FK -> `users.id` ON DELETE CASCADE)
- `post_id`: INTEGER NOT NULL (FK -> `posts.id` ON DELETE CASCADE)
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `UNIQUE(user_id, post_id)`

### 5. `followers`
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `follower_id`: INTEGER NOT NULL (FK -> `users.id` ON DELETE CASCADE)
- `following_id`: INTEGER NOT NULL (FK -> `users.id` ON DELETE CASCADE)
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `UNIQUE(follower_id, following_id)`
- `CHECK(follower_id != following_id)`

---

## ⚡ Quick Start

### 1. Start the Server
```bash
npm start
```
The server will start on `http://localhost:3000`.

### 2. Run Integration Tests
```bash
npm test
```
Runs the automated test suite testing health check, registration, login, `/me`, post creation, feed filtering, likes, comments, follow/unfollow, and profile editing.

---

## 🔑 Demo Credentials

Click any of the demo account badges in the app's right sidebar to quickly populate credentials:

| Username | Password | Bio |
| :--- | :--- | :--- |
| `alex_tech` | `password123` | Full-stack developer & open-source enthusiast 💻 |
| `sarah_design` | `password123` | UI/UX designer crafting clean interfaces ✨ |
| `marcus_lens` | `password123` | Travel photographer exploring quiet corners 🌍 |
