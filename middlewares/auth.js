const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// ============ AUTHENTICATE TOKEN MIDDLEWARE ============
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.cookies['auth'];
  const token = authHeader && authHeader.split ? authHeader.split(' ')[1] : authHeader;
  
  if (!token) {
    return res.status(401).json({ error: 'Token missing. Please login first.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// ============ VERIFY USER IS NOT BANNED OR LOCKED ============
async function verifyUserStatus(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await authService.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.status === 'BANNED') {
      return res.status(403).json({ error: 'Your account has been banned' });
    }

    if (user.status === 'LOCKED') {
      return res.status(403).json({ error: 'Your account is temporarily locked. Please try again later.' });
    }

    req.user.status = user.status;
    next();
  } catch (err) {
    next(err);
  }
}

// ============ RATE LIMITING (simple in-memory) ============
const requestLimits = new Map();

function rateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requestLimits.has(identifier)) {
      requestLimits.set(identifier, []);
    }

    const requests = requestLimits.get(identifier);
    
    // Remove old requests outside the time window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    validRequests.push(now);
    requestLimits.set(identifier, validRequests);
    next();
  };
}

// ============ LOGIN RATE LIMITING (stricter for login endpoint) ============
const loginAttempts = new Map();

function loginRateLimit(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!loginAttempts.has(identifier)) {
      loginAttempts.set(identifier, []);
    }

    const attempts = loginAttempts.get(identifier);
    const validAttempts = attempts.filter(time => now - time < windowMs);

    if (validAttempts.length >= maxAttempts) {
      return res.status(429).json({ 
        error: 'Too many login attempts. Please try again in 15 minutes.',
        retryAfter: 15 * 60
      });
    }

    validAttempts.push(now);
    loginAttempts.set(identifier, validAttempts);
    next();
  };
}

// ============ OPTIONAL USER (doesn't require auth) ============
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.cookies['auth'];
  const token = authHeader && authHeader.split ? authHeader.split(' ')[1] : authHeader;

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
    } catch (err) {
      // Token invalid but not required, continue anyway
    }
  }
  next();
}

module.exports = {
  authenticateToken,
  verifyUserStatus,
  rateLimit,
  loginRateLimit,
  optionalAuth
};
