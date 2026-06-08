const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register',
  body('username').isLength({ min: 3 }).trim().escape(),
  body('password').isLength({ min: 4 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    authController.register(req, res, next);
  }
);

router.post('/login',
  body('username').isLength({ min: 1 }).trim().escape(),
  body('password').isLength({ min: 1 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    authController.login(req, res, next);
  }
);

router.post('/logout', authController.logout);

router.get('/profile', authController.profile);

// Google OAuth endpoints
router.get('/google', authController.googleAuthUrl);
router.get('/google/callback', authController.googleCallback);
router.post('/google', (req, res, next) => { authController.googleCallback(req, res, next); });

module.exports = router;
