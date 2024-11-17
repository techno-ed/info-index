const { User, Content, Order } = require('../models');
const { contentPrice } = require('../config/config');
const config = require('../config/config');
const jwt = require('jsonwebtoken');

exports.getHomePage = async (req, res, next) => {
  const justLoggedIn = req.session.justLoggedIn;
  // 清除标志，以便下次访问不会再次触发
  req.session.justLoggedIn = false;

  try {
    // 获取最新的用户数据
    const updatedUser = await User.findByPk(req.user.id);
    if (!updatedUser) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 创建新的 token
    const newToken = jwt.sign(
      { 
        id: updatedUser.id, 
        username: updatedUser.username, 
        role: updatedUser.role, 
        points: updatedUser.points 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 更新 cookie 中的 token
    res.cookie('token', newToken, { httpOnly: true, maxAge: 3600000 }); // 1小时有效期

    let content;
    if (updatedUser.points > 0) {
      content = await Content.findAll({
        order: [['id', 'ASC']],
        limit: 200,
        raw: true
      });
    } else {
      content = await Content.findAll({
        where: {
          id: 0
        },
        order: [['id', 'ASC']],
        limit: 200,
        raw: true
      });
    }

    const formattedContent = {
      code: 200,
      data: await Promise.all(content.map(async (item) => {

        let commnet = [];
        if (typeof item.commnet === 'string') {
          try {
            const cleanedCommnet = item.commnet.trim().replace(/^\uFEFF/, '');
            commnet = JSON.parse(cleanedCommnet);
          } catch (e) {
            console.warn(`无法解析 ID ${item.id} 的 commnet 字段:`, e);
          }
        } else if (Array.isArray(item.commnet)) {
          commnet = item.commnet;
        } else {
          console.log(`ID ${item.id} 的 commnet 既不是字符串也不是数组:`, item.commnet);
        }

        let hasPurchased = false;
        if (req.user) {
          // 检查是否是会员或已购买
          const isMember = req.user.membershipType !== 'none' && 
                          new Date(req.user.membershipExpiry) > new Date();
          hasPurchased = isMember || await Order.findOne({ 
            where: { 
              userId: req.user.id, 
              contentId: item.id,
              type: 'content'
            } 
          });
        }

        return {
          id: item.id,
          simpleInfo: item.simpleInfo,
          preview: item.preview,
          location: item.location,
          price: item.price,
          area: item.area,
          city: item.city,
          detail: item.detail,
          commnet: commnet,
          hasPurchased: !!hasPurchased,
          hiddenContent: hasPurchased ? item.hiddenContent : null
        };
      }))
    };
    res.render('home', { 
      title: '首页', 
      content: formattedContent,
      user: updatedUser,
      contentPrice,
      customerServiceContact: config.customerService.contact,
      justLoggedIn: justLoggedIn
    });
  } catch (error) {
    console.error('获取内容时出错:', error);
    next(error);
  }
};

exports.purchaseContent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [content, user] = await Promise.all([
      Content.findByPk(id),
      User.findByPk(userId)
    ]);

    if (!content || !user) {
      return res.status(404).json({ error: '内容或用户不存在' });
    }

    if (user.points < contentPrice) {
      return res.status(400).json({ error: '积分不足' });
    }

    const existingOrder = await Order.findOne({ where: { userId, contentId: id } });
    if (existingOrder) {
      return res.status(400).json({ error: '您已经购买过此内容' });
    }

    await Promise.all([
      user.decrement('points', { by: contentPrice }),
      Order.create({ userId, contentId: id })
    ]);

    res.json({ 
      success: true, 
      hiddenContent: content.hiddenContent,
      remainingPoints: user.points - contentPrice
    });
  } catch (error) {
    console.error('购买内容错误:', error);
    res.status(500).json({ error: '购买失败，请稍后再试' });
  }
};
