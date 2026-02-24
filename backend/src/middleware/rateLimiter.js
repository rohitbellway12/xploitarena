const rateLimit = require('express-rate-limit');
const settingService = require('../services/setting.service');

// Wrapper function to get dynamic config
const getDynamicConfig = async (defaultLimit, defaultWindowMins) => {
  try {
    const config = await settingService.get('traffic_config');
    return {
      limit: config?.apiLimit || defaultLimit,
      windowMs: (config?.lockoutTime || defaultWindowMins) * 60 * 1000
    };
  } catch (error) {
    return { limit: defaultLimit, windowMs: defaultWindowMins * 60 * 1000 };
  }
};

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: async (req, res) => {
    const config = await getDynamicConfig(1000, 15);
    return config.limit;
  },
  standardHeaders: true, 
  legacyHeaders: false, 
  message: {
    message: 'Too many requests, please try again later.',
  },
});

// Strict rate limiter for Auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts, please try again after an hour',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
