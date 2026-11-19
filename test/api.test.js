const http = require('http');
const app = require('../server');
const { db } = require('../src/db');

let server;
const PORT = 3099;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(path, { method = 'GET', headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { ...headers }
    };

    let bodyData = null;
    if (body) {
      bodyData = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', (err) => reject(err));
    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Comprehensive API & Database Verification ---');

  // Start temporary test server
  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`Test server started on port ${PORT}`);
      resolve();
    });
  });

  let token = null;
  let testUserId = null;
  let createdPostId = null;

  try {
    // 1. Health check
    console.log('1. Health check...');
    const health = await makeRequest('/api/health');
    if (health.status !== 200 || health.body.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(health)}`);
    }
    console.log('   ✓ Health check passed');

    // 2. Seed data check
    console.log('2. Checking seeded data in database...');
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const postCount = db.prepare('SELECT COUNT(*) as c FROM posts').get().c;
    const commentCount = db.prepare('SELECT COUNT(*) as c FROM comments').get().c;
    console.log(`   Seeded: ${userCount} users, ${postCount} posts, ${commentCount} comments`);
    if (userCount < 3 || postCount < 4) {
      throw new Error('Seed data incomplete');
    }
    console.log('   ✓ Database seeded correctly');

    // 3. User Registration
    console.log('3. Testing User Registration...');
    const testUsername = `user_${Date.now()}`;
    const regRes = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        username: testUsername,
        email: `${testUsername}@example.com`,
        password: 'password123',
        bio: 'Automated test bio'
      }
    });

    if (regRes.status !== 201 || !regRes.body.token) {
      throw new Error(`Register failed: ${JSON.stringify(regRes)}`);
    }
    token = regRes.body.token;
    testUserId = regRes.body.user.id;
    console.log(`   ✓ Registered @${testUsername} (id: ${testUserId})`);

    // 4. User Login
    console.log('4. Testing User Login...');
    const loginRes = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: testUsername,
        password: 'password123'
      }
    });
    if (loginRes.status !== 200 || !loginRes.body.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes)}`);
    }
    console.log('   ✓ Login successful');

    // 5. Auth /me check
    console.log('5. Testing /api/auth/me with JWT...');
    const meRes = await makeRequest('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (meRes.status !== 200 || meRes.body.user.username !== testUsername) {
      throw new Error(`/api/auth/me failed: ${JSON.stringify(meRes)}`);
    }
    console.log('   ✓ /api/auth/me returned user details');

    // 6. Create Post (Photo and Video)
    console.log('6. Testing Post Creation (Photo and Video)...');
    const createPostRes = await makeRequest('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        content: 'Hello World! Testing the mini social network with a photo #testing',
        image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800'
      }
    });
    if (createPostRes.status !== 201 || !createPostRes.body.post.id) {
      throw new Error(`Create post failed: ${JSON.stringify(createPostRes)}`);
    }
    createdPostId = createPostRes.body.post.id;
    console.log(`   ✓ Photo Post created with ID: ${createdPostId}`);

    // Create Video Post
    const createVideoPostRes = await makeRequest('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        content: 'Testing video post feature! 🎥',
        media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        media_type: 'video'
      }
    });
    if (createVideoPostRes.status !== 201 || createVideoPostRes.body.post.media_type !== 'video') {
      throw new Error(`Create video post failed: ${JSON.stringify(createVideoPostRes)}`);
    }
    console.log(`   ✓ Video Post created with ID: ${createVideoPostRes.body.post.id} (media_type: ${createVideoPostRes.body.post.media_type})`);

    // 7. Feed retrieval (All Posts)
    console.log('7. Testing Get All Posts Feed...');
    const feedRes = await makeRequest('/api/posts?feed=all', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (feedRes.status !== 200 || !Array.isArray(feedRes.body.posts)) {
      throw new Error(`Get feed failed: ${JSON.stringify(feedRes)}`);
    }
    const foundOurPost = feedRes.body.posts.find(p => p.id === createdPostId);
    if (!foundOurPost) {
      throw new Error('Created post not found in feed');
    }
    console.log(`   ✓ Found created post in feed (total posts: ${feedRes.body.posts.length})`);

    // 8. Like / Unlike Toggle
    console.log('8. Testing Like / Unlike Post...');
    const like1 = await makeRequest(`/api/posts/${createdPostId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (like1.status !== 200 || !like1.body.has_liked || like1.body.like_count !== 1) {
      throw new Error(`Like failed: ${JSON.stringify(like1)}`);
    }
    console.log('   ✓ Post liked (like_count = 1)');

    const like2 = await makeRequest(`/api/posts/${createdPostId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (like2.status !== 200 || like2.body.has_liked || like2.body.like_count !== 0) {
      throw new Error(`Unlike failed: ${JSON.stringify(like2)}`);
    }
    console.log('   ✓ Post unliked (like_count = 0)');

    // 9. Comments (Add & Fetch)
    console.log('9. Testing Add and Fetch Comments...');
    const commentRes = await makeRequest(`/api/posts/${createdPostId}/comments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { content: 'This is an awesome test comment!' }
    });
    if (commentRes.status !== 201 || !commentRes.body.comment.id) {
      throw new Error(`Add comment failed: ${JSON.stringify(commentRes)}`);
    }
    console.log('   ✓ Comment added successfully');

    const getCommentsRes = await makeRequest(`/api/posts/${createdPostId}/comments`);
    if (getCommentsRes.status !== 200 || getCommentsRes.body.comments.length !== 1) {
      throw new Error(`Get comments failed: ${JSON.stringify(getCommentsRes)}`);
    }
    console.log('   ✓ Retrieved comment list');

    // 10. Follow / Unfollow System
    console.log('10. Testing Follow / Unfollow user...');
    // Follow 'alex_tech' (id: 1)
    const alexUser = db.prepare('SELECT id FROM users WHERE username = ?').get('alex_tech');
    const followRes = await makeRequest(`/api/users/${alexUser.id}/follow`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (followRes.status !== 200 || !followRes.body.is_following) {
      throw new Error(`Follow user failed: ${JSON.stringify(followRes)}`);
    }
    console.log('   ✓ Successfully followed alex_tech');

    // Verify 'following' feed now includes alex_tech's posts
    const followingFeedRes = await makeRequest('/api/posts?feed=following', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (followingFeedRes.status !== 200 || followingFeedRes.body.posts.length === 0) {
      throw new Error(`Following feed empty: ${JSON.stringify(followingFeedRes)}`);
    }
    console.log(`   ✓ Following feed returned ${followingFeedRes.body.posts.length} posts`);

    // Prevent self-following check
    const selfFollowRes = await makeRequest(`/api/users/${testUserId}/follow`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (selfFollowRes.status !== 400) {
      throw new Error('Self-following should be blocked with 400');
    }
    console.log('   ✓ Self-following prevented correctly');

    // 11. Profile Edit
    console.log('11. Testing Edit Profile...');
    const updateProfileRes = await makeRequest('/api/users/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        bio: 'Updated bio testing string',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
      }
    });
    if (updateProfileRes.status !== 200 || updateProfileRes.body.user.bio !== 'Updated bio testing string') {
      throw new Error(`Profile update failed: ${JSON.stringify(updateProfileRes)}`);
    }
    console.log('   ✓ Profile updated successfully');

    // 12. Delete Post
    console.log('12. Testing Delete Post...');
    const deleteRes = await makeRequest(`/api/posts/${createdPostId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (deleteRes.status !== 200) {
      throw new Error(`Delete post failed: ${JSON.stringify(deleteRes)}`);
    }
    console.log('   ✓ Post deleted successfully');

    console.log('\n======================================================');
    console.log('🎉 ALL 12 INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ Test Failure:', error);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests();
