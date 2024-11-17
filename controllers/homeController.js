const { User, Content } = require('../models');
const config = require('../config/config');
const jwt = require('jsonwebtoken');

exports.getHomePage = async (req, res, next) => {
  const justLoggedIn = req.session.justLoggedIn;
  req.session.justLoggedIn = false;

  try {
    const updatedUser = req.user ? await User.findByPk(req.user.id) : null;
    if (req.user && !updatedUser) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (updatedUser) {
      const newToken = jwt.sign(
        { 
          id: updatedUser.id, 
          username: updatedUser.username, 
          role: updatedUser.role,
          membershipType: updatedUser.membershipType,
          membershipExpiry: updatedUser.membershipExpiry
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      res.cookie('token', newToken, { httpOnly: true, maxAge: 3600000 });
    }

    const content = await Content.findAll({
      order: [['id', 'ASC']],
      limit: 200,
      raw: true
    });


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
        }

        const isMember = updatedUser && 
                        updatedUser.membershipType !== 'none' && 
                        new Date(updatedUser.membershipExpiry) > new Date();

        return {
          id: item.id,
          simpleInfo: item.simpleInfo,
          preview: item.preview,
          location: item.location,
          area: item.area,
          city: item.city,
          detail: item.detail,
          commnet: commnet,
          hasPurchased: isMember,
          hiddenContent: isMember ? item.hiddenContent : null
        };
      }))
    };

    // console.log(formattedContent);

    res.render('home', { 
      title: '首页', 
      content: formattedContent,
      user: updatedUser,
      customerServiceContact: config.customerService.contact,
      justLoggedIn: justLoggedIn
    });
  } catch (error) {
    console.error('获取内容时出错:', error);
    next(error);
  }
};
