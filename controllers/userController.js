const User = require('../models/User');
const InvitationCode = require('../models/InvitationCode');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).render('register', { error: '用户名已存在' });
    }

    // 创建新用户
    const user = await User.create({
      username,
      password,
      role: 'user',
      points: 0  // 可以设置初始积分，如果需要的话
    });

    // 重定向到登录页面,并显示成功消息
    res.redirect('/login?registered=true');
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).render('register', { error: '注册失败,请稍后再试' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ 
      where: { username },
      attributes: ['id', 'username', 'password', 'role', 'points']
    });
    if (!user) {
      return res.status(404).render('login', { error: '用户不存在' });
    }
    const isValid = await user.validPassword(password);
    if (!isValid) {
      return res.status(401).render('login', { error: '密码错误' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, points: user.points },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // 将 token 存储在 cookie 中
    res.cookie('token', token, { httpOnly: true, maxAge: 3600000 }); // 1小时有效期
    
    // 可选：在服务器端会话中存储用户信息
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      points: user.points
    };
    
    // 设置一个标志，表示用户刚刚登录
    req.session.justLoggedIn = true;
    
    // 重定向到主页
    res.redirect('/');
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).render('login', { error: '登录失败,请稍后重试' });
  }
};

exports.getLoginPage = (req, res) => {
    const registered = req.query.registered === 'true';
    res.render('login', { 
        title: '登录',
        registered: registered
    });
};

exports.getRegisterPage = (req, res) => {
    res.render('register', { title: '注册' });
};

// ... 其他导入和方法 ...

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
};

exports.getUserPoints = async (req, res) => {
    try {
        // 从 cookie 中获取 token
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: '未登录' });
        }

        // 验证 token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // 查找用户
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 返回用户积分
        res.json({ points: user.points });
    } catch (error) {
        console.error('获取用户积分错误:', error);
        res.status(500).json({ error: '获取积分失败，请稍后再试' });
    }
};
