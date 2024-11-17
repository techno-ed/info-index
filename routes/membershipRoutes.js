const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const isAdmin = require('../middlewares/isAdmin');
const { isLoggedIn } = require('../middlewares/auth');

// 会员页面路由
router.get('/', isLoggedIn, membershipController.getMembershipPage);

// 兑换码生成页面（管理员）
router.get('/generate', isLoggedIn, isAdmin, membershipController.getGenerateCodesPage);

// API 路由
router.post('/redeem', isLoggedIn, membershipController.redeemMembershipCode);
router.post('/generate-codes', isLoggedIn, isAdmin, membershipController.generateMembershipCodes);

module.exports = router; 