import { apiGet, apiPost, apiDelete } from '../api/client.js';
import { getCurrentUser } from '../state/auth.js';
import { requireAuth, getQueryParam } from '../utils/router.js';
import { renderNavbar } from '../components/navbar.js';
import { escapeHTML } from '../utils/validators.js';
import { toastError } from '../utils/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  const navMount = document.getElementById('navbar-mount');
  if (navMount) renderNavbar(navMount);

  const currentUser = getCurrentUser();
  const input = document.getElementById('search-input');
  const resultsList = document.getElementById('search-results');
  const emptyState = document.getElementById('search-empty');
  const loader = document.getElementById('search-loader');

  const initialQuery = getQueryParam('q') || '';
  input.value = initialQuery;

  let debounceTimer = null;

  const renderResults = (users) => {
    resultsList.innerHTML = '';
    if (users.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    users.forEach((user) => {
      const isSelf = currentUser && currentUser.id === user.id;
      const row = document.createElement('div');
      row.className = 'user-row';
      row.innerHTML = `
        <a href="/pages/profile.html?username=${encodeURIComponent(user.username)}">
          <img class="user-row-avatar" src="${user.profileImage || '/images/placeholders/default-avatar.png'}" alt="${escapeHTML(user.fullName)}" />
        </a>
        <div class="user-row-info">
          <a href="/pages/profile.html?username=${encodeURIComponent(user.username)}" class="user-row-name">${escapeHTML(user.fullName)}</a>
          <div class="user-row-username">@${escapeHTML(user.username)}</div>
        </div>
        ${
          isSelf
            ? ''
            : `<button class="btn btn-secondary btn-sm follow-btn" data-user-id="${user.id}">Follow</button>`
        }
      `;

      const followBtn = row.querySelector('.follow-btn');
      if (followBtn) {
        let following = false;
        followBtn.addEventListener('click', async () => {
          followBtn.disabled = true;
          try {
            if (following) {
              await apiDelete(`/users/unfollow/${user.id}`);
              following = false;
              followBtn.textContent = 'Follow';
              followBtn.classList.replace('btn-primary', 'btn-secondary');
            } else {
              await apiPost(`/users/follow/${user.id}`);
              following = true;
              followBtn.textContent = 'Following';
              followBtn.classList.replace('btn-secondary', 'btn-primary');
            }
          } catch (err) {
            toastError(err.message);
          } finally {
            followBtn.disabled = false;
          }
        });
      }

      resultsList.appendChild(row);
    });
  };

  const runSearch = async (query) => {
    loader.hidden = false;
    emptyState.hidden = true;
    try {
      const res = await apiGet(`/users?search=${encodeURIComponent(query)}&limit=30`);
      renderResults(res.data);
    } catch (err) {
      toastError(err.message);
    } finally {
      loader.hidden = true;
    }
  };

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = input.value.trim();
    window.history.replaceState({}, '', `/pages/search.html?q=${encodeURIComponent(query)}`);
    debounceTimer = setTimeout(() => runSearch(query), 350);
  });

  if (initialQuery) {
    runSearch(initialQuery);
  } else {
    loader.hidden = true;
  }
});
