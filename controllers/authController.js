const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

function isGoogleConfigured() {
  return GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CALLBACK_URL;
}

async function register(req, res, next) {
  try {
    const { username, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = await authService.createUser(username, hash);
    res.json({ success: true, user });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username already exists' });
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const user = await authService.findUserByUsername(username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, username: user.username } });
  } catch (err) { next(err); }
}

async function logout(req, res) {
  // client should remove token; server-side session not maintained
  res.json({ success: true });
}

async function profile(req, res, next) {
  try {
    const auth = req.headers['authorization'];
    if (!auth) return res.status(401).json({ error: 'Not authenticated' });
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await authService.findUserById(payload.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
}

async function googleAuthUrl(req, res, next) {
  try {
    if (!isGoogleConfigured()) return res.status(500).json({ error: 'Google OAuth not configured on server' });
    const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL);
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'profile', 'email'],
      prompt: 'consent',
      state: req.query.redirect || undefined
    });
    res.redirect(url);
  } catch (err) { next(err); }
}

async function googleCallback(req, res, next) {
  try {
    const code = req.query.code || req.body.code;
    if (!code) return res.status(400).json({ error: 'Authorization code missing' });
    if (!isGoogleConfigured()) return res.status(500).json({ error: 'Google OAuth not configured' });

    const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({ idToken: tokens.id_token, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const displayName = payload.name;
    const picture = payload.picture;

    // find user by google_id or email
    let user = await authService.findUserByGoogleOrEmail(googleId, email);
    if (!user) {
      // create username from email prefix
      const emailPrefix = (email || `google_${googleId}`).split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      let base = emailPrefix || `google_${googleId.substring(0,8)}`;
      let finalUsername = base;
      let counter = 1;
        while (true) {
          const check = await authService.findUserByUsername(finalUsername);
          if (!check) break;
          finalUsername = `${base}${counter}`;
          counter++;
        }
      user = await authService.createUserFromGoogle({ username: finalUsername, googleId, email, displayName, picture });
    }

    if (user.status === 'BANNED') return res.status(403).json({ error: 'Account is banned' });

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // If this was an OAuth redirect, return HTML to postMessage back to opener (useful for popup flows)
    if (req.query && req.query.state === 'popup') {
      const payload = {
        source: 'google-oauth',
        success: true,
        token,
        username: user.username,
        displayName: user.display_name,
        picture: user.profile_picture,
        email: user.email
      };
      const safe = JSON.stringify(payload).replace(/</g, '\\u003c');
      return res.send(`<!DOCTYPE html><html><body><script>if(window.opener){window.opener.postMessage(${safe}, location.origin);}window.close();</script></body></html>`);
    }

    return res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email, displayName: user.display_name, picture: user.profile_picture } });
  } catch (err) { next(err); }
}

module.exports = { register, login, logout, profile, googleAuthUrl, googleCallback };


