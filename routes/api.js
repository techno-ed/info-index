const express = require('express');
const router = express.Router();
const UserAction = require('../models/UserAction');

router.post('/log-action', async (req, res) => {
    try {
        const { action, contentId } = req.body;
        const userId = req.session?.user?.id || null;
        
        await UserAction.create({
            userId,
            action,
            contentId,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error logging action:', error);
        res.status(500).json({ error: 'Failed to log action' });
    }
});

module.exports = router;
