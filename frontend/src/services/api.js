import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Express default port
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const login = (credentials) => api.post('/users/login', credentials);
export const register = (userData) => api.post('/users/signup', userData);
export const logout = () => api.post('/users/logout');
export const getProfile = () => api.get('/users/profile');
export const updateProfile = (data) => api.put('/users/profile', data);

// Bookmark APIs
export const getBookmarks = () => api.get('/users/bookmarks');
export const addBookmark = (newsItem) => api.post('/users/bookmarks', newsItem);
export const removeBookmark = (newsId) => api.delete(`/users/bookmarks/${newsId}`);

export const getAISummary = (url) => api.post('/summarize', { url });

// Translation API - Sends text and targetLang code
export const translateText = (text, targetLang) => 
  api.post('/translate', { text, targetLang });

// Batch Sentiment Analysis API (existing)
export const getBatchSentiment = (texts) =>
  api.post('/sentiment', { texts });

// NEW: Single Sentiment Analysis API - wraps batch call for NewsCard usage
export const getSentiment = async (text) => {
  try {
    const response = await api.post('/sentiment', { texts: [text] });
    // The backend returns an array of scores. We only care about the first one.
    return response.data.sentiments?.[0] ?? 0; // Default to 0 (Neutral)
  } catch (error) {
    console.error("Single sentiment API failed:", error);
    return 0; // Return 0 on API error
  }
};

export default api;