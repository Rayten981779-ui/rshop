require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const xss = require('xss-clean');
const path = require('path');
const upload = require('./upload');
const db = require('./db');

const errorHandler = require('./middlewares/errorHandler');
const { rateLimit, loginRateLimit } = require('./middlewares/auth');

const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();
// Trust proxy when running behind Render or other proxies
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
  console.warn('Warning: Google OAuth environment variables are not fully configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in Render.');
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https:', 'https://accounts.google.com', 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
      scriptSrcAttr: ["'self'", "'unsafe-inline'"],
      scriptSrcElem: ["'self'", 'https:', 'https://accounts.google.com', 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'", 'https:', 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"]
    }
  }
}));
app.use(cors());
app.use(express.json());
app.use(xss());
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting - general (100 requests per 15 minutes)
app.use(rateLimit(100, 15 * 60 * 1000));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_session',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true }
}));

// Mount routes with specific rate limiting for login
app.use('/api/auth', authRoutes);

// Add stricter rate limiting to login endpoint
app.post('/api/auth/login', loginRateLimit(5, 15 * 60 * 1000));

app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);

// Upload endpoint for payment slips or other files
app.post('/api/upload/slip', upload.single('slip'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ success: true, filename: req.file.filename, path: `/uploads/${req.file.filename}` });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Public configuration endpoint for frontend runtime checks
app.get('/api/config', (req, res) => {
  res.json({
    googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL),
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || null,
    enableTwoFA: process.env.ENABLE_2FA === 'true'
  });
});

// Single-page app fallback: serve index.html for non-API GET requests
app.get('*', (req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Not configured'}`);
  console.log(`🔒 2FA: ${process.env.ENABLE_2FA === 'true' ? 'Enabled' : 'Disabled'}`);
});

