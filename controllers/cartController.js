const Cart = require('../models/cart');
const CartItem = require('../models/cartItem');
const Product = require('../models/product');

exports.addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
  
    // Verifica ou cria o carrinho do usuário
    let cart = await Cart.findOne({ where: { UserId: req.user.id } });
    if (!cart) {
      cart = await Cart.create({ UserId: req.user.id });
    }
  
    // Verifica se o produto existe
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).send('Produto não encontrado');
  
    // Adiciona ou atualiza o item no carrinho
    const cartItem = await CartItem.findOne({ where: { CartId: cart.id, ProductId: productId } });
  
    if (cartItem) {
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      await CartItem.create({ CartId: cart.id, ProductId: productId, quantity });
    }
  
    res.send('Produto adicionado ao carrinho');
  };


  exports.addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
  
    // Verifica ou cria o carrinho do usuário
    let cart = await Cart.findOne({ where: { UserId: req.user.id } });
    if (!cart) {
      cart = await Cart.create({ UserId: req.user.id });
    }
  
    // Verifica se o produto existe
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).send('Produto não encontrado');
  
    // Adiciona ou atualiza o item no carrinho
    const cartItem = await CartItem.findOne({ where: { CartId: cart.id, ProductId: productId } });
  
    if (cartItem) {
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      await CartItem.create({ CartId: cart.id, ProductId: productId, quantity });
    }
  
    res.send('Produto adicionado ao carrinho');
  };

  exports.getCart = async (req, res) => {
    let cart = await Cart.findOne({
      where: { UserId: req.user.id },
      include: { model: CartItem, include: [Product] },
    });
  
    // Se o carrinho não existir, crie um automaticamente
    if (!cart) {
      cart = await Cart.create({ UserId: req.user.id });
      return res.send({ items: [] }); // Retorna um carrinho vazio
    }
  
    res.send(cart);
  };

exports.removeFromCart = async (req, res) => {
  const { productId } = req.body;
  const cart = await Cart.findOne({ where: { UserId: req.user.id } });

  if (!cart) return res.status(404).send('Carrinho não encontrado');

  const cartItem = await CartItem.findOne({ where: { CartId: cart.id, ProductId: productId } });

  if (!cartItem) return res.status(404).send('Produto não está no carrinho');

  await cartItem.destroy();
  res.send('Produto removido do carrinho');
};
