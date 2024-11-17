const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Membership = sequelize.define('Membership', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('weekly', 'monthly', 'quarterly', 'yearly', 'lifetime'),
    allowNull: false
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  durationDays: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = Membership; 