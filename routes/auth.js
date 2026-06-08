const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');

// Validation middleware
const validateLogin = [
  body('usernameOrEmail')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Username or Email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

const validateSetPassword = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('username')
    .optional()
    .isLength({ min: 3 })
    .trim()
    .withMessage('Username must be at least 3 characters if provided')
];

const validateVerification = [
  body('userId')
    .isInt()
    .withMessage('User ID must be a number'),
  body('code')
    .matches(/^\d{6}$/)
    .withMessage('Verification code must be 6 digits')
];

// Error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

// ============ AUTHENTICATION ROUTES ============

// Register (disabled - only Google OAuth)
router.post('/register', (req, res) => {
  res.status(403).json({ error: 'Direct registration is disabled. Please use Google OAuth instead.' });
});

// Login with Username or Email + Password
router.post('/login', validateLogin, handleValidationErrors, authController.login);

// Verify 2FA code
router.post('/verify-2fa', validateVerification, handleValidationErrors, authController.verify2FA);

// Set password for Google OAuth users
router.post('/set-password', validateSetPassword, handleValidationErrors, authController.setPassword);

// Logout
router.post('/logout', authController.logout);

// Get current user profile
router.get('/profile', authController.profile);

// ============ GOOGLE OAUTH ROUTES ============

// Get Google OAuth URL
router.get('/google/auth-url', authController.googleAuthUrl);

// Google OAuth callback
router.get('/google/callback', authController.googleCallback);

// Google OAuth callback (POST for SPA)
router.post('/google/callback', authController.googleCallback);

module.exports = router;
