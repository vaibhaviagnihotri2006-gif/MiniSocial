// Central place to configure the backend API base URL.
// In production, replace this with your deployed Render backend URL,
// e.g. "https://mini-social-api.onrender.com/api"
const isLocalhost =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isLocalhost
  ? 'http://localhost:5000/api'
  : 'https://minisocial-j5lk.onrender.com/api';
export const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
