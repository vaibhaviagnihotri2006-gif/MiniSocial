const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const sanitizeRequest = require('./middleware/sanitizeMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentTopLevelRoutes = require('./routes/commentTopLevelRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

app.set('trust proxy', 1);

// 1. Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. CORS restricted to configured frontend origin(s)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.CORS_ORIGIN.length === 0 || env.CORS_ORIGIN.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// 3. Body parsing with size limit
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// NoSQL injection protection
app.use(sanitizeRequest);

// 4. Rate limiting (auth routes have their own stricter limiter)
app.use('/api', apiLimiter);

// 5. Request logging
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check (unauthenticated, for uptime monitors)
app.use('/api/health', healthRoutes);

// 6/7. Routes (auth + validation middleware attached per-route)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentTopLevelRoutes);

// 404 for unmatched routes
app.use(notFoundHandler);

// 8. Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
