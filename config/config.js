module.exports = {
    contentPrice: 80, // 所有内容的统一价格,单位为积分
    customerService: {
        contact: "\n QQ客服: 3574166785 备注（充值）\n 电报客服：https://t.me/duduhahh " 
    },
    allowRegistration: false, // 是否开放注册，默认关闭
    membership: {
        monthly: {
            title: "月卡会员",
            description: "有效期30天",
            price: "108元",
            purchaseUrl: "https://www.zaofaka.com/details/FABB0BAF"
        },
        quarterly: {
            title: "季卡会员",
            description: "有效期90天\n限时特惠",
            price: "158元",
            purchaseUrl: "https://www.zaofaka.com/details/64ACF1DC"
        },
        yearly: {
            title: "年卡会员",
            description: "有效期365天\n最优惠",
            price: "258元",
            purchaseUrl: "https://www.zaofaka.com/details/0AB78804"
        },
        lifetime: {
            title: "永久会员",
            description: "永久有效",
            price: "458元",
            purchaseUrl: "https://www.zaofaka.com/details/1ADE2C06"
        }
    }
};
