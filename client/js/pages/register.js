import { apiPost, ApiClientError } from '../api/client.js';
import { setSession } from '../state/auth.js';
import { redirectIfAuthenticated } from '../utils/router.js';
import { renderNavbar } from '../components/navbar.js';
import {
  validateFullName,
  validateUsername,
  validateEmail,
  validatePassword,
} from '../utils/validators.js';
import { toastSuccess, toastError } from '../utils/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  if (redirectIfAuthenticated()) return;

  const navMount = document.getElementById('navbar-mount');
  if (navMount) renderNavbar(navMount);

  const form = document.getElementById('register-form');
  const fields = {
    fullName: document.getElementById('fullName'),
    username: document.getElementById('username'),
    email: document.getElementById('email'),
    password: document.getElementById('password'),
  };
  const errors = {
    fullName: document.getElementById('fullName-error'),
    username: document.getElementById('username-error'),
    email: document.getElementById('email-error'),
    password: document.getElementById('password-error'),
  };
  const formError = document.getElementById('register-error');
  const submitBtn = document.getElementById('register-submit');
  const toggleBtn = document.getElementById('toggle-password');

  toggleBtn?.addEventListener('click', () => {
    const isPassword = fields.password.type === 'password';
    fields.password.type = isPassword ? 'text' : 'password';
    toggleBtn.textContent = isPassword ? 'Hide' : 'Show';
  });

  const validators = {
    fullName: validateFullName,
    username: validateUsername,
    email: validateEmail,
    password: validatePassword,
  };

  Object.keys(fields).forEach((key) => {
    fields[key].addEventListener('blur', () => {
      const msg = validators[key](fields[key].value);
      errors[key].textContent = msg || '';
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.textContent = '';

    let hasError = false;
    Object.keys(fields).forEach((key) => {
      const msg = validators[key](fields[key].value);
      errors[key].textContent = msg || '';
      if (msg) hasError = true;
    });
    if (hasError) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
      const res = await apiPost('/auth/register', {
        fullName: fields.fullName.value.trim(),
        username: fields.username.value.trim().toLowerCase(),
        email: fields.email.value.trim(),
        password: fields.password.value,
      });
      setSession(res.data.user, res.data.token);
      toastSuccess('Account created! Welcome to MiniSocial.');
      window.location.href = '/pages/feed.html';
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'Registration failed.';
      formError.textContent = message;
      toastError(message);
      if (err instanceof ApiClientError && err.fields) {
        err.fields.forEach((field) => {
          if (errors[field]) errors[field].textContent = message;
        });
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign up';
    }
  });
});
