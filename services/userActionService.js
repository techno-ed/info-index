const UserAction = require('../models/UserAction');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

class UserActionService {
    async logAction(userId, action, contentId, ip, userAgent) {
        return await UserAction.create({
            userId,
            action,
            contentId,
            ip,
            userAgent
        });
    }

    async getDailyStats(selectedDate) {
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);

        return await UserAction.findAll({
            attributes: [
                'action',
                [sequelize.fn('COUNT', sequelize.col('UserAction.id')), 'count']
            ],
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            },
            group: ['action']
        });
    }

    async getTrendStats(days = 7) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        return await UserAction.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('UserAction.createdAt')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('UserAction.id')), 'count']
            ],
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            },
            group: [sequelize.fn('DATE', sequelize.col('UserAction.createdAt'))],
            order: [[sequelize.fn('DATE', sequelize.col('UserAction.createdAt')), 'ASC']]
        });
    }

    async getUserStats(selectedDate) {
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);

        return await UserAction.findAll({
            attributes: [
                'userId',
                'action',
                [sequelize.fn('COUNT', sequelize.col('UserAction.id')), 'count']
            ],
            include: [{
                model: User,
                attributes: ['username']
            }],
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            },
            group: ['userId', 'action', 'User.id', 'User.username'],
            order: [[sequelize.col('count'), 'DESC']]
        });
    }
}

module.exports = new UserActionService();
