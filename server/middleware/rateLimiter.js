const rateLimit = require('express-rate-limit');

const jsonHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later.',
    error: { code: 'RATE_LIMITED', fields: [] },
  });
};

/** General API limiter: 300 requests / 15 min per IP */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

/** Stricter limiter for auth endpoints to slow credential stuffing */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

module.exports = { apiLimiter, authLimiter };
