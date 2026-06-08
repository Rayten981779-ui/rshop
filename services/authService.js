const db = require('../db');

async function createUser(username, passwordHash) {
  const res = await db.query('INSERT INTO users (username, password_hash, status, is_google, created_at) VALUES ($1,$2,$3,$4,now()) RETURNING id, username', [username, passwordHash, 'ACTIVE', false]);
  return res.rows[0];
}

async function findUserByUsername(username) {
  const res = await db.query('SELECT id, username, password_hash, email, display_name, profile_picture, status, is_google FROM users WHERE LOWER(username)=LOWER($1) LIMIT 1', [username]);
  return res.rows[0];
}

async function findUserById(id) {
  const res = await db.query('SELECT id, username, email, display_name, profile_picture, status FROM users WHERE id=$1', [id]);
  return res.rows[0];
}

async function findUserByGoogleOrEmail(googleId, email) {
  const res = await db.query('SELECT * FROM users WHERE google_id=$1 OR LOWER(email)=LOWER($2) LIMIT 1', [googleId, email]);
  return res.rows[0];
}

async function createUserFromGoogle({ username, googleId, email, displayName, picture }) {
  const res = await db.query('INSERT INTO users (username, password_hash, google_id, email, display_name, profile_picture, is_google, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now()) RETURNING id, username, email, display_name, profile_picture, status', [username, null, googleId, email, displayName, picture, true, 'ACTIVE']);
  return res.rows[0];
}

module.exports = { createUser, findUserByUsername, findUserById, findUserByGoogleOrEmail, createUserFromGoogle };
