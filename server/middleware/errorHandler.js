const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    error: { code: 'NOT_FOUND', fields: [] },
  });
};

const normalizeError = (err) => {
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const fields = Object.keys(err.errors || {});
    const message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(', ') || 'Validation failed';
    return { statusCode: 400, message, code: 'VALIDATION_ERROR', fields };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    return {
      statusCode: 409,
      message: `${fields.join(', ')} already in use`,
      code: 'CONFLICT',
      fields,
    };
  }

  // Mongoose invalid ObjectId cast
  if (err.name === 'CastError') {
    return {
      statusCode: 400,
      message: `Invalid value for ${err.path}`,
      code: 'VALIDATION_ERROR',
      fields: [err.path],
    };
  }

  if (err.isOperational) {
    return {
      statusCode: err.statusCode,
      message: err.message,
      code: err.code,
      fields: err.fields || [],
    };
  }

  return null;
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const normalized = normalizeError(err);

  if (normalized) {
    return res.status(normalized.statusCode).json({
      success: false,
      message: normalized.message,
      error: { code: normalized.code, fields: normalized.fields },
    });
  }

  const requestId = uuidv4();
  // eslint-disable-next-line no-console
  console.error(`[error] requestId=${requestId} route=${req.originalUrl}`, err);

  return res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === 'production'
        ? 'Something went wrong on our end. Please try again.'
        : err.message,
    error: { code: 'INTERNAL_ERROR', requestId },
  });
};

module.exports = { errorHandler, notFoundHandler };
