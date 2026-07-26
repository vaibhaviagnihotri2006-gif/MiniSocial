import { emit } from './events.js';

const TOKEN_KEY = 'mini_social_token';
const USER_KEY = 'mini_social_user';

let currentUser = null;
let currentToken = null;

const load = () => {
  try {
    currentToken = localStorage.getItem(TOKEN_KEY) || null;
    const rawUser = localStorage.getItem(USER_KEY);
    currentUser = rawUser ? JSON.parse(rawUser) : null;
  } catch (err) {
    currentToken = null;
    currentUser = null;
  }
};

load();

export const getToken = () => currentToken;

export const getCurrentUser = () => currentUser;

export const isAuthenticated = () => Boolean(currentToken);

export const setSession = (user, token) => {
  currentUser = user;
  currentToken = token;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emit('auth:changed', { user, token });
};

export const updateCurrentUser = (partialUser) => {
  if (!currentUser) return;
  currentUser = { ...currentUser, ...partialUser };
  localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
  emit('auth:changed', { user: currentUser, token: currentToken });
};

export const clearSession = () => {
  currentUser = null;
  currentToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  emit('auth:changed', { user: null, token: null });
};
