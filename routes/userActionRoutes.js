const express = require('express');
const router = express.Router();
const userActionController = require('../controllers/userActionController');

// 用户行为日志记录
router.post('/log', userActionController.logAction);

// 统计接口
router.get('/stats/daily', userActionController.getDailyStats);
router.get('/stats/trend', userActionController.getTrendStats);
router.get('/stats/users', userActionController.getUserStats);

module.exports = router;
