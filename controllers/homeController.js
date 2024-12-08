const { User, Content, Order } = require('../models');
const { contentPrice } = require('../config/config');
const config = require('../config/config');
const jwt = require('jsonwebtoken');
const homeService = require('../services/homeService');
const userService = require('../services/userService');

exports.getHomePage = async (req, res, next) => {
    const justLoggedIn = req.session.justLoggedIn;
    req.session.justLoggedIn = false;

    try {
        // 获取用户信息和内容数据
        const { user, token } = await userService.getUserWithToken(req.user.id);
        const { content } = await homeService.getHomePageData(req.user.id);

        // 设置新 token
        res.cookie('token', token, { httpOnly: true, maxAge: 3600000 });

        // 渲染页面
        res.render('home', {
            title: '首页',
            content,
            user,
            contentPrice,
            customerServiceContact: config.customerService.contact,
            justLoggedIn
        });
    } catch (error) {
        console.error('获取内容时出错:', error);
        next(error);
    }
};

exports.purchaseContent = async (req, res) => {
    try {
        const { id: contentId } = req.params;
        const userId = req.user.id;

        const { order, updatedPoints } = await homeService.purchaseContent(userId, contentId);

        res.json({
            success: true,
            message: '购买成功',
            points: updatedPoints
        });
    } catch (error) {
        console.error('购买内容时出错:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
