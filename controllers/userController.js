const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).render('register', { error: '用户名已存在' });
    }

    // 创建新用户
    await User.create({
      username,
      password,
      role: 'user'  // 默认角色为普通用户
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
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).render('login', { error: '用户不存在' });
    }
    const isValid = await user.validPassword(password);
    if (!isValid) {
      return res.status(401).render('login', { error: '密码错误' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // 将 token 存储在 cookie 中
    res.cookie('token', token, { httpOnly: true, maxAge: 3600000 }); // 1小时有效期
    
    // 重定向到主页
    res.redirect('/');
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).render('login', { error: '登录失败,请稍后再试' });
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