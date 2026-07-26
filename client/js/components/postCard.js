import { apiPost, apiDelete, apiPut } from '../api/client.js';
import { getCurrentUser } from '../state/auth.js';
import { emit } from '../state/events.js';
import { timeAgo } from '../utils/time.js';
import { escapeHTML, validateCaption } from '../utils/validators.js';
import { toastError, toastSuccess } from '../utils/toast.js';

/**
 * Builds a post card DOM node.
 * @param {object} post - post summary object from the API
 * @param {object} [options]
 * @param {boolean} [options.linkToDetail] - wrap caption/image with a link to the single post page
 */
export const createPostCard = (post, options = {}) => {
  const { linkToDetail = true } = options;
  const currentUser = getCurrentUser();
  const isOwner = currentUser && post.author && currentUser.id === post.author.id;

  const wrapper = document.createElement('article');
  wrapper.className = 'post-card';
  wrapper.dataset.postId = post.id;

  const detailHref = `/pages/post.html?id=${post.id}`;
  const profileHref = `/pages/profile.html?username=${encodeURIComponent(post.author?.username || '')}`;

  wrapper.innerHTML = `
    <div class="post-card-header">
      <a href="${profileHref}">
        <img class="post-card-avatar" src="${post.author?.profileImage || '/images/placeholders/default-avatar.png'}" alt="${escapeHTML(post.author?.fullName || 'User')}" />
      </a>
      <div>
        <a href="${profileHref}" class="post-card-author">${escapeHTML(post.author?.fullName || 'Unknown user')}</a>
        <div class="post-card-time">@${escapeHTML(post.author?.username || 'unknown')} &middot; ${timeAgo(post.createdAt)}</div>
      </div>
      ${
        isOwner
          ? `<div class="post-card-menu">
              <button class="btn-icon post-menu-toggle" aria-label="Post options">&#8942;</button>
              <div class="post-card-dropdown" hidden>
                <button class="post-edit-btn">Edit caption</button>
                <button class="post-delete-btn">Delete post</button>
              </div>
            </div>`
          : ''
      }
    </div>
    <div class="post-card-caption-wrap">
      <p class="post-card-caption">${escapeHTML(post.caption)}</p>
      <div class="post-caption-edit-form" hidden>
        <textarea class="form-textarea edit-caption-input" maxlength="500">${escapeHTML(post.caption)}</textarea>
        <div class="form-error edit-caption-error"></div>
        <div class="flex gap-1 mt-1">
          <button class="btn btn-primary btn-sm save-caption-btn">Save</button>
          <button class="btn btn-secondary btn-sm cancel-caption-btn">Cancel</button>
        </div>
      </div>
    </div>
    ${
      post.image
        ? linkToDetail
          ? `<a href="${detailHref}"><img class="post-card-image" src="${post.image}" alt="Post image" loading="lazy" /></a>`
          : `<img class="post-card-image" src="${post.image}" alt="Post image" loading="lazy" />`
        : ''
    }
    <div class="post-card-actions">
      <button class="post-action like-btn ${post.likedByMe ? 'liked' : ''}" aria-pressed="${post.likedByMe}">
        <span class="like-icon">${post.likedByMe ? '♥' : '♡'}</span>
        <span class="like-count">${post.likeCount}</span>
      </button>
      <a class="post-action" href="${detailHref}">
        <span>&#128172;</span>
        <span class="comment-count">${post.commentCount}</span>
      </a>
    </div>
  `;

  // --- Like / unlike ---
  const likeBtn = wrapper.querySelector('.like-btn');
  let liked = post.likedByMe;
  let likeInFlight = false;

  likeBtn.addEventListener('click', async () => {
    if (likeInFlight) return;
    likeInFlight = true;

    const nextLiked = !liked;
    const countEl = likeBtn.querySelector('.like-count');
    const iconEl = likeBtn.querySelector('.like-icon');
    const prevCount = parseInt(countEl.textContent, 10);

    // Optimistic update
    liked = nextLiked;
    likeBtn.classList.toggle('liked', liked);
    likeBtn.setAttribute('aria-pressed', String(liked));
    iconEl.textContent = liked ? '♥' : '♡';
    countEl.textContent = prevCount + (liked ? 1 : -1);

    try {
      const res = liked
        ? await apiPost(`/posts/${post.id}/like`)
        : await apiDelete(`/posts/${post.id}/unlike`);
      countEl.textContent = res.data.likeCount;
    } catch (err) {
      // Roll back on failure
      liked = !nextLiked;
      likeBtn.classList.toggle('liked', liked);
      likeBtn.setAttribute('aria-pressed', String(liked));
      iconEl.textContent = liked ? '♥' : '♡';
      countEl.textContent = prevCount;
      toastError(err.message);
    } finally {
      likeInFlight = false;
    }
  });

  // --- Owner menu (edit / delete) ---
  if (isOwner) {
    const menuToggle = wrapper.querySelector('.post-menu-toggle');
    const dropdown = wrapper.querySelector('.post-card-dropdown');
    menuToggle.addEventListener('click', () => {
      dropdown.hidden = !dropdown.hidden;
    });
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) dropdown.hidden = true;
    });

    const captionEl = wrapper.querySelector('.post-card-caption');
    const editForm = wrapper.querySelector('.post-caption-edit-form');
    const editInput = wrapper.querySelector('.edit-caption-input');
    const editError = wrapper.querySelector('.edit-caption-error');

    wrapper.querySelector('.post-edit-btn').addEventListener('click', () => {
      dropdown.hidden = true;
      captionEl.hidden = true;
      editForm.hidden = false;
      editInput.focus();
    });

    wrapper.querySelector('.cancel-caption-btn').addEventListener('click', () => {
      editForm.hidden = true;
      captionEl.hidden = false;
      editInput.value = post.caption;
      editError.textContent = '';
    });

    wrapper.querySelector('.save-caption-btn').addEventListener('click', async () => {
      const newCaption = editInput.value.trim();
      const validationError = validateCaption(newCaption);
      if (validationError) {
        editError.textContent = validationError;
        return;
      }
      try {
        const res = await apiPut(`/posts/${post.id}`, { caption: newCaption });
        post.caption = res.data.caption;
        captionEl.textContent = res.data.caption;
        editForm.hidden = true;
        captionEl.hidden = false;
        toastSuccess('Post updated');
      } catch (err) {
        editError.textContent = err.message;
      }
    });

    wrapper.querySelector('.post-delete-btn').addEventListener('click', async () => {
      dropdown.hidden = true;
      if (!window.confirm('Delete this post? This cannot be undone.')) return;
      try {
        await apiDelete(`/posts/${post.id}`);
        wrapper.remove();
        emit('post:deleted', { id: post.id });
        toastSuccess('Post deleted');
      } catch (err) {
        toastError(err.message);
      }
    });
  }

  return wrapper;
};

export const createPostSkeleton = () => {
  const el = document.createElement('div');
  el.className = 'card skeleton-post';
  return el;
};
