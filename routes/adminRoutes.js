const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const isAdmin = require('../middlewares/isAdmin');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// 将 isAdmin 中间件应用到所有管理员路由
router.use(isAdmin);

// 管理员仪表板
router.get('/', adminController.getDashboard);

// 用户管理
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/points', adminController.updateUserPoints);

// 订单管理
router.get('/orders', adminController.getOrders);
router.delete('/orders/:id', adminController.deleteOrder);

// 统计管理
router.get('/statistics', adminController.getStatistics);

// 邀请码管理
router.post('/invitation-codes', adminController.generateInvitationCode);

// 内容管理
router.get('/content', adminController.getContent);
router.get('/content/add', adminController.getContentForm);
router.get('/content/:id', adminController.getContentById);
router.post('/content', upload.single('preview'), adminController.addContent);
router.put('/content/:id', upload.single('preview'), adminController.updateContent);
router.delete('/content/:id', adminController.deleteContent);
router.post('/upload-image', upload.single('image'), adminController.uploadImage);

module.exports = router;