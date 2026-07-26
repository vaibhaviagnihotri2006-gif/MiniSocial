import { isAuthenticated } from '../state/auth.js';

export const getQueryParam = (name) => {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
};

export const navigate = (path) => {
  window.location.href = path;
};

export const navigateReplace = (path) => {
  window.location.replace(path);
};

export const requireAuth = () => {
  if (!isAuthenticated()) {
    navigateReplace('./login.html');
    return false;
  }
  return true;
};

export const redirectIfAuthenticated = (destination = './feed.html') => {
  if (isAuthenticated()) {
    navigateReplace(destination);
    return true;
  }
  return false;
};

export const postLoginRedirect = () => {
  navigate('./feed.html');
};