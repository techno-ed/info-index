const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Content = require('../models/Content');
const InvitationCode = require('../models/InvitationCode'); // 添加这行
const isAdmin = require('../middlewares/isAdmin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Order = require('../models/Order'); // 确保您有一个 Order 模型
const UserAction = require('../models/UserAction');
const sequelize = require('sequelize');

// 将 isAdmin 中间件应用到所有管理员路由
router.use(isAdmin);

// 管理员仪表板
router.get('/', (req, res) => {
    res.render('admin/dashboard');
});

// 获取所有用户（带分页和搜索）
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const searchTerm = req.query.search || '';

        if (!User || !User.findAndCountAll) {
            throw new Error('User model is not properly defined');
        }

        const whereClause = searchTerm
            ? {
                username: {
                    [Op.like]: `%${searchTerm}%`
                }
            }
            : {};

        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'username', 'role', 'points'],
            limit: limit,
            offset: offset,
            order: [['id', 'ASC']]
        });

        const totalPages = Math.ceil(count / limit);

        res.json({
            users: rows,
            totalPages: totalPages,
            currentPage: page,
            totalUsers: count
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: '获取用户列表失败', details: error.message });
    }
});

// 添加新用户
router.post('/users', async (req, res) => {
    const { username, password, role } = req.body;
    if (role !== 'user' && role !== 'admin') {
        return res.status(400).json({ error: '无效的角色' });
    }
    try {
        const newUser = await User.create({ username, password, role });
        res.status(201).json({ message: '用户创建成功', user: newUser });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: '创建用户失败' });
    }
});

// 删除用户
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // 首先检查用户是否存在
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 尝试删除用户
        const deletedCount = await User.destroy({
            where: { id: { [Op.eq]: id } }
        });

        if (deletedCount === 1) {
            res.json({ message: '用户删除成功' });
        } else {
            res.status(404).json({ error: '用户不存在或已被删除' });
        }
    } catch (error) {
        res.status(500).json({ 
            error: '删除用户失败', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// 获取所有内容
router.get('/content', async (req, res) => {
    try {
        const content = await Content.findAll();
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: '获取内容列表失败' });
    }
});

// 配置 multer 存储
const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads/'))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ storage: imageStorage });

// 添加新内容
router.post('/content', upload.single('preview'), async (req, res) => {
    try {
        const { simpleInfo, location, price, area, detail, commnet, hiddenContent, city } = req.body;
        const preview = req.file ? `/uploads/${req.file.filename}` : null;

        let parsedCommnet;
        try {
            parsedCommnet = JSON.parse(commnet);
        } catch (e) {
            console.error('解析 commnet 失败:', e);
            parsedCommnet = [];
        }

        const newContent = await Content.create({ 
            simpleInfo, 
            preview, 
            location, 
            price: parseFloat(price), 
            area, 
            detail: detail || '',
            commnet: parsedCommnet,
            hiddenContent: hiddenContent || '',
            city : city // 添加 city 字段
        });

        res.status(201).json({ message: '内容创建成功', content: newContent });
    } catch (error) {
        console.error('Error creating content:', error);
        res.status(500).json({ error: '创建内容失败' });
    }
});

// 添加新内容路由
router.get('/content/add', (req, res) => {
    res.render('admin/content-form', { title: '添加新内容', contentId: null });
});

// 编辑内容路由
router.get('/content/edit/:id', (req, res) => {
    res.render('admin/content-form', { contentId: req.params.id });
});

// 获取单个内容
router.get('/content/:id', async (req, res) => {
    try {
        const content = await Content.findByPk(req.params.id);
        if (content) {
            res.json(content);
        } else {
            res.status(404).json({ error: '内容不存在' });
        }
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ error: '获取内容失败' });
    }
});

// 更新内容
router.put('/content/:id', upload.single('preview'), async (req, res) => {
    try {
        const content = await Content.findByPk(req.params.id);
        if (!content) {
            return res.status(404).json({ error: '内容不存在' });
        }

        const { simpleInfo, location, price, area, detail, commnet, hiddenContent, city } = req.body;

        const updateData = { 
            simpleInfo, 
            location, 
            price: parseFloat(price), 
            area, 
            detail: detail || '',
            commnet: commnet,
            hiddenContent: hiddenContent || '',
            city // 添加 city 字段
        };

        if (req.file) {
            updateData.preview = `/uploads/${req.file.filename}`;
            // 删除旧的预览图
            if (content.preview) {
                const oldPath = path.join(__dirname, '..', 'public', content.preview);
                fs.unlink(oldPath, err => {
                    if (err) console.error('Error deleting old preview:', err);
                });
            }
        }

        await content.update(updateData);

        res.json({ message: '内容更新成功', content });
    } catch (error) {
        console.error('Error updating content:', error);
        res.status(500).json({ error: '更新内容失败' });
    }
});

// 删除内容
router.delete('/content/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Content.destroy({ where: { id } });
        res.json({ message: '内容删除成功' });
    } catch (error) {
        res.status(500).json({ error: '删除内容失败' });
    }
});

// 通用的日志中间件
router.use((req, res, next) => {
    next();
});

// 图片上传路由
router.post('/upload-image', upload.single('image'), (req, res) => {
    if (req.file) {
        // 返回上传后的图片 URL
        res.json({ url: '/uploads/' + req.file.filename });
    } else {
        res.status(400).json({ error: '上传失败' });
    }
});

// 确保这个由已经定义
router.put('/users/:id/points', async (req, res) => {
    
    try {
        const { id } = req.params;
        const { points } = req.body;

        // 验证积分是否为有效数字
        if (isNaN(points) || points < 0) {
            return res.status(400).json({ error: '无效的积分值' });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: '未找到用户' });
        }

        // 更新用户积分
        user.points = parseInt(points, 10);
        await user.save();
        res.json({ success: true, message: '积分更新成功', user: { id: user.id, username: user.username, points: user.points } });
    } catch (error) {
        console.error('更新用户积分时发生错误:', error);
        res.status(500).json({ error: '更新积分失败', details: error.message });
    }
});

// 获取所有订单
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { model: User, as: 'User', attributes: ['id', 'username'] },
                { model: Content, as: 'Content', attributes: ['id', 'simpleInfo'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: '获取订单列表失败' });
    }
});

// 删除订单
router.delete('/orders/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedCount = await Order.destroy({ where: { id } });
        if (deletedCount === 1) {
            res.json({ message: '订单删除成功' });
        } else {
            res.status(404).json({ error: '订单不存在或已被删除' });
        }
    } catch (error) {
        console.error('删除订单时发生错误:', error);
        res.status(500).json({ error: '删除订单失败', details: error.message });
    }
});

// 生成邀请码
router.post('/generate-invitation-code', async (req, res) => {
  try {
    const generateInvitationCode = () => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 5; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return code;
    };

    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = generateInvitationCode();
      const existingCode = await InvitationCode.findOne({ where: { code } });
      if (!existingCode) {
        isUnique = true;
      }
    }

    await InvitationCode.create({ code });
    res.json({ success: true, code });
  } catch (error) {
    console.error('生成邀请码错误:', error);
    res.status(500).json({ error: '生成邀请码失败' });
  }
});

// 获取所有邀请码
router.get('/invitation-codes', async (req, res) => {
  try {
    
    const codes = await InvitationCode.findAll({
      include: [{ 
        model: User, 
        as: 'usedByUser', 
        attributes: ['id', 'username'],
        required: false
      }]
    });
    res.json(codes);
  } catch (error) {
    console.error('获取邀请码列表失败:', error);
    res.status(500).json({ error: '获取邀请码列表失败', details: error.message });
  }
});

router.get('/statistics', async (req, res) => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        // 按天统计总体行为
        const stats = await UserAction.findAll({ 
            attributes: [
                [sequelize.fn('DATE', sequelize.col('UserAction.createdAt')), 'date'],
                'action',
                [sequelize.fn('COUNT', sequelize.col('UserAction.id')), 'count']
            ],
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            },
            group: [
                sequelize.fn('DATE', sequelize.col('UserAction.createdAt')),
                'action'
            ],
            order: [
                [sequelize.fn('DATE', sequelize.col('UserAction.createdAt')), 'DESC']
            ]
        });

        // 按天统计用户行为
        const userStats = await UserAction.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('UserAction.createdAt')), 'date'],
                'userId',
                'action',
                [sequelize.fn('COUNT', sequelize.col('UserAction.id')), 'count']
            ],
            include: [{
                model: User,
                attributes: ['username']
            }],
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            },
            group: [
                sequelize.fn('DATE', sequelize.col('UserAction.createdAt')),
                'userId',
                'action',
                'User.id',
                'User.username'
            ],
            order: [
                [sequelize.fn('DATE', sequelize.col('UserAction.createdAt')), 'DESC'],
                ['userId']
            ]
        });

        res.render('admin/statistics', { 
            stats, 
            userStats,
            startDate,
            endDate
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).send('获取统计数据失败: ' + error.message);
    }
});

module.exports = router;
