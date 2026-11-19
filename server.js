const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { initDb } = require('./src/db');

// Route handlers
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const postRoutes = require('./src/routes/posts');
const uploadRoutes = require('./src/routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database & Seed data if needed
initDb();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback to index.html for frontend navigation
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

// Start listening if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`Mini Social Media Platform server running on:`);
    console.log(`http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
