const db = require('../db');

// Generate random 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createUser(username, passwordHash) {
  const res = await db.query(
    'INSERT INTO users (username, password_hash, status, is_google, password_set, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,now(),now()) RETURNING id, username',
    [username, passwordHash, 'ACTIVE', false, true]
  );
  return res.rows[0];
}

async function findUserByUsername(username) {
  const res = await db.query(
    'SELECT id, username, password_hash, email, display_name, profile_picture, status, is_google, password_set, failed_login_attempts, lock_until FROM users WHERE LOWER(username)=LOWER($1) LIMIT 1',
    [username]
  );
  return res.rows[0];
}

async function findUserByEmail(email) {
  const res = await db.query(
    'SELECT id, username, email, password_hash, display_name, profile_picture, status, is_google, password_set, failed_login_attempts, lock_until FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1',
    [email]
  );
  return res.rows[0];
}

async function findUserByUsernameOrEmail(usernameOrEmail) {
  const res = await db.query(
    'SELECT id, username, email, password_hash, display_name, profile_picture, status, is_google, password_set, failed_login_attempts, lock_until FROM users WHERE LOWER(username)=LOWER($1) OR LOWER(email)=LOWER($1) LIMIT 1',
    [usernameOrEmail]
  );
  return res.rows[0];
}

async function findUserById(id) {
  const res = await db.query(
    'SELECT id, username, email, display_name, profile_picture, status, is_google, password_set FROM users WHERE id=$1',
    [id]
  );
  return res.rows[0];
}

async function findUserByGoogleOrEmail(googleId, email) {
  const res = await db.query(
    'SELECT * FROM users WHERE google_id=$1 OR LOWER(email)=LOWER($2) LIMIT 1',
    [googleId, email]
  );
  return res.rows[0];
}

async function createUserFromGoogle({ username, googleId, email, displayName, picture }) {
  const res = await db.query(
    'INSERT INTO users (username, password_hash, google_id, email, display_name, profile_picture, is_google, status, password_set, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now()) RETURNING id, username, email, display_name, profile_picture, status, is_google',
    [username, null, googleId, email, displayName, picture, true, 'ACTIVE', false]
  );
  return res.rows[0];
}

async function generateAndStoreVerificationCode(userId) {
  const code = generateVerificationCode();
  await db.query(
    'UPDATE users SET verification_code=$1, verification_code_created_at=now() WHERE id=$2',
    [code, userId]
  );
  return code;
}

async function verifyVerificationCode(userId, code) {
  const res = await db.query(
    'SELECT verification_code, verification_code_created_at FROM users WHERE id=$1',
    [userId]
  );
  if (!res.rows[0]) return false;
  
  const { verification_code, verification_code_created_at } = res.rows[0];
  if (verification_code !== code) return false;
  
  // Check if code is still valid (10 minutes)
  const createdTime = new Date(verification_code_created_at).getTime();
  const now = new Date().getTime();
  const isValid = (now - createdTime) < 10 * 60 * 1000;
  
  if (isValid) {
    await db.query(
      'UPDATE users SET verification_code=NULL, verification_code_created_at=NULL WHERE id=$1',
      [userId]
    );
    return true;
  }
  return false;
}

async function updatePassword(userId, passwordHash) {
  const res = await db.query(
    'UPDATE users SET password_hash=$1, password_set=$2, updated_at=now() WHERE id=$3 RETURNING id, username, email',
    [passwordHash, true, userId]
  );
  return res.rows[0];
}

async function incrementFailedLoginAttempts(userId) {
  await db.query(
    'UPDATE users SET failed_login_attempts=failed_login_attempts+1 WHERE id=$1',
    [userId]
  );
  
  // Lock account if more than 5 failed attempts
  const res = await db.query(
    'SELECT failed_login_attempts FROM users WHERE id=$1',
    [userId]
  );
  
  if (res.rows[0].failed_login_attempts >= 5) {
    const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
    await db.query(
      'UPDATE users SET lock_until=$1, status=$2 WHERE id=$3',
      [lockUntil, 'LOCKED', userId]
    );
    return { locked: true, lockUntil };
  }
  return { locked: false };
}

async function resetFailedLoginAttempts(userId) {
  await db.query(
    'UPDATE users SET failed_login_attempts=0, lock_until=NULL, status=$1 WHERE id=$2',
    ['ACTIVE', userId]
  );
}

async function isUserLocked(userId) {
  const res = await db.query(
    'SELECT lock_until, status FROM users WHERE id=$1',
    [userId]
  );
  
  if (!res.rows[0]) return false;
  
  const { lock_until, status } = res.rows[0];
  if (status === 'BANNED') return true;
  if (status === 'LOCKED' && lock_until) {
    const now = new Date();
    if (now < new Date(lock_until)) return true;
    
    // Unlock if lock time has passed
    await db.query(
      'UPDATE users SET lock_until=NULL, status=$1, failed_login_attempts=0 WHERE id=$2',
      ['ACTIVE', userId]
    );
    return false;
  }
  return false;
}

module.exports = {
  createUser,
  findUserByUsername,
  findUserByEmail,
  findUserByUsernameOrEmail,
  findUserById,
  findUserByGoogleOrEmail,
  createUserFromGoogle,
  generateAndStoreVerificationCode,
  verifyVerificationCode,
  updatePassword,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts,
  isUserLocked
};
