const productsService = require('../services/productsService');

async function list(req, res, next) {
  try {
    const rows = await productsService.listProducts();
    res.json(rows);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { title, category, price, downloadUrl, imgUrl } = req.body;
    const product = await productsService.createProduct({ title, category, price: parseFloat(price), downloadUrl, imgUrl });
    res.json({ success: true, product });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const id = req.params.id;
    const product = await productsService.getProductById(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) { next(err); }
}

module.exports = { list, create, getOne };
