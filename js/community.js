// AgriConnect Community Hub – posts, replies, likes (stored in this browser's localStorage)
(function () {
  "use strict";
  var KEY = "communityPosts";
  var user = null;
  try { user = JSON.parse(localStorage.getItem("currentUser")); } catch (e) {}

  var $ = function (id) { return document.getElementById(id); };
  var postsEl = $("posts");

  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(posts)); } catch (e) {} }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function ago(t) {
    var s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return "just now";
    var m = Math.floor(s / 60); if (m < 60) return m + " min ago";
    var h = Math.floor(m / 60); if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
    var d = Math.floor(h / 24); return d + (d === 1 ? " day ago" : " days ago");
  }
  function initials(n) { return n.split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase(); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  var H = 3600000, D = 24 * H, now = Date.now();
  var posts = load() || [
    { id: uid(), author: "John Molefe", email: "", cat: "Crops", title: "Growing avocados in Limpopo?", time: now - 2 * H,
      text: "Is anyone currently growing avocados in Limpopo? I'm looking for advice on irrigation methods and fertiliser schedules before planting.",
      likes: [], replies: [{ id: uid(), author: "Sarah Naidoo", email: "", text: "Drip irrigation worked well for us. Mulch heavily to keep the roots cool.", time: now - H }] },
    { id: uid(), author: "Peter Khumalo", email: "", cat: "Livestock", title: "Tick fever in cattle", time: now - 1 * D,
      text: "Has anyone dealt with tick fever this season? What dipping schedule are you using?",
      likes: [], replies: [] },
    { id: uid(), author: "Sipho Dlamini", email: "", cat: "Crops", title: "Best maize seed for the Free State?", time: now - 2 * D,
      text: "Looking for recommendations on maize seed varieties for dryland farming. What has given you the best yield?",
      likes: [], replies: [] }
  ];
  save();

  // ----- auth note -----
  var note = $("authNote");
  if (user) { note.textContent = "Posting as " + user.fullname; }
  else { note.innerHTML = 'Please <a href="login.html">log in</a> or <a href="register.html">register</a> to post, reply and like.'; }

  function requireLogin() {
    if (user) return true;
    alert("Please log in to take part in the community.");
    window.location = "login.html";
    return false;
  }
  var me = function () { return user ? user.email : ""; };
  var canDelete = function (owner) { return user && owner === user.email && owner !== ""; };

  // ----- render -----
  function render() {
    var q = $("searchPosts").value.trim().toLowerCase(), cat = $("filterCategory").value, sort = $("sortPosts").value;
    var list = posts.filter(function (p) {
      return (!cat || p.cat === cat) && (!q || (p.title + " " + p.text + " " + p.author).toLowerCase().indexOf(q) > -1);
    });
    list.sort(function (a, b) {
      if (sort === "top") return b.likes.length - a.likes.length;
      if (sort === "active") return b.replies.length - a.replies.length;
      return b.time - a.time;
    });
    postsEl.textContent = "";
    if (!list.length) postsEl.appendChild(el("div", "empty", "No discussions found. Be the first to start one!"));
    list.forEach(function (p) { postsEl.appendChild(renderPost(p)); });

    var replies = posts.reduce(function (n, p) { return n + p.replies.length; }, 0);
    var likes = posts.reduce(function (n, p) { return n + p.likes.length; }, 0);
    $("statPosts").textContent = posts.length; $("statReplies").textContent = replies; $("statLikes").textContent = likes;

    var score = {};
    posts.forEach(function (p) { score[p.author] = (score[p.author] || 0) + 2; p.replies.forEach(function (r) { score[r.author] = (score[r.author] || 0) + 1; }); });
    var top = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; }).slice(0, 5);
    var ol = $("leaders"); ol.textContent = "";
    top.forEach(function (n) { ol.appendChild(el("li", "", n + " (" + score[n] + " pts)")); });
  }

  function renderPost(p) {
    var card = el("article", "community-card");
    var head = el("div", "post-header");
    head.appendChild(el("div", "avatar", initials(p.author)));
    var info = el("div", "user-info"); info.appendChild(el("h3", "", p.author)); info.appendChild(el("span", "", ago(p.time)));
    head.appendChild(info); head.appendChild(el("span", "tag", p.cat)); card.appendChild(head);
    card.appendChild(el("h3", "post-title", p.title));
    card.appendChild(el("p", "post-text", p.text));

    var acts = el("div", "post-actions");
    var liked = user && p.likes.indexOf(me()) > -1;
    var likeBtn = el("button", "action-btn" + (liked ? " liked" : ""), "❤️ " + p.likes.length + (p.likes.length === 1 ? " Like" : " Likes"));
    likeBtn.onclick = function () {
      if (!requireLogin()) return;
      var i = p.likes.indexOf(me()); if (i > -1) p.likes.splice(i, 1); else p.likes.push(me());
      save(); render();
    };
    var repBtn = el("button", "action-btn", "💬 " + p.replies.length + (p.replies.length === 1 ? " Reply" : " Replies"));
    var share = el("button", "action-btn", "📤 Share");
    share.onclick = function () {
      var txt = p.title + " – AgriConnect SA Community";
      if (navigator.share) navigator.share({ title: txt, url: location.href }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(txt + " " + location.href).then(function () { share.textContent = "✅ Link copied"; });
    };
    acts.append(likeBtn, repBtn, share);
    if (canDelete(p.email)) {
      var del = el("button", "action-btn danger", "🗑 Delete");
      del.onclick = function () { if (confirm("Delete this discussion?")) { posts = posts.filter(function (x) { return x.id !== p.id; }); save(); render(); } };
      acts.appendChild(del);
    }
    card.appendChild(acts);

    var box = el("div", "replies"); box.hidden = !openThreads[p.id];
    p.replies.slice().sort(function (a, b) { return a.time - b.time; }).forEach(function (r) {
      var row = el("div", "reply"); row.appendChild(el("div", "avatar sm", initials(r.author)));
      var body = el("div", "body"), meta = el("div", "meta", r.author + " • " + ago(r.time) + " ");
      if (canDelete(r.email)) {
        var d = el("button", "", "delete");
        d.onclick = function () { p.replies = p.replies.filter(function (x) { return x.id !== r.id; }); save(); render(); };
        meta.appendChild(d);
      }
      body.appendChild(meta); body.appendChild(el("p", "", r.text)); row.appendChild(body); box.appendChild(row);
    });
    var form = el("form", "reply-box"), inp = el("input"); inp.type = "text"; inp.maxLength = 500;
    inp.placeholder = user ? "Write a reply…" : "Log in to reply"; inp.setAttribute("aria-label", "Write a reply");
    var go = el("button", "post-btn", "Reply"); go.type = "submit";
    form.append(inp, go);
    form.onsubmit = function (e) {
      e.preventDefault();
      if (!requireLogin()) return;
      var t = inp.value.trim(); if (!t) return;
      p.replies.push({ id: uid(), author: user.fullname, email: user.email, text: t, time: Date.now() });
      openThreads[p.id] = true; save(); render();
    };
    box.appendChild(form); card.appendChild(box);
    repBtn.onclick = function () { box.hidden = !box.hidden; openThreads[p.id] = !box.hidden; if (!box.hidden) inp.focus(); };
    return card;
  }
  var openThreads = {};

  // ----- new post -----
  var text = $("postText");
  text.addEventListener("input", function () { $("charCount").textContent = text.value.length + " / 1000"; });
  $("newPost").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!requireLogin()) return;
    var title = $("postTitle").value.trim(), body = text.value.trim();
    if (!title || !body) return;
    posts.unshift({ id: uid(), author: user.fullname, email: user.email, cat: $("postCategory").value, title: title, text: body, time: Date.now(), likes: [], replies: [] });
    save(); this.reset(); $("charCount").textContent = "0 / 1000";
    $("sortPosts").value = "new"; $("filterCategory").value = ""; $("searchPosts").value = ""; render();
  });
  $("askBtn").addEventListener("click", function () { setTimeout(function () { $("postTitle").focus(); }, 300); });
  ["searchPosts", "filterCategory", "sortPosts"].forEach(function (id) { $(id).addEventListener("input", render); });

  render();
})();
