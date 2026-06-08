const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

function sign(payload, opts) {
  return jwt.sign(payload, JWT_SECRET, opts || { expiresIn: '7d' });
}

function verify(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { sign, verify };
