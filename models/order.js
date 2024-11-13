const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const Product = require('./product');

const Order = sequelize.define('Order', {
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'pending' } // pending, completed, cancelled
});

User.hasMany(Order);
Order.belongsTo(User);
Product.hasMany(Order);
Order.belongsTo(Product);

module.exports = Order;
