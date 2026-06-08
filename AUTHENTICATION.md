# RShop Authentication System - Complete Guide

## 🔐 Overview

The RShop Marketplace features a comprehensive, production-ready authentication system with:

- **Google OAuth 2.0** - Primary authentication method
- **Email/Username + Password** - Secondary login method
- **Two-Factor Authentication (2FA)** - Optional security layer
- **Account Status Management** - ACTIVE, BANNED, LOCKED states
- **Brute Force Protection** - Rate limiting and automatic account locking
- **JWT Tokens** - Secure token-based authentication
- **Password Security** - bcrypt hashing with salt

---

## 📋 Features

### ✅ Authentication Methods

#### 1. Google OAuth 2.0 (Primary)
- Users sign up/login using their Google account
- Automatic user creation on first login
- Email and profile picture captured
- No traditional password required initially
- Can set password later for traditional login

#### 2. Email/Username + Password (Secondary)
- Traditional username or email + password login
- Available after Google OAuth first login or for users who set a password
- Case-insensitive username/email lookup
- Supports both username AND email for flexibility

#### 3. Two-Factor Authentication (2FA)
- Optional additional security layer
- 6-digit verification code sent after login
- 10-minute code expiration
- Automatic account locking after 5 failed attempts
- 30-minute lock duration

### 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: 7-day expiration
- **Rate Limiting**: 
  - General: 100 requests per 15 minutes
  - Login: 5 attempts per 15 minutes
- **Account Locking**: After 5 failed login attempts
- **Status Management**: ACTIVE, BANNED, LOCKED states
- **CORS Protection**: Configured for secure cross-origin requests
- **XSS Protection**: XSS-clean middleware
- **Helmet**: Security headers via Helmet.js
- **Input Validation**: express-validator for all inputs

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required Node.js packages (already in package.json)
- express: ^4.18.2
- pg: ^8.11.0
- bcryptjs: ^2.4.3
- jsonwebtoken: ^9.0.2
- google-auth-library: ^9.11.0
- express-validator: ^7.0.1
- helmet: ^6.0.1
- cors: ^2.8.5
- dotenv: ^16.4.5
```

### Environment Setup

1. **Copy .env.example to .env**:
```bash
cp .env.example .env
```

2. **Set up PostgreSQL Database**:
```bash
# Run migrations
psql $DATABASE_URL -f migrations/create_tables.sql
```

3. **Configure Google OAuth**:
   - Go to [Google Cloud Console](https://console.developers.google.com/)
   - Create new OAuth 2.0 Credentials (Web application)
   - Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
   - Copy Client ID and Client Secret to .env

4. **Set JWT & Session Secrets**:
```bash
# Generate strong secrets (use any method)
JWT_SECRET=your_random_secure_string_here_min_32_chars
SESSION_SECRET=another_random_secure_string_here
```

---

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

#### 1. **Login with Username or Email**
```http
POST /api/auth/login
Content-Type: application/json

{
  "usernameOrEmail": "john_doe or john@example.com",
  "password": "securePassword123"
}

Response (success - without 2FA):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "displayName": "John Doe",
    "picture": "https://...",
    "isGoogle": false
  }
}

Response (success - requires 2FA):
{
  "success": false,
  "requiresVerification": true,
  "userId": 1,
  "message": "Verification code sent. Please check your email or SMS."
}
```

#### 2. **Verify 2FA Code**
```http
POST /api/auth/verify-2fa
Content-Type: application/json

{
  "userId": 1,
  "code": "123456"
}

Response (success):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

#### 3. **Get Google OAuth URL**
```http
GET /api/auth/google/auth-url

Response:
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

#### 4. **Google OAuth Callback**
```http
GET /api/auth/google/callback?code=authorization_code
POST /api/auth/google/callback
{
  "code": "authorization_code"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "requiresPasswordSetup": true,
  "user": { ... }
}
```

#### 5. **Set Password (for Google OAuth users)**
```http
POST /api/auth/set-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "password": "newPassword123",
  "username": "john_doe" (optional - for changing username)
}

Response:
{
  "success": true,
  "message": "Password set successfully"
}
```

#### 6. **Get Current User Profile**
```http
GET /api/auth/profile
Authorization: Bearer {token}

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "displayName": "John Doe",
    "picture": "https://...",
    "status": "ACTIVE",
    "isGoogle": true,
    "passwordSet": true
  }
}
```

#### 7. **Logout**
```http
POST /api/auth/logout

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  google_id TEXT UNIQUE,
  email TEXT UNIQUE,
  display_name TEXT,
  profile_picture TEXT,
  verification_code VARCHAR(6),
  verification_code_created_at TIMESTAMPTZ,
  status TEXT DEFAULT 'ACTIVE',
  lock_until TIMESTAMPTZ,
  failed_login_attempts INT DEFAULT 0,
  is_google BOOLEAN DEFAULT false,
  password_set BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(LOWER(username));
CREATE INDEX idx_users_email ON users(LOWER(email));
CREATE INDEX idx_users_google_id ON users(google_id);
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL | Primary key |
| `username` | TEXT UNIQUE | Unique username (case-insensitive) |
| `password_hash` | TEXT | Bcrypt hashed password (NULL for Google-only users) |
| `google_id` | TEXT UNIQUE | Google OAuth ID |
| `email` | TEXT UNIQUE | User email |
| `display_name` | TEXT | User's display name from Google |
| `profile_picture` | TEXT | User's profile picture URL |
| `verification_code` | VARCHAR(6) | 6-digit 2FA code |
| `verification_code_created_at` | TIMESTAMPTZ | When code was generated |
| `status` | TEXT | ACTIVE \| BANNED \| LOCKED |
| `lock_until` | TIMESTAMPTZ | When account lock expires |
| `failed_login_attempts` | INT | Counter for brute force protection |
| `is_google` | BOOLEAN | True if created via Google OAuth |
| `password_set` | BOOLEAN | True if user set a password |
| `created_at` | TIMESTAMPTZ | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

---

## 🔄 Authentication Flow Diagrams

### Flow 1: Google OAuth Sign Up / Login

```
User clicks "Login with Google"
    ↓
Redirects to Google OAuth URL
    ↓
User signs in with Google account
    ↓
Google redirects to /api/auth/google/callback with authorization code
    ↓
Server exchanges code for ID token
    ↓
Server extracts: google_id, email, display_name, picture
    ↓
Check if user exists (by google_id or email)
    ↓
   ├─ If exists → Check status (ACTIVE/BANNED/LOCKED)
   │              ├─ ACTIVE → Generate JWT token → Redirect to dashboard
   │              ├─ BANNED → Return error
   │              └─ LOCKED → Return error
   │
   └─ If NOT exists → Auto-create user with:
                      - Unique username (auto-generated from email)
                      - google_id, email, display_name, picture
                      - password_set = false
                      - Check if password needed
                      ├─ YES → Show set-password form
                      └─ NO → Generate JWT token → Redirect to dashboard
```

### Flow 2: Email/Username + Password Login

```
User enters username/email and password
    ↓
Validate inputs (not empty, format check)
    ↓
Find user by username OR email (case-insensitive)
    ↓
   ├─ User NOT found → Return "Invalid credentials" error
   │
   └─ User found:
        ↓
        Check status:
        ├─ BANNED → Return "Account is banned" error
        ├─ LOCKED → Return "Account is locked" error
        └─ ACTIVE:
             ↓
             Check if account is currently locked (lock_until > now)
             ├─ YES → Return "Account locked for X minutes" error
             └─ NO:
                  ↓
                  Compare password with password_hash (bcrypt)
                  ├─ Password incorrect:
                  │   - Increment failed_login_attempts
                  │   - If >= 5 attempts:
                  │     - Set status = LOCKED
                  │     - Set lock_until = now + 30 minutes
                  │   - Return "Invalid credentials" error
                  │
                  └─ Password correct:
                      - Reset failed_login_attempts = 0
                      - Check if 2FA enabled
                      ├─ YES → Generate verification code → Return userId
                      └─ NO → Generate JWT token → Return token
```

### Flow 3: Two-Factor Authentication (2FA)

```
Login attempt successful but 2FA enabled
    ↓
Generate 6-digit verification code
    ↓
Store code in database with 10-minute expiration
    ↓
Send code via email/SMS (if configured)
    ↓
Return { requiresVerification: true, userId: X }
    ↓
User enters 6-digit code
    ↓
POST /api/auth/verify-2fa { userId, code }
    ↓
Validate code:
├─ Code not found/expired → Return error, show "resend code" button
├─ Code incorrect → Increment failed attempts
└─ Code correct:
    - Clear verification_code from database
    - Generate JWT token
    - Return token → Redirect to dashboard
```

---

## 🔧 Using the Login Page

### Standard Login
1. Open `http://localhost:5000/login.html`
2. Enter username/email and password
3. Click "Sign In"
4. If 2FA enabled: Enter 6-digit code
5. Redirected to dashboard with JWT token in localStorage

### Google OAuth Login
1. Click "Continue with Google"
2. Opens Google sign-in popup
3. After Google auth succeeds:
   - If first time: Prompted to set password (optional)
   - Otherwise: Redirected to dashboard

### Password Management
- **Set Password**: POST `/api/auth/set-password` (for Google-only users)
- **Change Password**: Not yet implemented (can be added)
- **Reset Password**: Not yet implemented (can be added)

---

## 🛠️ Development Tips

### Testing Authentication

#### Using cURL:

```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "john_doe",
    "password": "password123"
  }'

# Test with token
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test 2FA
curl -X POST http://localhost:5000/api/auth/verify-2fa \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "code": "123456"
  }'
```

#### Using JavaScript (Frontend):

```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    usernameOrEmail: 'john_doe',
    password: 'password123'
  })
});
const data = await response.json();
localStorage.setItem('authToken', data.token);

// Get profile
const profileResponse = await fetch('/api/auth/profile', {
  headers: { 'Authorization': `Bearer ${data.token}` }
});
```

---

## 🚢 Deployment on Render

### Setup Instructions

1. **Push code to GitHub**

2. **Create new Render service**:
   - Connect GitHub repo
   - Select Node.js as runtime

3. **Configure environment variables** in Render dashboard:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   JWT_SECRET=your_secure_secret
   SESSION_SECRET=your_secure_secret
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_CALLBACK_URL=https://your-app-name.onrender.com/api/auth/google/callback
   ENABLE_2FA=false
   ```

4. **Set build command**:
   ```
   npm install
   ```

5. **Set start command**:
   ```
   node server.js
   ```

6. **Update Google OAuth redirect URIs**:
   - Add: `https://your-app-name.onrender.com/api/auth/google/callback`

7. **Run migrations**:
   - Connect to production PostgreSQL
   - Run: `psql $DATABASE_URL -f migrations/create_tables.sql`

---

## 📊 Account Status States

| Status | Description | Behavior |
|--------|-------------|----------|
| **ACTIVE** | Normal active account | User can login normally |
| **BANNED** | Account disabled by admin | Login rejected, show error message |
| **LOCKED** | Temporary lock (auto or manual) | Login rejected until lock_until expires |

---

## 🔍 Troubleshooting

### Issue: Google OAuth not working
- ✅ Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET are set
- ✅ Verify GOOGLE_CALLBACK_URL matches Google Console settings
- ✅ Ensure CORS is enabled
- ✅ Check browser console for errors

### Issue: Password verification failing
- ✅ Ensure bcryptjs is installed correctly
- ✅ Check password_hash is stored in database
- ✅ Verify password is at least 6 characters

### Issue: JWT token errors
- ✅ Check JWT_SECRET is set and consistent
- ✅ Verify token is sent in `Authorization: Bearer` header
- ✅ Check token hasn't expired (7 days)

### Issue: Account locked repeatedly
- ✅ Check failed_login_attempts is being reset correctly
- ✅ Verify lock_until timestamp is being set/cleared
- ✅ Review authentication logs

---

## 🔐 Security Best Practices

1. **Never commit .env file** to version control
2. **Use strong secrets** (32+ characters, mix of alphanumeric and special chars)
3. **Enable HTTPS** in production (Render does this automatically)
4. **Rotate secrets** periodically
5. **Monitor failed login attempts** and suspicious activity
6. **Keep dependencies updated** regularly
7. **Use environment-specific configuration** (dev, staging, production)
8. **Enable 2FA** for additional security
9. **Implement password reset flow** (to be added)
10. **Log security events** for audit trails

---

## 📝 Notes

- Verification codes expire after **10 minutes**
- Account locks for **30 minutes** after 5 failed attempts
- JWT tokens valid for **7 days**
- Rate limit: **100 requests per 15 minutes** (general), **5 per 15 minutes** (login)
- Passwords hashed with **bcryptjs** (salt rounds: 10)

---

## 🎯 Future Enhancements

- [ ] Password reset via email
- [ ] Email verification on signup
- [ ] Multi-device session management
- [ ] Social login with GitHub, Facebook
- [ ] Biometric authentication support
- [ ] Admin dashboard for user management
- [ ] Detailed login analytics and logs
- [ ] SAML support for enterprise

---

**Last Updated**: 2024
**Version**: 1.0.0
