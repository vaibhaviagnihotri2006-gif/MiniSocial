import { API_BASE_URL } from '../config.js';
import { getToken, clearSession } from '../state/auth.js';
import { emit } from '../state/events.js';

class ApiClientError extends Error {
  constructor(message, status, code, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields || [];
  }
}

const buildHeaders = (isFormData) => {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

/**
 * Core request function. Handles JSON and FormData bodies, injects the
 * JWT, unwraps the standard { success, message, data } envelope, and
 * normalizes errors into ApiClientError instances.
 */
const request = async (path, { method = 'GET', body, isFormData = false } = {}) => {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: buildHeaders(isFormData),
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new ApiClientError(
      'Unable to reach the server. Check your connection and try again.',
      0,
      'NETWORK_ERROR'
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (parseErr) {
    payload = null;
  }

  if (response.status === 401) {
    clearSession();
    emit('auth:expired');
  }

  if (!response.ok) {
    const message =
      (payload && payload.message) || 'Something went wrong, please try again.';
    const code = payload && payload.error ? payload.error.code : 'ERROR';
    const fields = payload && payload.error ? payload.error.fields : [];
    throw new ApiClientError(message, response.status, code, fields);
  }

  return payload;
};

export const apiGet = (path) => request(path, { method: 'GET' });

export const apiPost = (path, body) => request(path, { method: 'POST', body });

export const apiPut = (path, body) => request(path, { method: 'PUT', body });

export const apiDelete = (path) => request(path, { method: 'DELETE' });

export const apiPostForm = (path, formData) =>
  request(path, { method: 'POST', body: formData, isFormData: true });

export const apiPutForm = (path, formData) =>
  request(path, { method: 'PUT', body: formData, isFormData: true });

export { ApiClientError };
