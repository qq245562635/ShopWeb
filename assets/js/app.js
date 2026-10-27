/* ShopWeb 页面逻辑：分类、搜索、商品详情、购物车、下单。
   一般不需要改这个文件，店铺内容在 config.js 和 products.js。 */
(function () {
  "use strict";

  var CFG = window.SHOP_CONFIG || {};
  var PRODUCTS = (window.SHOP_PRODUCTS || []).filter(function (p) { return p && p.id; });
  var CUR = CFG.currency || "¥";
  var CATS = CFG.categories || [];
  var PAYS = CFG.payments || [];
  var catById = {};
  var prodById = {};
  CATS.forEach(function (c) { catById[c.id] = c; });
  PRODUCTS.forEach(function (p) { prodById[p.id] = p; });

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
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8C10.5 5 7 4 6.5 6S9 8 12 8zm0 0c1.5-3 5-4 5.5-2S15 8 12 8z"/>',
    ticket: '<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z"/><path d="M15 5v2.5M15 10.8v2.4M15 16.5V19"/>',
    key: '<circle cx="8" cy="15" r="4.5"/><path d="M11.2 11.8L20 3M17 6l3 3M14.5 8.5l2.5 2.5"/>',
    gem: '<path d="M6.5 4h11L21 9l-9 11L3 9z"/><path d="M3 9h18M9.5 4L8 9l4 11 4-11-1.5-5"/>',
    crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/><path d="M5 16h14"/>',
    box: '<path d="M21 7.5l-9-4.5-9 4.5v9l9 4.5 9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9M7.5 5.2l9 4.6"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M8.8 7.5L12 12l3.2-4.5M8.5 12.5h7M8.5 15.5h7M12 12v5.5"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h5"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h4"/>',
    megaphone: '<path d="M3 10v4l11 5V5zM14 9h2.5a3 3 0 0 1 0 6H14M6 15.5l1.2 4.5H10l-1-4"/>',
    bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };

  function icon(name) {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.ticket) + "</svg>";
  }

  /* 卡面配色：products.js 里用 theme 指定，不写就按商品 id 自动分配 */
  var THEMES = {
    violet: ["#4b2fd6", "#9a7bff"],
    coral: ["#e2434b", "#ff9a62"],
    teal: ["#0b7f80", "#2fcfae"],
    midnight: ["#1a2040", "#4b5ca8"],
    gold: ["#a65f00", "#efb43a"],
    rose: ["#c2266f", "#ff7eb3"],
    forest: ["#17703d", "#76c46a"],
    ocean: ["#1356b8", "#4cc0f2"],
    graphite: ["#24262d", "#636878"]
  };
  var THEME_KEYS = Object.keys(THEMES);

  function themeOf(p) {
    if (THEMES[p.theme]) return THEMES[p.theme];
    var h = 0;
    for (var i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i)) >>> 0;
    return THEMES[THEME_KEYS[h % THEME_KEYS.length]];
  }

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }

  function themeVars(p) {
    var t = themeOf(p);
    return "--c1:" + t[0] + ";--c2:" + t[1] + ";--sh:" + rgba(t[0], 0.38) + ";--tint:" + rgba(t[1], 0.14);
  }

  var BRAND_SVG = '<svg viewBox="0 0 30 22" aria-hidden="true"><path fill="currentColor" d="M3 0h24a3 3 0 0 1 3 3v4.5a3.5 3.5 0 0 0 0 7V19a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-4.5a3.5 3.5 0 0 0 0-7V3a3 3 0 0 1 3-3z" opacity=".9"/></svg>';

  // 卡面：卡券类是带撕口的券，其它是圆角卡
  function faceHTML(p, o) {
    o = o || {};
    var coupon = (catById[p.category] || {}).style === "coupon";
    var cls = "face" + (coupon ? " face--coupon" : "") + (o.mini ? " face--mini" : "") + (p.image ? " face--img" : "");
    var bg = p.image ? ' style="background-image:linear-gradient(20deg,rgba(0,0,0,.35),rgba(0,0,0,0)),url(\'' + esc(p.image) + '\')"' : "";
    var tag = !o.mini && p.tags && p.tags.length ? '<span class="face-tag">' + esc(p.tags[0]) + "</span>" : "";
    var face = '<span class="' + cls + '"' + bg + ">" +
      (coupon ? '<span class="face-perf"></span>' : "") +
      '<span class="face-brand">' + BRAND_SVG + esc(CFG.name || "") + "</span>" + tag +
      (p.image ? "" : '<span class="face-glyph">' + icon(p.icon) + "</span>") +
      '<span class="face-title">' + esc(p.name) + (o.sub ? '<span class="face-sub" data-face-sub>' + esc(o.sub) + "</span>" : "") + "</span>" +
      (o.out ? '<span class="face-out">已售罄</span>' : "") +
      "</span>";
    return o.mini ? face : '<span class="face-wrap" style="' + themeVars(p) + '">' + face + "</span>";
  }

  function miniFace(p) {
    return '<span class="face-wrap" style="' + themeVars(p) + ';filter:none">' + faceHTML(p, { mini: true }) + "</span>";
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

  /* ---------- 购物车 ---------- */

  var cart = store.get("cart", []).filter(function (l) {
    var p = prodById[l && l.pid];
    return p && !p.link && (opts(p) ? opts(p)[l.oi] : l.oi == null) && l.qty > 0;
  });

  function saveCart() { store.set("cart", cart); updateBadge(true); }

  function cartCount() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }

  function linesTotal(lines) {
    return lines.reduce(function (s, l) { return s + priceOf(prodById[l.pid], l.oi) * l.qty; }, 0);
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
      if (o.onClose) o.onClose();
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

  /* ---------- 首页渲染 ---------- */

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

  function renderShop() {
    var name = CFG.name || "小铺";
    document.title = name;
    var meta = $('meta[name="description"]');
    if (meta) meta.setAttribute("content", CFG.tagline || "");
    Array.prototype.forEach.call(document.querySelectorAll("[data-shop]"), function (n) {
      n.textContent = CFG[n.getAttribute("data-shop")] || "";
    });

    if (CFG.notice) {
      $("#notice").textContent = CFG.notice;
      $("#notice").hidden = false;
    }

    var open = shopIsOpen();
    var facts = [];
    if (open !== null) {
      facts.push('<span class="fact' + (open ? "" : " is-closed") + '"><i class="dot"></i><b>' + (open ? "客服在线" : "客服休息中") + '</b><span class="num">' +
        esc(CFG.hours.open) + "–" + esc(CFG.hours.close) + "</span></span>");
    }
    var delivery = open === false ? "现在下单，上线后按顺序发货" : CFG.delivery;
    if (delivery) facts.push('<span class="fact">' + esc(delivery) + "</span>");
    $("#facts").innerHTML = facts.join("");

    renderFan();

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

  // 首屏扇形展开的三张卡：config.featured 指定，不写就取前三个有货的商品
  function renderFan() {
    var ids = CFG.featured && CFG.featured.length ? CFG.featured : PRODUCTS.filter(function (p) { return !soldOut(p); }).map(function (p) { return p.id; });
    var picks = ids.map(function (id) { return prodById[id]; }).filter(Boolean).slice(0, 3);
    var fan = $("#fan");
    if (!picks.length) { fan.hidden = true; return; }
    fan.innerHTML = picks.map(function (p) {
      return '<button class="fan-card" type="button" data-pid="' + esc(p.id) + '" aria-label="查看 ' + esc(p.name) + '">' + faceHTML(p) + "</button>";
    }).join("");
  }

  function contactsHTML() {
    return (CFG.contacts || []).map(function (c) {
      var inner = "<span><b>" + esc(c.label) + "</b> " + esc(c.value) + "</span>";
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
    return '<article class="item' + (out ? " is-out" : "") + '">' +
      '<button class="item-hit" type="button" data-pid="' + esc(p.id) + '" aria-label="' + esc(p.name) + "，" + esc(CUR) + money(r.min) + (r.from ? "起" : "") + (out ? "，已售罄" : "") + '">' +
        faceHTML(p, { out: out }) + "</button>" +
      '<div class="item-meta"><div class="item-row"><span class="price">' + priceHTML(r.min, r.from) + "</span>" +
        (was ? '<s class="was">' + esc(CUR) + money(was) + "</s>" : "") +
        '<button class="add" type="button" data-quick="' + esc(p.id) + '"' + (out ? " disabled" : "") +
          ' aria-label="' + (opts(p) ? "选择规格：" : "加入购物车：") + esc(p.name) + '">' + icon("plus") + "</button></div>" +
        (p.desc ? '<p class="item-desc">' + esc(p.desc) + "</p>" : "") +
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

    var body =
      '<div class="p-stage" style="' + themeVars(p) + '">' + faceHTML(p, { sub: o ? o[oi].name : "", out: soldOut(p) }) + "</div>" +
      '<h3 class="p-name">' + esc(p.name) + "</h3>" + (p.desc ? '<p class="p-desc">' + esc(p.desc) + "</p>" : "") +
      '<div class="p-price"><span class="price" data-price></span><s class="was" data-was></s><span class="p-stock" data-stock></span></div>' +
      (o ? '<fieldset class="field"><legend>规格</legend><div class="chips">' + o.map(function (x, i) {
        var none = stockOf(p, i) <= 0;
        return '<label class="chip"><input type="radio" name="opt-' + uid + '" value="' + i + '"' + (i === oi ? " checked" : "") + (none ? " disabled" : "") + "><span>" + esc(x.name) + (none ? "（售罄）" : "") + "</span></label>";
      }).join("") + "</div></fieldset>" : "") +
      (!p.link ? '<div class="field"><span class="field-label" id="' + uid + '">数量</span><div data-stepper></div></div>' : "") +
      ((p.details || []).length ? '<ul class="p-details">' + p.details.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul>" : "") +
      '<button class="text-btn" type="button" data-share>' + icon("link") + "复制商品链接</button>";

    var foot = p.link
      ? '<a class="btn btn-primary" href="' + esc(p.link) + '" target="_blank" rel="noopener">去购买</a>'
      : '<button class="btn" type="button" data-add>加入购物车</button><button class="btn btn-primary" type="button" data-buy>立即购买</button>';

    var L = openLayer({
      label: p.name,
      html: head(cat ? cat.name : "商品详情") + '<div class="panel-body">' + body + '</div><div class="panel-foot">' + foot + "</div>"
    });
    var panel = L.panel;

    function sync() {
      var out = o ? stockOf(p, oi) <= 0 : soldOut(p);
      var max = maxQty(p, oi);
      qty = Math.max(1, Math.min(qty, max || 1));
      $("[data-price]", panel).innerHTML = priceHTML(priceOf(p, oi));
      var sub = $("[data-face-sub]", panel);
      if (sub) sub.textContent = optName(p, oi);
      var w = wasOf(p, oi);
      var wasEl = $("[data-was]", panel);
      wasEl.textContent = w ? CUR + money(w) : "";
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
      if (t.hasAttribute("data-step")) {
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
      bodyEl.innerHTML = '<ul class="lines">' + cart.map(function (l, i) {
        var p = prodById[l.pid];
        return '<li class="line" data-i="' + i + '">' + miniFace(p) +
          '<div class="line-info"><span class="line-name">' + esc(p.name) + "</span>" +
          (l.oi != null ? '<span class="line-opt">' + esc(optName(p, l.oi)) + "</span>" : "") +
          '<div class="line-ctrl"><span class="line-price">' + esc(CUR) + money(priceOf(p, l.oi)) + "</span>" +
          stepperHTML(l.qty, Math.max(1, maxQty(p, l.oi)), true) +
          '<button class="icon-btn" type="button" data-remove aria-label="删除 ' + esc(p.name) + '">' + icon("trash") + "</button></div></div></li>";
      }).join("") + "</ul>";
      footEl.innerHTML = '<div class="foot-total"><small>合计 ' + cartCount() + ' 件</small><span class="price">' + priceHTML(linesTotal(cart)) + '</span></div><button class="btn btn-primary" type="button" data-checkout>去结算</button>';
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

  function openCheckout(lines, fromCart) {
    var total = linesTotal(lines);
    var count = lines.reduce(function (s, l) { return s + l.qty; }, 0);
    var uid = "f" + Date.now();
    var saved = store.get("contact", "");

    var summary = '<ul class="summary">' + lines.map(function (l) {
      var p = prodById[l.pid];
      return '<li><span class="s-name">' + esc(p.name) + (l.oi != null ? ' <span class="s-opt">' + esc(optName(p, l.oi)) + "</span>" : "") + " × " + l.qty +
        '</span><span class="s-amt">' + esc(CUR) + money(priceOf(p, l.oi) * l.qty) + "</span></li>";
    }).join("") + "</ul>";

    var L = openLayer({
      label: "确认订单",
      html: head("确认订单") +
        '<form class="panel-body" id="' + uid + '" novalidate>' + summary +
          '<div class="field"><label class="field-label" for="' + uid + 'c">联系方式</label>' +
            '<input class="input" id="' + uid + 'c" name="contact" autocomplete="email" value="' + esc(saved) + '" placeholder="' + esc(CFG.buyerContactHint || "QQ / 微信 / 邮箱") + '" aria-describedby="' + uid + 'e" required data-autofocus>' +
            '<p class="error" id="' + uid + 'e" hidden>填写联系方式，客服才能把商品发给你。</p></div>' +
          '<div class="field"><label class="field-label" for="' + uid + 'n">备注</label>' +
            '<textarea class="input" id="' + uid + 'n" name="note" placeholder="' + esc(CFG.noteHint || "选填") + '"></textarea></div>' +
        "</form>" +
        '<div class="panel-foot"><div class="foot-total"><small>共 ' + count + ' 件</small><span class="price">' + priceHTML(total) + '</span></div>' +
        '<button class="btn btn-primary" type="submit" form="' + uid + '">提交订单</button></div>'
    });

    var form = L.panel.querySelector("form");
    var input = form.elements.contact;
    var err = form.querySelector(".error");
    if (saved) input.removeAttribute("data-autofocus");

    input.addEventListener("input", function () {
      if (input.value.trim()) { err.hidden = true; input.removeAttribute("aria-invalid"); }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var contact = input.value.trim();
      if (!contact) {
        err.hidden = false;
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      store.set("contact", contact);
      var order = {
        no: makeOrderNo(),
        at: Date.now(),
        contact: contact,
        note: form.elements.note.value.trim(),
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
    rows.push("合计：" + CUR + money(order.total));
    if (pay) rows.push("付款方式：" + pay.name);
    rows.push("联系方式：" + order.contact);
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
        (PAYS.length ? "<li>按上面的金额扫码付款，付款备注填订单号。</li>" : "<li>联系客服付款 <b>" + esc(amount) + "</b>，并告诉客服订单号 <b>" + esc(order.no) + "</b>。</li>") +
        "<li>复制订单信息，发给客服。</li>" +
        "<li>客服核对到账后，把商品发到你留的联系方式。</li>" +
      "</ol>" +
      ((CFG.contacts || []).length ? '<div class="order-contacts">' + contactsHTML() + "</div>" : "") +
      '<details class="items-detail"><summary>商品明细</summary><ul>' + order.items.map(function (it) {
        return "<li>" + esc(it.name) + (it.opt ? "（" + esc(it.opt) + "）" : "") + " × " + it.qty + "，" + esc(CUR) + money(it.price * it.qty) + "</li>";
      }).join("") + "<li>联系方式：" + esc(order.contact) + "</li>" + (order.note ? "<li>备注：" + esc(order.note) + "</li>" : "") + "</ul></details>" +
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
          if (ok) { toast("订单信息已复制，发给客服吧"); t.textContent = "已复制订单信息"; }
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

  $("#fan").addEventListener("click", function (e) {
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
})();
