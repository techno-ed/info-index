const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Content = sequelize.define('Content', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  simpleInfo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  preview: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  area: {
    type: DataTypes.STRING,
    allowNull: false
  },
  detail: {
    type: DataTypes.JSON,
    allowNull: false
  },
  commnet: {
    type: DataTypes.JSON,
    allowNull: false
  }
});

module.exports = Content;
