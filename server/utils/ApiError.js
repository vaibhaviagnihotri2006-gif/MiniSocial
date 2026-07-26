/**
 * Represents a known, "operational" error whose message is safe to
 * expose to the client (validation failures, not-found, forbidden, etc).
 */
class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR', fields = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, fields = []) {
    return new ApiError(400, message, 'VALIDATION_ERROR', fields);
  }

  static unauthorized(message = 'Not authenticated') {
    return new ApiError(401, message, 'UNAUTHENTICATED');
  }

  static forbidden(message = 'Not authorized to perform this action') {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message, 'CONFLICT');
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, message, 'RATE_LIMITED');
  }
}

module.exports = ApiError;
