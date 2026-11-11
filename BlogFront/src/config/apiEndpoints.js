// apiEndpoints.js

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://localhost:7034/api').replace(/\/$/, '');

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    REFRESH: `${BASE_URL}/auth/refresh`,
    LOGOUT: `${BASE_URL}/auth/logout`,
    CHANGE_PASSWORD: `${BASE_URL}/auth/change-password`,
    FORGOT_PASSWORD: `${BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${BASE_URL}/auth/reset-password`,
  },
  POSTS: {
    BASE: `${BASE_URL}/Posts`,
    BY_ID: (id) => `${BASE_URL}/Posts/${id}`,
    ADD_MEDIA: (postId) => `${BASE_URL}/Posts/${postId}/media`,
    UPDATE_MEDIA: (mediaId) => `${BASE_URL}/Posts/Media/${mediaId}`,
  },
  CATEGORY: {
    BASE: `${BASE_URL}/Category`,
    BY_ID: (id) => `${BASE_URL}/Category/${id}`,
  },
  UPLOAD: {
    IMAGE: `${BASE_URL}/Upload/image`,
    DOWNLOAD: (fileName) => `${BASE_URL}/Upload/download/${fileName}`,
  }
};

export default API_ENDPOINTS;