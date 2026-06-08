const adminService = require('../services/adminService');

async function stats(req, res, next) {
  try {
    const s = await adminService.stats();
    res.json(s);
  } catch (err) { next(err); }
}

async function listAllOrders(req, res, next) {
  try {
    const rows = await adminService.listAllOrders();
    res.json(rows);
  } catch (err) { next(err); }
}

async function approveOrder(req, res, next) {
  try {
    const id = req.params.id;
    await adminService.approveOrder(id, req.body.comment);
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { stats, listAllOrders, approveOrder };
