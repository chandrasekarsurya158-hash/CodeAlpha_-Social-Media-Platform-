const API = {
  TOKEN_KEY: 'mini_social_token',
  USER_KEY: 'mini_social_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  },

  getCurrentUser() {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.USER_KEY);
    }
  },

  async request(endpoint, options = {}) {
    const headers = options.headers || {};
    const token = this.getToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  },

  // Auth Endpoints
  async register(username, email, password, bio = '', avatar_url = '') {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: { username, email, password, bio, avatar_url }
    });
    this.setToken(data.token);
    this.setCurrentUser(data.user);
    return data;
  },

  async login(identifier, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: { identifier, password }
    });
    this.setToken(data.token);
    this.setCurrentUser(data.user);
    return data;
  },

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    }
    this.setToken(null);
    this.setCurrentUser(null);
  },

  async getMe() {
    try {
      const data = await this.request('/api/auth/me');
      this.setCurrentUser(data.user);
      return data.user;
    } catch (err) {
      this.setToken(null);
      this.setCurrentUser(null);
      return null;
    }
  },

  // Posts Endpoints
  async getPosts({ feed = 'all', author = null, limit = 50, offset = 0 } = {}) {
    const params = new URLSearchParams();
    if (feed) params.append('feed', feed);
    if (author) params.append('author', author);
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);

    return this.request(`/api/posts?${params.toString()}`);
  },

  async createPost(content, media_url = null, media_type = null, is_reel = 0, audio_track = null, audio_url = null) {
    return this.request('/api/posts', {
      method: 'POST',
      body: { content, media_url, image_url: media_url, media_type, is_reel, audio_track, audio_url }
    });
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Upload failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  },

  async deletePost(postId) {
    return this.request(`/api/posts/${postId}`, {
      method: 'DELETE'
    });
  },

  async toggleLike(postId) {
    return this.request(`/api/posts/${postId}/like`, {
      method: 'POST'
    });
  },

  // Comments Endpoints
  async getComments(postId) {
    return this.request(`/api/posts/${postId}/comments`);
  },

  async addComment(postId, content) {
    return this.request(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: { content }
    });
  },

  // Users Endpoints
  async getUserProfile(username) {
    return this.request(`/api/users/profile/${encodeURIComponent(username)}`);
  },

  async updateProfile(bio, avatar_url) {
    const data = await this.request('/api/users/profile', {
      method: 'PUT',
      body: { bio, avatar_url }
    });
    if (data.user) {
      this.setCurrentUser(data.user);
    }
    return data;
  },

  async toggleFollow(userId) {
    return this.request(`/api/users/${userId}/follow`, {
      method: 'POST'
    });
  },

  async getSuggestedUsers() {
    return this.request('/api/users/suggested/list');
  }
};
