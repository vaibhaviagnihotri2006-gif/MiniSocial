import { apiGet } from '../api/client.js';
import { requireAuth, getQueryParam, navigate } from '../utils/router.js';
import { renderNavbar } from '../components/navbar.js';
import { createPostCard } from '../components/postCard.js';
import { mountCommentThread } from '../components/commentThread.js';
import { on } from '../state/events.js';
import { toastError } from '../utils/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  const navMount = document.getElementById('navbar-mount');
  if (navMount) renderNavbar(navMount);

  const postId = getQueryParam('id');
  const postMount = document.getElementById('post-detail-mount');
  const commentsMount = document.getElementById('comments-mount');
  const loader = document.getElementById('post-loader');
  const notFoundEl = document.getElementById('post-not-found');

  if (!postId) {
    navigate('/pages/404.html');
    return;
  }

  on('post:deleted', ({ id }) => {
    if (id === postId) navigate('/pages/feed.html');
  });

  try {
    const res = await apiGet(`/posts/${postId}`);
    const post = res.data;
    loader.hidden = true;

    postMount.appendChild(createPostCard(post, { linkToDetail: false }));

    const commentCountEl = document.querySelector(
      `[data-post-id="${post.id}"] .comment-count`
    );

    mountCommentThread(commentsMount, postId, {
      postAuthorId: post.author?.id,
      onCommentCountChange: (delta) => {
        if (commentCountEl) {
          commentCountEl.textContent = parseInt(commentCountEl.textContent, 10) + delta;
        }
      },
    });
  } catch (err) {
    loader.hidden = true;
    if (err.status === 404) {
      notFoundEl.hidden = false;
    } else {
      toastError(err.message);
    }
  }
});
