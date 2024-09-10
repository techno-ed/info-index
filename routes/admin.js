const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Content = require('../models/Content');
const isAdmin = require('../middlewares/isAdmin');

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
            attributes: ['id', 'username', 'role']
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
        const content = await Content.findAll();
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: '获取内容列表失败' });
    }
});

// 添加新内容
router.post('/content', async (req, res) => {
    const { simpleInfo, preview, location, price, area, detail, commnet } = req.body;
    try {
        const newContent = await Content.create({ 
            simpleInfo, preview, location, price, area, detail, commnet 
        });
        res.status(201).json({ message: '内容创建成功', content: newContent });
    } catch (error) {
        res.status(500).json({ error: '创建内容失败' });
    }
});

// 更新内容
router.put('/content/:id', async (req, res) => {
    const { id } = req.params;
    const { simpleInfo, preview, location, price, area, detail, commnet } = req.body;
    try {
        await Content.update(
            { simpleInfo, preview, location, price, area, detail, commnet },
            { where: { id } }
        );
        res.json({ message: '内容更新成功' });
    } catch (error) {
        res.status(500).json({ error: '新内容失败' });
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

module.exports = router;
