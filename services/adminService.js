const db = require('../db');

async function stats() {
  const p = await db.query('SELECT COUNT(*)::int as count FROM products');
  const u = await db.query('SELECT COUNT(*)::int as count FROM users');
  const o = await db.query('SELECT COUNT(*)::int as count FROM orders');
  return { products: p.rows[0].count, users: u.rows[0].count, orders: o.rows[0].count };
}

async function listAllOrders() {
  const res = await db.query('SELECT id, username, status, total_price, products_json, created_at FROM orders ORDER BY id DESC');
  return res.rows.map(r => ({ ...r, products: JSON.parse(r.products_json || '[]') }));
}

async function approveOrder(id, comment) {
  await db.query('UPDATE orders SET status=$1, updated_at=now() WHERE id=$2', ['APPROVED', id]);
  await db.query('UPDATE order_slips SET approved = true, admin_comment = $1 WHERE order_id = $2', [comment || 'Approved by admin', id]);
  const order = await db.query('SELECT username, products_json FROM orders WHERE id=$1', [id]);
  const products = JSON.parse(order.rows[0].products_json || '[]');
  for (const p of products) {
    await db.query('INSERT INTO bought_items (username, item_title) VALUES ($1,$2)', [order.rows[0].username, p.title]);
  }
}

module.exports = { stats, listAllOrders, approveOrder };
