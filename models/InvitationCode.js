const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InvitationCode = sequelize.define('InvitationCode', {
  code: {
    type: DataTypes.STRING(5),
    unique: true,
    allowNull: false
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  usedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

// 添加关联
InvitationCode.associate = (models) => {
  InvitationCode.belongsTo(models.User, {
    foreignKey: 'usedBy',
    as: 'usedByUser'
  });
};

module.exports = InvitationCode;
