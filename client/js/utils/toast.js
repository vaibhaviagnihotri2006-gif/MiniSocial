let container = null;

const ensureContainer = () => {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.className = 'toast-container';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  document.body.appendChild(container);
  return container;
};

/**
 * Shows an auto-dismissing toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration ms before auto-dismiss
 */
export const showToast = (message, type = 'info', duration = 4000) => {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  ensureContainer().appendChild(el);

  setTimeout(() => {
    el.style.transition = 'opacity 200ms ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 200);
  }, duration);
};

export const toastSuccess = (message) => showToast(message, 'success');
export const toastError = (message) => showToast(message, 'error');
export const toastInfo = (message) => showToast(message, 'info');
