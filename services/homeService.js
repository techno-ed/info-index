const { User, Content, Order } = require('../models');
const { contentPrice } = require('../config/config');

class HomeService {
    async getHomePageData(userId) {
        const user = await this.getUserData(userId);
        const content = await this.getContentList(user.points > 0, userId);
        return { user, content };
    }

    async getUserData(userId) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('用户不存在');
        }
        return user;
    }

    async getContentList(hasPoints, userId) {
        const content = await Content.findAll({
            where: hasPoints ? {} : { id: 0 },
            order: [['id', 'ASC']],
            limit: 200,
            raw: true
        });

        return {
            code: 200,
            data: await Promise.all(content.map(async (item) => {
                const commnet = await this.parseComment(item.commnet);
                const hasPurchased = await this.checkPurchaseStatus(userId, item.id);
                
                return {
                    id: item.id,
                    simpleInfo: item.simpleInfo,
                    preview: item.preview,
                    location: item.location,
                    price: item.price,
                    area: item.area,
                    city: item.city,
                    detail: item.detail,
                    commnet,
                    hasPurchased,
                    hiddenContent: hasPurchased ? item.hiddenContent : null
                };
            }))
        };
    }

    async parseComment(commentData) {
        if (typeof commentData === 'string') {
            try {
                const cleanedComment = commentData.trim().replace(/^\uFEFF/, '');
                return JSON.parse(cleanedComment);
            } catch (e) {
                console.warn('无法解析评论数据:', e);
                return [];
            }
        }
        return Array.isArray(commentData) ? commentData : [];
    }

    async checkPurchaseStatus(userId, contentId) {
        if (!userId) return false;
        const order = await Order.findOne({
            where: { userId, contentId }
        });
        return !!order;
    }

    async purchaseContent(userId, contentId) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('用户不存在');
        }

        const content = await Content.findByPk(contentId);
        if (!content) {
            throw new Error('内容不存在');
        }

        const existingOrder = await Order.findOne({
            where: { userId, contentId }
        });

        if (existingOrder) {
            throw new Error('已经购买过此内容');
        }

        if (user.points < contentPrice) {
            throw new Error('积分不足');
        }

        // 创建订单和更新用户积分
        const order = await Order.create({
            userId,
            contentId,
            price: contentPrice
        });

        await user.decrement('points', { by: contentPrice });
        const updatedUser = await user.reload();

        return {
            order,
            updatedPoints: updatedUser.points,
            hiddenContent: content.hiddenContent // 返回隐藏内容
        };
    }
}

module.exports = new HomeService();
