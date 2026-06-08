const cartService = require('../services/cartService');

async function getCart(req, res, next) {
  try {
    const username = req.user.username;
    const rows = await cartService.getCart(username);
    res.json(rows);
  } catch (err) { next(err); }
}

async function addToCart(req, res, next) {
  try {
    const username = req.user.username;
    const { product_id, quantity } = req.body;
    await cartService.addToCart(username, product_id, quantity || 1);
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function removeFromCart(req, res, next) {
  try {
    const username = req.user.username;
    const { product_id } = req.body;
    await cartService.removeFromCart(username, product_id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { getCart, addToCart, removeFromCart };
