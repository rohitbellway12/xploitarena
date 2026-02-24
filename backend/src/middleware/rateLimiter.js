const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 100 to 1000 for better dev/admin experience
  standardHeaders: true, 
  legacyHeaders: false, 
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

// Strict rate limiter for Auth routes (Login/Register/Reset)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // Increased from 100 to 200
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts from this IP, please try again after an hour',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
