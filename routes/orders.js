const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const { authenticateToken } = require('../middlewares/auth');

router.use(authenticateToken);
router.post('/', ordersController.createOrder);
router.get('/', ordersController.listOrders);

module.exports = router;
