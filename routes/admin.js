const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Content = require('../models/Content');
const isAdmin = require('../middlewares/isAdmin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 将 isAdmin 中间件应用到所有管理员路由
router.use(isAdmin);

// 管理员仪表板
router.get('/', (req, res) => {
    res.render('admin/dashboard');
});

// 获取所有用户
router.get('/users', async (req, res) => {
    try {
        console.log('User model:', User); // 添加这行
        if (!User || !User.findAll) {
            throw new Error('User model is not properly defined');
        }
        const users = await User.findAll({
            attributes: ['id', 'username', 'role', 'points']
        });
        console.log('Users fetched:', users);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: '获取用户列表失败' });
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
        await User.destroy({ where: { id } });
        res.json({ message: '用户删除成功' });
    } catch (error) {
        res.status(500).json({ error: '删除用户失败' });
    }
});

// 获取所有内容
router.get('/content', async (req, res) => {
    try {
        console.log('正在获取内容');
        const content = await Content.findAll();
        console.log('获取到的内容:', JSON.stringify(content, null, 2));
        res.json(content);
    } catch (error) {
        console.error('获取内容列表失败:', error);
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
        const { simpleInfo, location, price, area, detail, commnet } = req.body;
        const preview = req.file ? `/uploads/${req.file.filename}` : null;

        const newContent = await Content.create({ 
            simpleInfo, 
            preview, 
            location, 
            price: parseFloat(price), 
            area, 
            detail: detail || '', // 直接存储为字符串
            commnet: JSON.stringify(commnet) // 评论仍然保持 JSON 字符串格式
        });

        res.status(201).json({ message: '内容创建成功', content: newContent });
    } catch (error) {
        console.error('Error creating content:', error);
        res.status(500).json({ error: '创建内容失败' });
    }
});

// 添加新内容路由
router.get('/content/add', (req, res) => {
    console.log('访问添加内容页面');
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

        const { simpleInfo, location, price, area, detail, commnet } = req.body;
        const updateData = { 
            simpleInfo, 
            location, 
            price: parseFloat(price), 
            area, 
            detail: detail || '', // 直接存储为字符串
            commnet: JSON.stringify(commnet) // 评论仍然保持 JSON 字符串格式
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
    console.log('Admin 路由收到请求:', req.method, req.url);
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

// 确保这个路由已经定义
router.put('/users/:id/points', async (req, res) => {
    console.log('收到更新积分请求:', req.params, req.body);
    try {
        const { id } = req.params;
        const { points } = req.body;

        // 验证积分是否为有效数字
        if (isNaN(points) || points < 0) {
            return res.status(400).json({ error: '无效的积分值' });
        }

        console.log(`尝试更新用户 ${id} 的积分为 ${points}`);

        const user = await User.findByPk(id);
        if (!user) {
            console.log(`未找到 ID 为 ${id} 的用户`);
            return res.status(404).json({ error: '未找到用户' });
        }

        console.log(`找到用户:`, user.toJSON());

        // 更新用户积分
        user.points = parseInt(points, 10);
        await user.save();

        console.log(`成功更新用户 ${id} 的积分为 ${points}`);
        res.json({ success: true, message: '积分更新成功', user: { id: user.id, username: user.username, points: user.points } });
    } catch (error) {
        console.error('更新用户积分时发生错误:', error);
        res.status(500).json({ error: '更新积分失败', details: error.message });
    }
});

module.exports = router;
