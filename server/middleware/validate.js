const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Runs after an array of express-validator chains. Collects errors and
 * throws a single ApiError with a `fields` list if any check failed.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const fields = [...new Set(errors.array().map((e) => e.path))];
  const firstMessage = errors.array()[0].msg;
  return next(ApiError.badRequest(firstMessage, fields));
};

module.exports = validate;
