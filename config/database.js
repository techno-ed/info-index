const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  // 其他 MySQL 特定配置
});

module.exports = { sequelize };  // 注意这里的变化

