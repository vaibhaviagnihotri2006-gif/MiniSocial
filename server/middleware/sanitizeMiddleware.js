const { stripOperators } = require('../utils/sanitize');

/**
 * Strips any keys containing `$` or `.` from req.body, req.params, and
 * req.query in place, preventing NoSQL operator injection. Mutates
 * properties in place rather than reassigning req.query (which is a
 * getter-only property on newer Express/Node versions).
 */
const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = stripOperators(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    const cleaned = stripOperators(req.params);
    Object.keys(req.params).forEach((k) => delete req.params[k]);
    Object.assign(req.params, cleaned);
  }
  if (req.query && typeof req.query === 'object') {
    const cleaned = stripOperators(req.query);
    Object.keys(req.query).forEach((k) => delete req.query[k]);
    Object.assign(req.query, cleaned);
  }
  next();
};

module.exports = sanitizeRequest;
