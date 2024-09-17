const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const { isLoggedIn } = require('../middlewares/auth');

// 添加一个中间件来记录 req.user
const logUser = (req, res, next) => {
  console.log('当前用户:', req.user);
  next();
};

// 在 isLoggedIn 中间件之后，homeController.getHomePage 之前添加 logUser 中间件
router.get('/', isLoggedIn, logUser, homeController.getHomePage);

// ... 其他路由 ...
router.post('/content/:id/purchase', isLoggedIn, homeController.purchaseContent);

module.exports = router;
