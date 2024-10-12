const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const { isLoggedIn } = require('../middlewares/auth');
const { User } = require('../models');

// 更新用户信息的中间件
const updateUserInfo = async (req, res, next) => {
  if (req.user) {
    try {
      const updatedUser = await User.findByPk(req.user.id);
      if (updatedUser) {
        req.user = updatedUser.toJSON();
      }
    } catch (error) {
      console.error('更新用户信息时出错:', error);
    }
  }
  next();
};

// 在 isLoggedIn 中间件之后，homeController.getHomePage 之前添加 updateUserInfo 中间件
router.get('/', isLoggedIn, updateUserInfo, homeController.getHomePage);

// ... 其他路由 ...
router.post('/content/:id/purchase', isLoggedIn, updateUserInfo, homeController.purchaseContent);

module.exports = router;
