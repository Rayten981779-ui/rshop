const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const productsController = require('../controllers/productsController');

router.get('/', productsController.list);
router.post('/',
  body('title').isLength({ min: 1 }).trim().escape(),
  body('category').isString().trim().escape(),
  body('price').isFloat({ gt: 0 }),
  productsController.create
);

router.get('/:id', productsController.getOne);

module.exports = router;
