// Application State
const State = {
  currentUser: null,
  currentTab: 'all', // 'all' or 'following'
  currentView: 'feed', // 'feed', 'profile', or 'reels'
  profileUsername: null,
  posts: [],
  isLoadingPosts: false,
  attachedMedia: {
    url: null,
    type: null,
    name: ''
  },
  currentMediaMode: 'photo',
  tempAvatarUrl: null,
  tempReelUrl: null,
  reelSoundEnabled: false
};

// DOM Selectors
const DOM = {
  // Navigation & User
  userMenuArea: document.getElementById('user-menu-area'),
  loginBtn: document.getElementById('header-login-btn'),
  navFeedBtn: document.getElementById('nav-feed-btn'),
  navFollowingBtn: document.getElementById('nav-following-btn'),
  navReelsBtn: document.getElementById('nav-reels-btn'),
  navProfileBtn: document.getElementById('nav-profile-btn'),
  
  // Views
  feedContainer: document.getElementById('feed-container'),
  profileContainer: document.getElementById('profile-container'),
  reelsContainer: document.getElementById('reels-container'),
  reelsStream: document.getElementById('reels-stream'),
  postsList: document.getElementById('posts-list'),
  feedTabs: document.getElementById('feed-tabs'),
  tabAll: document.getElementById('tab-all'),
  tabFollowing: document.getElementById('tab-following'),

  // Create Post
  createPostCard: document.getElementById('create-post-card'),
  createPostAvatar: document.getElementById('create-post-avatar'),
  postContent: document.getElementById('post-content'),
  charCount: document.getElementById('char-count'),
  submitPostBtn: document.getElementById('submit-post-btn'),
  
  // Multi-Media Drawer
  mediaDrawer: document.getElementById('media-drawer'),
  tabModePhoto: document.getElementById('tab-mode-photo'),
  tabModeVideo: document.getElementById('tab-mode-video'),
  tabModeUpload: document.getElementById('tab-mode-upload'),
  mediaPanelPhoto: document.getElementById('media-panel-photo'),
  mediaPanelVideo: document.getElementById('media-panel-video'),
  mediaPanelUpload: document.getElementById('media-panel-upload'),
  postPhotoUrl: document.getElementById('post-photo-url'),
  postVideoUrl: document.getElementById('post-video-url'),
  mediaFileInput: document.getElementById('media-file-input'),
  fileDropZone: document.getElementById('file-drop-zone'),
  uploadProgressText: document.getElementById('upload-progress-text'),
  mediaPreviewBox: document.getElementById('media-preview-box'),
  mediaPreviewContent: document.getElementById('media-preview-content'),
  mediaPreviewType: document.getElementById('media-preview-type'),
  removePreviewBtn: document.getElementById('remove-preview-btn'),

  // Right Sidebar Widgets
  demoAccountsCard: document.getElementById('demo-accounts-card'),
  myProfileWidget: document.getElementById('my-profile-widget'),
  myProfileWidgetContent: document.getElementById('my-profile-widget-content'),
  suggestedUsersList: document.getElementById('suggested-users-list'),

  // Modals
  authModal: document.getElementById('auth-modal'),
  authModalClose: document.getElementById('auth-modal-close'),
  authTabLogin: document.getElementById('auth-tab-login'),
  authTabRegister: document.getElementById('auth-tab-register'),
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  
  editProfileModal: document.getElementById('edit-profile-modal'),
  editProfileClose: document.getElementById('edit-profile-close'),
  editProfileForm: document.getElementById('edit-profile-form'),
  editBioInput: document.getElementById('edit-bio-input'),
  editBioCount: document.getElementById('edit-bio-count'),
  editAvatarInput: document.getElementById('edit-avatar-input'),
  editAvatarPreview: document.getElementById('edit-avatar-preview'),
  editAvatarFileInput: document.getElementById('edit-avatar-file-input'),
  avatarUrlDrawer: document.getElementById('avatar-url-drawer'),
  avatarUploadStatus: document.getElementById('avatar-upload-status'),

  // Create Reel Modal
  createReelModal: document.getElementById('create-reel-modal'),
  createReelClose: document.getElementById('create-reel-close'),
  createReelForm: document.getElementById('create-reel-form'),
  reelFileInput: document.getElementById('reel-file-input'),
  reelUrlDrawer: document.getElementById('reel-url-drawer'),
  reelUrlInput: document.getElementById('reel-url-input'),
  reelUploadStatus: document.getElementById('reel-upload-status'),
  reelPreviewContainer: document.getElementById('reel-preview-container'),
  reelPreviewVideo: document.getElementById('reel-preview-video'),
  reelCaptionInput: document.getElementById('reel-caption-input'),
  reelAudioInput: document.getElementById('reel-audio-input'),
  reelAudioUrlInput: document.getElementById('reel-audio-url-input'),
  reelAudioFileInput: document.getElementById('reel-audio-file-input'),
  reelAudioUploadStatus: document.getElementById('reel-audio-upload-status'),
  previewSongBtn: document.getElementById('preview-song-btn'),
  modalSongPreviewAudio: document.getElementById('modal-song-preview-audio'),
  selectedSongBadge: document.getElementById('selected-song-badge'),
  submitReelBtn: document.getElementById('submit-reel-btn'),

  toastContainer: document.getElementById('toast-container')
};

// UI Helper: Toast Notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button style="background:none; border:none; color:inherit; font-size:1rem; cursor:pointer; margin-left:0.5rem;" onclick="this.parentElement.remove()">&times;</button>
  `;
  DOM.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

// Utility: HTML Escaping
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Utility: Relative Time Formatter
function timeAgo(dateString) {
  const date = new Date(dateString.replace(' ', 'T') + (dateString.endsWith('Z') ? '' : 'Z'));
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Render Avatar Helper
function renderAvatar(url, username, sizeClass = '') {
  const initial = (username ? username[0] : '?').toUpperCase();
  if (url && url.trim()) {
    return `<img src="${escapeHtml(url)}" alt="@${escapeHtml(username)}" class="avatar ${sizeClass}" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'avatar ${sizeClass} avatar-fallback\\'>${initial}</span>';">`;
  }
  return `<span class="avatar ${sizeClass} avatar-fallback">${initial}</span>`;
}

// Initialize Application
async function initApp() {
  bindEvents();
  
  // Check active user session
  try {
    const user = await API.getMe();
    State.currentUser = user;
  } catch (err) {
    State.currentUser = null;
  }

  updateAuthUI();
  handleHashNavigation();
  loadSuggestedUsers();
}

// Update UI elements based on authentication state
function updateAuthUI() {
  const user = State.currentUser;

  if (user) {
    DOM.createPostCard.style.display = 'block';
    DOM.createPostAvatar.innerHTML = renderAvatar(user.avatar_url, user.username, 'avatar');
    
    // Header navigation
    DOM.userMenuArea.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.65rem;">
        <a href="#profile/${encodeURIComponent(user.username)}" style="display:flex; align-items:center; gap:0.5rem; text-decoration:none; color:inherit;">
          ${renderAvatar(user.avatar_url, user.username, 'avatar-sm')}
          <span style="font-weight:700; font-size:0.9rem;">@${escapeHtml(user.username)}</span>
        </a>
        <button class="btn btn-secondary btn-sm" onclick="openEditProfileModal()" title="Edit Profile & Photo">
          ⚙️ Settings
        </button>
        <button id="logout-btn" class="btn btn-secondary btn-sm" title="Log out">Log Out</button>
      </div>
    `;

    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

    if (DOM.navProfileBtn) {
      DOM.navProfileBtn.style.display = 'flex';
      DOM.navProfileBtn.onclick = () => { window.location.hash = `#profile/${user.username}`; };
    }

    // Right Sidebar: Hide Demo Accounts Box when user is logged in!
    if (DOM.demoAccountsCard) {
      DOM.demoAccountsCard.style.display = 'none';
    }

    // Right Sidebar: Show My Profile Widget with instant edit photo option
    if (DOM.myProfileWidget && DOM.myProfileWidgetContent) {
      DOM.myProfileWidget.style.display = 'block';
      DOM.myProfileWidgetContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.85rem;">
          <a href="#profile/${encodeURIComponent(user.username)}">
            ${renderAvatar(user.avatar_url, user.username, 'avatar')}
          </a>
          <div style="min-width:0; overflow:hidden;">
            <a href="#profile/${encodeURIComponent(user.username)}" style="font-weight:700; font-size:0.95rem; text-decoration:none; color:inherit; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              @${escapeHtml(user.username)}
            </a>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.15rem;">
              <span>${user.follower_count || 0} followers</span> · <span>${user.following_count || 0} following</span>
            </div>
          </div>
        </div>
        <button class="btn btn-outline-primary btn-sm" style="width:100%; display:flex; align-items:center; justify-content:center; gap:0.4rem;" onclick="openEditProfileModal()">
          <span>📷</span> Change Profile Photo / Bio
        </button>
      `;
    }
  } else {
    DOM.createPostCard.style.display = 'none';
    DOM.userMenuArea.innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="openAuthModal('login')">Log In</button>
      <button class="btn btn-secondary btn-sm" onclick="openAuthModal('register')">Sign Up</button>
    `;
    if (DOM.navProfileBtn) {
      DOM.navProfileBtn.style.display = 'none';
    }

    // Right Sidebar: Show Demo Accounts Box when logged out
    if (DOM.demoAccountsCard) {
      DOM.demoAccountsCard.style.display = 'block';
    }
    if (DOM.myProfileWidget) {
      DOM.myProfileWidget.style.display = 'none';
    }
  }
}

// Hash Routing: #feed, #following, #reels, #profile/:username
function handleHashNavigation() {
  const hash = window.location.hash.slice(1) || 'feed';
  
  // Sync mobile bottom nav buttons
  document.querySelectorAll('.mobile-nav-item').forEach(btn => btn.classList.remove('active'));

  if (hash.startsWith('profile/')) {
    document.getElementById('mobile-nav-profile-btn')?.classList.add('active');
    const username = hash.split('/')[1];
    loadUserProfile(username);
  } else if (hash === 'reels') {
    document.getElementById('mobile-nav-reels-btn')?.classList.add('active');
    switchToReels();
  } else if (hash === 'following') {
    document.getElementById('mobile-nav-following-btn')?.classList.add('active');
    if (!State.currentUser) {
      openAuthModal('login');
      window.location.hash = 'feed';
      return;
    }
    switchTab('following');
  } else {
    document.getElementById('mobile-nav-feed-btn')?.classList.add('active');
    switchTab('all');
  }
}

function navigateToMyProfile() {
  if (State.currentUser) {
    window.location.hash = `#profile/${encodeURIComponent(State.currentUser.username)}`;
  } else {
    openAuthModal('login');
  }
}

function switchToReels() {
  State.currentView = 'reels';
  State.profileUsername = null;
  document.body.classList.add('reels-active-mode');

  DOM.feedContainer.style.display = 'none';
  DOM.profileContainer.style.display = 'none';
  DOM.feedTabs.style.display = 'none';
  if (DOM.reelsContainer) DOM.reelsContainer.style.display = 'block';

  DOM.navFeedBtn?.classList.remove('active');
  DOM.navFollowingBtn?.classList.remove('active');
  DOM.navReelsBtn?.classList.add('active');
  DOM.navProfileBtn?.classList.remove('active');

  loadReels();
}

function switchTab(tab) {
  pauseAllReelMedia();
  document.body.classList.remove('reels-active-mode');
  State.currentTab = tab;
  State.currentView = 'feed';
  State.profileUsername = null;

  DOM.feedContainer.style.display = 'block';
  DOM.profileContainer.style.display = 'none';
  if (DOM.reelsContainer) DOM.reelsContainer.style.display = 'none';
  DOM.feedTabs.style.display = 'flex';

  DOM.navReelsBtn?.classList.remove('active');

  if (tab === 'all') {
    DOM.tabAll.classList.add('active');
    DOM.tabFollowing.classList.remove('active');
    DOM.navFeedBtn?.classList.add('active');
    DOM.navFollowingBtn?.classList.remove('active');
    DOM.navProfileBtn?.classList.remove('active');
  } else {
    DOM.tabAll.classList.remove('active');
    DOM.tabFollowing.classList.add('active');
    DOM.navFeedBtn?.classList.remove('active');
    DOM.navFollowingBtn?.classList.add('active');
    DOM.navProfileBtn?.classList.remove('active');
  }

  loadPosts();
}

// Load Posts Feed
async function loadPosts() {
  DOM.postsList.innerHTML = `
    <div style="text-align:center; padding: 2.5rem 0;">
      <div class="loading-spinner"></div>
      <p style="color:var(--text-muted); font-size:0.875rem; margin-top:0.5rem;">Loading posts...</p>
    </div>
  `;

  try {
    const params = { feed: State.currentTab };
    if (State.currentView === 'profile' && State.profileUsername) {
      params.author = State.profileUsername;
    }

    const data = await API.getPosts(params);
    State.posts = data.posts;
    renderPosts(data.posts);
  } catch (err) {
    DOM.postsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Unable to load posts</div>
        <p class="empty-state-desc">${escapeHtml(err.message)}</p>
        <button class="btn btn-secondary btn-sm" style="margin-top:1rem;" onclick="loadPosts()">Try Again</button>
      </div>
    `;
  }
}

// Render Posts to DOM
function renderPosts(posts) {
  if (!posts || posts.length === 0) {
    const emptyMessage = State.currentTab === 'following'
      ? 'No posts from people you follow yet. Follow more users or switch to "All Posts"!'
      : 'No posts to display yet. Be the first to share something!';

    DOM.postsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💬</div>
        <div class="empty-state-title">No Posts Found</div>
        <p class="empty-state-desc">${emptyMessage}</p>
      </div>
    `;
    return;
  }

  DOM.postsList.innerHTML = posts.map(post => renderPostCardHtml(post)).join('');
}

// YouTube video ID extractor
function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

// Vimeo video ID extractor
function extractVimeoId(url) {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/);
  return match ? match[3] : null;
}

// Render Media (Photo, Video, Audio, or Embed)
function renderMediaHtml(mediaUrl, mediaType) {
  if (!mediaUrl || !mediaUrl.trim()) return '';
  const url = mediaUrl.trim();
  const type = mediaType || 'image';

  if (type === 'video') {
    const ytId = extractYouTubeId(url);
    if (ytId) {
      return `
        <div class="video-embed-container">
          <iframe src="https://www.youtube-nocookie.com/embed/${ytId}" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
      `;
    }

    const vimeoId = extractVimeoId(url);
    if (vimeoId) {
      return `
        <div class="video-embed-container">
          <iframe src="https://player.vimeo.com/video/${vimeoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
        </div>
      `;
    }

    // Native Video Player
    return `
      <div style="margin-bottom:0.85rem; border-radius:var(--radius-md); overflow:hidden; background:#000;">
        <video controls playsinline preload="metadata" class="post-video" src="${escapeHtml(url)}">
          Your browser does not support HTML5 video.
        </video>
      </div>
    `;
  }

  if (type === 'audio') {
    return `
      <div style="margin-bottom:0.85rem;">
        <audio controls class="post-audio" src="${escapeHtml(url)}" style="width:100%;">
          Your browser does not support audio playback.
        </audio>
      </div>
    `;
  }

  // Standard Image
  return `
    <div class="post-image-container">
      <img src="${escapeHtml(url)}" alt="Post media" loading="lazy" onerror="this.parentElement.style.display='none';">
    </div>
  `;
}

// Generate HTML for a single post card
function renderPostCardHtml(post) {
  const isAuthor = State.currentUser && State.currentUser.id === post.author.id;
  const isLiked = post.has_liked;

  return `
    <article class="post-card" id="post-${post.id}">
      <header class="post-header">
        <div class="post-author-info">
          <a href="#profile/${encodeURIComponent(post.author.username)}">
            ${renderAvatar(post.author.avatar_url, post.author.username, 'avatar')}
          </a>
          <div class="author-names">
            <a href="#profile/${encodeURIComponent(post.author.username)}" class="author-username">
              @${escapeHtml(post.author.username)}
            </a>
            <span class="post-time">${timeAgo(post.created_at)}</span>
          </div>
        </div>
        ${isAuthor ? `
          <button class="icon-btn" title="Delete post" onclick="handleDeletePost(${post.id})" style="color:var(--text-dim); hover:color:var(--danger);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        ` : ''}
      </header>

      <div class="post-body">${formatPostContent(post.content)}</div>

      ${renderMediaHtml(post.media_url || post.image_url, post.media_type)}

      <div class="post-actions">
        <button class="action-btn ${isLiked ? 'liked' : ''}" id="like-btn-${post.id}" onclick="handleToggleLike(${post.id})">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span id="like-count-${post.id}">${post.like_count}</span>
        </button>

        <button class="action-btn" onclick="toggleComments(${post.id})">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span id="comment-count-${post.id}">${post.comment_count}</span>
        </button>
      </div>

      <section class="comments-section" id="comments-section-${post.id}">
        <div class="comments-list" id="comments-list-${post.id}">
          <!-- Comments loaded dynamically -->
        </div>

        ${State.currentUser ? `
          <form class="comment-form" onsubmit="handleAddComment(event, ${post.id})">
            ${renderAvatar(State.currentUser.avatar_url, State.currentUser.username, 'avatar-sm')}
            <input type="text" class="comment-input" placeholder="Write a comment..." required maxlength="500" id="comment-input-${post.id}">
            <button type="submit" class="btn btn-primary btn-sm">Reply</button>
          </form>
        ` : `
          <p style="font-size:0.8rem; color:var(--text-muted); text-align:center;">
            <a href="javascript:void(0)" onclick="openAuthModal('login')" style="color:var(--primary); font-weight:600;">Log in</a> to leave a comment.
          </p>
        `}
      </section>
    </article>
  `;
}

// Content highlighter for hashtags
function formatPostContent(content) {
  const escaped = escapeHtml(content);
  return escaped.replace(/#(\w+)/g, '<span style="color:var(--primary); font-weight:600;">#$1</span>');
}

// Like / Unlike toggle
async function handleToggleLike(postId) {
  if (!State.currentUser) {
    openAuthModal('login');
    return;
  }

  const likeBtn = document.getElementById(`like-btn-${postId}`);
  const likeCountSpan = document.getElementById(`like-count-${postId}`);
  const currentCount = parseInt(likeCountSpan.innerText, 10);
  const currentlyLiked = likeBtn.classList.contains('liked');

  // Optimistic UI update
  likeBtn.classList.toggle('liked');
  likeCountSpan.innerText = currentlyLiked ? currentCount - 1 : currentCount + 1;
  const svg = likeBtn.querySelector('svg');
  if (svg) svg.setAttribute('fill', !currentlyLiked ? 'currentColor' : 'none');

  try {
    const data = await API.toggleLike(postId);
    likeCountSpan.innerText = data.like_count;
    if (data.has_liked) {
      likeBtn.classList.add('liked');
      if (svg) svg.setAttribute('fill', 'currentColor');
    } else {
      likeBtn.classList.remove('liked');
      if (svg) svg.setAttribute('fill', 'none');
    }
  } catch (err) {
    // Revert optimistic update
    likeBtn.classList.toggle('liked', currentlyLiked);
    likeCountSpan.innerText = currentCount;
    if (svg) svg.setAttribute('fill', currentlyLiked ? 'currentColor' : 'none');
    showToast(err.message, 'error');
  }
}

// Comments toggle & fetch
async function toggleComments(postId) {
  const section = document.getElementById(`comments-section-${postId}`);
  const list = document.getElementById(`comments-list-${postId}`);
  
  if (section.classList.contains('open')) {
    section.classList.remove('open');
    return;
  }

  section.classList.add('open');
  list.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); text-align:center;">Loading comments...</p>`;

  try {
    const data = await API.getComments(postId);
    renderComments(postId, data.comments);
  } catch (err) {
    list.innerHTML = `<p style="font-size:0.8rem; color:var(--danger); text-align:center;">Failed to load comments</p>`;
  }
}

function renderComments(postId, comments) {
  const list = document.getElementById(`comments-list-${postId}`);
  if (!comments || comments.length === 0) {
    list.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:0.5rem 0;">No comments yet. Start the conversation!</p>`;
    return;
  }

  list.innerHTML = comments.map(c => `
    <div class="comment-item">
      <a href="#profile/${encodeURIComponent(c.author.username)}">
        ${renderAvatar(c.author.avatar_url, c.author.username, 'avatar-sm')}
      </a>
      <div class="comment-bubble">
        <div class="comment-author-row">
          <a href="#profile/${encodeURIComponent(c.author.username)}" class="comment-author">@${escapeHtml(c.author.username)}</a>
          <span class="comment-time">${timeAgo(c.created_at)}</span>
        </div>
        <div class="comment-text">${escapeHtml(c.content)}</div>
      </div>
    </div>
  `).join('');
}

// Add comment under post
async function handleAddComment(e, postId) {
  e.preventDefault();
  if (!State.currentUser) {
    openAuthModal('login');
    return;
  }

  const input = document.getElementById(`comment-input-${postId}`);
  const content = input.value.trim();
  if (!content) return;

  try {
    input.disabled = true;
    const data = await API.addComment(postId, content);
    input.value = '';

    // Update comment counter
    const countSpan = document.getElementById(`comment-count-${postId}`);
    if (countSpan) countSpan.innerText = data.comment_count;

    // Append comment dynamically
    const list = document.getElementById(`comments-list-${postId}`);
    const emptyNotice = list.querySelector('p');
    if (emptyNotice) emptyNotice.remove();

    const newCommentHtml = `
      <div class="comment-item" style="animation: slideToast 0.2s ease;">
        <a href="#profile/${encodeURIComponent(data.comment.author.username)}">
          ${renderAvatar(data.comment.author.avatar_url, data.comment.author.username, 'avatar-sm')}
        </a>
        <div class="comment-bubble">
          <div class="comment-author-row">
            <a href="#profile/${encodeURIComponent(data.comment.author.username)}" class="comment-author">@${escapeHtml(data.comment.author.username)}</a>
            <span class="comment-time">just now</span>
          </div>
          <div class="comment-text">${escapeHtml(data.comment.content)}</div>
        </div>
      </div>
    `;
    list.insertAdjacentHTML('beforeend', newCommentHtml);
    showToast('Comment posted!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    input.disabled = false;
    input.focus();
  }
}

// Delete Post
async function handleDeletePost(postId) {
  if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
    return;
  }

  try {
    await API.deletePost(postId);
    const postEl = document.getElementById(`post-${postId}`);
    if (postEl) {
      postEl.style.transition = 'all 0.3s ease';
      postEl.style.opacity = '0';
      postEl.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        postEl.remove();
        if (DOM.postsList.children.length === 0) {
          renderPosts([]);
        }
      }, 300);
    }
    showToast('Post deleted successfully.', 'info');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Create Post
async function handleCreatePost(e) {
  e.preventDefault();
  if (State._submittingPost) return; // prevent double submit
  if (!State.currentUser) {
    openAuthModal('login');
    return;
  }

  const content = DOM.postContent.value.trim();
  const mediaUrl = State.attachedMedia.url || (
    State.currentMediaMode === 'photo' ? DOM.postPhotoUrl?.value.trim() :
    State.currentMediaMode === 'video' ? DOM.postVideoUrl?.value.trim() : null
  );
  const mediaType = State.attachedMedia.type || (
    State.currentMediaMode === 'video' ? 'video' : 'image'
  );

  if (!content && !mediaUrl) {
    showToast('Please write something or attach a photo/video before posting.', 'error');
    return;
  }

  State._submittingPost = true;
  try {
    DOM.submitPostBtn.disabled = true;
    DOM.submitPostBtn.innerText = 'Posting...';

    const result = await API.createPost(content, mediaUrl, mediaType);
    showToast('Post published!', 'success');

    // Reset post form
    DOM.postContent.value = '';
    DOM.charCount.innerText = '0 / 1000';
    clearMediaAttachment();
    DOM.mediaDrawer.classList.remove('open');

    // Prepend new post to feed
    if (DOM.postsList.querySelector('.empty-state')) {
      DOM.postsList.innerHTML = '';
    }
    DOM.postsList.insertAdjacentHTML('afterbegin', renderPostCardHtml(result.post));
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    State._submittingPost = false;
    DOM.submitPostBtn.disabled = false;
    DOM.submitPostBtn.innerText = 'Post';
  }
}

// User Profile View
async function loadUserProfile(username) {
  pauseAllReelMedia();
  document.body.classList.remove('reels-active-mode');
  State.currentView = 'profile';
  State.profileUsername = username;

  DOM.feedTabs.style.display = 'none';
  DOM.feedContainer.style.display = 'none';
  if (DOM.reelsContainer) DOM.reelsContainer.style.display = 'none';
  DOM.profileContainer.style.display = 'block';

  DOM.navReelsBtn?.classList.remove('active');

  DOM.profileContainer.innerHTML = `
    <div style="text-align:center; padding: 3rem 0;">
      <div class="loading-spinner"></div>
      <p style="color:var(--text-muted); font-size:0.875rem; margin-top:0.5rem;">Loading profile of @${escapeHtml(username)}...</p>
    </div>
  `;

  try {
    const data = await API.getUserProfile(username);
    const profile = data.user;
    renderProfileHeader(profile);
    loadPosts(); // Loads posts for this author
  } catch (err) {
    DOM.profileContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👤</div>
        <div class="empty-state-title">User Not Found</div>
        <p class="empty-state-desc">${escapeHtml(err.message)}</p>
        <button class="btn btn-secondary btn-sm" style="margin-top:1rem;" onclick="window.location.hash='feed'">Back to Feed</button>
      </div>
    `;
  }
}

function renderProfileHeader(profile) {
  const isSelf = State.currentUser && State.currentUser.id === profile.id;
  const isFollowing = profile.is_following;

  DOM.profileContainer.innerHTML = `
    <div class="profile-card">
      <div class="profile-banner"></div>
      <div class="profile-details">
        <div class="profile-avatar-row">
          ${renderAvatar(profile.avatar_url, profile.username, 'avatar-lg')}
          <div>
            ${isSelf ? `
              <button class="btn btn-secondary btn-sm" onclick="openEditProfileModal()">Edit Profile</button>
            ` : State.currentUser ? `
              <button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-sm" id="profile-follow-btn" onclick="handleToggleFollow(${profile.id}, '${escapeHtml(profile.username)}')">
                ${isFollowing ? 'Following' : 'Follow'}
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="openAuthModal('login')">Follow</button>
            `}
          </div>
        </div>

        <h1 class="profile-name">@${escapeHtml(profile.username)}</h1>
        <div class="profile-username">Joined ${timeAgo(profile.created_at)}</div>

        <p class="profile-bio">${escapeHtml(profile.bio) || '<span style="color:var(--text-dim); font-style:italic;">No bio yet.</span>'}</p>

        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-number" id="profile-posts-stat">${profile.post_count}</span>
            <span class="stat-label">Posts</span>
          </div>
          <div class="stat-item">
            <span class="stat-number" id="profile-followers-stat">${profile.follower_count}</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="stat-item">
            <span class="stat-number" id="profile-following-stat">${profile.following_count}</span>
            <span class="stat-label">Following</span>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-bottom:1rem; font-weight:700; font-size:1rem; color:var(--text-main);">
      Posts by @${escapeHtml(profile.username)}
    </div>
    <div id="posts-list" class="post-list"></div>
  `;

  // Re-bind DOM.postsList
  DOM.postsList = document.getElementById('posts-list');
}

// Follow / Unfollow Toggle
async function handleToggleFollow(userId, username) {
  if (!State.currentUser) {
    openAuthModal('login');
    return;
  }

  const followBtn = document.getElementById('profile-follow-btn');
  const followersStat = document.getElementById('profile-followers-stat');

  try {
    const data = await API.toggleFollow(userId);
    if (followBtn) {
      if (data.is_following) {
        followBtn.innerText = 'Following';
        followBtn.className = 'btn btn-secondary btn-sm';
      } else {
        followBtn.innerText = 'Follow';
        followBtn.className = 'btn btn-primary btn-sm';
      }
    }

    if (followersStat) {
      followersStat.innerText = data.target_follower_count;
    }

    showToast(data.message, 'info');
    loadSuggestedUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Suggested Users
async function loadSuggestedUsers() {
  if (!DOM.suggestedUsersList) return;
  try {
    const data = await API.getSuggestedUsers();
    renderSuggestedUsers(data.users);
  } catch (e) {
    // Graceful ignore
  }
}

function renderSuggestedUsers(users) {
  if (!users || users.length === 0) {
    DOM.suggestedUsersList.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted);">No suggestions right now.</p>`;
    return;
  }

  DOM.suggestedUsersList.innerHTML = users.map(u => `
    <div class="suggested-user-item">
      <a href="#profile/${encodeURIComponent(u.username)}" class="suggested-user-info">
        ${renderAvatar(u.avatar_url, u.username, 'avatar-sm')}
        <div class="suggested-name-group">
          <div class="suggested-name">@${escapeHtml(u.username)}</div>
          <div class="suggested-followers">${u.follower_count} followers</div>
        </div>
      </a>
      ${State.currentUser ? `
        <button class="btn ${u.is_following ? 'btn-secondary' : 'btn-outline-primary'} btn-sm" style="padding:0.2rem 0.6rem; font-size:0.75rem;" onclick="handleQuickFollow(${u.id}, '${escapeHtml(u.username)}', this)">
          ${u.is_following ? 'Following' : 'Follow'}
        </button>
      ` : ''}
    </div>
  `).join('');
}

async function handleQuickFollow(userId, username, btn) {
  if (!State.currentUser) {
    openAuthModal('login');
    return;
  }
  try {
    const data = await API.toggleFollow(userId);
    btn.innerText = data.is_following ? 'Following' : 'Follow';
    btn.className = `btn ${data.is_following ? 'btn-secondary' : 'btn-outline-primary'} btn-sm`;
    showToast(data.message, 'info');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Auth Handlers
function openAuthModal(mode = 'login') {
  DOM.authModal.classList.add('open');
  switchAuthTab(mode);
}

function closeAuthModal() {
  DOM.authModal.classList.remove('open');
}

function switchAuthTab(mode) {
  if (mode === 'login') {
    DOM.authTabLogin.classList.add('active');
    DOM.authTabRegister.classList.remove('active');
    DOM.loginForm.style.display = 'block';
    DOM.registerForm.style.display = 'none';
  } else {
    DOM.authTabLogin.classList.remove('active');
    DOM.authTabRegister.classList.add('active');
    DOM.loginForm.style.display = 'none';
    DOM.registerForm.style.display = 'block';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const idInput = document.getElementById('login-identifier');
  const passInput = document.getElementById('login-password');

  try {
    const data = await API.login(idInput.value.trim(), passInput.value);
    State.currentUser = data.user;
    updateAuthUI();
    closeAuthModal();
    showToast(`Welcome back, @${data.user.username}!`, 'success');
    loadPosts();
    loadSuggestedUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const bio = document.getElementById('register-bio').value.trim();
  const avatarUrl = document.getElementById('register-avatar').value.trim();

  try {
    const data = await API.register(username, email, password, bio, avatarUrl);
    State.currentUser = data.user;
    updateAuthUI();
    closeAuthModal();
    showToast(`Account created! Welcome, @${data.user.username}!`, 'success');
    loadPosts();
    loadSuggestedUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleLogout() {
  await API.logout();
  State.currentUser = null;
  updateAuthUI();
  showToast('Logged out successfully.', 'info');
  if (window.location.hash.startsWith('#profile/')) {
    window.location.hash = 'feed';
  } else {
    loadPosts();
  }
  loadSuggestedUsers();
}

// Quick demo login fill
window.fillDemoLogin = (username) => {
  document.getElementById('login-identifier').value = username;
  document.getElementById('login-password').value = 'password123';
  openAuthModal('login');
};

// Edit Profile Modal Handlers
function openEditProfileModal() {
  if (!State.currentUser) {
    openAuthModal('login');
    return;
  }
  const bio = State.currentUser.bio || '';
  const avatarUrl = State.currentUser.avatar_url || '';

  DOM.editBioInput.value = bio;
  if (DOM.editBioCount) DOM.editBioCount.innerText = `${bio.length} / 300`;
  DOM.editAvatarInput.value = avatarUrl;
  updateEditAvatarPreview(avatarUrl);
  if (DOM.avatarUrlDrawer) DOM.avatarUrlDrawer.style.display = 'none';
  if (DOM.avatarUploadStatus) DOM.avatarUploadStatus.style.display = 'none';

  DOM.editProfileModal.classList.add('open');
}

function closeEditProfileModal() {
  DOM.editProfileModal.classList.remove('open');
}

function updateEditAvatarPreview(url) {
  if (!DOM.editAvatarPreview) return;
  const username = State.currentUser ? State.currentUser.username : '?';
  if (url && url.trim()) {
    DOM.editAvatarPreview.innerHTML = `<img src="${escapeHtml(url.trim())}" alt="Preview" style="width:100%; height:100%; object-fit:cover; display:block;">`;
  } else {
    DOM.editAvatarPreview.innerHTML = renderAvatar('', username, 'avatar-lg');
  }
}

function toggleAvatarUrlInput() {
  if (!DOM.avatarUrlDrawer) return;
  const isHidden = DOM.avatarUrlDrawer.style.display === 'none';
  DOM.avatarUrlDrawer.style.display = isHidden ? 'block' : 'none';
  if (isHidden && DOM.editAvatarInput) {
    DOM.editAvatarInput.focus();
  }
}

function generateRandomAvatar() {
  const username = State.currentUser ? State.currentUser.username : 'user';
  const seed = `${username}_${Date.now()}`;
  const randomUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
  State.tempAvatarUrl = randomUrl;
  if (DOM.editAvatarInput) DOM.editAvatarInput.value = randomUrl;
  updateEditAvatarPreview(randomUrl);
  showToast('Generated random avatar! Click Save Changes to apply.', 'info');
}

async function handleAvatarFileUpload(file) {
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file (PNG, JPG, WebP, etc.).', 'error');
    return;
  }

  if (file.size > 15 * 1024 * 1024) {
    showToast('Profile photo must be under 15MB.', 'error');
    return;
  }

  try {
    if (DOM.avatarUploadStatus) {
      DOM.avatarUploadStatus.innerText = `Uploading photo...`;
      DOM.avatarUploadStatus.style.color = 'var(--primary)';
      DOM.avatarUploadStatus.style.display = 'block';
    }

    const data = await API.uploadFile(file);
    State.tempAvatarUrl = data.url;
    if (DOM.editAvatarInput) DOM.editAvatarInput.value = data.url;
    updateEditAvatarPreview(data.url);

    if (DOM.avatarUploadStatus) {
      DOM.avatarUploadStatus.innerText = `Photo uploaded! Click "Save Changes" below.`;
      DOM.avatarUploadStatus.style.color = '#10b981';
      DOM.avatarUploadStatus.style.display = 'block';
    }

    showToast('Photo uploaded successfully! Click Save Changes to apply.', 'success');
  } catch (err) {
    showToast(`Upload failed: ${err.message}`, 'error');
    if (DOM.avatarUploadStatus) {
      DOM.avatarUploadStatus.style.display = 'none';
    }
  }
}

async function handleSaveProfile(e) {
  e.preventDefault();
  if (State._savingProfile) return; // prevent double submit
  State._savingProfile = true;
  const bio = DOM.editBioInput ? DOM.editBioInput.value : '';
  const avatarUrl = State.tempAvatarUrl || (DOM.editAvatarInput ? DOM.editAvatarInput.value.trim() : '') || (State.currentUser ? State.currentUser.avatar_url : '');

  try {
    const data = await API.updateProfile(bio, avatarUrl);
    State.currentUser = data.user;
    State.tempAvatarUrl = null;
    API.setCurrentUser(data.user);
    updateAuthUI();
    closeEditProfileModal();
    showToast('Profile photo & bio saved successfully! ✨', 'success');

    // Reload posts and profile view so new avatar reflects immediately everywhere
    if (State.currentView === 'profile' && State.profileUsername === data.user.username) {
      loadUserProfile(data.user.username);
    } else {
      loadPosts();
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    State._savingProfile = false;
  }
}

// ==========================================================================
// Reels Handlers
// ==========================================================================
async function loadReels() {
  if (!DOM.reelsStream) return;
  DOM.reelsStream.innerHTML = `
    <div style="text-align:center; padding:3rem 0;">
      <div class="loading-spinner"></div>
      <p style="color:var(--text-muted); font-size:0.875rem; margin-top:0.5rem;">Loading reels...</p>
    </div>
  `;

  try {
    const data = await API.getPosts({ feed: 'reels' });
    renderReels(data.posts);
  } catch (err) {
    DOM.reelsStream.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Unable to load reels</div>
        <p class="empty-state-desc">${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

function renderReels(reels) {
  if (!reels || reels.length === 0) {
    DOM.reelsStream.innerHTML = `
      <div class="empty-state" style="max-width:380px;">
        <div class="empty-state-icon">📱</div>
        <div class="empty-state-title">No Reels Yet</div>
        <p class="empty-state-desc">Be the first to create and share a reel!</p>
        ${State.currentUser ? `
          <button class="btn btn-primary btn-sm" style="margin-top:1rem;" onclick="openCreateReelModal()">Create Reel</button>
        ` : ''}
      </div>
    `;
    return;
  }

  DOM.reelsStream.innerHTML = reels.map(reel => {
    const isLiked = reel.has_liked;
    const isAuthor = State.currentUser && State.currentUser.id === reel.author.id;
    const mediaUrl = reel.media_url || reel.image_url;

    return `
      <div class="reel-card" id="reel-${reel.id}" data-reel-id="${reel.id}">
        <!-- Top Reel Progress Bar -->
        <div class="reel-progress-track">
          <div class="reel-progress-fill" id="progress-fill-${reel.id}"></div>
        </div>

        <video 
          class="reel-video" 
          src="${escapeHtml(mediaUrl)}" 
          loop 
          playsinline 
          muted 
          preload="auto"
          id="video-player-${reel.id}"
          onclick="togglePlayPauseVideo(${reel.id})"
          onerror="this.parentElement.querySelector('.reel-error-fallback').style.display='flex';"
        ></video>
        ${reel.audio_url ? `
          <audio 
            id="audio-player-${reel.id}" 
            src="${escapeHtml(reel.audio_url)}" 
            loop 
            preload="auto"
          ></audio>
        ` : ''}
        
        <div class="reel-error-fallback" style="display:none; position:absolute; inset:0; background:#0f172a; color:#fff; align-items:center; justify-content:center; flex-direction:column; padding:1.5rem; text-align:center;">
          <div style="font-size:2rem; margin-bottom:0.5rem;">⚠️</div>
          <div style="font-weight:700;">Video unavailable</div>
          <p style="font-size:0.75rem; color:#94a3b8; margin-top:0.25rem;">Could not load video source</p>
        </div>

        <div class="reel-overlay-gradient" onclick="togglePlayPauseVideo(${reel.id})"></div>

        <!-- Center Play/Pause indicator -->
        <div class="reel-play-indicator" id="play-indicator-${reel.id}" style="display:none;">
          ▶
        </div>

        <!-- Mute / Unmute Button on Top Right -->
        <button type="button" class="reel-sound-toggle-btn" id="sound-btn-${reel.id}" onclick="toggleReelAudio(${reel.id}, this)" title="Click to play sound">
          🔇
        </button>

        <div class="reel-content-bottom">
          <div class="reel-author-row">
            <a href="#profile/${encodeURIComponent(reel.author.username)}">
              ${renderAvatar(reel.author.avatar_url, reel.author.username, 'avatar-sm')}
            </a>
            <a href="#profile/${encodeURIComponent(reel.author.username)}" class="reel-author-name">
              @${escapeHtml(reel.author.username)}
            </a>
          </div>
          <div class="reel-caption">${formatPostContent(reel.content)}</div>
          <div class="reel-audio-tag" onclick="toggleReelAudio(${reel.id})" style="cursor:pointer;" title="Click to play music">
            <span>🎵</span>
            <span>${escapeHtml(reel.audio_track || 'Original Audio')}</span>
          </div>
        </div>

        <div class="reel-actions-column">
          <div style="display:flex; flex-direction:column; align-items:center;">
            <button class="reel-action-btn ${isLiked ? 'liked' : ''}" id="reel-like-btn-${reel.id}" onclick="handleToggleLikeReel(${reel.id})">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <span class="reel-action-count" id="reel-like-count-${reel.id}">${reel.like_count}</span>
          </div>

          <div style="display:flex; flex-direction:column; align-items:center;">
            <button class="reel-action-btn" onclick="toggleComments(${reel.id})">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
            <span class="reel-action-count">${reel.comment_count}</span>
          </div>

          ${isAuthor ? `
            <button class="reel-action-btn" title="Delete Reel" onclick="handleDeletePost(${reel.id})" style="background:rgba(239, 68, 68, 0.4);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Set up progress bar updates & audio loop sync for each reel video
  reels.forEach(reel => {
    const video = document.getElementById(`video-player-${reel.id}`);
    const audio = document.getElementById(`audio-player-${reel.id}`);
    const progressFill = document.getElementById(`progress-fill-${reel.id}`);

    if (video) {
      video.addEventListener('timeupdate', () => {
        if (progressFill && video.duration) {
          progressFill.style.width = `${(video.currentTime / video.duration) * 100}%`;
        }
      });

      // Synchronize background audio track on loop
      video.addEventListener('seeked', () => {
        if (audio && !video.muted) {
          audio.currentTime = video.currentTime % (audio.duration || 1);
        }
      });
    }
  });

  // Activate scroll-snap observer to play visible reel & pause offscreen reels
  setupReelsObserver();
  attachReelsSwipeListeners();
}

async function handleToggleLikeReel(reelId) {
  if (!State.currentUser) {
    openAuthModal('login');
    return;
  }
  const likeBtn = document.getElementById(`reel-like-btn-${reelId}`);
  const likeCountSpan = document.getElementById(`reel-like-count-${reelId}`);
  const currentCount = parseInt(likeCountSpan?.innerText || '0', 10);
  const currentlyLiked = likeBtn?.classList.contains('liked');

  if (likeBtn) likeBtn.classList.toggle('liked');
  if (likeCountSpan) likeCountSpan.innerText = currentlyLiked ? currentCount - 1 : currentCount + 1;
  const svg = likeBtn?.querySelector('svg');
  if (svg) svg.setAttribute('fill', !currentlyLiked ? 'currentColor' : 'none');

  try {
    const data = await API.toggleLike(reelId);
    if (likeCountSpan) likeCountSpan.innerText = data.like_count;
    if (likeBtn) likeBtn.classList.toggle('liked', data.has_liked);
    if (svg) svg.setAttribute('fill', data.has_liked ? 'currentColor' : 'none');
  } catch (err) {
    if (likeBtn) likeBtn.classList.toggle('liked', currentlyLiked);
    if (likeCountSpan) likeCountSpan.innerText = currentCount;
    if (svg) svg.setAttribute('fill', currentlyLiked ? 'currentColor' : 'none');
    showToast(err.message, 'error');
  }
}

// ==========================================================================
// Reels Audio & Video Playback Controls (Full-Screen Snap-Scroll)
// ==========================================================================
let reelObserver = null;
let currentVisibleReelId = null;

function setupReelsObserver() {
  if (reelObserver) {
    reelObserver.disconnect();
  }

  const stream = DOM.reelsStream;
  if (!stream) return;

  const options = {
    root: stream,
    threshold: 0.65 // when 65% in view
  };

  reelObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const reelEl = entry.target;
      const reelId = reelEl.getAttribute('data-reel-id');
      const video = document.getElementById(`video-player-${reelId}`);
      const audio = document.getElementById(`audio-player-${reelId}`);
      const soundBtn = document.getElementById(`sound-btn-${reelId}`);

      if (entry.isIntersecting) {
        currentVisibleReelId = reelId;
        if (video) {
          video.play().catch(e => console.log('Autoplay prevented:', e));

          if (State.reelSoundEnabled) {
            video.muted = false;
            video.volume = 1.0;
            if (audio) {
              if (video.duration && audio.duration) {
                audio.currentTime = video.currentTime % audio.duration;
              }
              audio.volume = 1.0;
              audio.play().catch(() => {});
            }
            if (soundBtn) {
              soundBtn.innerHTML = '🔊';
              soundBtn.classList.add('unmuted');
            }
          } else {
            video.muted = true;
            if (audio) audio.pause();
            if (soundBtn) {
              soundBtn.innerHTML = '🔇';
              soundBtn.classList.remove('unmuted');
            }
          }
        }
      } else {
        // Paused when swiped away
        if (video) {
          video.pause();
        }
        if (audio) {
          audio.pause();
        }
        if (soundBtn) {
          soundBtn.innerHTML = '🔇';
          soundBtn.classList.remove('unmuted');
        }
      }
    });
  }, options);

  document.querySelectorAll('.reel-card').forEach(card => {
    reelObserver.observe(card);
  });
}

function scrollToNextReel() {
  const cards = Array.from(document.querySelectorAll('.reel-card'));
  if (cards.length === 0) return;
  const currentIndex = cards.findIndex(c => c.getAttribute('data-reel-id') === String(currentVisibleReelId));
  const nextIndex = (currentIndex >= 0 && currentIndex + 1 < cards.length) ? currentIndex + 1 : 0;
  cards[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function scrollToPreviousReel() {
  const cards = Array.from(document.querySelectorAll('.reel-card'));
  if (cards.length === 0) return;
  const currentIndex = cards.findIndex(c => c.getAttribute('data-reel-id') === String(currentVisibleReelId));
  const prevIndex = (currentIndex > 0) ? currentIndex - 1 : cards.length - 1;
  cards[prevIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function toggleFullscreenReels() {
  const wrapper = document.getElementById('reels-wrapper-relative');
  if (!wrapper) return;
  wrapper.classList.toggle('fullscreen-active');
  const isFs = wrapper.classList.contains('fullscreen-active');
  showToast(isFs ? 'Fullscreen Mode On ⛶ (Swipe to browse)' : 'Exited Fullscreen', 'info');
}

let reelsSwipeListenersAttached = false;
function attachReelsSwipeListeners() {
  if (reelsSwipeListenersAttached) return;
  reelsSwipeListenersAttached = true;

  let touchStartY = 0;
  let touchEndY = 0;

  DOM.reelsStream?.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  DOM.reelsStream?.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].screenY;
    const diffY = touchStartY - touchEndY;
    if (Math.abs(diffY) > 40) {
      if (diffY > 0) {
        scrollToNextReel();
      } else {
        scrollToPreviousReel();
      }
    }
  }, { passive: true });

  // Mouse wheel snap throttling
  let wheelLock = false;
  DOM.reelsStream?.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) < 25) return;
    if (wheelLock) return;
    wheelLock = true;
    setTimeout(() => { wheelLock = false; }, 450);

    if (e.deltaY > 0) {
      scrollToNextReel();
    } else {
      scrollToPreviousReel();
    }
    e.preventDefault();
  }, { passive: false });

  // Arrow Keys & Spacebar keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (State.currentView !== 'reels') return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      scrollToNextReel();
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      scrollToPreviousReel();
    } else if (e.key === 'm' || e.key === 'M') {
      if (currentVisibleReelId) toggleReelAudio(currentVisibleReelId);
    } else if (e.key === ' ') {
      e.preventDefault();
      if (currentVisibleReelId) togglePlayPauseVideo(currentVisibleReelId);
    } else if (e.key === 'Escape') {
      const wrapper = document.getElementById('reels-wrapper-relative');
      if (wrapper && wrapper.classList.contains('fullscreen-active')) {
        wrapper.classList.remove('fullscreen-active');
      }
    }
  });
}

function toggleReelAudio(reelId, btn) {
  const video = document.getElementById(`video-player-${reelId}`);
  const audio = document.getElementById(`audio-player-${reelId}`);
  const soundBtn = btn || document.getElementById(`sound-btn-${reelId}`);
  if (!video) return;

  if (video.muted) {
    State.reelSoundEnabled = true;

    // Unmute this reel and pause all others
    document.querySelectorAll('.reel-video').forEach(v => {
      if (v.id !== `video-player-${reelId}`) v.muted = true;
    });
    document.querySelectorAll('audio[id^="audio-player-"]').forEach(a => {
      if (a.id !== `audio-player-${reelId}`) a.pause();
    });
    document.querySelectorAll('.reel-sound-toggle-btn').forEach(b => {
      if (b !== soundBtn) {
        b.innerHTML = '🔇';
        b.classList.remove('unmuted');
      }
    });

    video.muted = false;
    video.volume = 1.0;

    if (audio) {
      if (video.duration && audio.duration) {
        audio.currentTime = video.currentTime % audio.duration;
      }
      audio.volume = 1.0;
      audio.play().catch(e => console.log('Audio playback prevented:', e));
    }

    if (soundBtn) {
      soundBtn.innerHTML = '🔊';
      soundBtn.classList.add('unmuted');
    }
    showToast('Sound On 🔊', 'info');
  } else {
    // Mute
    State.reelSoundEnabled = false;
    video.muted = true;
    if (audio) {
      audio.pause();
    }
    if (soundBtn) {
      soundBtn.innerHTML = '🔇';
      soundBtn.classList.remove('unmuted');
    }
    showToast('Sound Muted 🔇', 'info');
  }
}

function togglePlayPauseVideo(reelId) {
  const video = document.getElementById(`video-player-${reelId}`);
  const audio = document.getElementById(`audio-player-${reelId}`);
  const indicator = document.getElementById(`play-indicator-${reelId}`);
  if (!video) return;

  if (video.paused) {
    video.play().catch(() => {});
    if (!video.muted && audio) {
      if (video.duration && audio.duration) {
        audio.currentTime = video.currentTime % audio.duration;
      }
      audio.play().catch(() => {});
    }
    if (indicator) {
      indicator.innerHTML = '▶';
      indicator.style.display = 'flex';
      setTimeout(() => { indicator.style.display = 'none'; }, 400);
    }
  } else {
    video.pause();
    if (audio) {
      audio.pause();
    }
    if (indicator) {
      indicator.innerHTML = '❚❚';
      indicator.style.display = 'flex';
      setTimeout(() => { indicator.style.display = 'none'; }, 400);
    }
  }
}

function pauseAllReelMedia() {
  document.querySelectorAll('.reel-video').forEach(v => {
    v.pause();
    v.muted = true;
  });
  document.querySelectorAll('audio[id^="audio-player-"]').forEach(a => {
    a.pause();
  });
  document.querySelectorAll('.reel-sound-toggle-btn').forEach(b => {
    b.innerHTML = '🔇';
    b.classList.remove('unmuted');
  });
}

// ==========================================================================
// Reel Song & Music Picker Handlers
// ==========================================================================
function selectReelSong(title, url) {
  if (DOM.reelAudioInput) DOM.reelAudioInput.value = title;
  if (DOM.reelAudioUrlInput) DOM.reelAudioUrlInput.value = url || '';
  if (DOM.selectedSongBadge) {
    DOM.selectedSongBadge.innerText = (title || 'Original Audio').split('·')[0].trim();
  }

  // Update chip styling
  document.querySelectorAll('.song-chip-btn').forEach(btn => btn.classList.remove('active'));
  if (!url) {
    document.getElementById('song-btn-original')?.classList.add('active');
  } else if (url.includes('synthwave')) {
    document.getElementById('song-btn-synthwave')?.classList.add('active');
  } else if (url.includes('chillhop')) {
    document.getElementById('song-btn-chillhop')?.classList.add('active');
  } else if (url.includes('energetic')) {
    document.getElementById('song-btn-energetic')?.classList.add('active');
  } else if (url.includes('acoustic')) {
    document.getElementById('song-btn-acoustic')?.classList.add('active');
  }

  // Preview button in modal
  if (DOM.previewSongBtn && DOM.modalSongPreviewAudio) {
    if (url) {
      DOM.modalSongPreviewAudio.src = url;
      DOM.previewSongBtn.style.display = 'inline-flex';
      DOM.previewSongBtn.innerHTML = '▶ Listen to Song';
      DOM.modalSongPreviewAudio.pause();
    } else {
      DOM.modalSongPreviewAudio.pause();
      DOM.modalSongPreviewAudio.src = '';
      DOM.previewSongBtn.style.display = 'none';
    }
  }
}

function toggleReelSongModalPreview() {
  if (!DOM.modalSongPreviewAudio) return;
  if (DOM.modalSongPreviewAudio.paused) {
    DOM.modalSongPreviewAudio.play().then(() => {
      if (DOM.previewSongBtn) DOM.previewSongBtn.innerHTML = '⏹ Stop Preview';
    }).catch(err => {
      showToast('Could not play audio preview', 'error');
    });
  } else {
    DOM.modalSongPreviewAudio.pause();
    DOM.modalSongPreviewAudio.currentTime = 0;
    if (DOM.previewSongBtn) DOM.previewSongBtn.innerHTML = '▶ Listen to Song';
  }
}

async function handleReelAudioFileUpload(file) {
  if (!file) return;
  if (!file.type.startsWith('audio/')) {
    showToast('Please select a valid audio file (MP3, WAV, OGG).', 'error');
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    showToast('Audio file must be under 20MB.', 'error');
    return;
  }

  try {
    if (DOM.reelAudioUploadStatus) {
      DOM.reelAudioUploadStatus.innerText = `Uploading song "${file.name}"...`;
      DOM.reelAudioUploadStatus.style.display = 'block';
      DOM.reelAudioUploadStatus.style.color = 'var(--primary)';
    }

    const data = await API.uploadFile(file);
    const cleanSongTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const displayTitle = `🎵 ${cleanSongTitle}`;

    selectReelSong(displayTitle, data.url);

    if (DOM.reelAudioUploadStatus) {
      DOM.reelAudioUploadStatus.innerText = `Song uploaded! Click "▶ Listen to Song" to test.`;
      DOM.reelAudioUploadStatus.style.color = '#10b981';
    }
    showToast('Audio track uploaded! 🎵', 'success');
  } catch (err) {
    showToast(err.message, 'error');
    if (DOM.reelAudioUploadStatus) DOM.reelAudioUploadStatus.style.display = 'none';
  }
}

// ==========================================================================
// Create Reel Modal Handlers
// ==========================================================================
function openCreateReelModal() {
  if (!State.currentUser) {
    openAuthModal('login');
    return;
  }
  State.tempReelUrl = null;
  if (DOM.reelUrlInput) DOM.reelUrlInput.value = '';
  if (DOM.reelCaptionInput) DOM.reelCaptionInput.value = '';
  if (DOM.reelPreviewContainer) DOM.reelPreviewContainer.style.display = 'none';
  if (DOM.reelPreviewVideo) DOM.reelPreviewVideo.src = '';
  if (DOM.reelUploadStatus) DOM.reelUploadStatus.style.display = 'none';
  if (DOM.reelAudioUploadStatus) DOM.reelAudioUploadStatus.style.display = 'none';
  if (DOM.reelUrlDrawer) DOM.reelUrlDrawer.style.display = 'none';

  selectReelSong('Original Video Audio', '');

  DOM.createReelModal?.classList.add('open');
}

function closeCreateReelModal() {
  DOM.createReelModal?.classList.remove('open');
  if (DOM.reelPreviewVideo) {
    DOM.reelPreviewVideo.pause();
    DOM.reelPreviewVideo.src = '';
  }
  if (DOM.modalSongPreviewAudio) {
    DOM.modalSongPreviewAudio.pause();
    DOM.modalSongPreviewAudio.currentTime = 0;
  }
  if (DOM.previewSongBtn) {
    DOM.previewSongBtn.innerHTML = '▶ Listen to Song';
  }
}

function toggleReelUrlInput() {
  if (!DOM.reelUrlDrawer) return;
  const isHidden = DOM.reelUrlDrawer.style.display === 'none';
  DOM.reelUrlDrawer.style.display = isHidden ? 'block' : 'none';
  if (isHidden && DOM.reelUrlInput) DOM.reelUrlInput.focus();
}

function pickReelSample(sampleKey) {
  const reelSamples = {
    flower: {
      url: '/samples/flower.mp4',
      audio: 'Lo-Fi Coding Beats · Study Chill',
      audioUrl: '/audio/chillhop.mp3',
      caption: 'Flower blooming in timelapse 🌸 Nature is pure poetry ✨ #flower #nature #timelapse'
    },
    nature: {
      url: '/samples/nature.mp4',
      audio: 'Calm Coastal Breeze · Sunshine Vibes',
      audioUrl: '/audio/acoustic.mp3',
      caption: 'Walks through deep green forests & ocean shores 🌲🌊 #nature #peace #travel'
    },
    bunny: {
      url: '/samples/mov_bbb.mp4',
      audio: 'Electronic Energy · SynthWave Beat',
      audioUrl: '/audio/synthwave.mp3',
      caption: 'Fast full-stack animation demo! Speed is everything ⚡🚀 #coding #webdev #animation'
    }
  };

  const sample = reelSamples[sampleKey];
  if (!sample) return;

  setReelVideoPreview(sample.url);
  if (DOM.reelCaptionInput && !DOM.reelCaptionInput.value) DOM.reelCaptionInput.value = sample.caption;
  selectReelSong(sample.audio, sample.audioUrl);
}

function setReelVideoPreview(url) {
  if (!url || !url.trim()) return;
  State.tempReelUrl = url.trim();
  if (DOM.reelUrlInput) DOM.reelUrlInput.value = State.tempReelUrl;
  if (DOM.reelPreviewVideo && DOM.reelPreviewContainer) {
    DOM.reelPreviewVideo.src = State.tempReelUrl;
    DOM.reelPreviewContainer.style.display = 'block';
    DOM.reelPreviewVideo.play().catch(() => {});
  }
}

async function handleReelFileUpload(file) {
  if (!file) return;

  if (!file.type.startsWith('video/')) {
    showToast('Please select a video file (MP4, WebM, etc.).', 'error');
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    showToast('Reel video must be under 50MB.', 'error');
    return;
  }

  try {
    if (DOM.reelUploadStatus) {
      DOM.reelUploadStatus.innerText = `Uploading "${file.name}"...`;
      DOM.reelUploadStatus.style.color = 'var(--primary)';
      DOM.reelUploadStatus.style.display = 'block';
    }

    const data = await API.uploadFile(file);
    setReelVideoPreview(data.url);

    if (DOM.reelUploadStatus) {
      DOM.reelUploadStatus.innerText = `Video uploaded successfully!`;
      DOM.reelUploadStatus.style.color = '#10b981';
      DOM.reelUploadStatus.style.display = 'block';
    }

    showToast('Video uploaded! Add a caption and share.', 'success');
  } catch (err) {
    showToast(`Upload failed: ${err.message}`, 'error');
    if (DOM.reelUploadStatus) DOM.reelUploadStatus.style.display = 'none';
  }
}

async function handleCreateReel(e) {
  e.preventDefault();
  if (State._submittingReel) return; // prevent double submit
  if (!State.currentUser) {
    openAuthModal('login');
    return;
  }

  const videoUrl = State.tempReelUrl || (DOM.reelUrlInput ? DOM.reelUrlInput.value.trim() : null);
  const caption = DOM.reelCaptionInput ? DOM.reelCaptionInput.value.trim() : '';
  const audio = DOM.reelAudioInput ? DOM.reelAudioInput.value.trim() : 'Original Audio';
  const audioUrl = DOM.reelAudioUrlInput ? DOM.reelAudioUrlInput.value.trim() : null;

  if (!videoUrl) {
    showToast('Please upload a video or paste a video URL for your reel.', 'error');
    return;
  }

  State._submittingReel = true;
  try {
    if (DOM.submitReelBtn) {
      DOM.submitReelBtn.disabled = true;
      DOM.submitReelBtn.innerText = 'Publishing...';
    }

    const data = await API.createPost(caption, videoUrl, 'video', 1, audio, audioUrl);
    showToast('Reel published successfully! 🎉', 'success');
    closeCreateReelModal();
    window.location.hash = 'reels';
    switchToReels();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    State._submittingReel = false;
    if (DOM.submitReelBtn) {
      DOM.submitReelBtn.disabled = false;
      DOM.submitReelBtn.innerText = 'Publish Reel';
    }
  }
}

// Multi-Media Drawer & Attachment Handlers
function openMediaDrawerWithMode(mode) {
  if (DOM.mediaDrawer.classList.contains('open') && State.currentMediaMode === mode) {
    DOM.mediaDrawer.classList.remove('open');
    return;
  }
  DOM.mediaDrawer.classList.add('open');
  switchMediaMode(mode);
}

function switchMediaMode(mode) {
  State.currentMediaMode = mode;

  // Toggle Tab active states
  DOM.tabModePhoto?.classList.toggle('active', mode === 'photo');
  DOM.tabModeVideo?.classList.toggle('active', mode === 'video');
  DOM.tabModeUpload?.classList.toggle('active', mode === 'upload');

  // Toggle Panels
  if (DOM.mediaPanelPhoto) DOM.mediaPanelPhoto.style.display = mode === 'photo' ? 'block' : 'none';
  if (DOM.mediaPanelVideo) DOM.mediaPanelVideo.style.display = mode === 'video' ? 'block' : 'none';
  if (DOM.mediaPanelUpload) DOM.mediaPanelUpload.style.display = mode === 'upload' ? 'block' : 'none';

  if (mode === 'photo' && DOM.postPhotoUrl) DOM.postPhotoUrl.focus();
  if (mode === 'video' && DOM.postVideoUrl) DOM.postVideoUrl.focus();
}

function setMediaAttachment(url, type = 'image', label = '') {
  if (!url || !url.trim()) {
    clearMediaAttachment();
    return;
  }

  const cleanUrl = url.trim();
  State.attachedMedia = {
    url: cleanUrl,
    type: type,
    name: label
  };

  DOM.mediaPreviewBox.style.display = 'block';
  DOM.mediaPreviewType.innerText = type === 'video' ? '🎥 Video Attached' : type === 'audio' ? '🎵 Audio Attached' : '📷 Photo Attached';

  if (type === 'video') {
    const ytId = extractYouTubeId(cleanUrl);
    if (ytId) {
      DOM.mediaPreviewContent.innerHTML = `
        <div class="video-embed-container" style="max-height:220px;">
          <iframe src="https://www.youtube-nocookie.com/embed/${ytId}" allowfullscreen></iframe>
        </div>
      `;
    } else {
      DOM.mediaPreviewContent.innerHTML = `
        <video controls playsinline class="post-video" src="${escapeHtml(cleanUrl)}" style="max-height:220px;"></video>
      `;
    }
  } else if (type === 'audio') {
    DOM.mediaPreviewContent.innerHTML = `
      <div style="padding:1rem;">
        <audio controls class="post-audio" src="${escapeHtml(cleanUrl)}" style="width:100%;"></audio>
      </div>
    `;
  } else {
    DOM.mediaPreviewContent.innerHTML = `
      <img src="${escapeHtml(cleanUrl)}" alt="Preview" style="max-height:220px; width:100%; object-fit:contain;" onerror="this.parentElement.innerHTML='<div style=\\'padding:1rem; color:#fff; text-align:center;\\'>Invalid Image URL</div>';">
    `;
  }
}

function clearMediaAttachment() {
  State.attachedMedia = { url: null, type: null, name: '' };
  if (DOM.postPhotoUrl) DOM.postPhotoUrl.value = '';
  if (DOM.postVideoUrl) DOM.postVideoUrl.value = '';
  if (DOM.mediaFileInput) DOM.mediaFileInput.value = '';
  if (DOM.mediaPreviewContent) DOM.mediaPreviewContent.innerHTML = '';
  if (DOM.mediaPreviewBox) DOM.mediaPreviewBox.style.display = 'none';
  if (DOM.uploadProgressText) DOM.uploadProgressText.style.display = 'none';
}

function pickSampleMedia(category, sampleKey) {
  if (category === 'photo') {
    const samples = {
      code: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      design: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=80',
      nature: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80',
      coffee: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80'
    };
    const url = samples[sampleKey] || '';
    if (DOM.postPhotoUrl) DOM.postPhotoUrl.value = url;
    setMediaAttachment(url, 'image', `${sampleKey} sample photo`);
  } else if (category === 'video') {
    const videoSamples = {
      nature: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      blaze: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    };
    const url = videoSamples[sampleKey] || '';
    if (DOM.postVideoUrl) DOM.postVideoUrl.value = url;
    setMediaAttachment(url, 'video', `${sampleKey} sample video`);
  }
}

// File Upload Handler
async function handleFileUpload(file) {
  if (!file) return;

  if (file.size > 50 * 1024 * 1024) {
    showToast('File exceeds maximum size of 50MB.', 'error');
    return;
  }

  try {
    if (DOM.uploadProgressText) {
      DOM.uploadProgressText.innerText = `Uploading "${file.name}"...`;
      DOM.uploadProgressText.style.display = 'block';
    }

    const data = await API.uploadFile(file);
    showToast(`${file.name} uploaded successfully!`, 'success');

    if (DOM.uploadProgressText) {
      DOM.uploadProgressText.innerText = `Uploaded: ${file.name}`;
    }

    setMediaAttachment(data.url, data.media_type, file.name);
  } catch (err) {
    showToast(`Upload failed: ${err.message}`, 'error');
    if (DOM.uploadProgressText) {
      DOM.uploadProgressText.style.display = 'none';
    }
  }
}

// Event Bindings
function bindEvents() {
  // Navigation tabs
  DOM.tabAll?.addEventListener('click', () => switchTab('all'));
  DOM.tabFollowing?.addEventListener('click', () => switchTab('following'));

  DOM.navFeedBtn?.addEventListener('click', () => { window.location.hash = 'feed'; });
  DOM.navFollowingBtn?.addEventListener('click', () => { window.location.hash = 'following'; });
  DOM.navReelsBtn?.addEventListener('click', () => { window.location.hash = 'reels'; });

  // Post form
  DOM.submitPostBtn?.addEventListener('click', handleCreatePost);
  DOM.postContent?.addEventListener('input', () => {
    const len = DOM.postContent.value.length;
    DOM.charCount.innerText = `${len} / 1000`;
    DOM.charCount.style.color = len > 950 ? 'var(--danger)' : 'var(--text-muted)';
  });

  // Media Inputs
  DOM.postPhotoUrl?.addEventListener('input', (e) => {
    setMediaAttachment(e.target.value, 'image', 'Photo');
  });

  DOM.postVideoUrl?.addEventListener('input', (e) => {
    setMediaAttachment(e.target.value, 'video', 'Video');
  });

  DOM.removePreviewBtn?.addEventListener('click', clearMediaAttachment);

  // File Upload Drag & Drop and File Picker
  DOM.mediaFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
  });

  if (DOM.fileDropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      DOM.fileDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        DOM.fileDropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      DOM.fileDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        DOM.fileDropZone.classList.remove('dragover');
      });
    });

    DOM.fileDropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    });
  }

  // Profile Settings Edit Events
  DOM.editBioInput?.addEventListener('input', (e) => {
    const len = e.target.value.length;
    if (DOM.editBioCount) {
      DOM.editBioCount.innerText = `${len} / 300`;
      DOM.editBioCount.style.color = len > 280 ? 'var(--danger)' : 'var(--text-muted)';
    }
  });

  DOM.editAvatarFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleAvatarFileUpload(file);
  });

  DOM.editAvatarInput?.addEventListener('input', (e) => {
    updateEditAvatarPreview(e.target.value);
  });

  // Modals
  DOM.authModalClose?.addEventListener('click', closeAuthModal);
  DOM.authTabLogin?.addEventListener('click', () => switchAuthTab('login'));
  DOM.authTabRegister?.addEventListener('click', () => switchAuthTab('register'));
  DOM.loginForm?.addEventListener('submit', handleLogin);
  DOM.registerForm?.addEventListener('submit', handleRegister);

  DOM.editProfileClose?.addEventListener('click', closeEditProfileModal);
  DOM.editProfileForm?.addEventListener('submit', handleSaveProfile);

  // Create Reel Modal Events
  DOM.createReelClose?.addEventListener('click', closeCreateReelModal);
  DOM.createReelForm?.addEventListener('submit', handleCreateReel);
  DOM.reelFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleReelFileUpload(file);
  });
  DOM.reelAudioFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleReelAudioFileUpload(file);
  });
  DOM.reelUrlInput?.addEventListener('input', (e) => setReelVideoPreview(e.target.value));

  // Close modals on backdrop click
  window.addEventListener('click', (e) => {
    if (e.target === DOM.authModal) closeAuthModal();
    if (e.target === DOM.editProfileModal) closeEditProfileModal();
    if (e.target === DOM.createReelModal) closeCreateReelModal();
  });

  // Hash change
  window.addEventListener('hashchange', handleHashNavigation);
}

// Expose globals for inline HTML triggers
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.openEditProfileModal = openEditProfileModal;
window.closeEditProfileModal = closeEditProfileModal;
window.generateRandomAvatar = generateRandomAvatar;
window.toggleAvatarUrlInput = toggleAvatarUrlInput;
window.updateEditAvatarPreview = updateEditAvatarPreview;
window.openCreateReelModal = openCreateReelModal;
window.closeCreateReelModal = closeCreateReelModal;
window.pickReelSample = pickReelSample;
window.toggleReelUrlInput = toggleReelUrlInput;
window.selectReelSong = selectReelSong;
window.toggleReelSongModalPreview = toggleReelSongModalPreview;
window.toggleReelAudio = toggleReelAudio;
window.togglePlayPauseVideo = togglePlayPauseVideo;
window.scrollToNextReel = scrollToNextReel;
window.scrollToPreviousReel = scrollToPreviousReel;
window.toggleFullscreenReels = toggleFullscreenReels;
window.handleToggleLikeReel = handleToggleLikeReel;
window.navigateToMyProfile = navigateToMyProfile;
window.switchToReels = switchToReels;
window.handleDeletePost = handleDeletePost;
window.handleToggleLike = handleToggleLike;
window.toggleComments = toggleComments;
window.handleAddComment = handleAddComment;
window.handleToggleFollow = handleToggleFollow;
window.handleQuickFollow = handleQuickFollow;
window.openMediaDrawerWithMode = openMediaDrawerWithMode;
window.switchMediaMode = switchMediaMode;
window.pickSampleMedia = pickSampleMedia;
window.clearMediaAttachment = clearMediaAttachment;

// Start app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initApp);
