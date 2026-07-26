import { apiGet, apiPost, apiDelete } from '../api/client.js';
import { getCurrentUser } from '../state/auth.js';
import { timeAgo } from '../utils/time.js';
import { escapeHTML, validateCommentText } from '../utils/validators.js';
import { toastError, toastSuccess } from '../utils/toast.js';

/**
 * Mounts an interactive, paginated comment thread for a post.
 * @param {HTMLElement} mount
 * @param {string} postId
 * @param {object} [options]
 * @param {string} [options.postAuthorId]
 * @param {Function} [options.onCommentCountChange]
 */
export const mountCommentThread = (mount, postId, options = {}) => {
  const { postAuthorId, onCommentCountChange } = options;
  const currentUser = getCurrentUser();
  let page = 1;
  let totalPages = 1;
  let loading = false;

  mount.innerHTML = `
    <div class="comment-composer">
      <img class="comment-avatar" src="${currentUser?.profileImage || '/images/placeholders/default-avatar.png'}" alt="You" />
      <div style="flex:1;">
        <textarea class="form-textarea comment-input" placeholder="Add a comment..." maxlength="300"></textarea>
        <div class="flex-between">
          <span class="char-counter comment-char-counter">0 / 300</span>
          <button class="btn btn-primary btn-sm comment-submit-btn">Post</button>
        </div>
        <div class="form-error comment-error"></div>
      </div>
    </div>
    <h3 class="comments-heading">Comments</h3>
    <div class="comment-list"></div>
    <div class="feed-loader comment-loader" hidden>Loading comments...</div>
    <div class="empty-state comment-empty" hidden>
      <div class="empty-state-icon">&#128172;</div>
      <h3>No comments yet</h3>
      <p>Be the first to share your thoughts.</p>
    </div>
    <button class="btn btn-secondary btn-block load-more-comments" hidden>Load more comments</button>
  `;

  const list = mount.querySelector('.comment-list');
  const loader = mount.querySelector('.comment-loader');
  const emptyState = mount.querySelector('.comment-empty');
  const loadMoreBtn = mount.querySelector('.load-more-comments');
  const input = mount.querySelector('.comment-input');
  const counter = mount.querySelector('.comment-char-counter');
  const errorEl = mount.querySelector('.comment-error');
  const submitBtn = mount.querySelector('.comment-submit-btn');

  input.addEventListener('input', () => {
    counter.textContent = `${input.value.length} / 300`;
    counter.classList.toggle('limit-near', input.value.length > 280);
  });

  const renderComment = (comment) => {
    const canDelete =
      currentUser &&
      (currentUser.id === comment.author?.id || currentUser.id === postAuthorId);

    const el = document.createElement('div');
    el.className = 'comment-item';
    el.dataset.commentId = comment.id;
    el.innerHTML = `
      <img class="comment-avatar" src="${comment.author?.profileImage || '/images/placeholders/default-avatar.png'}" alt="${escapeHTML(comment.author?.fullName || 'User')}" />
      <div class="comment-body">
        <span><a href="/pages/profile.html?username=${encodeURIComponent(comment.author?.username || '')}" class="comment-author">${escapeHTML(comment.author?.fullName || 'Unknown')}</a> <span class="comment-text">${escapeHTML(comment.text)}</span></span>
        <div class="comment-meta">
          <span>${timeAgo(comment.createdAt)}</span>
          ${canDelete ? '<button class="comment-delete">Delete</button>' : ''}
        </div>
      </div>
    `;

    if (canDelete) {
      el.querySelector('.comment-delete').addEventListener('click', async () => {
        if (!window.confirm('Delete this comment?')) return;
        try {
          await apiDelete(`/comments/${comment.id}`);
          el.remove();
          onCommentCountChange?.(-1);
          if (!list.children.length) emptyState.hidden = false;
        } catch (err) {
          toastError(err.message);
        }
      });
    }

    return el;
  };

  const loadPage = async () => {
    if (loading || page > totalPages) return;
    loading = true;
    loader.hidden = false;
    try {
      const res = await apiGet(`/posts/${postId}/comments?page=${page}&limit=20`);
      totalPages = res.meta?.totalPages || 1;
      if (page === 1 && res.data.length === 0) {
        emptyState.hidden = false;
      } else {
        emptyState.hidden = true;
      }
      res.data.forEach((comment) => list.appendChild(renderComment(comment)));
      page += 1;
      loadMoreBtn.hidden = page > totalPages;
    } catch (err) {
      toastError(err.message);
    } finally {
      loading = false;
      loader.hidden = true;
    }
  };

  loadMoreBtn.addEventListener('click', loadPage);

  submitBtn.addEventListener('click', async () => {
    const text = input.value.trim();
    const validationError = validateCommentText(text);
    if (validationError) {
      errorEl.textContent = validationError;
      return;
    }
    errorEl.textContent = '';
    submitBtn.disabled = true;
    try {
      const res = await apiPost(`/posts/${postId}/comments`, { text });
      emptyState.hidden = true;
      list.prepend(renderComment(res.data));
      input.value = '';
      counter.textContent = '0 / 300';
      onCommentCountChange?.(1);
      toastSuccess('Comment added');
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      submitBtn.disabled = false;
    }
  });

  loadPage();
};
