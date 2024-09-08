const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// 管理员仪表板
router.get('/', (req, res) => {
    res.render('admin/dashboard');
});

// 获取所有用户
router.get('/users', async (req, res) => {
    try {
        const users = await db.query('SELECT id, username, email FROM users');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: '获取用户列表失败' });
    }
});

// 添加新用户
router.post('/users', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
        res.status(201).json({ message: '用户创建成功' });
    } catch (error) {
        res.status(500).json({ error: '创建用户失败' });
    }
});

// 删除用户
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: '用户删除成功' });
    } catch (error) {
        res.status(500).json({ error: '删除用户失败' });
    }
});

// 获取所有内容
router.get('/content', async (req, res) => {
    try {
        const content = await db.query('SELECT * FROM content');
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: '获取内容列表失败' });
    }
});

// 添加新内容
router.post('/content', async (req, res) => {
    const { simpleInfo, price } = req.body;
    try {
        await db.query('INSERT INTO content (simpleInfo, price) VALUES (?, ?)', [simpleInfo, price]);
        res.status(201).json({ message: '内容创建成功' });
    } catch (error) {
        res.status(500).json({ error: '创建内容失败' });
    }
});

// 更新内容
router.put('/content/:id', async (req, res) => {
    const { id } = req.params;
    const { simpleInfo, price } = req.body;
    try {
        await db.query('UPDATE content SET simpleInfo = ?, price = ? WHERE id = ?', [simpleInfo, price, id]);
        res.json({ message: '内容更新成功' });
    } catch (error) {
        res.status(500).json({ error: '更新内容失败' });
    }
});

// 删除内容
router.delete('/content/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM content WHERE id = ?', [id]);
        res.json({ message: '内容删除成功' });
    } catch (error) {
        res.status(500).json({ error: '删除内容失败' });
    }
});

module.exports = router;
