const Order = require('../models/order');
const Cart = require('../models/cart');
const CartItem = require('../models/cartItem');

exports.createOrder = async (req, res) => {
  const cart = await Cart.findOne({
    where: { UserId: req.user.id },
    include: { model: CartItem },
  });

  if (!cart || cart.CartItems.length === 0) return res.status(400).send('Carrinho está vazio');

  const totalPrice = cart.CartItems.reduce(
    (total, item) => total + item.quantity * item.Product.price,
    0
  );

  const order = await Order.create({
    UserId: req.user.id,
    status: 'pending',
    totalPrice,
  });

  await CartItem.destroy({ where: { CartId: cart.id } });

  res.status(201).send(order);
};

exports.getOrders = async (req, res) => {
  const orders = await Order.findAll({ where: { UserId: req.user.id } });
  res.send(orders);
};
