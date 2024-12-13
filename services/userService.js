const { User, Order, Content } = require('../models');
const jwt = require('jsonwebtoken');

class UserService {
    async getUserWithToken(userId) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('用户不存在');
        }

        const token = this.generateToken(user);
        return { user, token };
    }

    generateToken(user) {
        return jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
                points: user.points
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    }

    async login(username, password) {
        const user = await User.findOne({ where: { username } });
        if (!user || !user.comparePassword(password)) {
            throw new Error('用户名或密码错误');
        }

        const token = this.generateToken(user);
        return { user, token };
    }

    async register(userData) {
        const existingUser = await User.findOne({
            where: { username: userData.username }
        });

        if (existingUser) {
            throw new Error('用户名已存在');
        }

        const user = await User.create(userData);
        const token = this.generateToken(user);
        return { user, token };
    }

    async getUserPoints(userId) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('用户不存在');
        }
        return user.points;
    }

    async getProfileData(userId) {
        try {
            // 获取用户信息
            const user = await User.findByPk(userId, {
                attributes: ['id', 'username', 'points', 'role', 'createdAt']
            });

            if (!user) {
                throw new Error('用户不存在');
            }

            // 获取用户的订单及关联的内容信息
            const orders = await Order.findAll({
                where: { userId },
                include: [{
                    model: Content,
                    as: 'Content',  
                    attributes: ['simpleInfo', 'location', 'price', 'city', 'area','hiddenContent']
                }],
                order: [['createdAt', 'DESC']],
                attributes: ['id', 'createdAt', 'contentId']
            });

            return {
                user: user.toJSON(),
                orders: orders.map(order => order.toJSON())
            };
        } catch (error) {
            console.error('获取用户资料时出错:', error);
            throw error;
        }
    }
}

module.exports = new UserService();
