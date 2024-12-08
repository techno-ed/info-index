const userActionService = require('../services/userActionService');

class UserActionController {
    async logAction(req, res) {
        try {
            const { action, contentId } = req.body;
            const userId = req.session?.user?.id || null;
            
            await userActionService.logAction(
                userId,
                action,
                contentId,
                req.ip,
                req.headers['user-agent']
            );
            
            res.json({ success: true });
        } catch (error) {
            console.error('Error logging action:', error);
            res.status(500).json({ error: 'Failed to log action' });
        }
    }

    async getDailyStats(req, res) {
        try {
            const { date } = req.query;
            const stats = await userActionService.getDailyStats(date || new Date());
            res.json(stats);
        } catch (error) {
            console.error('Error getting daily stats:', error);
            res.status(500).json({ error: 'Failed to get daily stats' });
        }
    }

    async getTrendStats(req, res) {
        try {
            const { days } = req.query;
            const stats = await userActionService.getTrendStats(parseInt(days) || 7);
            res.json(stats);
        } catch (error) {
            console.error('Error getting trend stats:', error);
            res.status(500).json({ error: 'Failed to get trend stats' });
        }
    }

    async getUserStats(req, res) {
        try {
            const { date } = req.query;
            const stats = await userActionService.getUserStats(date || new Date());
            res.json(stats);
        } catch (error) {
            console.error('Error getting user stats:', error);
            res.status(500).json({ error: 'Failed to get user stats' });
        }
    }
}

module.exports = new UserActionController();
