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
const apiRoutes = require('./routes/api');  // 添加这行

// 使用路由
app.use('/', homeRoutes);
app.use('/', userRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);  // 添加这行

const PORT = process.env.PORT || 3000;

// 在其他导入之后添加
const User = require('./models/User');
const Content = require('./models/Content');
const Order = require('./models/Order');
const InvitationCode = require('./models/InvitationCode');

// 建立模型关联
const models = { User, Content, Order, InvitationCode };
Object.keys(models).forEach(modelName => {
  if ('associate' in models[modelName]) {
    models[modelName].associate(models);
  }
});

// 在 sequelize.sync() 之前添加
User.hasMany(Order, { foreignKey: 'userId', as: 'UserOrders' });
Content.hasMany(Order, { foreignKey: 'contentId', as: 'ContentOrders' });
User.hasMany(InvitationCode, { foreignKey: 'usedBy', as: 'usedInvitationCodes'});

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  // 设置局部变量，只在开发中提供错误
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // 设置状态码
  res.status(err.status || 500);

  // 渲染错误页面
  res.render('error', {
    message: err.message,
    error: err,
    status: err.status || 500  // 确保传递 status
  });
});
