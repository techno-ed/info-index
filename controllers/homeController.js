const { User, Content, Order } = require('../models');
const { contentPrice } = require('../config/config');
const config = require('../config/config');

exports.getHomePage = async (req, res, next) => {
  try {
    const content = await Content.findAll({
      order: [['id', 'ASC']],
      limit: 50,
      raw: true
    });

    console.log('从数据库获取的原始内容:', JSON.stringify(content, null, 2));

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
          hasPurchased = await Order.findOne({ where: { userId: req.user.id, contentId: item.id } });
        }

        console.log(`ID ${item.id} 的处理结果:`, {
          id: item.id,
          simpleInfo: item.simpleInfo,
          commnet: commnet,
          hasPurchased: !!hasPurchased
        });

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

    console.log('发送到前端的格式化内容:', JSON.stringify(formattedContent, null, 2));

    res.render('home', { 
      title: '首页', 
      content: formattedContent,
      user: req.user,
      contentPrice,
      customerServiceContact: config.customerService.contact
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
