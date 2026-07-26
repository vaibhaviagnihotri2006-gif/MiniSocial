import { apiPost, ApiClientError } from '../api/client.js';
import { setSession } from '../state/auth.js';
import { redirectIfAuthenticated, postLoginRedirect } from '../utils/router.js';
import { renderNavbar } from '../components/navbar.js';
import { toastSuccess, toastError } from '../utils/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  if (redirectIfAuthenticated()) return;

  const navMount = document.getElementById('navbar-mount');
  if (navMount) renderNavbar(navMount);

  const form = document.getElementById('login-form');
  const identifierInput = document.getElementById('identifier');
  const passwordInput = document.getElementById('password');
  const errorEl = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');
  const toggleBtn = document.getElementById('toggle-password');

  toggleBtn?.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.textContent = isPassword ? 'Hide' : 'Show';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const identifier = identifierInput.value.trim();
    const password = passwordInput.value;

    if (!identifier || !password) {
      errorEl.textContent = 'Please fill in both fields.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
      const res = await apiPost('/auth/login', { identifier, password });
      setSession(res.data.user, res.data.token);
      toastSuccess('Welcome back!');
      postLoginRedirect();
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'Login failed. Please try again.';
      errorEl.textContent = message;
      toastError(message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log in';
    }
  });
});
