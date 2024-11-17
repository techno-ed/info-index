const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MembershipCode = sequelize.define('MembershipCode', {
  code: {
    type: DataTypes.STRING(16),
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('weekly', 'monthly', 'quarterly', 'yearly', 'lifetime'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('unused', 'used', 'invalid'),
    defaultValue: 'unused'
  },
  usedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = MembershipCode; 