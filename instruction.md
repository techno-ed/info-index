

# 项目说明文档

## 核心功能
1. 用户管理系统
   - 基于邀请码的注册机制
   - 用户积分系统
   - 用户行为追踪

2. 内容管理系统
   - 房源信息管理
   - 图片上传和预览
   - 隐藏内容付费查看

3. 订单系统
   - 积分购买内容
   - 订单记录和管理

4. 管理后台
   - 用户管理
   - 内容管理
   - 数据统计
   - 邀请码生成

## 技术栈
- 后端：Node.js + Express
- 数据库：MySQL + Sequelize ORM
- 前端：EJS + jQuery + Bootstrap
- 文件上传：Multer
- 会话管理：express-session
- 日志系统：自定义 UserAction 模型

## 项目结构
```
project/
├── controllers/
│   ├── userController.js
│   ├── homeController.js
│   └── adminController.js
├── models/
│   ├── User.js
│   ├── Content.js
│   ├── Order.js
│   ├── UserAction.js
│   └── InvitationCode.js
├── middlewares/
│   ├── auth.js
│   └── isAdmin.js
├── public/
│   ├── css/
│   ├── js/
│   └── uploads/
├── routes/
│   ├── api.js
│   ├── admin.js
│   ├── homeRoutes.js
│   └── userRoutes.js
└── views/
    ├── admin/
    ├── home/
    └── user/
```

## 数据库设计
### User 表
- id: 主键
- username: 用户名
- password: 密码(加密)
- role: 角色(admin/user)
- points: 积分
- invitationCode: 注册使用的邀请码

### Content 表
- id: 主键
- simpleInfo: 基本信息
- preview: 预览图
- location: 位置
- price: 价格
- area: 面积
- detail: 详细信息
- hiddenContent: 付费内容
- city: 城市

### Order 表
- id: 主键
- userId: 用户ID
- contentId: 内容ID
- points: 消费积分
- status: 订单状态

## 配色方案
- 主色：#007bff (Bootstrap Primary)
- 次要色：#6c757d (Bootstrap Secondary)
- 成功色：#28a745
- 警告色：#ffc107
- 危险色：#dc3545
- 背景色：#f8f9fa

## 文案指南
- 错误提示：简短明确，如"用户名或密码错误"
- 成功提示：积极正面，如"注册成功，欢迎加入"
- 按钮文字：动作导向，如"立即购买"、"查看详情"
- 标题文案：简洁有力，如"精选房源"、"热门推荐"

## 登录页面组件
```html
<div class="login-container">
  <h2>用户登录</h2>
  <form id="loginForm">
    <div class="form-group">
      <input type="text" name="username" placeholder="用户名" required>
    </div>
    <div class="form-group">
      <input type="password" name="password" placeholder="密码" required>
    </div>
    <button type="submit">登录</button>
    <p>还没有账号？<a href="/register">立即注册</a></p>
  </form>
</div>
```

相关路由代码参考：

```5:8:routes/userRoutes.js
const actionLogger = require('../middlewares/actionLogger');
router.get('/login', userController.getLoginPage);
router.get('/register', userController.getRegisterPage);
router.post('/api/users/register', userController.register);
```
