import { apiGet, apiPostForm } from '../api/client.js';
import { getCurrentUser } from '../state/auth.js';
import { requireAuth } from '../utils/router.js';
import { renderNavbar } from '../components/navbar.js';
import { createPostCard, createPostSkeleton } from '../components/postCard.js';
import { on } from '../state/events.js';
import { validateCaption, validateImageFile } from '../utils/validators.js';
import { toastError, toastSuccess } from '../utils/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  const navMount = document.getElementById('navbar-mount');
  if (navMount) renderNavbar(navMount);

  const currentUser = getCurrentUser();

  const feedList = document.getElementById('feed-list');
  const loader = document.getElementById('feed-loader');
  const emptyState = document.getElementById('feed-empty');

  const composerAvatar = document.getElementById('composer-avatar');
  if (composerAvatar) {
    composerAvatar.src = currentUser?.profileImage || '/images/placeholders/default-avatar.png';
  }

  const captionInput = document.getElementById('composer-caption');
  const captionCounter = document.getElementById('composer-char-counter');
  const captionError = document.getElementById('composer-error');
  const imageInput = document.getElementById('composer-image-input');
  const previewWrap = document.getElementById('composer-preview');
  const submitBtn = document.getElementById('composer-submit');

  let selectedFile = null;
  let page = 1;
  let totalPages = 1;
  let loading = false;

  captionInput?.addEventListener('input', () => {
    captionCounter.textContent = `${captionInput.value.length} / 500`;
    captionCounter.classList.toggle('limit-near', captionInput.value.length > 480);
  });

  imageInput?.addEventListener('change', () => {
    const file = imageInput.files[0];
    const err = validateImageFile(file);
    if (err) {
      captionError.textContent = err;
      imageInput.value = '';
      return;
    }
    captionError.textContent = '';
    selectedFile = file || null;
    renderPreview();
  });

  const renderPreview = () => {
    previewWrap.innerHTML = '';
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    previewWrap.innerHTML = `
      <div class="composer-preview">
        <img src="${url}" alt="Selected image preview" />
        <button type="button" class="remove-preview" aria-label="Remove image">&times;</button>
      </div>
    `;
    previewWrap.querySelector('.remove-preview').addEventListener('click', () => {
      selectedFile = null;
      imageInput.value = '';
      previewWrap.innerHTML = '';
    });
  };

  submitBtn?.addEventListener('click', async () => {
    const caption = captionInput.value.trim();
    const validationError = validateCaption(caption);
    if (validationError) {
      captionError.textContent = validationError;
      return;
    }
    captionError.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    try {
      const formData = new FormData();
      formData.append('caption', caption);
      if (selectedFile) formData.append('image', selectedFile);

      const res = await apiPostForm('/posts', formData);
      emptyState.hidden = true;
      feedList.prepend(createPostCard(res.data));

      captionInput.value = '';
      captionCounter.textContent = '0 / 500';
      selectedFile = null;
      imageInput.value = '';
      previewWrap.innerHTML = '';
      toastSuccess('Post published!');
    } catch (err) {
      captionError.textContent = err.message;
      toastError(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post';
    }
  });

  const loadNextPage = async () => {
    if (loading || page > totalPages) return;
    loading = true;
    loader.hidden = false;

    // Skeletons while loading first page
    let skeletons = [];
    if (page === 1) {
      skeletons = [createPostSkeleton(), createPostSkeleton()];
      skeletons.forEach((s) => feedList.appendChild(s));
    }

    try {
      const res = await apiGet(`/posts?page=${page}&limit=10`);
      skeletons.forEach((s) => s.remove());

      totalPages = res.meta?.totalPages || 1;

      if (page === 1 && res.data.length === 0) {
        emptyState.hidden = false;
      }

      const existingIds = new Set(
        Array.from(feedList.querySelectorAll('.post-card')).map((el) => el.dataset.postId)
      );

      res.data.forEach((post) => {
        if (!existingIds.has(post.id)) {
          feedList.appendChild(createPostCard(post));
        }
      });

      page += 1;
    } catch (err) {
      skeletons.forEach((s) => s.remove());
      toastError(err.message);
    } finally {
      loading = false;
      loader.hidden = page > totalPages;
    }
  };

  on('post:deleted', () => {
    if (!feedList.querySelector('.post-card')) emptyState.hidden = false;
  });

  window.addEventListener('scroll', () => {
    const scrolledToBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
    if (scrolledToBottom) loadNextPage();
  });

  loadNextPage();
});
