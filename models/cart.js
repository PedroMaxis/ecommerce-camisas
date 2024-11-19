const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const Cart = sequelize.define('Cart', {});

User.hasOne(Cart);
Cart.belongsTo(User);

module.exports = Cart;
