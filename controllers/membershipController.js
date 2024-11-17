const { User, MembershipCode } = require('../models');
const { generateMembershipCode } = require('../utils/membershipCodeGenerator');
const { sequelize } = require('../config/database');

// 兑换会员码
exports.redeemMembershipCode = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    const membershipCode = await MembershipCode.findOne({
      where: { 
        code: code,
        status: 'unused'
      }
    });

    if (!membershipCode) {
      return res.status(400).json({ error: '无效的兑换码' });
    }

    const user = await User.findByPk(userId);
    
    // 计算到期时间
    let expiryDate;
    if (membershipCode.type === 'lifetime') {
      expiryDate = new Date('2999-12-31');
    } else {
      const MEMBERSHIP_DURATION = {
        weekly: 7,
        monthly: 30,
        quarterly: 90,
        yearly: 365
      };
      
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + MEMBERSHIP_DURATION[membershipCode.type]);
      
      if (user.membershipType !== 'none' && user.membershipExpiry > new Date()) {
        expiryDate = new Date(user.membershipExpiry);
        expiryDate.setDate(expiryDate.getDate() + MEMBERSHIP_DURATION[membershipCode.type]);
      }
    }

    await sequelize.transaction(async (t) => {
      await user.update({
        membershipType: membershipCode.type,
        membershipExpiry: expiryDate
      }, { transaction: t });

      await membershipCode.update({
        status: 'used',
        usedBy: userId,
        usedAt: new Date()
      }, { transaction: t });
    });

    res.json({ 
      success: true,
      membershipType: membershipCode.type,
      expiryDate: expiryDate
    });
  } catch (error) {
    console.error('兑换会员失败:', error);
    res.status(500).json({ error: '兑换失败，请稍后重试' });
  }
};

// 生成会员兑换码
exports.generateMembershipCodes = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权限' });
    }

    const { type, count = 1 } = req.body;
    const codes = [];

    for (let i = 0; i < count; i++) {
      const code = generateMembershipCode();
      codes.push({
        code,
        type,
        status: 'unused'
      });
    }

    await MembershipCode.bulkCreate(codes);

    res.json({ 
      success: true, 
      codes: codes.map(c => c.code)
    });
  } catch (error) {
    console.error('生成兑换码失败:', error);
    res.status(500).json({ error: '生成失败，请稍后重试' });
  }
};

// 获取会员页面
exports.getMembershipPage = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.render('membership/redeem', { user });
  } catch (error) {
    console.error('获取会员页面失败:', error);
    res.status(500).render('error', { error: '页面加载失败' });
  }
};

// 获取生成兑换码页面
exports.getGenerateCodesPage = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.redirect('/');
    }
    res.render('admin/generate-codes');
  } catch (error) {
    console.error('获取生成兑换码页面失败:', error);
    res.status(500).render('error', { error: '页面加载失败' });
  }
}; 