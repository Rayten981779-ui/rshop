const ordersService = require('../services/ordersService');

async function createOrder(req, res, next) {
  try {
    const username = req.user.username;
    const { products, total_price } = req.body; // products expected as array of {id, qty}
    const result = await ordersService.createOrder(username, products, total_price);
    res.json({ success: true, orderId: result.id || result.id });
  } catch (err) { next(err); }
}

async function listOrders(req, res, next) {
  try {
    const username = req.user.username;
    const rows = await ordersService.listOrdersForUser(username);
    res.json(rows);
  } catch (err) { next(err); }
}

module.exports = { createOrder, listOrders };
