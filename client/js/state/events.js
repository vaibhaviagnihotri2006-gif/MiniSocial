const listeners = new Map();

/**
 * Subscribe to an event. Returns an unsubscribe function.
 * @param {string} eventName
 * @param {Function} handler
 */
export const on = (eventName, handler) => {
  if (!listeners.has(eventName)) listeners.set(eventName, new Set());
  listeners.get(eventName).add(handler);
  return () => off(eventName, handler);
};

export const off = (eventName, handler) => {
  if (!listeners.has(eventName)) return;
  listeners.get(eventName).delete(handler);
};

export const emit = (eventName, payload) => {
  if (!listeners.has(eventName)) return;
  listeners.get(eventName).forEach((handler) => {
    try {
      handler(payload);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[events] handler for "${eventName}" threw`, err);
    }
  });
};
