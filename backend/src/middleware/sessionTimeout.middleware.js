// Session Timeout Middleware
// Checks if the JWT was issued too long ago, acting as a sliding session timeout.
// Use AFTER the protect middleware so req.user is available.

const SESSION_TIMEOUT_HOURS = parseInt(process.env.SESSION_TIMEOUT_HOURS || '8', 10);
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_HOURS * 60 * 60 * 1000;

const sessionTimeout = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // JWT iat (issued at) is in seconds; convert to ms
    const tokenIssuedAt = req.user.iat ? req.user.iat * 1000 : null;

    // If we can't determine issue time, skip the check (trust the protect middleware)
    if (!tokenIssuedAt) return next();

    const elapsed = Date.now() - tokenIssuedAt;
    if (elapsed > SESSION_TIMEOUT_MS) {
      return res.status(401).json({
        message: 'Session expired. Please log in again.',
        code: 'SESSION_EXPIRED',
      });
    }

    next();
  } catch (error) {
    console.error('Session Timeout Middleware Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { sessionTimeout };
