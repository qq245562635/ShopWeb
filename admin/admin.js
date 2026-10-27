/* 店铺后台：在浏览器里编辑 data/shop.json 和 data/products.json，
   点「发布」时用 GitHub 令牌把改动（含新上传的图片）一次性提交到仓库。
   令牌只存在这个浏览器里，只会发给 api.github.com。 */
(function () {
  "use strict";

  var API = "https://api.github.com";
  var app = document.getElementById("app");
  var fileInput = document.getElementById("fileInput");

  /* ---------- 小工具 ---------- */

  function $(s, root) { return (root || document).querySelector(s); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function rid() { return Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 6); }

  function num(v) {
    var s = String(v == null ? "" : v).trim();
    if (s === "") return null;
    var n = Number(s);
    return isNaN(n) ? NaN : n;
  }

  function money(n) {
    var v = Math.round(Number(n) * 100) / 100;
    return v % 1 === 0 ? String(v) : v.toFixed(2);
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function getPath(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }

  function setPath(obj, path, val) {
    var keys = path.split(".");
    var last = keys.pop();
    var o = keys.reduce(function (o, k) { if (o[k] == null) o[k] = {}; return o[k]; }, obj);
    o[last] = val;
  }

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("shopadmin." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("shopadmin." + k, JSON.stringify(v)); } catch (e) { /* 忽略 */ } },
    del: function (k) { try { localStorage.removeItem("shopadmin." + k); } catch (e) { /* 忽略 */ } }
  };
  var session = {
    get: function (k) { try { return sessionStorage.getItem("shopadmin." + k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem("shopadmin." + k, v); } catch (e) { /* 忽略 */ } },
    del: function (k) { try { sessionStorage.removeItem("shopadmin." + k); } catch (e) { /* 忽略 */ } }
  };

  function b64enc(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  function b64dec(b64) {
    var bin = atob(String(b64).replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  var toastTimer;
  function toast(msg, isError) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.toggle("is-error", !!isError);
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, isError ? 5000 : 2600);
  }

  /* ---------- 图标 ---------- */

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
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    left: '<path d="M15 6l-6 6 6 6"/>',
    right: '<path d="M9 6l6 6-6 6"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h4"/>',
    edit: '<path d="M4 20l4-1L19 8a2.1 2.1 0 0 0-3-3L5 16z"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M5 11v9h14v-9M10 20v-5h4v5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="2.5"/><path d="M3 10h18M16 15h2"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
  };

  function icon(name) {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.box) + "</svg>";
  }

  var PRODUCT_ICONS = [
    ["box", "盒子"], ["bolt", "闪电"], ["gift", "礼物"], ["card", "卡片"], ["star", "星星"], ["image", "图片"],
    ["keyboard", "键盘"], ["pen", "画笔"], ["chat", "对话"], ["medal", "徽章"], ["key", "钥匙"], ["ticket", "券"]
  ];

  var TINTS = {
    lavender: ["#eef0ff", "#5b5bd6", "淡紫"],
    sky: ["#e5f2fc", "#1f74c2", "天蓝"],
    mint: ["#e5f5ec", "#2b8456", "薄荷"],
    peach: ["#fff0e5", "#cf5a24", "蜜桃"],
    yellow: ["#fff5d3", "#a87a06", "鹅黄"],
    pink: ["#fdeaf3", "#bd3277", "粉色"],
    gray: ["#eef0f3", "#4a4f5c", "浅灰"]
  };
  var TINT_KEYS = Object.keys(TINTS);

  function tintOf(p) {
    if (TINTS[p.color]) return TINTS[p.color];
    var h = 0, id = String(p.id || "");
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return TINTS[TINT_KEYS[h % TINT_KEYS.length]];
  }

  var TYPES = [
    { id: "digital", name: "数字商品", hint: "付款后发到买家留的联系方式" },
    { id: "physical", name: "实物", hint: "买家下单要填收货地址，按运费设置收费" },
    { id: "service", name: "服务", hint: "下单后你联系买家约时间" }
  ];

  function typeName(t) {
    for (var i = 0; i < TYPES.length; i++) if (TYPES[i].id === t) return TYPES[i].name;
    return "数字商品";
  }

  /* ---------- 状态 ---------- */

  var gh = null;        // { owner, repo, token, branch, mirror }
  var S = null;         // { shop, products }
  var snapshot = "";
  var pending = {};     // 新上传的图片：path -> { b64, url, done }
  var view = "shop";
  var busy = false;
  var pf = { q: "", cat: "" };
  var lastPublish = null;

  function isDirty() { return !!S && JSON.stringify(S) !== snapshot; }

  function src(path) {
    if (!path) return "";
    if (pending[path]) return pending[path].url;
    if (/^(https?:|data:|blob:)/.test(path)) return path;
    return "../" + String(path).replace(/^\/+/, "");
  }

  function catName(id) {
    var c = (S.shop.categories || []).filter(function (x) { return x.id === id; })[0];
    return c ? c.name || "（未命名分类）" : "";
  }

  /* ---------- GitHub ---------- */

  function repoPath() { return "/repos/" + encodeURIComponent(gh.owner) + "/" + encodeURIComponent(gh.repo); }

  function api(method, path, body) {
    var headers = { Authorization: "Bearer " + gh.token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (body) headers["Content-Type"] = "application/json";
    return fetch(API + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store" })
      .then(function (res) {
        if (res.status === 204) return null;
        return res.json().catch(function () { return null; }).then(function (data) {
          if (!res.ok) {
            var err = new Error((data && data.message) || "HTTP " + res.status);
            err.status = res.status;
            throw err;
          }
          return data;
        });
      }, function (e) { var err = new Error(e.message); err.status = 0; throw err; });
  }

  function errText(e) {
    if (e.status === 401) return "令牌无效或已过期，请重新登录。";
    if (e.status === 403) return "令牌没有权限：创建令牌时要授权这个仓库，并把 Contents 设为 Read and write。";
    if (e.status === 404) return "找不到仓库：检查仓库名，以及令牌是否授权了这个仓库。";
    if (e.status === 409 || e.status === 422) return "提交冲突，可能别处刚改过仓库。点「账号与发布」里的重新读取后再改。";
    if (!e.status) return "连不上 GitHub，检查网络后重试。";
    return "GitHub 返回：" + e.message;
  }

  function readJSON(path) {
    return api("GET", repoPath() + "/contents/" + path + "?ref=" + encodeURIComponent(gh.branch)).then(
      function (d) { return JSON.parse(b64dec(d.content)); },
      function (e) { if (e.status === 404) return null; throw e; }
    );
  }

  function loadData() {
    return Promise.all([readJSON("data/shop.json"), readJSON("data/products.json")]).then(function (res) {
      var shop = res[0] && typeof res[0] === "object" ? res[0] : { name: "我的小铺", currency: "¥", shippingFee: 0 };
      ["categories", "payments", "contacts", "notes"].forEach(function (k) { if (!Array.isArray(shop[k])) shop[k] = []; });
      S = { shop: shop, products: Array.isArray(res[1]) ? res[1] : [] };
      snapshot = JSON.stringify(S);
      pending = {};
    });
  }

  function connect(repoStr, token, remember) {
    var parts = String(repoStr).trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/+$/, "").split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) return Promise.reject(new Error("仓库要写成「用户名/仓库名」，例如 qq245562635/ShopWeb。"));
    if (!String(token).trim()) return Promise.reject(new Error("请粘贴 GitHub 令牌。"));
    gh = { owner: parts[0], repo: parts[1], token: String(token).trim() };
    return api("GET", repoPath()).then(function (info) {
      gh.owner = info.owner.login;
      gh.repo = info.name;
      gh.branch = info.default_branch;
      return api("GET", repoPath() + "/branches/gh-pages").then(
        function () { gh.mirror = gh.branch !== "gh-pages"; },
        function (e) { if (e.status !== 404) throw e; gh.mirror = false; }
      );
    }).then(function () {
      store.set("repo", gh.owner + "/" + gh.repo);
      if (remember) { store.set("token", gh.token); session.del("token"); }
      else { store.del("token"); session.set("token", gh.token); }
      return loadData();
    }).catch(function (e) {
      gh = null;
      throw e.status !== undefined ? new Error(errText(e)) : e;
    });
  }

  function detectRepo() {
    var saved = store.get("repo", "");
    if (saved) return saved;
    var h = location.hostname;
    if (/\.github\.io$/i.test(h)) {
      var owner = h.split(".")[0];
      var seg = location.pathname.split("/").filter(Boolean);
      var repo = seg.length && seg[0] !== "admin" ? seg[0] : owner + ".github.io";
      return owner + "/" + repo;
    }
    return "";
  }

  /* ---------- 登录页 ---------- */

  function renderLogin(error, prev) {
    prev = prev || {};
    document.title = "登录店铺后台";
    app.innerHTML =
      '<div class="login"><form class="login-card" id="loginForm" novalidate>' +
        "<h1>店铺后台</h1>" +
        '<p class="lead">连接存放网站的 GitHub 仓库，改完点「发布」，网站一两分钟后自动更新。</p>' +
        '<div class="stack">' +
          '<div class="field"><label class="label" for="lgRepo">仓库</label><input class="input" id="lgRepo" name="repo" placeholder="用户名/仓库名" value="' + esc(prev.repo != null ? prev.repo : detectRepo()) + '" autocomplete="off" spellcheck="false"></div>' +
          '<div class="field"><label class="label" for="lgToken">GitHub 令牌</label><input class="input" id="lgToken" name="token" type="password" placeholder="github_pat_..." value="' + esc(prev.token || "") + '" autocomplete="off" spellcheck="false"></div>' +
          '<label class="check"><input type="checkbox" name="remember" checked> 在这台设备上保持登录</label>' +
        "</div>" +
        (error ? '<p class="form-error" role="alert">' + esc(error) + "</p>" : "") +
        '<button class="btn btn-primary" type="submit" style="margin-top:20px">连接仓库</button>' +
        '<details class="help"' + (error ? "" : " open") + "><summary>怎么获取令牌</summary><ol>" +
          '<li>打开 <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub 新建令牌页面</a>（Fine-grained token）。</li>' +
          "<li>Token name 随便填，Expiration 选一个你能接受的有效期。</li>" +
          "<li>Repository access 选 <b>Only select repositories</b>，选中这个网站的仓库。</li>" +
          "<li>Permissions → Repository permissions 里，把 <b>Contents</b> 设为 <b>Read and write</b>。</li>" +
          "<li>点 Generate token，复制以 github_pat_ 开头的令牌，粘贴到上面。</li>" +
        "</ol><p class=\"hint\">令牌只保存在这个浏览器里，只会发给 GitHub。不要在别人的电脑上勾选保持登录。</p></details>" +
      "</form></div>";

    var form = $("#loginForm");
    if (!form.elements.repo.value) form.elements.repo.focus(); else form.elements.token.focus();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = "连接中…";
      connect(form.elements.repo.value, form.elements.token.value, form.elements.remember.checked).then(
        function () { view = "shop"; renderApp(); },
        function (err) { renderLogin(err.message, { repo: form.elements.repo.value, token: form.elements.token.value }); }
      );
    });
  }

  /* ---------- 主框架 ---------- */

  var NAV = [
    ["shop", "店铺信息", "store"],
    ["products", "商品", "list"],
    ["categories", "分类", "tag"],
    ["payments", "收款码", "wallet"],
    ["contacts", "联系方式", "phone"],
    ["notes", "购买须知", "help"]
  ];

  function avatarSm() {
    var name = S.shop.name || "小铺";
    return S.shop.avatar
      ? '<img class="avatar-sm" src="' + esc(src(S.shop.avatar)) + '" alt="">'
      : '<span class="avatar-sm avatar-text" aria-hidden="true">' + esc(Array.from(name)[0] || "铺") + "</span>";
  }

  function topHTML() {
    return '<div class="top-brand">' + avatarSm() + '<span class="name">' + esc(S.shop.name || "我的小铺") + "</span><span>后台</span></div>" +
      '<span class="dirty" id="dirty"' + (isDirty() ? "" : " hidden") + "><span>有修改未发布</span></span>" +
      '<a class="btn btn-view" href="../" target="_blank" rel="noopener">' + icon("external") + "查看网站</a>" +
      '<button class="btn btn-accent" type="button" data-act="publish"' + (busy ? " disabled" : "") + ">" + (busy ? "发布中…" : "发布") + "</button>";
  }

  function navHTML() {
    return NAV.map(function (n) {
      var count = n[0] === "products" ? '<span class="count">' + S.products.length + "</span>" : "";
      return '<button type="button" data-act="nav" data-view="' + n[0] + '"' + (view === n[0] ? ' aria-current="page"' : "") + ">" + icon(n[2]) + n[1] + count + "</button>";
    }).join("") + "<hr>" +
      '<button type="button" data-act="nav" data-view="account"' + (view === "account" ? ' aria-current="page"' : "") + ">" + icon("gear") + "账号与发布</button>";
  }

  function renderApp() {
    document.title = (S.shop.name || "店铺") + " · 后台";
    app.innerHTML = '<header class="top" id="top">' + topHTML() + "</header>" +
      '<div class="shell"><nav class="nav" id="nav" aria-label="后台导航">' + navHTML() + '</nav><main class="main" id="main">' + viewHTML() + "</main></div>";
  }

  function renderTop() { var t = $("#top"); if (t) t.innerHTML = topHTML(); }
  function renderNav() { var n = $("#nav"); if (n) n.innerHTML = navHTML(); }
  function renderMain() { var m = $("#main"); if (m) m.innerHTML = viewHTML(); }
  function updateDirty() { var d = $("#dirty"); if (d) d.hidden = !isDirty(); }

  function viewHTML() {
    switch (view) {
      case "products": return viewProducts();
      case "categories": return viewCategories();
      case "payments": return viewPayments();
      case "contacts": return viewContacts();
      case "notes": return viewNotes();
      case "account": return viewAccount();
      default: return viewShop();
    }
  }

  /* ---------- 通用表单片段 ---------- */

  function inputHTML(path, label, opt) {
    opt = opt || {};
    var id = "f-" + path.replace(/\./g, "-");
    var val = getPath(S, path);
    var attrs = ' id="' + id + '" data-bind="' + path + '"' + (opt.type === "number" ? ' data-type="number" inputmode="decimal"' : "") +
      (opt.placeholder ? ' placeholder="' + esc(opt.placeholder) + '"' : "");
    var control = opt.textarea
      ? '<textarea class="input"' + attrs + ">" + esc(val) + "</textarea>"
      : '<input class="input"' + attrs + ' value="' + esc(val == null ? "" : val) + '">';
    return '<div class="field">' + (label ? '<label class="label" for="' + id + '">' + label + "</label>" : "") + control +
      (opt.hint ? '<p class="hint">' + opt.hint + "</p>" : "") + "</div>";
  }

  function uploadHTML(path, kind, label, hint) {
    var val = getPath(S, path);
    var cls = kind === "avatar" ? " is-round" : kind === "cover" ? " is-wide" : kind === "qr" ? " is-qr" : "";
    return '<div class="field"><span class="label">' + label + '</span><div class="upl"><span class="upl-prev' + cls + '">' +
      (val ? '<img src="' + esc(src(val)) + '" alt="">' : icon("image")) + '</span><div><div class="upl-actions">' +
      '<button class="btn btn-sm" type="button" data-act="upload" data-path="' + path + '" data-kind="' + kind + '">' + (val ? "更换" : "上传图片") + "</button>" +
      (val ? '<button class="btn btn-sm btn-danger" type="button" data-act="clear" data-path="' + path + '">移除</button>' : "") +
      "</div>" + (hint ? '<p class="hint">' + hint + "</p>" : "") + "</div></div></div>";
  }

  function rowCtrl(list, i, len) {
    return '<div class="row-ctrl">' +
      '<button class="icon-btn" type="button" data-act="list-up" data-list="' + list + '" data-i="' + i + '" aria-label="上移"' + (i === 0 ? " disabled" : "") + ">" + icon("up") + "</button>" +
      '<button class="icon-btn" type="button" data-act="list-down" data-list="' + list + '" data-i="' + i + '" aria-label="下移"' + (i === len - 1 ? " disabled" : "") + ">" + icon("down") + "</button>" +
      '<button class="icon-btn is-danger" type="button" data-act="list-del" data-list="' + list + '" data-i="' + i + '" aria-label="删除">' + icon("trash") + "</button></div>";
  }

  /* ---------- 店铺信息 ---------- */

  function viewShop() {
    var sh = S.shop;
    var hasHours = !!(sh.hours && sh.hours.open != null);
    return '<div class="page-head"><h1>店铺信息</h1></div>' +
      '<section class="card"><h2>基本信息</h2><p class="sub">显示在顶栏和首页的店主名片上。</p><div class="stack">' +
        '<div class="grid-2">' + inputHTML("shop.name", "店名", { placeholder: "我的小铺" }) +
          '<div class="field"><label class="label" for="f-accent">主题色</label><div class="upl"><input id="f-accent" type="color" data-bind="shop.accent" value="' + esc(sh.accent || "#f0522b") + '" style="width:52px;height:42px;border:0;background:none;padding:0;cursor:pointer"><span class="num" id="accentHex">' + esc(sh.accent || "#f0522b") + '</span></div><p class="hint">按钮悬停、价格、角标会用到。</p></div>' +
        "</div>" +
        inputHTML("shop.tagline", "自我介绍", { textarea: true, placeholder: "介绍一下你和你卖的东西" }) +
        '<div class="grid-2">' + uploadHTML("shop.avatar", "avatar", "头像", "不传就用店名第一个字。") +
          uploadHTML("shop.cover", "cover", "首页横幅", "建议 1200×300 左右。不传就自动用商品图拼一条。") + "</div>" +
      "</div></section>" +
      '<section class="card"><h2>公告和在线时间</h2><p class="sub">让买家知道什么时候能找到你。</p><div class="stack">' +
        inputHTML("shop.notice", "顶部公告", { placeholder: "留空就不显示", hint: "显示在页面最上方的黑色条里。" }) +
        '<div class="field"><label class="check"><input type="checkbox" data-act="toggle-hours"' + (hasHours ? " checked" : "") + "> 显示在线时间（按北京时间判断「在线 / 休息中」）</label>" +
          (hasHours ? '<div class="grid-2" style="margin-top:12px">' + inputHTML("shop.hours.open", "开始", { placeholder: "10:00" }) + inputHTML("shop.hours.close", "结束", { placeholder: "24:00", hint: "写 24:00 表示到半夜十二点；跨夜可以写成 20:00 到 02:00。" }) + "</div>" : "") +
        "</div>" +
        inputHTML("shop.delivery", "发货说明", { placeholder: "数字商品 10 分钟内发，实物 48 小时内寄出", hint: "显示在首页名片上。" }) +
      "</div></section>" +
      '<section class="card"><h2>交易设置</h2><p class="sub">影响下单页和订单信息。</p><div class="stack">' +
        '<div class="grid-3">' + inputHTML("shop.shippingFee", "实物运费", { type: "number", placeholder: "0", hint: "0 表示包邮；每单收一次。" }) +
          inputHTML("shop.currency", "货币符号", { placeholder: "¥" }) + inputHTML("shop.orderPrefix", "订单号前缀", { placeholder: "可留空" }) + "</div>" +
        '<div class="grid-2">' + inputHTML("shop.buyerContactHint", "联系方式输入框提示", { placeholder: "微信 / QQ / 邮箱，用来发货和联系你" }) +
          inputHTML("shop.noteHint", "备注输入框提示", { placeholder: "选填：游戏 ID、尺寸、定制要求等" }) + "</div>" +
      "</div></section>";
  }

  /* ---------- 商品列表 ---------- */

  function priceLabel(p) {
    var o = Array.isArray(p.options) && p.options.length ? p.options : null;
    if (!o) return '<span class="pprice"><small>' + esc(S.shop.currency || "¥") + "</small>" + money(p.price || 0) + "</span>";
    var list = o.map(function (x) { return Number(x.price) || 0; });
    var min = Math.min.apply(null, list), max = Math.max.apply(null, list);
    return '<span class="pprice"><small>' + esc(S.shop.currency || "¥") + "</small>" + money(min) + (max > min ? "<small> 起</small>" : "") + "</span>";
  }

  function stockInfo(p) {
    var o = Array.isArray(p.options) && p.options.length ? p.options : null;
    var stocks = o ? o.map(function (x) { return x.stock != null ? Number(x.stock) : p.stock != null ? Number(p.stock) : Infinity; })
      : [p.stock != null ? Number(p.stock) : Infinity];
    var total = stocks.reduce(function (a, b) { return a + b; }, 0);
    if (total <= 0) return '<span class="pill is-out">已售罄</span>';
    if (total === Infinity) return "不限库存";
    return "库存 " + total;
  }

  function thumbHTML(p) {
    var imgs = Array.isArray(p.images) ? p.images : p.image ? [p.image] : [];
    var t = tintOf(p);
    return '<span class="thumb" style="--tint:' + t[0] + ";--tint-fg:" + t[1] + '">' +
      (imgs.length ? '<img src="' + esc(src(imgs[0])) + '" alt="" loading="lazy">' : icon(p.icon)) + "</span>";
  }

  function productRowsHTML() {
    var q = pf.q.trim().toLowerCase();
    var filtering = !!(q || pf.cat);
    var rows = S.products.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) {
      if (pf.cat === "__none") { if (catName(x.p.category)) return false; }
      else if (pf.cat && x.p.category !== pf.cat) return false;
      return !q || [x.p.name, x.p.desc, (x.p.tags || []).join(" ")].join(" ").toLowerCase().indexOf(q) !== -1;
    });
    if (!S.products.length) return '<div class="empty-note">还没有商品，点右上角「新增商品」开始。</div>';
    if (!rows.length) return '<div class="empty-note">没有符合条件的商品。</div>';
    var len = S.products.length;
    return rows.map(function (x) {
      var p = x.p, i = x.i;
      var cn = catName(p.category);
      return '<div class="prow">' + thumbHTML(p) +
        '<div><button class="pname" type="button" data-act="edit-product" data-i="' + i + '">' + esc(p.name || "（未命名商品）") + "</button>" +
          '<div class="pmeta">' + (cn ? '<span class="pill">' + esc(cn) + "</span>" : '<span class="pill is-warn">未分类</span>') +
          (typeName(p.type) !== cn ? '<span class="pill">' + typeName(p.type) + "</span>" : "") + (p.link ? '<span class="pill">站外购买</span>' : "") + "</div></div>" +
        priceLabel(p) + '<span class="pstock">' + stockInfo(p) + "</span>" +
        '<div class="pctrl">' +
          '<button class="icon-btn hide-sm" type="button" data-act="move-product" data-dir="-1" data-i="' + i + '" aria-label="上移"' + (filtering || i === 0 ? " disabled" : "") + ">" + icon("up") + "</button>" +
          '<button class="icon-btn hide-sm" type="button" data-act="move-product" data-dir="1" data-i="' + i + '" aria-label="下移"' + (filtering || i === len - 1 ? " disabled" : "") + ">" + icon("down") + "</button>" +
          '<button class="icon-btn hide-sm" type="button" data-act="dup-product" data-i="' + i + '" aria-label="复制一份">' + icon("copy") + "</button>" +
          '<button class="icon-btn" type="button" data-act="edit-product" data-i="' + i + '" aria-label="编辑">' + icon("edit") + "</button>" +
          '<button class="icon-btn is-danger" type="button" data-act="del-product" data-i="' + i + '" aria-label="删除">' + icon("trash") + "</button>" +
        "</div></div>";
    }).join("");
  }

  function viewProducts() {
    var cats = S.shop.categories || [];
    return '<div class="page-head"><h1>商品</h1><button class="btn btn-primary" type="button" data-act="new-product">' + icon("plus") + "新增商品</button></div>" +
      '<div class="toolbar"><input class="input" type="search" placeholder="搜索商品" data-filter="q" value="' + esc(pf.q) + '" aria-label="搜索商品">' +
        '<select class="select" data-filter="cat" aria-label="按分类筛选"><option value="">全部分类</option>' +
        cats.map(function (c) { return '<option value="' + esc(c.id) + '"' + (pf.cat === c.id ? " selected" : "") + ">" + esc(c.name || "（未命名）") + "</option>"; }).join("") +
        '<option value="__none"' + (pf.cat === "__none" ? " selected" : "") + ">未分类</option></select></div>" +
      '<div class="plist" id="plist">' + productRowsHTML() + "</div>";
  }

  /* ---------- 分类 / 收款 / 联系方式 / 须知 ---------- */

  function viewCategories() {
    var cats = S.shop.categories;
    return '<div class="page-head"><h1>分类</h1></div><section class="card">' +
      '<p class="sub">前台按这里的顺序显示分类标签。删除分类不会删除商品，商品会变成「未分类」。</p><div class="rows">' +
      (cats.length ? cats.map(function (c, i) {
        var n = S.products.filter(function (p) { return p.category === c.id; }).length;
        return '<div class="row"><div class="row-fields"><input class="input" data-bind="shop.categories.' + i + '.name" value="' + esc(c.name) + '" placeholder="分类名，例如：实物" aria-label="分类名"><span class="row-meta">' + n + " 件商品</span></div>" + rowCtrl("shop.categories", i, cats.length) + "</div>";
      }).join("") : '<div class="empty-note">还没有分类。</div>') +
      '</div><button class="btn add-row" type="button" data-act="list-add" data-list="shop.categories">' + icon("plus") + "添加分类</button></section>";
  }

  function viewPayments() {
    var pays = S.shop.payments;
    return '<div class="page-head"><h1>收款码</h1></div><section class="card">' +
      '<p class="sub">买家提交订单后，会看到这里的收款码和应付金额。可以放多种，买家自己切换。</p><div class="rows">' +
      (pays.length ? pays.map(function (p, i) {
        return '<div class="row"><div class="row-fields"><input class="input" data-bind="shop.payments.' + i + '.name" value="' + esc(p.name) + '" placeholder="名称，例如：微信支付" aria-label="收款方式名称">' +
          uploadHTML("shop.payments." + i + ".qr", "qr", "收款码图片", "在微信 / 支付宝里保存收款码图片后上传。") + "</div>" + rowCtrl("shop.payments", i, pays.length) + "</div>";
      }).join("") : '<div class="empty-note">还没有收款码。没有的话，订单页会提示买家联系你付款。</div>') +
      '</div><button class="btn add-row" type="button" data-act="list-add" data-list="shop.payments">' + icon("plus") + "添加收款方式</button></section>";
  }

  function viewContacts() {
    var cs = S.shop.contacts;
    return '<div class="page-head"><h1>联系方式</h1></div><section class="card">' +
      '<p class="sub">显示在首页底部和订单页。买家点一下就能复制；填了链接的会直接打开链接。</p><div class="rows">' +
      (cs.length ? cs.map(function (c, i) {
        return '<div class="row"><div class="row-fields cols-3">' +
          '<input class="input" data-bind="shop.contacts.' + i + '.label" value="' + esc(c.label) + '" placeholder="名称，例如：微信" aria-label="名称">' +
          '<input class="input" data-bind="shop.contacts.' + i + '.value" value="' + esc(c.value) + '" placeholder="号码或账号" aria-label="号码或账号">' +
          '<input class="input" data-bind="shop.contacts.' + i + '.link" value="' + esc(c.link || "") + '" placeholder="链接（选填）" aria-label="链接">' +
          "</div>" + rowCtrl("shop.contacts", i, cs.length) + "</div>";
      }).join("") : '<div class="empty-note">还没有联系方式。</div>') +
      '</div><button class="btn add-row" type="button" data-act="list-add" data-list="shop.contacts">' + icon("plus") + "添加联系方式</button></section>";
  }

  function viewNotes() {
    var ns = S.shop.notes;
    return '<div class="page-head"><h1>购买须知</h1></div><section class="card">' +
      '<p class="sub">显示在首页底部，一问一答。</p><div class="rows">' +
      (ns.length ? ns.map(function (n, i) {
        return '<div class="row"><div class="row-fields">' +
          '<input class="input" data-bind="shop.notes.' + i + '.q" value="' + esc(n.q) + '" placeholder="问题，例如：多久发货？" aria-label="问题">' +
          '<textarea class="input" data-bind="shop.notes.' + i + '.a" placeholder="回答" aria-label="回答">' + esc(n.a) + "</textarea>" +
          "</div>" + rowCtrl("shop.notes", i, ns.length) + "</div>";
      }).join("") : '<div class="empty-note">还没有内容。</div>') +
      '</div><button class="btn add-row" type="button" data-act="list-add" data-list="shop.notes">' + icon("plus") + "添加一条</button></section>";
  }

  function viewAccount() {
    var repoUrl = "https://github.com/" + gh.owner + "/" + gh.repo;
    return '<div class="page-head"><h1>账号与发布</h1></div>' +
      (lastPublish && lastPublish.mirrorFail ? '<div class="notice-bar">上次发布已保存到 ' + esc(gh.branch) + "，但没能同步到 gh-pages 分支，网站可能还是旧内容。建议按下面的提示把网站分支改成 " + esc(gh.branch) + "。</div>" : "") +
      '<section class="card"><h2>GitHub 仓库</h2><p class="sub">发布时，改动会作为一次提交保存到下面的分支。</p><dl class="kv">' +
        '<dt>仓库</dt><dd><a href="' + esc(repoUrl) + '" target="_blank" rel="noopener">' + esc(gh.owner + "/" + gh.repo) + "</a></dd>" +
        "<dt>保存到分支</dt><dd>" + esc(gh.branch) + "</dd>" +
        "<dt>网站分支</dt><dd>" + (gh.mirror ? "gh-pages（每次发布自动同步成和 " + esc(gh.branch) + " 一样）" : esc(gh.branch) + "（请确认 Settings → Pages 里选的是它）") + "</dd>" +
        (lastPublish ? "<dt>上次发布</dt><dd>" + new Date(lastPublish.at).toLocaleString("zh-CN") + '，<a href="' + esc(repoUrl) + "/commit/" + esc(lastPublish.sha) + '" target="_blank" rel="noopener">查看提交</a></dd>' : "") +
      "</dl>" +
      (gh.mirror ? '<p class="hint">更省心的做法：到仓库 <a href="' + esc(repoUrl) + '/settings/pages" target="_blank" rel="noopener">Settings → Pages</a> 把 Branch 改成 ' + esc(gh.branch) + "，之后就可以删掉 gh-pages 分支。</p>" : "") +
      '<div class="upl-actions" style="margin-top:18px"><button class="btn" type="button" data-act="reload">重新读取仓库数据</button><button class="btn btn-danger" type="button" data-act="logout">退出登录</button></div></section>' +
      '<section class="card"><h2>备份</h2><p class="sub">把当前编辑中的数据下载成文件，自己留一份。</p><div class="upl-actions">' +
        '<button class="btn" type="button" data-act="export" data-file="shop">下载 shop.json</button>' +
        '<button class="btn" type="button" data-act="export" data-file="products">下载 products.json</button></div></section>';
  }

  /* ---------- 图片上传 ---------- */

  var LIMITS = { avatar: { max: 480, keepPng: true }, cover: { max: 1800 }, product: { max: 1400 }, qr: { max: 1000, png: true } };
  var EXT = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp", "image/svg+xml": "svg" };

  function loadImg(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("无法读取图片")); };
      img.src = url;
    });
  }

  function blobToB64(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(",")[1]); };
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  function addUpload(file, kind) {
    if (!/^image\//.test(file.type)) return Promise.reject(new Error("不是图片"));
    var lim = LIMITS[kind] || LIMITS.product;
    var ext = EXT[file.type] || "jpg";
    var work = Promise.resolve(file);
    if (file.type !== "image/gif" && file.type !== "image/svg+xml") {
      work = loadImg(file).then(function (img) {
        var w = img.naturalWidth, h = img.naturalHeight;
        var scale = Math.min(1, lim.max / Math.max(w, h));
        if (scale >= 1 && file.size <= 400 * 1024) return file;
        var png = lim.png || (lim.keepPng && file.type === "image/png");
        var c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(w * scale));
        c.height = Math.max(1, Math.round(h * scale));
        var ctx = c.getContext("2d");
        if (!png) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        ext = png ? "png" : "jpg";
        return new Promise(function (resolve) { c.toBlob(resolve, png ? "image/png" : "image/jpeg", 0.86); });
      });
    }
    return work.then(function (blob) {
      if (!blob) throw new Error("图片转换失败");
      if (blob.size > 8 * 1024 * 1024) throw new Error("图片太大（超过 8MB）");
      return blobToB64(blob).then(function (b64) {
        var path = "assets/img/uploads/" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + "." + ext;
        pending[path] = { b64: b64, url: URL.createObjectURL(blob), done: false };
        return path;
      });
    });
  }

  var uploadCb = null, uploadKind = "product";

  function pickImages(kind, multiple, cb) {
    uploadCb = cb;
    uploadKind = kind;
    fileInput.multiple = !!multiple;
    fileInput.value = "";
    fileInput.click();
  }

  fileInput.addEventListener("change", function () {
    var files = Array.prototype.slice.call(fileInput.files || []);
    var cb = uploadCb;
    uploadCb = null;
    if (!files.length || !cb) return;
    toast("正在处理图片…");
    var paths = [];
    files.reduce(function (p, f) {
      return p.then(function () {
        return addUpload(f, uploadKind).then(function (path) { paths.push(path); }, function (e) { toast(f.name + "：" + e.message, true); });
      });
    }, Promise.resolve()).then(function () { if (paths.length) { cb(paths); toast("图片已添加，发布后生效"); } });
  });

  /* ---------- 发布 ---------- */

  function publish() {
    if (busy || !S) return;
    var badCat = S.shop.categories.findIndex(function (c) { return !String(c.name || "").trim(); });
    if (badCat >= 0) { view = "categories"; renderApp(); toast("有分类还没填名字", true); return; }
    var badPay = S.shop.payments.findIndex(function (p) { return !String(p.name || "").trim() || !p.qr; });
    if (badPay >= 0) { view = "payments"; renderApp(); toast("有收款方式没填名称或没传收款码", true); return; }

    busy = true;
    renderTop();
    var json = JSON.stringify(S);
    var files = [
      { path: "data/shop.json", b64: b64enc(JSON.stringify(S.shop, null, 2) + "\n") },
      { path: "data/products.json", b64: b64enc(JSON.stringify(S.products, null, 2) + "\n") }
    ];
    Object.keys(pending).forEach(function (p) {
      if (!pending[p].done && json.indexOf(JSON.stringify(p)) !== -1) files.push({ path: p, b64: pending[p].b64 });
    });
    var base, commitSha, mirrorFail = false;

    api("GET", repoPath() + "/git/ref/heads/" + encodeURIComponent(gh.branch)).then(function (ref) {
      base = ref.object.sha;
      return api("GET", repoPath() + "/git/commits/" + base);
    }).then(function (baseCommit) {
      var tree = [];
      return files.reduce(function (p, f) {
        return p.then(function () {
          return api("POST", repoPath() + "/git/blobs", { content: f.b64, encoding: "base64" }).then(function (b) {
            tree.push({ path: f.path, mode: "100644", type: "blob", sha: b.sha });
          });
        });
      }, Promise.resolve()).then(function () {
        return api("POST", repoPath() + "/git/trees", { base_tree: baseCommit.tree.sha, tree: tree });
      });
    }).then(function (t) {
      var nImg = files.length - 2;
      return api("POST", repoPath() + "/git/commits", {
        message: "后台更新店铺内容" + (nImg ? "（新增 " + nImg + " 张图片）" : ""),
        tree: t.sha,
        parents: [base]
      });
    }).then(function (c) {
      commitSha = c.sha;
      return api("PATCH", repoPath() + "/git/refs/heads/" + encodeURIComponent(gh.branch), { sha: commitSha });
    }).then(function () {
      if (!gh.mirror) return null;
      return api("PATCH", repoPath() + "/git/refs/heads/gh-pages", { sha: commitSha, force: false }).catch(function () { mirrorFail = true; });
    }).then(function () {
      files.slice(2).forEach(function (f) { pending[f.path].done = true; });
      snapshot = json;
      lastPublish = { at: Date.now(), sha: commitSha, mirrorFail: mirrorFail };
      busy = false;
      renderTop();
      if (view === "account") renderMain();
      toast(mirrorFail ? "已保存，但没能同步 gh-pages 分支，网站可能不会更新（详见「账号与发布」）" : "已发布，网站一两分钟后更新", mirrorFail);
    }).catch(function (e) {
      busy = false;
      renderTop();
      toast("发布失败：" + errText(e), true);
    });
  }

  /* ---------- 商品编辑 ---------- */

  function toDraft(p) {
    var o = Array.isArray(p.options) ? p.options : [];
    var str = function (v) { return v == null ? "" : String(v); };
    return {
      id: p.id,
      category: p.category || "",
      type: p.type || "digital",
      name: p.name || "",
      desc: p.desc || "",
      details: (p.details || []).join("\n"),
      images: (Array.isArray(p.images) ? p.images : p.image ? [p.image] : []).slice(),
      icon: p.icon || "box",
      color: p.color || "",
      tags: (p.tags || []).join("，"),
      useOptions: o.length > 0,
      price: str(p.price),
      was: str(p.was),
      stock: str(p.stock),
      options: o.map(function (x) {
        return { name: x.name || "", price: str(x.price), was: str(x.was), stock: x.stock != null ? str(x.stock) : str(p.stock) };
      }),
      link: p.link || ""
    };
  }

  function newDraft() {
    var cats = S.shop.categories;
    var d = toDraft({ id: "p" + rid(), category: cats.length ? cats[0].id : "", type: "digital", icon: "box" });
    d.options = [{ name: "", price: "", was: "", stock: "" }, { name: "", price: "", was: "", stock: "" }];
    return d;
  }

  function fromDraft(d) {
    var p = { id: d.id, category: d.category, type: d.type, name: d.name.trim() };
    if (d.desc.trim()) p.desc = d.desc.trim();
    var details = d.details.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
    if (details.length) p.details = details;
    if (d.images.length) p.images = d.images.slice();
    p.icon = d.icon;
    if (d.color) p.color = d.color;
    var tags = d.tags.split(/[,，、]/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (tags.length) p.tags = tags;
    if (d.useOptions) {
      p.options = d.options.filter(function (o) { return o.name.trim() || String(o.price).trim(); }).map(function (o) {
        var x = { name: o.name.trim(), price: num(o.price) };
        if (num(o.was) != null) x.was = num(o.was);
        if (num(o.stock) != null) x.stock = Math.max(0, Math.floor(num(o.stock)));
        return x;
      });
    } else {
      p.price = num(d.price);
      if (num(d.was) != null) p.was = num(d.was);
      if (num(d.stock) != null) p.stock = Math.max(0, Math.floor(num(d.stock)));
    }
    if (d.link.trim()) p.link = d.link.trim();
    return p;
  }

  function validateDraft(d) {
    if (!d.name.trim()) return { field: "name", msg: "填写商品名称" };
    var bad = function (v) { var n = num(v); return n === null || isNaN(n) || n < 0; };
    var badOpt = function (v) { var n = num(v); return n !== null && (isNaN(n) || n < 0); };
    if (!d.useOptions) {
      if (bad(d.price)) return { field: "price", msg: "填写正确的价格" };
      if (badOpt(d.was)) return { field: "was", msg: "原价要填数字" };
      if (badOpt(d.stock)) return { field: "stock", msg: "库存要填数字，不限就留空" };
    } else {
      var rows = d.options.map(function (o, i) { return { o: o, i: i }; }).filter(function (x) { return x.o.name.trim() || String(x.o.price).trim(); });
      if (!rows.length) return { field: "options.0.name", msg: "至少填一个规格" };
      for (var k = 0; k < rows.length; k++) {
        var x = rows[k];
        if (!x.o.name.trim()) return { field: "options." + x.i + ".name", msg: "规格要填名称" };
        if (bad(x.o.price)) return { field: "options." + x.i + ".price", msg: "规格「" + x.o.name + "」要填正确的价格" };
        if (badOpt(x.o.was)) return { field: "options." + x.i + ".was", msg: "原价要填数字" };
        if (badOpt(x.o.stock)) return { field: "options." + x.i + ".stock", msg: "库存要填数字，不限就留空" };
      }
    }
    return null;
  }

  function openEditor(index) {
    var isNew = index < 0;
    var D = isNew ? newDraft() : toDraft(S.products[index]);
    var start = JSON.stringify(D);
    var opener = document.activeElement;

    var el = document.createElement("div");
    el.className = "layer";
    el.innerHTML = '<div class="scrim" data-x></div><div class="drawer" role="dialog" aria-modal="true" aria-label="' + (isNew ? "新增商品" : "编辑商品") + '" tabindex="-1"></div>';
    document.body.appendChild(el);
    document.body.classList.add("locked");
    var drawer = el.querySelector(".drawer");

    function dInput(path, label, opt) {
      opt = opt || {};
      var id = "d-" + path.replace(/\./g, "-");
      var val = getPath(D, path);
      var attrs = ' id="' + id + '" data-d="' + path + '"' + (opt.placeholder ? ' placeholder="' + esc(opt.placeholder) + '"' : "") + (opt.numeric ? ' inputmode="decimal"' : "") + (opt.aria ? ' aria-label="' + esc(opt.aria) + '"' : "");
      var control = opt.textarea ? '<textarea class="input"' + attrs + ">" + esc(val) + "</textarea>" : '<input class="input"' + attrs + ' value="' + esc(val) + '">';
      if (opt.bare) return control;
      return '<div class="field">' + (label ? '<label class="label" for="' + id + '">' + label + "</label>" : "") + control + (opt.hint ? '<p class="hint">' + opt.hint + "</p>" : "") + "</div>";
    }

    function body() {
      var cats = S.shop.categories;
      var t = tintOf({ id: D.id, color: D.color });
      var html =
        '<div class="sec"><h3>基本信息</h3><div class="stack">' +
          dInput("name", "商品名称", { placeholder: "例如：原创贴纸套装" }) +
          dInput("desc", "一句话介绍", { textarea: true, placeholder: "列表里显示两行，详情页显示全部" }) +
          '<div class="field"><label class="label" for="d-category">分类</label><select class="select" id="d-category" data-d="category">' +
            cats.map(function (c) { return '<option value="' + esc(c.id) + '"' + (D.category === c.id ? " selected" : "") + ">" + esc(c.name || "（未命名）") + "</option>"; }).join("") +
            '<option value=""' + (catName(D.category) ? "" : " selected") + ">未分类</option></select></div>" +
          '<div class="field"><span class="label">商品类型</span><div class="seg" role="radiogroup" aria-label="商品类型">' +
            TYPES.map(function (ty) { return '<label><input type="radio" name="d-type" data-d="type" value="' + ty.id + '"' + (D.type === ty.id ? " checked" : "") + "><span>" + ty.name + "</span></label>"; }).join("") +
          '</div><p class="hint">' + TYPES.filter(function (ty) { return ty.id === D.type; }).map(function (ty) { return ty.hint; }).join("") + "</p></div>" +
        "</div></div>";

      html += '<div class="sec"><h3>图片<small>第一张是封面，建议正方形</small></h3><div class="gal">' +
        D.images.map(function (img, i) {
          return '<div class="gal-item"><img src="' + esc(src(img)) + '" alt="第 ' + (i + 1) + ' 张">' + (i === 0 ? '<span class="cover-tag">封面</span>' : "") +
            '<div class="gal-ctrl"><button type="button" data-img="left" data-i="' + i + '" aria-label="往前移"' + (i === 0 ? " disabled" : "") + ">" + icon("left") + "</button>" +
            '<button type="button" data-img="del" data-i="' + i + '" aria-label="删除这张">' + icon("trash") + "</button>" +
            '<button type="button" data-img="right" data-i="' + i + '" aria-label="往后移"' + (i === D.images.length - 1 ? " disabled" : "") + ">" + icon("right") + "</button></div></div>";
        }).join("") +
        '<button class="gal-add" type="button" data-img="add">' + icon("plus") + "添加图片</button></div>" +
        (D.images.length ? "" :
          '<div class="stack" style="margin-top:16px"><div class="field"><span class="label">没有图片时显示的图标</span><div class="icons">' +
            PRODUCT_ICONS.map(function (ic) { return '<label title="' + ic[1] + '"><input type="radio" name="d-icon" data-d="icon" value="' + ic[0] + '"' + (D.icon === ic[0] ? " checked" : "") + ' aria-label="' + ic[1] + '"><span style="color:' + t[1] + '">' + icon(ic[0]) + "</span></label>"; }).join("") +
          '</div></div><div class="field"><span class="label">底色</span><div class="swatches">' +
            '<label title="自动"><input type="radio" name="d-color" data-d="color" value=""' + (!D.color ? " checked" : "") + ' aria-label="自动"><span style="--sw:#fff">自动</span></label>' +
            TINT_KEYS.map(function (k) { return '<label title="' + TINTS[k][2] + '"><input type="radio" name="d-color" data-d="color" value="' + k + '"' + (D.color === k ? " checked" : "") + ' aria-label="' + TINTS[k][2] + '"><span style="--sw:' + TINTS[k][0] + '"></span></label>'; }).join("") +
          "</div></div></div>") +
        "</div>";

      html += '<div class="sec"><h3>价格和库存</h3><label class="check" style="margin-bottom:14px"><input type="checkbox" data-d="useOptions"' + (D.useOptions ? " checked" : "") + "> 有多个规格（比如尺寸、版本、面值）</label>";
      if (!D.useOptions) {
        html += '<div class="grid-3">' + dInput("price", "价格", { numeric: true, placeholder: "0" }) + dInput("was", "划线原价", { numeric: true, placeholder: "选填" }) +
          dInput("stock", "库存", { numeric: true, placeholder: "不限", hint: "填 0 显示已售罄" }) + "</div>";
      } else {
        html += '<div class="opts"><div class="opt-row opt-head"><span>规格名称</span><span>价格</span><span class="opt-was">原价</span><span>库存</span><span></span></div>' +
          D.options.map(function (o, i) {
            return '<div class="opt-row">' + dInput("options." + i + ".name", "", { bare: true, placeholder: "例如：大号", aria: "规格名称" }) +
              dInput("options." + i + ".price", "", { bare: true, numeric: true, placeholder: "价格", aria: "价格" }) +
              '<span class="opt-was">' + dInput("options." + i + ".was", "", { bare: true, numeric: true, placeholder: "选填", aria: "原价" }) + "</span>" +
              dInput("options." + i + ".stock", "", { bare: true, numeric: true, placeholder: "不限", aria: "库存" }) +
              '<button class="icon-btn is-danger" type="button" data-opt="del" data-i="' + i + '" aria-label="删除这个规格">' + icon("trash") + "</button></div>";
          }).join("") +
          '</div><button class="btn btn-sm add-row" type="button" data-opt="add">' + icon("plus") + '添加规格</button><p class="hint">库存留空表示不限，填 0 表示这个规格卖完了。</p>';
      }
      html += "</div>";

      html += '<div class="sec"><h3>详情</h3><div class="stack">' +
        dInput("details", "详情要点", { textarea: true, placeholder: "每行一条，例如：\n一套 12 张\n防水防晒材质", hint: "显示在详情页，每行一条。" }) +
        dInput("tags", "标签", { placeholder: "例如：热卖，九成新", hint: "用逗号分隔，第一个会显示在商品图左上角。" }) +
        dInput("link", "站外购买链接", { placeholder: "选填，例如闲鱼或发卡平台的商品链接", hint: "填了以后这个商品不走本站下单，买家点按钮直接跳转过去。" }) +
        "</div></div>";
      return html;
    }

    function render(keepScroll) {
      var b = drawer.querySelector(".drawer-body");
      var top = keepScroll && b ? b.scrollTop : 0;
      drawer.innerHTML =
        '<div class="drawer-head"><h2>' + (isNew ? "新增商品" : "编辑商品") + '</h2><button class="icon-btn" type="button" data-x aria-label="关闭">' + icon("close") + "</button></div>" +
        '<div class="drawer-body">' + body() + "</div>" +
        '<div class="drawer-foot">' + (isNew ? "" : '<button class="btn btn-danger" type="button" data-del style="margin-right:auto">删除商品</button>') +
        '<button class="btn" type="button" data-x>取消</button><button class="btn btn-primary" type="button" data-save>保存</button></div>';
      drawer.querySelector(".drawer-body").scrollTop = top;
    }

    function close(force) {
      if (!force && JSON.stringify(D) !== start && !window.confirm("这个商品的修改还没保存，确定放弃吗？")) return;
      el.remove();
      document.removeEventListener("keydown", onKey, true);
      if (!$(".layer")) document.body.classList.remove("locked");
      if (opener && document.contains(opener)) opener.focus();
    }

    function onKey(e) {
      if (e.key === "Escape") { e.stopPropagation(); close(false); }
    }
    document.addEventListener("keydown", onKey, true);

    el.addEventListener("input", function (e) {
      var path = e.target.getAttribute("data-d");
      if (!path) return;
      if (e.target.type === "checkbox" || e.target.type === "radio" || e.target.tagName === "SELECT") return;
      setPath(D, path, e.target.value);
      if (e.target.getAttribute("aria-invalid")) e.target.removeAttribute("aria-invalid");
    });

    el.addEventListener("change", function (e) {
      var path = e.target.getAttribute("data-d");
      if (!path) return;
      if (e.target.type === "checkbox") {
        setPath(D, path, e.target.checked);
        if (path === "useOptions" && D.useOptions && !D.options.length) {
          D.options = [{ name: "", price: D.price, was: D.was, stock: D.stock }, { name: "", price: "", was: "", stock: "" }];
        }
        render(true);
      } else if (e.target.type === "radio" || e.target.tagName === "SELECT") {
        setPath(D, path, e.target.value);
        if (path === "type" || path === "color") render(true);
      }
    });

    el.addEventListener("click", function (e) {
      if (e.target.closest("[data-x]")) { close(false); return; }
      var t = e.target.closest("button");
      if (!t) return;
      var i = Number(t.getAttribute("data-i"));
      var img = t.getAttribute("data-img");
      var op = t.getAttribute("data-opt");
      if (img === "add") {
        pickImages("product", true, function (paths) { D.images = D.images.concat(paths); render(true); });
      } else if (img === "del") {
        D.images.splice(i, 1); render(true);
      } else if (img === "left" || img === "right") {
        var j = img === "left" ? i - 1 : i + 1;
        var tmp = D.images[i]; D.images[i] = D.images[j]; D.images[j] = tmp;
        render(true);
      } else if (op === "add") {
        D.options.push({ name: "", price: "", was: "", stock: "" });
        render(true);
        var rows = drawer.querySelectorAll(".opt-row:not(.opt-head)");
        var last = rows[rows.length - 1];
        if (last) last.querySelector("input").focus();
      } else if (op === "del") {
        D.options.splice(i, 1);
        render(true);
      } else if (t.hasAttribute("data-save")) {
        var bad = validateDraft(D);
        if (bad) {
          var input = drawer.querySelector('[data-d="' + bad.field + '"]');
          if (input) { input.setAttribute("aria-invalid", "true"); input.focus(); }
          toast(bad.msg, true);
          return;
        }
        var p = fromDraft(D);
        if (isNew) S.products.unshift(p); else S.products[index] = p;
        close(true);
        renderMain(); renderNav(); updateDirty();
        toast("已保存。改完记得点右上角「发布」");
      } else if (t.hasAttribute("data-del")) {
        if (!window.confirm("确定删除「" + (D.name || "这个商品") + "」吗？")) return;
        S.products.splice(index, 1);
        close(true);
        renderMain(); renderNav(); updateDirty();
        toast("已删除，发布后生效");
      }
    });

    render(false);
    drawer.focus();
    var first = drawer.querySelector("#d-name");
    if (isNew && first) first.focus();
  }

  /* ---------- 事件 ---------- */

  var LIST_NEW = {
    "shop.categories": function () { return { id: "c" + rid(), name: "" }; },
    "shop.payments": function () { return { id: "pay" + rid(), name: "", qr: "" }; },
    "shop.contacts": function () { return { label: "", value: "" }; },
    "shop.notes": function () { return { q: "", a: "" }; }
  };

  app.addEventListener("input", function (e) {
    var t = e.target;
    if (t.hasAttribute("data-filter")) {
      pf[t.getAttribute("data-filter")] = t.value;
      var pl = $("#plist");
      if (pl) pl.innerHTML = productRowsHTML();
      return;
    }
    var path = t.getAttribute("data-bind");
    if (!path || !S) return;
    var v = t.value;
    if (t.getAttribute("data-type") === "number") { var n = num(v); v = n === null || isNaN(n) ? 0 : n; }
    setPath(S, path, v);
    if (path === "shop.accent") { var hx = $("#accentHex"); if (hx) hx.textContent = t.value; }
    if (path === "shop.name") renderTop();
    updateDirty();
  });

  app.addEventListener("change", function (e) {
    var t = e.target;
    if (t.getAttribute("data-filter") === "cat") {
      pf.cat = t.value;
      var pl = $("#plist");
      if (pl) pl.innerHTML = productRowsHTML();
    }
    if (t.getAttribute("data-act") === "toggle-hours") {
      if (t.checked) S.shop.hours = { open: "10:00", close: "24:00" };
      else delete S.shop.hours;
      renderMain(); updateDirty();
    }
  });

  app.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act]");
    if (!t || t.tagName === "INPUT") return;
    var act = t.getAttribute("data-act");
    var i = Number(t.getAttribute("data-i"));
    var list = t.getAttribute("data-list");

    if (act === "nav") {
      view = t.getAttribute("data-view");
      renderNav(); renderMain();
      window.scrollTo(0, 0);
    } else if (act === "publish") {
      publish();
    } else if (act === "upload") {
      var path = t.getAttribute("data-path");
      pickImages(t.getAttribute("data-kind"), false, function (paths) {
        setPath(S, path, paths[0]);
        renderMain(); renderTop(); updateDirty();
      });
    } else if (act === "clear") {
      setPath(S, t.getAttribute("data-path"), "");
      renderMain(); renderTop(); updateDirty();
    } else if (act === "list-add") {
      var arr = getPath(S, list);
      arr.push(LIST_NEW[list]());
      renderMain(); updateDirty();
      var rows = document.querySelectorAll("#main .row");
      var last = rows[rows.length - 1];
      if (last) { var f = last.querySelector("input, textarea"); if (f) f.focus(); }
    } else if (act === "list-del") {
      var a = getPath(S, list);
      if (list === "shop.categories") {
        var used = S.products.filter(function (p) { return p.category === a[i].id; }).length;
        if (used && !window.confirm("有 " + used + " 件商品在「" + (a[i].name || "这个分类") + "」下，删除后它们会变成未分类。确定删除？")) return;
      }
      a.splice(i, 1);
      renderMain(); updateDirty();
    } else if (act === "list-up" || act === "list-down") {
      var b = getPath(S, list);
      var j = act === "list-up" ? i - 1 : i + 1;
      if (j < 0 || j >= b.length) return;
      var tmp = b[i]; b[i] = b[j]; b[j] = tmp;
      renderMain(); updateDirty();
    } else if (act === "new-product") {
      openEditor(-1);
    } else if (act === "edit-product") {
      openEditor(i);
    } else if (act === "dup-product") {
      var copy = clone(S.products[i]);
      copy.id = "p" + rid();
      copy.name = (copy.name || "") + "（副本）";
      S.products.splice(i + 1, 0, copy);
      renderMain(); renderNav(); updateDirty();
      toast("已复制一份，记得改名");
    } else if (act === "del-product") {
      if (!window.confirm("确定删除「" + (S.products[i].name || "这个商品") + "」吗？")) return;
      S.products.splice(i, 1);
      renderMain(); renderNav(); updateDirty();
      toast("已删除，发布后生效");
    } else if (act === "move-product") {
      var k = i + Number(t.getAttribute("data-dir"));
      if (k < 0 || k >= S.products.length) return;
      var tp = S.products[i]; S.products[i] = S.products[k]; S.products[k] = tp;
      renderMain(); updateDirty();
    } else if (act === "reload") {
      if (isDirty() && !window.confirm("还有修改没发布，重新读取会丢掉这些修改。确定吗？")) return;
      loadData().then(function () { renderApp(); toast("已重新读取仓库数据"); }, function (err) { toast(errText(err), true); });
    } else if (act === "logout") {
      if (isDirty() && !window.confirm("还有修改没发布，退出会丢掉这些修改。确定退出吗？")) return;
      store.del("token"); session.del("token");
      gh = null; S = null; snapshot = ""; pending = {};
      renderLogin();
    } else if (act === "export") {
      var which = t.getAttribute("data-file");
      var data = which === "shop" ? S.shop : S.products;
      var blob = new Blob([JSON.stringify(data, null, 2) + "\n"], { type: "application/json" });
      var a2 = document.createElement("a");
      a2.href = URL.createObjectURL(blob);
      a2.download = which + ".json";
      document.body.appendChild(a2);
      a2.click();
      a2.remove();
    }
  });

  window.addEventListener("beforeunload", function (e) {
    if (isDirty()) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ---------- 启动 ---------- */

  var savedToken = store.get("token", null) || session.get("token");
  var savedRepo = store.get("repo", "");
  if (savedToken && savedRepo) {
    app.innerHTML = '<div class="login"><p class="lead">正在连接仓库…</p></div>';
    connect(savedRepo, savedToken, !!store.get("token", null)).then(
      function () { renderApp(); },
      function (err) { renderLogin(err.message); }
    );
  } else {
    renderLogin();
  }
})();
