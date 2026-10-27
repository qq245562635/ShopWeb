/*
 * 商品列表 —— 下面都是示例，按自己的商品改。
 *
 * 字段说明：
 *   id        唯一标识，只用英文、数字、横线（会出现在商品链接里）
 *   category  分类 id，对应 config.js 里的 categories
 *   name      商品名
 *   desc      一两句话介绍，列表里最多显示两行
 *   details   详情页里的要点列表（可选）
 *   icon      图标：gift 礼物 / ticket 券 / key 钥匙 / gem 宝石 / crown 皇冠 / box 盒子 /
 *             bolt 闪电 / coin 金币 / star 星星 / card 卡片
 *   theme     卡面配色：violet 紫 / coral 珊瑚 / teal 青 / midnight 午夜蓝 / gold 金 /
 *             rose 玫红 / forest 森林绿 / ocean 海蓝 / graphite 石墨（不写会自动分配）
 *   image     卡面背景图（可选，填了就不显示图标），例如 "assets/img/xxx.jpg"，建议 16:10
 *   tags      标签（可选），第一个会印在卡面右上角
 *   price     价格；有多个规格时不用填，写在 options 里
 *   was       划线原价（可选）
 *   stock     库存（可选，不填表示不限；填 0 显示「已售罄」）
 *   options   规格列表（可选），每项 { name, price, was?, stock? }
 *   link      外部购买链接（可选）。填了以后不走本站下单，按钮直接跳转（比如自动发卡平台）
 */
window.SHOP_PRODUCTS = [
  {
    id: "starter-pack",
    category: "virtual",
    name: "新手成长礼包",
    desc: "金币、体力和三天双倍经验卡，适合刚开服的玩家。",
    details: ["标准版：10 万金币 + 体力 ×20", "豪华版：50 万金币 + 体力 ×100 + 双倍经验卡 ×3", "每个账号限购一次"],
    icon: "gift",
    theme: "coral",
    tags: ["热卖"],
    options: [
      { name: "标准版", price: 6 },
      { name: "豪华版", price: 30, was: 45 }
    ],
    stock: 200
  },
  {
    id: "vip-pass",
    category: "virtual",
    name: "会员通行证",
    desc: "会员期间每天登录领钻石，商城购物九折。",
    details: ["每天登录领取 100 钻石", "会员期间商城九折", "到期前可续费，时长自动叠加"],
    icon: "crown",
    theme: "midnight",
    tags: ["可叠加"],
    options: [
      { name: "月卡", price: 25 },
      { name: "季卡", price: 68, was: 75 },
      { name: "年卡", price: 238, was: 300 }
    ]
  },
  {
    id: "diamonds",
    category: "virtual",
    name: "钻石充值",
    desc: "人工充值到你的游戏账号，下单时在备注里写上游戏 ID 和区服。",
    details: ["下单备注里写清游戏 ID 和区服", "客服在线时 10 分钟内到账"],
    icon: "coin",
    theme: "ocean",
    tags: ["需填游戏 ID"],
    options: [
      { name: "60 钻", price: 6 },
      { name: "300 钻", price: 30 },
      { name: "680 钻", price: 68 },
      { name: "3280 钻", price: 328 }
    ]
  },
  {
    id: "pixel-ui-kit",
    category: "virtual",
    name: "像素风 UI 素材包",
    desc: "120 多张按钮、图标和窗口切图，附 PSD 源文件，可商用。",
    details: ["PNG 切图 + PSD 源文件", "适配 Unity / Cocos，含九宫格切片说明", "购买后发网盘下载链接，永久有效"],
    icon: "box",
    theme: "violet",
    tags: ["含源文件", "可商用"],
    price: 39
  },
  {
    id: "license-key",
    category: "virtual",
    name: "工具软件激活码",
    desc: "永久授权，绑定设备使用，可免费换绑一次。",
    details: ["永久授权，不限更新", "换电脑时联系客服换绑，限一次"],
    icon: "key",
    theme: "graphite",
    tags: ["永久"],
    options: [
      { name: "单设备", price: 49 },
      { name: "三设备", price: 119, was: 147 }
    ]
  },
  {
    id: "limited-skin",
    category: "virtual",
    name: "限定外观兑换码",
    desc: "活动限定外观，兑换后永久保留。",
    icon: "gem",
    theme: "rose",
    price: 18,
    stock: 0
  },
  {
    id: "gift-card",
    category: "card",
    name: "店铺礼品卡",
    desc: "购买本店任意商品时抵扣，余额不过期，可以转送朋友。",
    details: ["下单时在备注里填卡号即可抵扣", "余额不过期，可分多次使用", "可转送，不可兑换现金"],
    icon: "card",
    theme: "gold",
    tags: ["可转送"],
    options: [
      { name: "面值 50", price: 48 },
      { name: "面值 100", price: 95 },
      { name: "面值 200", price: 188 },
      { name: "面值 500", price: 468 }
    ]
  },
  {
    id: "cash-voucher",
    category: "card",
    name: "代金券",
    desc: "下单时抵扣现金，有效期 90 天，每单限用一张。",
    icon: "ticket",
    theme: "teal",
    options: [
      { name: "20 元券", price: 18 },
      { name: "50 元券", price: 45 }
    ]
  },
  {
    id: "custom-icon-voucher",
    category: "card",
    name: "图标定制兑换券",
    desc: "凭券定制一套小图标（最多 10 个），7 个工作日内交付。",
    details: ["一张券兑换一次定制，最多 10 个图标", "提供 PNG + 源文件，可改两轮", "兑换有效期 180 天"],
    icon: "star",
    theme: "forest",
    tags: ["每月限量"],
    price: 199,
    stock: 20
  }
];
