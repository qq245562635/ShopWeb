/*
 * 商品列表 —— 下面都是示例，按自己的商品改。
 *
 * 字段说明：
 *   id        唯一标识，只用英文、数字、横线（会出现在商品链接里）
 *   category  分类 id，对应 config.js 里的 categories
 *   type      商品类型，决定怎么发货：
 *               "digital"  数字商品（默认）：发到买家留的联系方式
 *               "physical" 实物：下单时要填收货地址，按 config.js 的 shippingFee 收运费
 *               "service"  服务：下单后联系买家约时间
 *   name      商品名
 *   desc      一两句话介绍
 *   details   详情页里的要点列表（可选）
 *   images    商品图片列表（可选），第一张是封面，例如 ["assets/img/sticker-1.jpg", "assets/img/sticker-2.jpg"]
 *             建议用正方形或 4:3 的图
 *   icon      没有图片时显示的图标：box 盒子 / bolt 闪电 / gift 礼物 / card 卡片 / star 星星 /
 *             image 图片 / keyboard 键盘 / pen 画笔 / chat 对话 / medal 徽章 / key 钥匙 / ticket 券
 *   color     没有图片时的底色：lavender / sky / mint / peach / yellow / pink / gray（不写会自动分配）
 *   tags      标签（可选），第一个会显示在图片左上角
 *   price     价格；有多个规格时不用填，写在 options 里
 *   was       划线原价（可选）
 *   stock     库存（可选，不填表示不限；填 0 显示「已售罄」）
 *   options   规格列表（可选），每项 { name, price, was?, stock? }
 *   link      外部购买链接（可选）。填了以后不走本站下单，按钮直接跳转（比如闲鱼、发卡平台）
 */
window.SHOP_PRODUCTS = [
  {
    id: "pixel-ui-kit",
    category: "digital",
    type: "digital",
    name: "像素风 UI 素材包",
    desc: "120 多张按钮、图标和窗口切图，附 PSD 源文件，可商用。",
    details: ["PNG 切图 + PSD 源文件", "适配 Unity / Cocos，含九宫格切片说明", "付款后发网盘链接，永久有效"],
    icon: "image",
    color: "lavender",
    tags: ["含源文件"],
    price: 39
  },
  {
    id: "level-editor",
    category: "digital",
    type: "digital",
    name: "关卡编辑器插件",
    desc: "在 Unity 编辑器里拖拽摆关卡，一键导出 JSON。",
    details: ["支持 Unity 2021 及以上", "个人版限 1 个项目，团队版不限项目", "一年内免费更新"],
    icon: "bolt",
    color: "sky",
    tags: ["新品"],
    options: [
      { name: "个人版", price: 69 },
      { name: "团队版", price: 199, was: 259 }
    ]
  },
  {
    id: "game-pack",
    category: "card",
    type: "digital",
    name: "游戏新手礼包兑换码",
    desc: "金币、体力和双倍经验卡，每个账号限兑换一次。",
    icon: "gift",
    color: "peach",
    tags: ["热卖"],
    options: [
      { name: "标准版", price: 6 },
      { name: "豪华版", price: 30, was: 45 }
    ],
    stock: 200
  },
  {
    id: "gift-card",
    category: "card",
    type: "digital",
    name: "店铺礼品卡",
    desc: "在本店买任何东西都能抵扣，余额不过期，可以送人。",
    details: ["下单时在备注里填卡号即可抵扣", "余额不过期，可分多次使用", "不可兑换现金"],
    icon: "card",
    color: "yellow",
    options: [
      { name: "面值 50", price: 48 },
      { name: "面值 100", price: 95 },
      { name: "面值 200", price: 188 }
    ]
  },
  {
    id: "sticker-set",
    category: "goods",
    type: "physical",
    name: "原创像素贴纸套装",
    desc: "12 张防水贴纸，贴电脑、手机壳、水杯都行。",
    details: ["一套 12 张，单张约 5cm", "防水防晒 PVC 材质", "平信或快递寄出"],
    icon: "star",
    color: "pink",
    price: 25
  },
  {
    id: "acrylic-stand",
    category: "goods",
    type: "physical",
    name: "亚克力立牌",
    desc: "双面印刷，带底座，放桌面刚好。",
    icon: "medal",
    color: "mint",
    options: [
      { name: "小号 10cm", price: 35 },
      { name: "大号 15cm", price: 59, stock: 0 }
    ],
    stock: 15
  },
  {
    id: "keyboard",
    category: "goods",
    type: "physical",
    name: "闲置机械键盘",
    desc: "87 键茶轴，用了半年，功能完好，原盒配件都在。",
    details: ["九成新，无磕碰", "附原装线和拔键器", "只有一把，拍下后顺丰到付"],
    icon: "keyboard",
    color: "gray",
    tags: ["九成新"],
    price: 260,
    was: 499,
    stock: 1
  },
  {
    id: "avatar-commission",
    category: "service",
    type: "service",
    name: "像素头像定制",
    desc: "根据你的照片或描述画一张像素风头像，7 天内交付。",
    details: ["交付 PNG 原图 + 透明底", "可改两轮", "下单后联系你确认需求"],
    icon: "pen",
    color: "peach",
    tags: ["每月限 10 单"],
    options: [
      { name: "Q 版头像", price: 99 },
      { name: "半身像", price: 199 }
    ],
    stock: 10
  },
  {
    id: "consult",
    category: "service",
    type: "service",
    name: "一对一技术咨询",
    desc: "游戏开发、性能优化、项目规划都可以聊，语音或屏幕共享。",
    icon: "chat",
    color: "sky",
    price: 150
  },
  {
    id: "limited-badge",
    category: "goods",
    type: "physical",
    name: "限定金属徽章",
    desc: "去年展会限定款，已经卖完了。",
    icon: "medal",
    color: "yellow",
    price: 30,
    stock: 0
  }
];
