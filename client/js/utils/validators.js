export const USERNAME_REGEX = /^[a-z0-9_]+$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const validateFullName = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Full name is required';
  if (trimmed.length > 100) return 'Full name cannot exceed 100 characters';
  return null;
};

export const validateUsername = (value) => {
  const trimmed = (value || '').trim().toLowerCase();
  if (trimmed.length < 3 || trimmed.length > 20) {
    return 'Username must be 3-20 characters';
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return 'Only lowercase letters, numbers, and underscores allowed';
  }
  return null;
};

export const validateEmail = (value) => {
  if (!EMAIL_REGEX.test((value || '').trim())) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePassword = (value) => {
  if (!value || value.length < 8) {
    return 'Password must be at least 8 characters';
  }
  return null;
};

export const validateBio = (value) => {
  if ((value || '').length > 160) return 'Bio cannot exceed 160 characters';
  return null;
};

export const validateCaption = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Caption is required';
  if (trimmed.length > 500) return 'Caption cannot exceed 500 characters';
  return null;
};

export const validateCommentText = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Comment cannot be empty';
  if (trimmed.length > 300) return 'Comment cannot exceed 300 characters';
  return null;
};

export const validateImageFile = (file) => {
  if (!file) return null;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, and WebP images are allowed';
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Image must be smaller than 5MB';
  }
  return null;
};

/** Escapes HTML special characters to prevent XSS when injecting user text. */
export const escapeHTML = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
