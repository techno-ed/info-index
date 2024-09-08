require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { sequelize } = require('./config/database');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');

const app = express();

// 设置静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json());  // 添加这行来支持 JSON 请求体
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());

// 添加一个中间件来确保 req.user 总是可用
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 导入路由
const homeRoutes = require('./routes/homeRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/admin');

// 使用路由
app.use('/', homeRoutes);
app.use('/api/users', userRoutes);
app.use('/', userRoutes);  // 注意这里的变化
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
});
