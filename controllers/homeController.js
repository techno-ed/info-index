const Content = require('../models/Content');

exports.getHomePage = async (req, res) => {
  try {
    const content = await Content.findAll({
      order: [['id', 'ASC']],
      limit: 50  // 限制返回的数量
    });

    const formattedContent = {
      code: 200,
      data: content.map(item => ({
        id: item.id,
        simpleInfo: item.simpleInfo,
        preview: item.preview,
        location: item.location,
        price: item.price,
        area: item.area,
        detail: item.detail,
        commnet: item.commnet
      }))
    };

    res.render('home', { 
      title: '老师信息大全', 
      content: formattedContent,
      user: req.user  // Passport.js 会自动将用户信息附加到 req.user
    });
  } catch (error) {
    console.error('获取内容时出错:', error);
    res.status(500).render('error', { message: '加载主页时出错' });
  }
};
