const { User } = require('../models');
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
}

module.exports = new UserService();
