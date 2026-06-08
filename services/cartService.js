const db = require('../db');

async function getCart(username) {
  const res = await db.query('SELECT c.product_id, c.quantity, p.title, p.price, p.img_url as img FROM carts c JOIN products p ON p.id = c.product_id WHERE c.username = $1', [username]);
  return res.rows;
}

async function addToCart(username, productId, quantity) {
  await db.query('INSERT INTO carts (username, product_id, quantity, created_at) VALUES ($1,$2,$3,now()) ON CONFLICT (username, product_id) DO UPDATE SET quantity = carts.quantity + EXCLUDED.quantity', [username, productId, quantity || 1]);
}

async function removeFromCart(username, productId) {
  await db.query('DELETE FROM carts WHERE username=$1 AND product_id=$2', [username, productId]);
}

module.exports = { getCart, addToCart, removeFromCart };
