const db = require('../db');

async function createOrder(username, products, totalPrice) {
  const productsJson = JSON.stringify(products || []);
  const res = await db.query('INSERT INTO orders (username, status, total_price, products_json, created_at, updated_at) VALUES ($1,$2,$3,$4,now(),now()) RETURNING id', [username, 'AWAITING_SLIP', totalPrice || 0, productsJson]);
  return res.rows[0];
}

async function listOrdersForUser(username) {
  const res = await db.query('SELECT id, status, total_price, products_json, created_at, updated_at FROM orders WHERE username=$1 ORDER BY id DESC', [username]);
  return res.rows.map(r => ({ ...r, products: JSON.parse(r.products_json || '[]') }));
}

async function listAllOrders() {
  const res = await db.query('SELECT id, username, status, total_price, products_json, created_at FROM orders ORDER BY id DESC');
  return res.rows.map(r => ({ ...r, products: JSON.parse(r.products_json || '[]') }));
}

async function approveOrder(id) {
  await db.query('UPDATE orders SET status=$1, updated_at=now() WHERE id=$2', ['APPROVED', id]);
}

module.exports = { createOrder, listOrdersForUser, listAllOrders, approveOrder };
