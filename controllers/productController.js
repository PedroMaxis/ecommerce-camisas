const Product = require('../models/product');

exports.createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).send(product);
};

exports.getProducts = async (req, res) => {
  const products = await Product.findAll();
  res.send(products);
};
