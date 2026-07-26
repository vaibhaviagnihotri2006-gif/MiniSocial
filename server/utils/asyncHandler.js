/**
 * Wraps an async Express route handler and forwards any rejected
 * promise to the centralized error-handling middleware via next().
 * @param {Function} fn - async (req, res, next) => {}
 * @returns {Function}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
