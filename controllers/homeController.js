const Content = require('../models/Content');

exports.getHomePage = async (req, res, next) => {
  try {
    const content = await Content.findAll({
      order: [['id', 'ASC']],
      limit: 50,
      raw: true // 使用原始查询结果
    });

    const formattedContent = {
      code: 200,
      data: content.map(item => {
        let commnet = [];
        if (typeof item.commnet === 'string') {
          try {
            // 尝试清理 JSON 字符串
            const cleanedCommnet = item.commnet.trim().replace(/^\uFEFF/, '');
            commnet = JSON.parse(cleanedCommnet);
          } catch (e) {
            console.warn(`无法解析 ID ${item.id} 的 commnet 字段:`, e);
          }
        }

        return {
          id: item.id,
          simpleInfo: item.simpleInfo,
          preview: item.preview,
          location: item.location,
          price: item.price,
          area: item.area,
          detail: item.detail, // 直接使用，不进行解析
          commnet: Array.isArray(commnet) ? commnet : []
        };
      })
    };

    res.render('home', { 
      title: '老师信息大全', 
      content: formattedContent,
      user: req.user
    });
  } catch (error) {
    console.error('获取内容时出错:', error);
    next(error);
  }
};
