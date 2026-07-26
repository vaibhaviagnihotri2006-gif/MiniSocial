import { getCurrentUser, clearSession, isAuthenticated } from '../state/auth.js';
import { on } from '../state/events.js';
import { navigate } from '../utils/router.js';
import { escapeHTML } from '../utils/validators.js';

/**
 * Renders the responsive navbar into the given mount element and wires
 * up its interactions. Re-renders automatically when auth state changes.
 * @param {HTMLElement} mount
 */
export const renderNavbar = (mount) => {
  const render = () => {
    const user = getCurrentUser();
    const authed = isAuthenticated();

    mount.innerHTML = `
      <nav class="navbar">
        <div class="navbar-inner">
          <a class="navbar-brand" href="${authed ? '/pages/feed.html' : '/index.html'}">MiniSocial</a>
          ${
            authed
              ? `<form class="navbar-search" id="navbar-search-form" role="search">
                  <input type="search" id="navbar-search-input" placeholder="Search people..." aria-label="Search users" />
                </form>`
              : ''
          }
          <button class="btn-icon navbar-menu-toggle" id="navbar-menu-toggle" aria-label="Toggle menu" aria-expanded="false">☰</button>
          <div class="navbar-links" id="navbar-links">
            ${
              authed
                ? `
                  <a class="btn btn-secondary" href="./feed.html">Feed</a>
                  <a class="btn btn-secondary" href="/pages/search.html">Search</a>
                  <a href="/pages/profile.html?username=${encodeURIComponent(user?.username || '')}" title="My profile">
                    <img class="navbar-avatar" src="${user?.profileImage || '/images/placeholders/default-avatar.png'}" alt="${escapeHTML(user?.fullName || 'Profile')}" />
                  </a>
                  <button class="btn btn-secondary" id="navbar-logout">Log out</button>
                `
                : `
                  <a class="btn btn-secondary" href="/pages/login.html">Log in</a>
                  <a class="btn btn-primary" href="./pages/register.html">Sign up</a>
                `
            }
          </div>
        </div>
      </nav>
    `;

    const menuToggle = mount.querySelector('#navbar-menu-toggle');
    const links = mount.querySelector('#navbar-links');
    if (menuToggle && links) {
      menuToggle.addEventListener('click', () => {
        const isOpen = links.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    const logoutBtn = mount.querySelector('#navbar-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        clearSession();
        navigate('/index.html');
      });
    }

    const searchForm = mount.querySelector('#navbar-search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = mount.querySelector('#navbar-search-input').value.trim();
        navigate(`./pages/search.html?q=${encodeURIComponent(q)}`);
      });
    }
  };

  render();
  on('auth:changed', render);
};
