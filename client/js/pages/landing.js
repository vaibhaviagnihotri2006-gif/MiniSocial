import { isAuthenticated } from '../state/auth.js';
import { renderNavbar } from '../components/navbar.js';

document.addEventListener('DOMContentLoaded', () => {
  const navMount = document.getElementById('navbar-mount');
  if (navMount) renderNavbar(navMount);

  const ctaWrap = document.getElementById('landing-cta');
  if (isAuthenticated() && ctaWrap) {
    ctaWrap.innerHTML = `<a class="btn btn-primary" href="/feed.html">Go to your feed</a>`;
  }
});
