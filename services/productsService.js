const db = require('../db');

async function listProducts() {
  const res = await db.query('SELECT id, title, category, price, download_url as download, img_url as img FROM products ORDER BY id DESC');
  return res.rows;
}

async function createProduct({ title, category, price, downloadUrl, imgUrl }) {
  const res = await db.query('INSERT INTO products (title, category, price, download_url, img_url, created_at) VALUES ($1,$2,$3,$4,$5,now()) RETURNING id, title, category, price', [title, category, price || 0, downloadUrl, imgUrl]);
  return res.rows[0];
}

async function getProductById(id) {
  const res = await db.query('SELECT id, title, category, price, download_url as download, img_url as img FROM products WHERE id=$1', [id]);
  return res.rows[0];
}

module.exports = { listProducts, createProduct, getProductById };
