const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  contentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  purchaseDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// 添加关联方法
Order.associate = (models) => {
  Order.belongsTo(models.User, { foreignKey: 'userId', as: 'User' });
  Order.belongsTo(models.Content, { foreignKey: 'contentId', as: 'Content' });
};

module.exports = Order;
