import { apiPutForm } from '../api/client.js';
import { getCurrentUser, updateCurrentUser } from '../state/auth.js';
import { requireAuth, navigate } from '../utils/router.js';
import { renderNavbar } from '../components/navbar.js';
import { validateFullName, validateBio, validateImageFile } from '../utils/validators.js';
import { toastSuccess, toastError } from '../utils/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  const navMount = document.getElementById('navbar-mount');
  if (navMount) renderNavbar(navMount);

  const currentUser = getCurrentUser();

  const fullNameInput = document.getElementById('edit-fullName');
  const bioInput = document.getElementById('edit-bio');
  const bioCounter = document.getElementById('edit-bio-counter');
  const profileImageInput = document.getElementById('edit-profileImage');
  const coverImageInput = document.getElementById('edit-coverImage');
  const profilePreview = document.getElementById('edit-profile-preview');
  const coverPreview = document.getElementById('edit-cover-preview');
  const form = document.getElementById('edit-profile-form');
  const formError = document.getElementById('edit-profile-error');
  const submitBtn = document.getElementById('edit-profile-submit');

  fullNameInput.value = currentUser?.fullName || '';
  bioInput.value = currentUser?.bio || '';
  bioCounter.textContent = `${bioInput.value.length} / 160`;
  profilePreview.src = currentUser?.profileImage || '/images/placeholders/default-avatar.png';
  if (currentUser?.coverImage) coverPreview.src = currentUser.coverImage;

  let selectedProfileFile = null;
  let selectedCoverFile = null;

  bioInput.addEventListener('input', () => {
    bioCounter.textContent = `${bioInput.value.length} / 160`;
    bioCounter.classList.toggle('limit-near', bioInput.value.length > 150);
  });

  profileImageInput.addEventListener('change', () => {
    const file = profileImageInput.files[0];
    const err = validateImageFile(file);
    if (err) {
      formError.textContent = err;
      profileImageInput.value = '';
      return;
    }
    formError.textContent = '';
    selectedProfileFile = file || null;
    if (file) profilePreview.src = URL.createObjectURL(file);
  });

  coverImageInput.addEventListener('change', () => {
    const file = coverImageInput.files[0];
    const err = validateImageFile(file);
    if (err) {
      formError.textContent = err;
      coverImageInput.value = '';
      return;
    }
    formError.textContent = '';
    selectedCoverFile = file || null;
    if (file) coverPreview.src = URL.createObjectURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.textContent = '';

    const fullNameError = validateFullName(fullNameInput.value);
    const bioError = validateBio(bioInput.value);
    if (fullNameError || bioError) {
      formError.textContent = fullNameError || bioError;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      const formData = new FormData();
      formData.append('fullName', fullNameInput.value.trim());
      formData.append('bio', bioInput.value.trim());
      if (selectedProfileFile) formData.append('profileImage', selectedProfileFile);
      if (selectedCoverFile) formData.append('coverImage', selectedCoverFile);

      const res = await apiPutForm('/users/profile', formData);
      updateCurrentUser(res.data);
      toastSuccess('Profile updated successfully');
      navigate(`/pages/profile.html?username=${encodeURIComponent(res.data.username)}`);
    } catch (err) {
      formError.textContent = err.message;
      toastError(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Changes';
    }
  });
});
