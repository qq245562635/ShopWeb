/* ShopWeb 页面逻辑：分类、搜索、商品详情、购物车、下单。
   一般不需要改这个文件。店铺内容在 data/shop.json 和 data/products.json，
   推荐用后台（/admin/）修改。 */
(function () {
  "use strict";

  function loadJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  Promise.all([loadJSON("data/shop.json"), loadJSON("data/products.json")]).then(
    function (res) { start(res[0] || {}, res[1] || []); },
    function (err) {
      var grid = document.getElementById("grid");
      if (grid) {
        grid.outerHTML = '<p class="empty">店铺数据没有加载出来。如果是直接双击打开的 index.html，请按 README 用本地服务器打开；线上出现这个提示请刷新重试。</p>';
      }
      if (window.console) console.error(err);
    }
  );

  function start(CFG, PRODUCTS) {
  PRODUCTS = PRODUCTS.filter(function (p) { return p && p.id; });
  var CUR = CFG.currency || "¥";
  var CATS = CFG.categories || [];
  var PAYS = CFG.payments || [];
  var SHIP_FEE = Number(CFG.shippingFee) || 0;
  var catById = {};
  var prodById = {};
  CATS.forEach(function (c) { catById[c.id] = c; });
  PRODUCTS.forEach(function (p) { prodById[p.id] = p; });

  if (CFG.accent) document.documentElement.style.setProperty("--accent", CFG.accent);

  /* ---------- 小工具 ---------- */

  function $(s, root) { return (root || document).querySelector(s); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function money(n) {
    var v = Math.round(Number(n) * 100) / 100;
    return v % 1 === 0 ? String(v) : v.toFixed(2);
  }

  function priceHTML(n, from) {
    return '<span class="cur">' + esc(CUR) + "</span>" + money(n) + (from ? '<span class="from">起</span>' : "");
  }

  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem("shopweb." + k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem("shopweb." + k, JSON.stringify(v)); } catch (e) { /* 隐私模式等情况下忽略 */ }
    }
  };

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var ICONS = {
    box: '<path d="M21 7.5l-9-4.5-9 4.5v9l9 4.5 9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9M7.5 5.2l9 4.6"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8C10.5 5 7 4 6.5 6S9 8 12 8zm0 0c1.5-3 5-4 5.5-2S15 8 12 8z"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h5"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    keyboard: '<rect x="2" y="6" width="20" height="12" rx="2.5"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7 14h10"/>',
    pen: '<path d="M4 20l4-1L19 8a2.1 2.1 0 0 0-3-3L5 16z"/><path d="M14 7l3 3"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    medal: '<circle cx="12" cy="14.5" r="5.5"/><path d="M8.6 10.2L6 3h4l2 4.5L14 3h4l-2.6 7.2"/><path d="M12 12v5M9.5 14.5h5"/>',
    key: '<circle cx="8" cy="15" r="4.5"/><path d="M11.2 11.8L20 3M17 6l3 3M14.5 8.5l2.5 2.5"/>',
    ticket: '<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z"/><path d="M15 5v2.5M15 10.8v2.4M15 16.5V19"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h4"/>',
    bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    send: '<path d="M21 3L3 10.5l7 2.5 2.5 7z"/><path d="M10 13l4-4"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'
  };

  function icon(name) {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.box) + "</svg>";
  }

  /* 没有图片时的占位底色 */
  var TINTS = {
    lavender: ["#eef0ff", "#5b5bd6"],
    sky: ["#e5f2fc", "#1f74c2"],
    mint: ["#e5f5ec", "#2b8456"],
    peach: ["#fff0e5", "#cf5a24"],
    yellow: ["#fff5d3", "#a87a06"],
    pink: ["#fdeaf3", "#bd3277"],
    gray: ["#eef0f3", "#4a4f5c"]
  };
  var TINT_KEYS = Object.keys(TINTS);

  function tintOf(p) {
    if (TINTS[p.color]) return TINTS[p.color];
    var h = 0;
    for (var i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i)) >>> 0;
    return TINTS[TINT_KEYS[h % TINT_KEYS.length]];
  }

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }

  function tintVars(p) {
    var t = tintOf(p);
    return "--tint:" + t[0] + ";--tint-fg:" + t[1] + ";--tint-dot:" + rgba(t[1], 0.13);
  }

  function imagesOf(p) {
    if (Array.isArray(p.images) && p.images.length) return p.images;
    return p.image ? [p.image] : [];
  }

  // 商品图：有图用第一张，没有就画占位图块
  function mediaHTML(p, extraCls) {
    var imgs = imagesOf(p);
    return '<span class="media' + (extraCls ? " " + extraCls : "") + '" style="' + tintVars(p) + '">' +
      (imgs.length ? '<img src="' + esc(imgs[0]) + '" alt="" loading="lazy">' : '<span class="media-ph">' + icon(p.icon) + "</span>") +
      "</span>";
  }

  var toastTimer;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 1800);
  }

  function copyText(text) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
    }
    return Promise.resolve(fallback());
  }

  /* ---------- 商品数据 ---------- */

  function opts(p) { return Array.isArray(p.options) && p.options.length ? p.options : null; }

  function opt(p, oi) { var o = opts(p); return o ? o[oi || 0] : null; }

  function priceOf(p, oi) { var o = opt(p, oi); return Number(o ? o.price : p.price) || 0; }

  function wasOf(p, oi) { var o = opt(p, oi); var w = o ? o.was : p.was; return w ? Number(w) : null; }

  function stockOf(p, oi) {
    var o = opt(p, oi);
    var s = o && o.stock != null ? o.stock : p.stock;
    return s == null ? Infinity : Number(s);
  }

  function maxQty(p, oi) { return Math.max(0, Math.min(99, stockOf(p, oi))); }

  function soldOut(p) {
    var o = opts(p);
    if (!o) return stockOf(p) <= 0;
    return o.every(function (_, i) { return stockOf(p, i) <= 0; });
  }

  function priceRange(p) {
    var o = opts(p);
    if (!o) return { min: priceOf(p), from: false };
    var list = o.map(function (x) { return Number(x.price) || 0; });
    var min = Math.min.apply(null, list);
    return { min: min, from: Math.max.apply(null, list) > min };
  }

  function optName(p, oi) { var o = opt(p, oi); return o ? o.name : ""; }

  function typeOf(p) { return p.type === "physical" || p.type === "service" ? p.type : "digital"; }

  function shipText() { return SHIP_FEE > 0 ? "运费 " + CUR + money(SHIP_FEE) : "包邮"; }

  // 发货方式的简短说明（列表和详情里用）
  function deliveryInfo(p) {
    var t = typeOf(p);
    if (t === "physical") return { icon: "truck", short: "快递 " + shipText(), long: "实物，快递寄出，" + shipText() + "。下单时填收货地址。" };
    if (t === "service") return { icon: "calendar", short: "预约服务", long: "服务类，下单后我会联系你确认需求和时间。" };
    return { icon: "send", short: "线上发货", long: "数字商品，付款后发到你留的联系方式。" };
  }

  /* ---------- 购物车 ---------- */

  var cart = store.get("cart", []).filter(function (l) {
    var p = prodById[l && l.pid];
    return p && !p.link && (opts(p) ? opts(p)[l.oi] : l.oi == null) && l.qty > 0;
  });

  function saveCart() { store.set("cart", cart); updateBadge(true); }

  function cartCount() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }

  function subtotalOf(lines) {
    return lines.reduce(function (s, l) { return s + priceOf(prodById[l.pid], l.oi) * l.qty; }, 0);
  }

  function needsShipping(lines) {
    return lines.some(function (l) { return typeOf(prodById[l.pid]) === "physical"; });
  }

  function addToCart(pid, oi, qty) {
    var p = prodById[pid];
    var max = maxQty(p, oi);
    var line = cart.filter(function (l) { return l.pid === pid && l.oi === oi; })[0];
    var before = line ? line.qty : 0;
    var after = Math.min(max, before + qty);
    if (after === before) return false;
    if (line) line.qty = after;
    else cart.push({ pid: pid, oi: oi, qty: after });
    saveCart();
    return true;
  }

  function addAndTell(pid, oi, qty) {
    toast(addToCart(pid, oi, qty) ? "已加入购物车" : "购物车里已经是库存上限了");
  }

  function updateBadge(bump) {
    var b = $("#cartCount");
    b.textContent = cartCount();
    if (bump && !reduceMotion) {
      b.classList.remove("is-bump");
      void b.offsetWidth;
      b.classList.add("is-bump");
    }
  }

  /* ---------- 弹层 ---------- */

  var stack = [];

  function head(title) {
    return '<div class="panel-head"><h2>' + esc(title) + '</h2><button class="close-btn" type="button" data-close aria-label="关闭">' + icon("close") + "</button></div>";
  }

  function openLayer(o) {
    var opener = document.activeElement;
    var el = document.createElement("div");
    el.className = "layer" + (o.side ? " layer--side" : "");
    el.innerHTML = '<div class="scrim" data-close></div><div class="panel" role="dialog" aria-modal="true" aria-label="' + esc(o.label) + '" tabindex="-1">' + o.html + "</div>";
    document.body.appendChild(el);
    document.body.classList.add("locked");

    var layer = { el: el, panel: el.querySelector(".panel"), closed: false };
    layer.close = function () {
      if (layer.closed) return;
      layer.closed = true;
      stack.splice(stack.indexOf(layer), 1);
      if (!stack.length) document.body.classList.remove("locked");
      var removed = false;
      var remove = function () { if (!removed) { removed = true; el.remove(); } };
      if (reduceMotion) remove();
      else { el.classList.add("is-leaving"); setTimeout(remove, 200); }
      if (opener && opener.focus && document.contains(opener)) opener.focus({ preventScroll: true });
    };
    el.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) layer.close();
    });
    stack.push(layer);
    requestAnimationFrame(function () {
      var f = layer.panel.querySelector("[data-autofocus]") || layer.panel;
      f.focus({ preventScroll: true });
    });
    return layer;
  }

  function closeAll() { stack.slice().reverse().forEach(function (l) { l.close(); }); }

  document.addEventListener("keydown", function (e) {
    var top = stack[stack.length - 1];
    if (!top) return;
    if (e.key === "Escape") { e.preventDefault(); top.close(); return; }
    if (e.key !== "Tab") return;
    var f = Array.prototype.filter.call(
      top.panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea, summary, [tabindex]:not([tabindex="-1"])'),
      function (n) { return n.offsetParent !== null; }
    );
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === top.panel)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  function stepperHTML(value, max, small, labelId) {
    return '<div class="stepper' + (small ? " stepper--sm" : "") + '">' +
      '<button type="button" data-step="-1" aria-label="减少数量"' + (value <= 1 ? " disabled" : "") + ">−</button>" +
      '<input type="number" inputmode="numeric" min="1" max="' + max + '" value="' + value + '"' + (labelId ? ' aria-labelledby="' + labelId + '"' : ' aria-label="数量"') + ">" +
      '<button type="button" data-step="1" aria-label="增加数量"' + (value >= max ? " disabled" : "") + ">+</button></div>";
  }

  /* ---------- 首页 ---------- */

  var state = { cat: "all", q: "" };

  function shopIsOpen() {
    var h = CFG.hours;
    if (!h || !h.open || !h.close) return null;
    var hh, mm;
    try {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: CFG.timezone || "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
      parts.forEach(function (x) { if (x.type === "hour") hh = Number(x.value) % 24; if (x.type === "minute") mm = Number(x.value); });
    } catch (e) {
      var d = new Date(); hh = d.getHours(); mm = d.getMinutes();
    }
    var toMin = function (s) { var a = String(s).split(":"); return Number(a[0]) * 60 + (Number(a[1]) || 0); };
    var now = hh * 60 + mm, o = toMin(h.open), c = toMin(h.close);
    return c > o ? now >= o && now < c : now >= o || now < c;
  }

  function avatarHTML(cls) {
    var name = CFG.name || "小铺";
    return CFG.avatar
      ? '<img class="' + cls + '" src="' + esc(CFG.avatar) + '" alt="">'
      : '<span class="' + cls + ' avatar--text" aria-hidden="true">' + esc(Array.from(name)[0]) + "</span>";
  }

  function renderShop() {
    var name = CFG.name || "小铺";
    document.title = name;
    var meta = $('meta[name="description"]');
    if (meta) meta.setAttribute("content", CFG.tagline || "");
    Array.prototype.forEach.call(document.querySelectorAll("[data-shop]"), function (n) {
      n.textContent = CFG[n.getAttribute("data-shop")] || "";
    });
    $("#brandAvatar").outerHTML = avatarHTML("brand-avatar");
    $("#avatar").outerHTML = avatarHTML("avatar");

    if (CFG.notice) {
      $("#notice").textContent = CFG.notice;
      $("#notice").hidden = false;
    }

    var open = shopIsOpen();
    var facts = [];
    if (open !== null) {
      facts.push('<span class="fact' + (open ? "" : " is-closed") + '"><i class="dot"></i><b>' + (open ? "在线" : "休息中") + '</b><span class="num">' +
        esc(CFG.hours.open) + "–" + esc(CFG.hours.close) + "</span></span>");
    }
    var onSale = PRODUCTS.filter(function (p) { return !soldOut(p); }).length;
    facts.push('<span class="fact">在售 <b class="num">' + onSale + "</b> 件</span>");
    var delivery = open === false ? "现在下单，我上线后按顺序处理" : CFG.delivery;
    if (delivery) facts.push('<span class="fact">' + esc(delivery) + "</span>");
    $("#facts").innerHTML = facts.join("");

    renderCover();

    var notes = CFG.notes || [];
    if (notes.length) {
      $("#faq").innerHTML = notes.map(function (n) {
        return "<div><dt>" + esc(n.q) + "</dt><dd>" + esc(n.a) + "</dd></div>";
      }).join("");
      $("#notes").hidden = false;
    }

    if ((CFG.contacts || []).length) {
      $("#contactList").innerHTML = contactsHTML();
      $("#contact").hidden = false;
    }
    if ($("#notes").hidden && $("#contact").hidden) $("#info").hidden = true;
    $("#footLine").textContent = "© " + new Date().getFullYear() + " " + name;
  }

  // 横幅：有 cover 图就用图，没有就把商品图排成一条
  function renderCover() {
    var el = $("#cover");
    if (CFG.cover) {
      el.classList.add("cover--img");
      el.style.backgroundImage = "url('" + String(CFG.cover).replace(/'/g, "%27") + "')";
      return;
    }
    var picks = PRODUCTS.filter(function (p) { return !soldOut(p); }).slice(0, 8);
    el.innerHTML = '<div class="cover-strip">' + picks.map(function (p, i) {
      return '<span class="cover-tile" style="--r:' + (i % 2 ? 4 : -5) + "deg;--y:" + (i % 3 ? 10 : -6) + 'px">' + mediaHTML(p) + "</span>";
    }).join("") + "</div>";
  }

  function contactsHTML() {
    return (CFG.contacts || []).map(function (c) {
      var inner = "<span><b>" + esc(c.label) + "</b>" + esc(c.value) + "</span>";
      if (c.link) {
        return '<a class="contact-chip" href="' + esc(c.link) + '" target="_blank" rel="noopener">' + inner + '<span class="chip-act">打开</span></a>';
      }
      return '<button class="contact-chip" type="button" data-copy="' + esc(c.value) + '" data-copy-msg="已复制' + esc(c.label) + '">' + inner + '<span class="chip-act">' + icon("copy") + "复制</span></button>";
    }).join("");
  }

  function renderTabs() {
    var counts = {};
    PRODUCTS.forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });
    var tabs = [{ id: "all", name: "全部", n: PRODUCTS.length }].concat(
      CATS.filter(function (c) { return counts[c.id]; }).map(function (c) { return { id: c.id, name: c.name, n: counts[c.id] }; })
    );
    $("#tabs").innerHTML = tabs.map(function (t) {
      return '<button class="tab" type="button" data-cat="' + esc(t.id) + '" aria-pressed="' + (state.cat === t.id) + '">' +
        esc(t.name) + ' <span class="tab-n">' + t.n + "</span></button>";
    }).join("");
  }

  function itemHTML(p) {
    var out = soldOut(p);
    var r = priceRange(p);
    var was = opts(p) ? null : wasOf(p);
    var d = deliveryInfo(p);
    return '<article class="item' + (out ? " is-out" : "") + '">' +
      '<div class="item-media">' + mediaHTML(p) +
        (p.tags && p.tags.length ? '<span class="item-tag">' + esc(p.tags[0]) + "</span>" : "") +
        (out ? '<span class="item-out">已售罄</span>' : "") + "</div>" +
      '<div class="item-body">' +
        '<h3 class="item-name"><button class="item-hit" type="button" data-pid="' + esc(p.id) + '">' + esc(p.name) + "</button></h3>" +
        '<p class="item-kind">' + icon(d.icon) + esc(d.short) + "</p>" +
        '<div class="item-row"><span class="price">' + priceHTML(r.min, r.from) + "</span>" +
          (was ? '<s class="was">' + esc(CUR) + money(was) + "</s>" : "") +
          '<button class="add" type="button" data-quick="' + esc(p.id) + '"' + (out ? " disabled" : "") +
            ' aria-label="' + (opts(p) ? "选择规格：" : "加入购物车：") + esc(p.name) + '">' + icon("plus") + "</button></div>" +
      "</div></article>";
  }

  function renderGrid() {
    var q = state.q.trim().toLowerCase();
    var list = PRODUCTS.filter(function (p) {
      if (state.cat !== "all" && p.category !== state.cat) return false;
      if (!q) return true;
      var hay = [p.name, p.desc, (p.tags || []).join(" "), (opts(p) || []).map(function (o) { return o.name; }).join(" ")].join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    $("#grid").innerHTML = list.map(itemHTML).join("");
    var empty = $("#empty");
    empty.hidden = list.length > 0;
    if (!list.length) {
      empty.textContent = q ? "没有找到和「" + state.q.trim() + "」有关的商品，换个关键词试试。" : "这个分类暂时没有商品。";
    }
  }

  /* ---------- 商品详情 ---------- */

  function galleryHTML(p) {
    var imgs = imagesOf(p);
    if (imgs.length < 2) return '<div class="gallery">' + mediaHTML(p, "media--wide") + "</div>";
    return '<div class="gallery"><div class="g-track" data-track>' + imgs.map(function (src, i) {
      return '<div class="g-slide"><span class="media media--wide" style="' + tintVars(p) + '"><img src="' + esc(src) + '" alt="' + esc(p.name) + " 第 " + (i + 1) + ' 张图"' + (i ? ' loading="lazy"' : "") + "></span></div>";
    }).join("") + '</div><div class="g-dots">' + imgs.map(function (_, i) {
      return '<button type="button" data-dot="' + i + '" aria-label="第 ' + (i + 1) + ' 张图"' + (i ? "" : ' aria-current="true"') + "></button>";
    }).join("") + "</div></div>";
  }

  function openProduct(pid) {
    var p = prodById[pid];
    if (!p) return;
    var o = opts(p);
    var oi = null;
    if (o) {
      oi = 0;
      for (var i = 0; i < o.length; i++) { if (stockOf(p, i) > 0) { oi = i; break; } }
    }
    var qty = 1;
    var cat = catById[p.category];
    var uid = "q" + Date.now();
    var d = deliveryInfo(p);

    var body =
      galleryHTML(p) +
      '<h3 class="p-name">' + esc(p.name) + "</h3>" +
      (p.desc ? '<p class="p-desc">' + esc(p.desc) + "</p>" : "") +
      '<div class="p-price"><span class="price" data-price></span><s class="was" data-was></s><span class="p-stock" data-stock></span></div>' +
      '<p class="p-kind">' + icon(d.icon) + esc(d.long) + "</p>" +
      (o ? '<fieldset class="field"><legend>规格</legend><div class="chips">' + o.map(function (x, i) {
        var none = stockOf(p, i) <= 0;
        return '<label class="chip"><input type="radio" name="opt-' + uid + '" value="' + i + '"' + (i === oi ? " checked" : "") + (none ? " disabled" : "") + "><span>" + esc(x.name) + (none ? "（售罄）" : "") + "</span></label>";
      }).join("") + "</div></fieldset>" : "") +
      (!p.link ? '<div class="field"><span class="field-label" id="' + uid + '">数量</span><div data-stepper></div></div>' : "") +
      ((p.details || []).length ? '<ul class="p-details">' + p.details.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
      '<button class="text-btn" type="button" data-share>' + icon("link") + "复制商品链接</button>";

    var foot = p.link
      ? '<a class="btn btn-primary" href="' + esc(p.link) + '" target="_blank" rel="noopener">去购买</a>'
      : '<button class="btn" type="button" data-add>加入购物车</button><button class="btn btn-primary" type="button" data-buy>立即购买</button>';

    var L = openLayer({
      label: p.name,
      html: head(cat ? cat.name : "商品详情") + '<div class="panel-body">' + body + '</div><div class="panel-foot">' + foot + "</div>"
    });
    var panel = L.panel;

    var track = $("[data-track]", panel);
    if (track) {
      var dots = panel.querySelectorAll("[data-dot]");
      track.addEventListener("scroll", function () {
        var idx = Math.round(track.scrollLeft / track.clientWidth);
        Array.prototype.forEach.call(dots, function (b, i) {
          if (i === idx) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
        });
      }, { passive: true });
    }

    function sync() {
      var out = o ? stockOf(p, oi) <= 0 : soldOut(p);
      var max = maxQty(p, oi);
      qty = Math.max(1, Math.min(qty, max || 1));
      $("[data-price]", panel).innerHTML = priceHTML(priceOf(p, oi));
      var w = wasOf(p, oi);
      $("[data-was]", panel).textContent = w ? CUR + money(w) : "";
      var s = stockOf(p, oi);
      $("[data-stock]", panel).textContent = out ? "已售罄" : s !== Infinity ? "剩余 " + s + " 件" : "";
      var st = $("[data-stepper]", panel);
      if (st) st.innerHTML = stepperHTML(qty, Math.max(1, max), false, uid);
      Array.prototype.forEach.call(panel.querySelectorAll("[data-add],[data-buy]"), function (b) { b.disabled = out; });
      var buy = $("[data-buy]", panel);
      if (buy) buy.textContent = out ? "已售罄" : "立即购买";
    }

    panel.addEventListener("change", function (e) {
      if (e.target.type === "radio") { oi = Number(e.target.value); sync(); }
      if (e.target.type === "number") { qty = parseInt(e.target.value, 10) || 1; sync(); }
    });

    panel.addEventListener("click", function (e) {
      var t = e.target.closest("button");
      if (!t) return;
      if (t.hasAttribute("data-dot")) {
        track.scrollTo({ left: track.clientWidth * Number(t.getAttribute("data-dot")), behavior: reduceMotion ? "auto" : "smooth" });
      } else if (t.hasAttribute("data-step")) {
        qty += Number(t.getAttribute("data-step"));
        sync();
        $("[data-stepper] [data-step='" + t.getAttribute("data-step") + "']", panel).focus();
      } else if (t.hasAttribute("data-add")) {
        addAndTell(p.id, oi, qty);
        L.close();
      } else if (t.hasAttribute("data-buy")) {
        openCheckout([{ pid: p.id, oi: oi, qty: qty }], false);
      } else if (t.hasAttribute("data-share")) {
        var url = location.href.split("#")[0] + "#item=" + encodeURIComponent(p.id);
        copyText(url).then(function (ok) { toast(ok ? "商品链接已复制" : "复制失败，请手动复制地址栏"); });
      }
    });

    sync();
  }

  /* ---------- 购物车 ---------- */

  function openCart() {
    var L = openLayer({
      side: true,
      label: "购物车",
      html: head("购物车") + '<div class="panel-body" data-body></div><div class="panel-foot" data-foot></div>'
    });
    var panel = L.panel;

    function render() {
      var bodyEl = $("[data-body]", panel);
      var footEl = $("[data-foot]", panel);
      if (!cart.length) {
        bodyEl.innerHTML = '<div class="blank">' + icon("bag") + '<p>购物车是空的。</p><button class="btn" type="button" data-close>去挑商品</button></div>';
        footEl.hidden = true;
        return;
      }
      footEl.hidden = false;
      var ship = needsShipping(cart);
      bodyEl.innerHTML = '<ul class="lines">' + cart.map(function (l, i) {
        var p = prodById[l.pid];
        return '<li class="line" data-i="' + i + '">' + mediaHTML(p, "media--thumb") +
          '<div class="line-info"><span class="line-name">' + esc(p.name) + "</span>" +
          (l.oi != null ? '<span class="line-opt">' + esc(optName(p, l.oi)) + "</span>" : "") +
          '<div class="line-ctrl"><span class="line-price">' + esc(CUR) + money(priceOf(p, l.oi)) + "</span>" +
          stepperHTML(l.qty, Math.max(1, maxQty(p, l.oi)), true) +
          '<button class="icon-btn" type="button" data-remove aria-label="删除 ' + esc(p.name) + '">' + icon("trash") + "</button></div></div></li>";
      }).join("") + "</ul>" +
      (ship ? '<p class="ship-note">' + icon("truck") + "含实物商品，" + (SHIP_FEE > 0 ? "结算时加收运费 " + esc(CUR) + money(SHIP_FEE) : "包邮") + "</p>" : "");
      var total = subtotalOf(cart) + (ship ? SHIP_FEE : 0);
      footEl.innerHTML = '<div class="foot-total"><small>合计 ' + cartCount() + ' 件</small><span class="price">' + priceHTML(total) + '</span></div><button class="btn btn-primary" type="button" data-checkout>去结算</button>';
    }

    panel.addEventListener("click", function (e) {
      var t = e.target.closest("button");
      if (!t) return;
      var row = t.closest("[data-i]");
      var i = row ? Number(row.getAttribute("data-i")) : -1;
      if (t.hasAttribute("data-step") && i >= 0) {
        var l = cart[i];
        l.qty = Math.max(1, Math.min(maxQty(prodById[l.pid], l.oi), l.qty + Number(t.getAttribute("data-step"))));
        saveCart(); render();
        var again = panel.querySelector('[data-i="' + i + '"] [data-step="' + t.getAttribute("data-step") + '"]');
        if (again && !again.disabled) again.focus(); else panel.focus();
      } else if (t.hasAttribute("data-remove") && i >= 0) {
        cart.splice(i, 1);
        saveCart(); render(); panel.focus();
      } else if (t.hasAttribute("data-checkout")) {
        openCheckout(cart.map(function (x) { return { pid: x.pid, oi: x.oi, qty: x.qty }; }), true);
      }
    });

    panel.addEventListener("change", function (e) {
      if (e.target.type !== "number") return;
      var row = e.target.closest("[data-i]");
      var l = cart[Number(row.getAttribute("data-i"))];
      l.qty = Math.max(1, Math.min(maxQty(prodById[l.pid], l.oi), parseInt(e.target.value, 10) || 1));
      saveCart(); render();
    });

    render();
  }

  /* ---------- 下单 ---------- */

  function makeOrderNo() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var A = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    var buf = new Uint8Array(4);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(buf);
    else for (var j = 0; j < 4; j++) buf[j] = Math.floor(Math.random() * 256);
    var r = "";
    for (var i = 0; i < 4; i++) r += A[buf[i] % A.length];
    return (CFG.orderPrefix || "") + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + r;
  }

  function fieldHTML(id, label, input, errMsg) {
    return '<div class="field"><label class="field-label" for="' + id + '">' + label + "</label>" + input +
      (errMsg ? '<p class="error" id="' + id + 'e" hidden>' + errMsg + "</p>" : "") + "</div>";
  }

  function openCheckout(lines, fromCart) {
    var ship = needsShipping(lines);
    var fee = ship ? SHIP_FEE : 0;
    var subtotal = subtotalOf(lines);
    var total = subtotal + fee;
    var count = lines.reduce(function (s, l) { return s + l.qty; }, 0);
    var uid = "f" + Date.now();
    var saved = store.get("buyer", {});

    var summary = '<ul class="summary">' + lines.map(function (l) {
      var p = prodById[l.pid];
      return '<li><span class="s-name">' + esc(p.name) + (l.oi != null ? ' <span class="s-opt">' + esc(optName(p, l.oi)) + "</span>" : "") + " × " + l.qty +
        '</span><span class="s-amt">' + esc(CUR) + money(priceOf(p, l.oi) * l.qty) + "</span></li>";
    }).join("") +
    (ship ? '<li class="s-ship"><span class="s-name">运费</span><span class="s-amt">' + (fee ? esc(CUR) + money(fee) : "包邮") + "</span></li>" : "") +
    "</ul>";

    var inputs =
      fieldHTML(uid + "c", "联系方式", '<input class="input" id="' + uid + 'c" name="contact" value="' + esc(saved.contact || "") + '" placeholder="' + esc(CFG.buyerContactHint || "微信 / QQ / 邮箱") + '" aria-describedby="' + uid + 'ce" data-required data-autofocus>', "填写联系方式，我才能把东西发给你。");
    if (ship) {
      inputs +=
        '<p class="form-group">' + icon("truck") + "收货信息</p>" +
        '<div class="field-row">' +
          fieldHTML(uid + "r", "收货人", '<input class="input" id="' + uid + 'r" name="receiver" autocomplete="name" value="' + esc(saved.receiver || "") + '" aria-describedby="' + uid + 're" data-required>', "填写收货人。") +
          fieldHTML(uid + "p", "手机号", '<input class="input" id="' + uid + 'p" name="phone" type="tel" inputmode="tel" autocomplete="tel" value="' + esc(saved.phone || "") + '" aria-describedby="' + uid + 'pe" data-required>', "填写手机号，快递要用。") +
        "</div>" +
        fieldHTML(uid + "a", "收货地址", '<textarea class="input" id="' + uid + 'a" name="address" autocomplete="street-address" placeholder="省市区 + 详细地址" aria-describedby="' + uid + 'ae" data-required>' + esc(saved.address || "") + "</textarea>", "填写收货地址。");
    }
    inputs += fieldHTML(uid + "n", "备注", '<textarea class="input" id="' + uid + 'n" name="note" placeholder="' + esc(CFG.noteHint || "选填") + '"></textarea>');

    var L = openLayer({
      label: "确认订单",
      html: head("确认订单") +
        '<form class="panel-body" id="' + uid + '" novalidate>' + summary + inputs + "</form>" +
        '<div class="panel-foot"><div class="foot-total"><small>共 ' + count + ' 件</small><span class="price">' + priceHTML(total) + '</span></div>' +
        '<button class="btn btn-primary" type="submit" form="' + uid + '">提交订单</button></div>'
    });

    var form = L.panel.querySelector("form");
    if (saved.contact && form.elements.contact) form.elements.contact.removeAttribute("data-autofocus");

    form.addEventListener("input", function (e) {
      if (e.target.value.trim() && e.target.hasAttribute("aria-invalid")) {
        e.target.removeAttribute("aria-invalid");
        var err = document.getElementById(e.target.id + "e");
        if (err) err.hidden = true;
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      Array.prototype.forEach.call(form.querySelectorAll("[data-required]"), function (el) {
        var bad = !el.value.trim();
        var err = document.getElementById(el.id + "e");
        if (err) err.hidden = !bad;
        if (bad) { el.setAttribute("aria-invalid", "true"); if (!firstBad) firstBad = el; }
        else el.removeAttribute("aria-invalid");
      });
      if (firstBad) { firstBad.focus(); return; }

      var val = function (n) { return form.elements[n] ? form.elements[n].value.trim() : ""; };
      var buyer = { contact: val("contact"), receiver: val("receiver") || saved.receiver, phone: val("phone") || saved.phone, address: val("address") || saved.address };
      store.set("buyer", buyer);

      var order = {
        no: makeOrderNo(),
        at: Date.now(),
        contact: val("contact"),
        note: val("note"),
        ship: ship ? { receiver: val("receiver"), phone: val("phone"), address: val("address") } : null,
        fee: fee,
        total: total,
        items: lines.map(function (l) {
          var p = prodById[l.pid];
          return { pid: p.id, name: p.name, opt: optName(p, l.oi), price: priceOf(p, l.oi), qty: l.qty };
        })
      };
      var orders = store.get("orders", []);
      orders.unshift(order);
      store.set("orders", orders.slice(0, 30));
      if (fromCart) { cart = []; saveCart(); }
      closeAll();
      openOrder(order, true);
    });
  }

  function fmtTime(ts) {
    var d = new Date(ts);
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function orderText(order, pay) {
    var rows = ["【订单 " + order.no + "】"];
    order.items.forEach(function (it) {
      rows.push(it.name + (it.opt ? "（" + it.opt + "）" : "") + " × " + it.qty + "  " + CUR + money(it.price * it.qty));
    });
    if (order.ship) rows.push("运费：" + (order.fee ? CUR + money(order.fee) : "包邮"));
    rows.push("合计：" + CUR + money(order.total));
    if (pay) rows.push("付款方式：" + pay.name);
    rows.push("联系方式：" + order.contact);
    if (order.ship) rows.push("收货：" + order.ship.receiver + " " + order.ship.phone + " " + order.ship.address);
    if (order.note) rows.push("备注：" + order.note);
    rows.push("下单时间：" + fmtTime(order.at));
    return rows.join("\n");
  }

  function openOrder(order, fresh) {
    var payIdx = Math.max(0, PAYS.map(function (p) { return p.id; }).indexOf(store.get("pay", "")));
    var count = order.items.reduce(function (s, it) { return s + it.qty; }, 0);
    var amount = CUR + money(order.total);

    var html = head(fresh ? "订单已提交" : "订单详情") + '<div class="panel-body">' +
      '<div class="receipt">' +
        '<div class="receipt-top"><span class="receipt-label">订单号</span><span class="receipt-no num">' + esc(order.no) + "</span></div>" +
        '<div class="receipt-perf"></div>' +
        '<div class="receipt-bottom"><div><span class="receipt-label">应付金额</span><span class="price">' + priceHTML(order.total) + "</span></div>" +
        '<div class="receipt-time">' + count + " 件商品<br>" + esc(fmtTime(order.at)) + "</div></div>" +
      "</div>" +
      (PAYS.length > 1 ? '<div class="pay-switch" role="group" aria-label="付款方式">' + PAYS.map(function (p, i) {
        return '<button type="button" data-pay="' + i + '" aria-pressed="' + (i === payIdx) + '">' + esc(p.name) + "</button>";
      }).join("") + "</div>" : "") +
      (PAYS.length ? '<div class="qr"><img data-qr alt=""></div><p class="qr-cap" data-cap></p>' : "") +
      '<ol class="steps">' +
        (PAYS.length ? "<li>按上面的金额扫码付款，付款备注填订单号。</li>" : "<li>联系我付款 <b>" + esc(amount) + "</b>，并告诉我订单号 <b>" + esc(order.no) + "</b>。</li>") +
        "<li>复制订单信息，发给我。</li>" +
        "<li>我核对到账后发货，有问题会联系你。</li>" +
      "</ol>" +
      ((CFG.contacts || []).length ? '<div class="order-contacts">' + contactsHTML() + "</div>" : "") +
      '<details class="items-detail"><summary>订单明细</summary><ul>' + order.items.map(function (it) {
        return "<li>" + esc(it.name) + (it.opt ? "（" + esc(it.opt) + "）" : "") + " × " + it.qty + "，" + esc(CUR) + money(it.price * it.qty) + "</li>";
      }).join("") +
        (order.ship ? "<li>运费：" + (order.fee ? esc(CUR) + money(order.fee) : "包邮") + "</li><li>收货：" + esc(order.ship.receiver) + " " + esc(order.ship.phone) + " " + esc(order.ship.address) + "</li>" : "") +
        "<li>联系方式：" + esc(order.contact) + "</li>" + (order.note ? "<li>备注：" + esc(order.note) + "</li>" : "") + "</ul></details>" +
      '<p class="local-note">订单只保存在这台设备的浏览器里，关掉后可以在顶部「订单」里找回。</p>' +
      '<details class="raw"><summary>复制不了？点这里手动长按复制</summary><pre data-raw></pre></details>' +
      '</div><div class="panel-foot"><button class="btn btn-primary" type="button" data-copy-order>复制订单信息</button></div>';

    var L = openLayer({ label: "订单 " + order.no, html: html });
    var panel = L.panel;

    function syncPay() {
      var pay = PAYS[payIdx];
      Array.prototype.forEach.call(panel.querySelectorAll("[data-pay]"), function (b) {
        b.setAttribute("aria-pressed", String(Number(b.getAttribute("data-pay")) === payIdx));
      });
      if (pay) {
        var img = $("[data-qr]", panel);
        img.src = pay.qr;
        img.alt = pay.name + "收款码";
        $("[data-cap]", panel).innerHTML = "扫码付 <b>" + esc(amount) + "</b>，付款备注填 <b>" + esc(order.no) + "</b>";
      }
      $("[data-raw]", panel).textContent = orderText(order, pay);
    }

    panel.addEventListener("click", function (e) {
      var t = e.target.closest("button");
      if (!t) return;
      if (t.hasAttribute("data-pay")) {
        payIdx = Number(t.getAttribute("data-pay"));
        store.set("pay", PAYS[payIdx].id);
        syncPay();
      } else if (t.hasAttribute("data-copy-order")) {
        copyText(orderText(order, PAYS[payIdx])).then(function (ok) {
          if (ok) { toast("订单信息已复制，发给我吧"); t.textContent = "已复制订单信息"; }
          else { toast("复制失败，请手动复制"); panel.querySelector(".raw").open = true; }
        });
      }
    });

    syncPay();
  }

  function openOrders() {
    var orders = store.get("orders", []);
    var body = orders.length
      ? orders.map(function (o, i) {
          var n = o.items.reduce(function (s, it) { return s + it.qty; }, 0);
          return '<button class="order-row" type="button" data-o="' + i + '"><span><span class="order-no">' + esc(o.no) + '</span><span class="order-meta">' +
            esc(fmtTime(o.at)) + "，" + n + " 件，" + esc(o.items[0].name) + (o.items.length > 1 ? " 等" : "") + '</span></span><span class="price">' + priceHTML(o.total) + "</span></button>";
        }).join("")
      : '<div class="blank">' + icon("receipt") + "<p>还没有订单。在这台设备上下的单会显示在这里。</p></div>";
    var L = openLayer({ side: true, label: "我的订单", html: head("我的订单") + '<div class="panel-body">' + body + "</div>" });
    L.panel.addEventListener("click", function (e) {
      var t = e.target.closest("[data-o]");
      if (t) openOrder(orders[Number(t.getAttribute("data-o"))], false);
    });
  }

  /* ---------- 事件 ---------- */

  $("#tabs").addEventListener("click", function (e) {
    var t = e.target.closest("[data-cat]");
    if (!t) return;
    state.cat = t.getAttribute("data-cat");
    renderTabs();
    renderGrid();
  });

  var qTimer;
  $("#q").addEventListener("input", function (e) {
    clearTimeout(qTimer);
    qTimer = setTimeout(function () { state.q = e.target.value; renderGrid(); }, 120);
  });

  $("#grid").addEventListener("click", function (e) {
    var q = e.target.closest("[data-quick]");
    if (q) {
      var p = prodById[q.getAttribute("data-quick")];
      if (opts(p) || p.link) openProduct(p.id);
      else addAndTell(p.id, null, 1);
      return;
    }
    var t = e.target.closest("[data-pid]");
    if (t) openProduct(t.getAttribute("data-pid"));
  });

  $("#openCart").addEventListener("click", openCart);
  $("#openOrders").addEventListener("click", openOrders);

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-copy]");
    if (!t) return;
    copyText(t.getAttribute("data-copy")).then(function (ok) {
      toast(ok ? t.getAttribute("data-copy-msg") || "已复制" : "复制失败：" + t.getAttribute("data-copy"));
    });
  });

  function openFromHash() {
    var m = /item=([^&]+)/.exec(location.hash);
    if (m) {
      var id = decodeURIComponent(m[1]);
      if (prodById[id]) { closeAll(); openProduct(id); }
    }
  }
  window.addEventListener("hashchange", openFromHash);

  /* ---------- 启动 ---------- */

  renderShop();
  renderTabs();
  renderGrid();
  updateBadge(false);
  openFromHash();
  }
})();
