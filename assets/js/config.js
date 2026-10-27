/*
 * 店铺设置 —— 改这里就行，不用动其它代码。
 * 商品列表在 products.js。
 */
window.SHOP_CONFIG = {
  // 店名，会显示在顶栏、首屏和浏览器标签上
  name: "我的小铺",

  // 首屏的一句话介绍
  tagline: "游戏道具、素材资源和各类卡券。下单后扫码付款，客服核对到账后发货。",

  // 首屏公告，不需要就留空 ""
  notice: "虚拟商品发出后不支持退款，下单前请看清规格。",

  // 客服在线时间（按北京时间判断「在线 / 休息中」）。不想显示就删掉这一段
  hours: { open: "10:00", close: "24:00" },
  timezone: "Asia/Shanghai",

  // 首屏右侧的发货说明
  delivery: "付款后 10 分钟内发货",

  // 货币符号
  currency: "¥",

  // 订单号前缀，可留空
  orderPrefix: "",

  // 商品分类：id 要和 products.js 里商品的 category 对应；paper 是这一类商品券的票面颜色
  // 想再加分类可以用这些颜色：#F8C7B5（橘粉）、#D8D0F5（淡紫）、#BFE0F2（浅蓝）
  categories: [
    { id: "virtual", name: "虚拟物品", paper: "#C9EBD9" },
    { id: "card", name: "卡券", paper: "#F7E59A" }
  ],

  // 收款方式：把 qr 换成你自己的收款码图片（放进 assets/img/ 再改文件名）
  payments: [
    { id: "wechat", name: "微信支付", qr: "assets/img/pay-wechat.svg" },
    { id: "alipay", name: "支付宝", qr: "assets/img/pay-alipay.svg" }
  ],

  // 客服联系方式：点了会复制 value；有 link 的会直接打开链接
  contacts: [
    { label: "微信", value: "your_wechat_id" },
    { label: "QQ", value: "10000" },
    { label: "邮箱", value: "shop@example.com", link: "mailto:shop@example.com" }
  ],

  // 下单页「联系方式」输入框的提示
  buyerContactHint: "QQ / 微信 / 邮箱，卡密会发到这里",
  // 下单页「备注」输入框的提示
  noteHint: "选填：充值用的游戏 ID、区服，或其它要求",

  // 购买须知（页面底部）
  notes: [
    { q: "多久能收到？", a: "客服在线时间内，付款后 10 分钟内发货；休息时间下单的，第二天上线后按顺序处理。" },
    { q: "怎么付款？", a: "提交订单后扫码付款，付款备注里写上订单号，再把订单信息发给客服。" },
    { q: "卡密发到哪里？", a: "发到你下单时填的联系方式（QQ、微信或邮箱）。请确认填写正确。" },
    { q: "可以退款吗？", a: "虚拟商品和卡券一经发出不支持退款。如果卡密无法使用，联系客服核实后补发或退款。" }
  ]
};
