const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
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

// ============ REGISTRATION (Google OAuth only) ============
async function register(req, res, next) {
  try {
    return res.status(403).json({ error: 'Direct registration is not allowed. Please use Google OAuth to sign up.' });
  } catch (err) {
    next(err);
  }
}

// ============ LOGIN with Username or Email + Password ============
async function login(req, res, next) {
  try {
    const { usernameOrEmail, password } = req.body;
    
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    // Find user by username or email
    const user = await authService.findUserByUsernameOrEmail(usernameOrEmail);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is locked or banned
    const isLocked = await authService.isUserLocked(user.id);
    if (isLocked) {
      return res.status(403).json({ error: 'Account is locked or banned. Please try again later.' });
    }

    // For Google-only users without password
    if (user.is_google && !user.password_set) {
      return res.status(403).json({ error: 'This account was created with Google OAuth. Please set a password first or login with Google.' });
    }

    // Verify password
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      // Increment failed login attempts
      const lockResult = await authService.incrementFailedLoginAttempts(user.id);
      if (lockResult.locked) {
        return res.status(403).json({ error: 'Too many failed login attempts. Account locked for 30 minutes.' });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset failed attempts on successful login
    await authService.resetFailedLoginAttempts(user.id);

    // Check if 2FA is needed
    if (process.env.ENABLE_2FA === 'true') {
      const code = await authService.generateAndStoreVerificationCode(user.id);
      // In production, send via email or SMS
      console.log(`[2FA] Verification code for user ${user.id}: ${code}`);
      return res.json({ 
        success: false, 
        requiresVerification: true, 
        userId: user.id,
        message: 'Verification code sent. Please check your email or SMS.' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        picture: user.profile_picture,
        isGoogle: user.is_google
      }
    });
  } catch (err) {
    next(err);
  }
}

// ============ VERIFY 2FA CODE ============
async function verify2FA(req, res, next) {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ error: 'User ID and verification code are required' });
    }

    const user = await authService.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await authService.verifyVerificationCode(userId, code);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired verification code' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        picture: user.profile_picture
      }
    });
  } catch (err) {
    next(err);
  }
}

// ============ LOGOUT ============
async function logout(req, res) {
  res.json({ success: true, message: 'Logged out successfully' });
}

// ============ GET PROFILE ============
async function profile(req, res, next) {
  try {
    const auth = req.headers['authorization'];
    if (!auth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await authService.findUserById(payload.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    next(err);
  }
}

// ============ SET PASSWORD (for Google OAuth users) ============
async function setPassword(req, res, next) {
  try {
    const auth = req.headers['authorization'];
    if (!auth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await authService.findUserById(payload.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get full user object with is_google field
    const fullUser = await db.query('SELECT is_google, password_set FROM users WHERE id=$1', [user.id]);
    const fullUserData = fullUser.rows[0];

    if (!fullUserData.is_google || fullUserData.password_set) {
      return res.status(403).json({ error: 'You can only set password for Google OAuth accounts without a password' });
    }

    const { password, username } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await authService.updatePassword(user.id, passwordHash);

    // Update username if provided
    if (username && username.length >= 3) {
      await db.query(
        'UPDATE users SET username=$1 WHERE id=$2',
        [username, user.id]
      );
    }

    res.json({ success: true, message: 'Password set successfully' });
  } catch (err) {
    next(err);
  }
}

// ============ GOOGLE OAUTH - GET AUTH URL ============
async function googleAuthUrl(req, res, next) {
  try {
    if (!isGoogleConfigured()) {
      return res.status(500).json({ error: 'Google OAuth not configured on server' });
    }

    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_CALLBACK_URL
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'profile', 'email'],
      prompt: 'consent',
      state: req.query.redirect || undefined
    });

    res.json({ success: true, authUrl: url });
  } catch (err) {
    next(err);
  }
}

// ============ GOOGLE OAUTH - CALLBACK ============
async function googleCallback(req, res, next) {
  try {
    const code = req.query.code || req.body.code;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code missing' });
    }

    if (!isGoogleConfigured()) {
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_CALLBACK_URL
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const displayName = payload.name;
    const picture = payload.picture;

    // Find or create user
    let user = await authService.findUserByGoogleOrEmail(googleId, email);

    if (!user) {
      // Generate unique username
      const emailPrefix = (email || `google_${googleId}`)
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');
      
      let finalUsername = emailPrefix || `google_${googleId.substring(0, 8)}`;
      let counter = 1;

      while (true) {
        const existing = await authService.findUserByUsername(finalUsername);
        if (!existing) break;
        finalUsername = `${emailPrefix}${counter}`;
        counter++;
      }

      user = await authService.createUserFromGoogle({
        username: finalUsername,
        googleId,
        email,
        displayName,
        picture
      });
    }

    // Check user status
    if (user.status === 'BANNED') {
      return res.status(403).json({ error: 'Account is banned' });
    }

    if (user.status === 'LOCKED') {
      return res.status(403).json({ error: 'Account is locked. Please try again later' });
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // If this was a popup OAuth flow
    if (req.query && req.query.state === 'popup') {
      const responsePayload = {
        source: 'google-oauth',
        success: true,
        token: jwtToken,
        username: user.username,
        displayName: user.display_name,
        picture: user.profile_picture,
        email: user.email,
        requiresPasswordSetup: !user.password_set
      };
      const safe = JSON.stringify(responsePayload).replace(/</g, '\\u003c');
      return res.send(
        `<!DOCTYPE html><html><body><script>if(window.opener){window.opener.postMessage(${safe}, location.origin);}window.close();</script></body></html>`
      );
    }

    // Standard JSON response
    return res.json({
      success: true,
      token: jwtToken,
      requiresPasswordSetup: !user.password_set,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        picture: user.profile_picture,
        isGoogle: user.is_google
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  profile,
  setPassword,
  verify2FA,
  googleAuthUrl,
  googleCallback
};
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


