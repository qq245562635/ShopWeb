/*
 * 店铺设置 —— 改这里就行，不用动其它代码。
 * 商品列表在 products.js。
 */
window.SHOP_CONFIG = {
  // 店名，会显示在顶栏、首页和浏览器标签上
  name: "我的小铺",

  // 头像图片（放进 assets/img/ 后填路径）。不填就用店名第一个字
  avatar: "",

  // 首页顶部的横幅图（建议 1200×300 左右）。不填就自动用商品图拼一条
  cover: "",

  // 首页的自我介绍
  tagline: "做游戏之余做点小东西：素材、插件、周边，偶尔也出点闲置。下单后扫码付款，我看到就发货。",

  // 顶部公告，不需要就留空 ""
  notice: "数字商品发出后不支持退款，下单前请看清规格。",

  // 在线时间（按北京时间判断「在线 / 休息中」）。不想显示就删掉这一段
  hours: { open: "10:00", close: "24:00" },
  timezone: "Asia/Shanghai",

  // 首页的发货说明
  delivery: "数字商品 10 分钟内发，实物 48 小时内寄出",

  // 主题色：按钮悬停、价格、角标会用到
  accent: "#f0522b",

  // 货币符号
  currency: "¥",

  // 实物运费：0 表示包邮；填数字表示每单收一次运费
  shippingFee: 0,

  // 订单号前缀，可留空
  orderPrefix: "",

  // 商品分类：id 要和 products.js 里商品的 category 对应，想分几类都行
  categories: [
    { id: "digital", name: "数字商品" },
    { id: "card", name: "卡券" },
    { id: "goods", name: "实物" },
    { id: "service", name: "服务" }
  ],

  // 收款方式：把 qr 换成你自己的收款码图片（放进 assets/img/ 再改文件名）
  payments: [
    { id: "wechat", name: "微信支付", qr: "assets/img/pay-wechat.svg" },
    { id: "alipay", name: "支付宝", qr: "assets/img/pay-alipay.svg" }
  ],

  // 联系方式：点了会复制 value；有 link 的会直接打开链接
  contacts: [
    { label: "微信", value: "your_wechat_id" },
    { label: "QQ", value: "10000" },
    { label: "邮箱", value: "shop@example.com", link: "mailto:shop@example.com" }
  ],

  // 下单页输入框的提示
  buyerContactHint: "微信 / QQ / 邮箱，用来发货和联系你",
  noteHint: "选填：游戏 ID、尺寸、定制要求等",

  // 购买须知（页面底部）
  notes: [
    { q: "多久发货？", a: "数字商品在线时间内 10 分钟内发到你留的联系方式；实物 48 小时内寄出，发货后把单号发给你。" },
    { q: "怎么付款？", a: "提交订单后扫码付款，付款备注里写上订单号，再把订单信息发给我。" },
    { q: "可以退款吗？", a: "数字商品和卡券发出后不退；实物收到 7 天内、不影响二次销售的可以退，运费由买家承担。" },
    { q: "定制和服务怎么约？", a: "下单后我会联系你确认需求和时间，开始前可以全额退款。" }
  ]
};
