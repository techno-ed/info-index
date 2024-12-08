const adminService = require('../services/adminService');
const path = require('path');
const fs = require('fs').promises;

class AdminController {
    async getDashboard(req, res) {
        res.render('admin/dashboard');
    }

    async getUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const searchTerm = req.query.search || '';

            const result = await adminService.getUsers(page, limit, searchTerm);
            res.json(result);
        } catch (error) {
            console.error('获取用户列表失败:', error);
            res.status(500).json({ error: '获取用户列表失败', details: error.message });
        }
    }

    async createUser(req, res) {
        try {
            const user = await adminService.createUser(req.body);
            res.status(201).json({ message: '用户创建成功', user });
        } catch (error) {
            console.error('创建用户失败:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async deleteUser(req, res) {
        try {
            await adminService.deleteUser(req.params.id);
            res.json({ message: '用户删除成功' });
        } catch (error) {
            console.error('删除用户失败:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async updateUserPoints(req, res) {
        try {
            const { id } = req.params;
            const { points } = req.body;
            
            if (typeof points !== 'number' || points < 0) {
                throw new Error('积分必须是非负数');
            }

            await adminService.updateUserPoints(id, points);
            res.json({ message: '积分更新成功' });
        } catch (error) {
            console.error('更新用户积分失败:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async getOrders(req, res) {
        try {
            const orders = await adminService.getOrders();
            res.json({ orders });
        } catch (error) {
            console.error('获取订单列表失败:', error);
            res.status(500).json({ error: '获取订单列表失败' });
        }
    }

    async deleteOrder(req, res) {
        try {
            await adminService.deleteOrder(req.params.id);
            res.json({ message: '订单删除成功' });
        } catch (error) {
            console.error('删除订单失败:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async getStatistics(req, res) {
        try {
            const date = req.query.date || new Date().toISOString().split('T')[0];
            const sortBy = req.query.sortBy || 'view_home';
            
            console.log('Getting statistics for:', { date, sortBy });
            
            const stats = await adminService.getStatistics(date, sortBy);
            
            if (!stats) {
                throw new Error('No statistics data returned from service');
            }
            
            console.log('Statistics retrieved successfully:', {
                dailyStatsCount: stats.dailyStats?.length || 0,
                trendStatsCount: stats.trendStats?.length || 0,
                userStatsCount: stats.userStats?.length || 0
            });
            
            res.json(stats);
        } catch (error) {
            console.error('获取统计数据失败:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({ 
                error: '获取统计数据失败', 
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    async generateInvitationCode(req, res) {
        try {
            const invitationCode = await adminService.generateInvitationCode();
            res.json({ success: true, code: invitationCode.code });
        } catch (error) {
            console.error('生成邀请码失败:', error);
            res.status(500).json({ error: '生成邀请码失败' });
        }
    }

    async getContentForm(req, res) {
        try {
            const contentId = req.query.id;
            res.render('admin/content-form', { contentId });
        } catch (error) {
            console.error('渲染内容表单失败:', error);
            res.status(500).json({ error: '渲染内容表单失败' });
        }
    }

    async getContentById(req, res) {
        try {
            const content = await adminService.getContentById(req.params.id);
            if (!content) {
                return res.status(404).json({ error: '内容不存在' });
            }
            res.json(content);
        } catch (error) {
            console.error('获取内容详情失败:', error);
            res.status(500).json({ error: '获取内容详情失败' });
        }
    }

    async addContent(req, res) {
        try {
            const contentData = req.body;
            const previewFile = req.file;
            
            const content = await adminService.saveContent(contentData, previewFile);
            res.status(201).json({ 
                success: true, 
                message: '内容添加成功',
                content 
            });
        } catch (error) {
            console.error('添加内容失败:', error);
            res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    async updateContent(req, res) {
        try {
            const contentId = req.params.id;
            const contentData = req.body;
            const previewFile = req.file;
            
            const content = await adminService.updateContent(contentId, contentData, previewFile);
            res.json({ 
                success: true, 
                message: '内容更新成功',
                content 
            });
        } catch (error) {
            console.error('更新内容失败:', error);
            res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    async uploadImage(req, res) {
        try {
            const imageFile = req.file;
            if (!imageFile) {
                throw new Error('未上传图片');
            }

            // 生成唯一的文件名
            const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(imageFile.originalname);
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            
            // 确保上传目录存在
            await fs.mkdir(uploadDir, { recursive: true });
            
            // 保存文件
            await fs.writeFile(path.join(uploadDir, filename), imageFile.buffer);
            
            // 返回图片URL
            res.json({ 
                success: true,
                url: '/uploads/' + filename 
            });
        } catch (error) {
            console.error('上传图片失败:', error);
            res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }
    }

    async getContent(req, res) {
        try {
            const content = await adminService.getContent();
            res.json({ 
                success: true,
                content: content 
            });
        } catch (error) {
            console.error('获取内容列表失败:', error);
            res.status(500).json({ 
                success: false, 
                error: '获取内容列表失败' 
            });
        }
    }

    async deleteContent(req, res) {
        try {
            const { id } = req.params;
            const result = await adminService.deleteContent(id);
            res.json(result);
        } catch (error) {
            console.error('删除内容时出错:', error);
            res.status(500).json({ error: error.message || '删除内容失败' });
        }
    }
}

module.exports = new AdminController();
