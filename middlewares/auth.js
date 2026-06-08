const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.cookies['auth'];
  const token = authHeader && authHeader.split ? authHeader.split(' ')[1] : authHeader;
  if (!token) return res.status(401).json({ error: 'Token missing' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authenticateToken };
