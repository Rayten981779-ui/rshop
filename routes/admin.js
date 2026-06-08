const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middlewares/auth');

router.use(authenticateToken);
router.get('/stats', adminController.stats);
router.get('/orders', adminController.listAllOrders);
router.post('/orders/:id/approve', adminController.approveOrder);

module.exports = router;
