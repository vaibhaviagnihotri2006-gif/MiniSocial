import { apiGet, apiPost, apiDelete } from '../api/client.js';
import { getCurrentUser, updateCurrentUser } from '../state/auth.js';
import { requireAuth, getQueryParam } from '../utils/router.js';
import { renderNavbar } from '../components/navbar.js';
import { createPostCard, createPostSkeleton } from '../components/postCard.js';
import { on } from '../state/events.js';
import { formatJoinDate } from '../utils/time.js';
import { escapeHTML } from '../utils/validators.js';
import { toastError } from '../utils/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  const navMount = document.getElementById('navbar-mount');
  if (navMount) renderNavbar(navMount);

  const currentUser = getCurrentUser();
  const username = getQueryParam('username') || currentUser?.username;

  const headerMount = document.getElementById('profile-header');
  const postsGrid = document.getElementById('profile-posts-grid');
  const loader = document.getElementById('profile-loader');
  const emptyPosts = document.getElementById('profile-posts-empty');

  let page = 1;
  let totalPages = 1;
  let loadingPosts = false;
  let profileUserId = null;

  const renderHeader = (profile, isFollowing) => {
    const isOwnProfile = currentUser && currentUser.username === profile.username;

    headerMount.innerHTML = `
      <div class="profile-cover" style="${profile.coverImage ? `background-image:url('${profile.coverImage}')` : ''}"></div>
      <div class="profile-header">
        <img class="profile-avatar" src="${profile.profileImage || '/images/placeholders/default-avatar.png'}" alt="${escapeHTML(profile.fullName)}" />
        <div class="profile-meta">
          <div>
            <div class="profile-name">${escapeHTML(profile.fullName)}</div>
            <div class="profile-username">@${escapeHTML(profile.username)}</div>
            ${profile.bio ? `<p class="profile-bio">${escapeHTML(profile.bio)}</p>` : '<p class="profile-bio text-muted">No bio yet.</p>'}
          </div>
          <div>
            ${
              isOwnProfile
                ? '<a class="btn btn-secondary" href="/pages/edit-profile.html">Edit Profile</a>'
                : `<button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}" id="follow-toggle-btn">${isFollowing ? 'Following' : 'Follow'}</button>`
            }
          </div>
        </div>
        <div class="profile-stats">
          <div><strong id="stat-posts">${profile.postCount}</strong><span class="text-muted">Posts</span></div>
          <div><strong id="stat-followers">${profile.followersCount}</strong><span class="text-muted">Followers</span></div>
          <div><strong id="stat-following">${profile.followingCount}</strong><span class="text-muted">Following</span></div>
        </div>
        <div class="profile-join-date">Joined ${formatJoinDate(profile.createdAt)}</div>
      </div>
    `;

    if (!isOwnProfile) {
      const followBtn = document.getElementById('follow-toggle-btn');
      let following = isFollowing;
      followBtn.addEventListener('click', async () => {
        followBtn.disabled = true;
        try {
          const res = following
            ? await apiDelete(`/users/unfollow/${profile.id}`)
            : await apiPost(`/users/follow/${profile.id}`);
          following = !following;
          followBtn.textContent = following ? 'Following' : 'Follow';
          followBtn.classList.toggle('btn-primary', !following);
          followBtn.classList.toggle('btn-secondary', following);
          document.getElementById('stat-followers').textContent = res.data.followersCount;
        } catch (err) {
          toastError(err.message);
        } finally {
          followBtn.disabled = false;
        }
      });
    }
  };

  const loadPosts = async () => {
    if (loadingPosts || page > totalPages || !profileUserId) return;
    loadingPosts = true;
    loader.hidden = false;

    let skeleton;
    if (page === 1) {
      skeleton = createPostSkeleton();
      postsGrid.appendChild(skeleton);
    }

    try {
      const res = await apiGet(`/posts?user=${profileUserId}&page=${page}&limit=12`);
      skeleton?.remove();
      totalPages = res.meta?.totalPages || 1;

      if (page === 1 && res.data.length === 0) {
        emptyPosts.hidden = false;
      }

      res.data.forEach((post) => postsGrid.appendChild(createPostCard(post)));
      page += 1;
    } catch (err) {
      skeleton?.remove();
      toastError(err.message);
    } finally {
      loadingPosts = false;
      loader.hidden = page > totalPages;
    }
  };

  on('post:deleted', () => {
    if (!postsGrid.querySelector('.post-card')) emptyPosts.hidden = false;
    const statPosts = document.getElementById('stat-posts');
    if (statPosts) statPosts.textContent = Math.max(parseInt(statPosts.textContent, 10) - 1, 0);
  });

  window.addEventListener('scroll', () => {
    const scrolledToBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
    if (scrolledToBottom) loadPosts();
  });

  if (!username) {
    toastError('No profile specified.');
    return;
  }

  try {
    const res = await apiGet(`/users/username/${encodeURIComponent(username)}`);
    const profile = res.data;
    profileUserId = profile.id;

    const isOwnProfile = currentUser && currentUser.username === profile.username;
    let isFollowing = false;

    if (!isOwnProfile && currentUser) {
      try {
        const me = await apiGet('/auth/me');
        isFollowing = (me.data.followingIds || []).includes(profile.id);
      } catch (e) {
        /* if this fails, default to not-following state */
      }
    }

    renderHeader(profile, isFollowing);

    if (isOwnProfile) {
      updateCurrentUser({
        fullName: profile.fullName,
        bio: profile.bio,
        profileImage: profile.profileImage,
        coverImage: profile.coverImage,
      });
    }

    loadPosts();
  } catch (err) {
    if (err.status === 404) {
      window.location.href = '/pages/404.html';
    } else {
      toastError(err.message);
    }
  }
});
