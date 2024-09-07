const { sequelize } = require('../config/database');
const Content = require('../models/Content');

const seedContent = async () => {
  try {
    await sequelize.sync({ force: true }); // 警告：这将删除现有的内容表

    const contentData = [
      {
        simpleInfo: "[推荐]教授数学很有经验",
        preview: "/images/iceice/1.jpg",  // 注意这里的路径更改
        location: "海淀 五道口",
        price: 1000.0,
        area: "海淀",
        detail: [{
          type: 2,
          content: "/images/iceice/1.jpg"  // 这里也要更改
        }],
        commnet: ["1号老师很不错，很负责人"]
      },
      {
        simpleInfo: "[推荐]教授英语很有经验",
        preview: "/images/iceice/2.jpg",  // 注意这里的路径更改
        location: "海淀 五道口",
        price: 1000.0,
        area: "海淀",
        detail: [{
          type: 2,
          content: "/images/iceice/2.jpg"  // 这里也要更改
        }],
        commnet: ["2号老师很不错，很负责人"]
      }
    ];

    await Content.bulkCreate(contentData);

    console.log('内容数据已成功添加到数据库');
  } catch (error) {
    console.error('添加内容数据时出错:', error);
  } finally {
    await sequelize.close();
  }
};

seedContent();
