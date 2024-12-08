const { User, Content, Order, InvitationCode, UserAction } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

class AdminService {
    async getUsers(page = 1, limit = 50, searchTerm = '') {
        const offset = (page - 1) * limit;
        const whereClause = searchTerm
            ? {
                username: {
                    [Op.like]: `%${searchTerm}%`
                }
            }
            : {};

        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'username', 'role', 'points'],
            limit,
            offset,
            order: [['id', 'ASC']]
        });

        return {
            users: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalUsers: count
        };
    }

    async createUser(userData) {
        const { username, password, role } = userData;
        if (role !== 'user' && role !== 'admin') {
            throw new Error('无效的角色');
        }

        return await User.create({ username, password, role });
    }

    async deleteUser(id) {
        const user = await User.findByPk(id);
        if (!user) {
            throw new Error('用户不存在');
        }
        await user.destroy();
    }

    async updateUserPoints(id, points) {
        const user = await User.findByPk(id);
        if (!user) {
            throw new Error('用户不存在');
        }
        
        user.points = points;
        await user.save();
        
        return user;
    }

    async getOrders() {
        return await Order.findAll({
            include: [
                { model: User, as: 'User', attributes: ['id', 'username'] },
                { model: Content, as: 'Content', attributes: ['id'] }
            ],
            order: [['createdAt', 'DESC']]
        });
    }

    async deleteOrder(orderId) {
        const order = await Order.findByPk(orderId);
        if (!order) {
            throw new Error('订单不存在');
        }

        await Order.destroy({
            where: { id: orderId }
        });
    }

    async getStatistics(date, sortBy = 'view_home') {
        try {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            // 获取每日统计数据
            const dailyStats = await UserAction.findAll({
                attributes: [
                    'action',
                    [Sequelize.fn('COUNT', Sequelize.col('UserAction.id')), 'count']
                ],
                where: {
                    timestamp: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                group: ['action']
            });

            // 获取趋势数据（最近7天）
            const trendStartDate = new Date(date);
            trendStartDate.setDate(trendStartDate.getDate() - 6);
            trendStartDate.setHours(0, 0, 0, 0);

            const trendStats = await UserAction.findAll({
                attributes: [
                    [Sequelize.fn('DATE', Sequelize.col('UserAction.timestamp')), 'date'],
                    [Sequelize.fn('COUNT', Sequelize.col('UserAction.id')), 'count']
                ],
                where: {
                    timestamp: {
                        [Op.between]: [trendStartDate, endDate]
                    },
                    action: sortBy
                },
                group: [Sequelize.fn('DATE', Sequelize.col('UserAction.timestamp'))],
                order: [[Sequelize.fn('DATE', Sequelize.col('UserAction.timestamp')), 'ASC']]
            });

            // 获取用户统计数据
            const userStats = await UserAction.findAll({
                attributes: [
                    'userId',
                    'action',
                    [Sequelize.fn('COUNT', Sequelize.col('UserAction.id')), 'count']
                ],
                where: {
                    timestamp: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                include: [{
                    model: User,
                    attributes: ['username'],
                    required: true
                }],
                group: ['UserAction.userId', 'UserAction.action', 'User.id', 'User.username'],
                order: [[Sequelize.fn('COUNT', Sequelize.col('UserAction.id')), 'DESC']],
                limit: 10
            });

            // 处理用户统计数据
            const userStatsMap = {};
            userStats.forEach(stat => {
                const userId = stat.userId;
                const action = stat.action;
                const count = parseInt(stat.getDataValue('count'));
                
                if (!userStatsMap[userId]) {
                    userStatsMap[userId] = {
                        userId,
                        username: stat.User.username,
                        view_home: 0,
                        view_detail: 0,
                        sort_content: 0,
                        purchase: 0
                    };
                }
                
                userStatsMap[userId][action] = count;
            });

            const processedUserStats = Object.values(userStatsMap);

            console.log('Statistics results:', {
                dailyStats: dailyStats.map(stat => ({
                    action: stat.action,
                    count: parseInt(stat.getDataValue('count'))
                })),
                trendStats: trendStats.map(stat => ({
                    date: stat.getDataValue('date'),
                    count: parseInt(stat.getDataValue('count'))
                })),
                userStats: processedUserStats
            });

            return {
                dailyStats: dailyStats.map(stat => ({
                    action: stat.action,
                    count: parseInt(stat.getDataValue('count'))
                })),
                trendStats: trendStats.map(stat => ({
                    date: stat.getDataValue('date'),
                    count: parseInt(stat.getDataValue('count'))
                })),
                userStats: processedUserStats
            };
        } catch (error) {
            console.error('Error in getStatistics:', error);
            throw error;
        }
    }

    async generateInvitationCode() {
        const generateCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let code = '';
            for (let i = 0; i < 8; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
        };

        let code;
        let isUnique = false;
        
        while (!isUnique) {
            code = generateCode();
            const existingCode = await InvitationCode.findOne({ where: { code } });
            if (!existingCode) {
                isUnique = true;
            }
        }

        return await InvitationCode.create({ code });
    }

    async saveContent(contentData, previewFile) {
        const { simpleInfo, location, price, area, city, detail, comment, hiddenContent } = contentData;

        let previewPath = null;
        if (previewFile) {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            await fs.mkdir(uploadDir, { recursive: true });
            
            const filename = Date.now() + path.extname(previewFile.originalname);
            await fs.writeFile(
                path.join(uploadDir, filename),
                previewFile.buffer
            );
            previewPath = '/uploads/' + filename;
        }

        return await Content.create({
            simpleInfo,
            preview: previewPath,
            location,
            price: parseInt(price),
            area,
            city,
            detail,
            comment: comment ? JSON.parse(comment) : [],
            hiddenContent
        });
    }

    async getContent() {
        return await Content.findAll({
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'simpleInfo', 'location', 'area', 'city', 'detail', 'createdAt']
        });
    }

    async getContentById(id) {
        return await Content.findByPk(id);
    }

    async updateContent(id, contentData, previewFile) {
        const content = await Content.findByPk(id);
        if (!content) {
            throw new Error('内容不存在');
        }

        const { simpleInfo, location, price, area, city, detail, comment, hiddenContent } = contentData;

        let previewPath = content.preview;
        if (previewFile) {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            await fs.mkdir(uploadDir, { recursive: true });
            
            const filename = Date.now() + path.extname(previewFile.originalname);
            await fs.writeFile(
                path.join(uploadDir, filename),
                previewFile.buffer
            );
            previewPath = '/uploads/' + filename;
        }

        return await content.update({
            simpleInfo,
            preview: previewPath,
            location,
            price: parseInt(price),
            area,
            city,
            detail,
            comment: comment ? JSON.parse(comment) : [],
            hiddenContent
        });
    }

    async deleteContent(id) {
        const content = await Content.findByPk(id);
        if (!content) {
            throw new Error('内容不存在');
        }

        // 如果有预览图，删除预览图文件
        if (content.preview) {
            const filePath = path.join(process.cwd(), 'public', content.preview);
            try {
                await fs.unlink(filePath);
            } catch (error) {
                console.error('删除预览图失败:', error);
            }
        }

        await content.destroy();
        return { success: true };
    }
}

module.exports = new AdminService();
