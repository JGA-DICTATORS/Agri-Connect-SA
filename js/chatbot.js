/* AgriBot – floating assistant for AgriConnect SA.
 * Works fully offline using the site's own information.
 * Optional: set window.AGRIBOT_API_URL (before this script loads) to a SERVER-SIDE endpoint
 * that accepts POST {messages:[{role,content}]} and returns {reply:"..."} to use an AI model.
 * Never put an AI API key in this file – anything in browser code is public. */
(function () {
  "use strict";
  if (document.getElementById("agribot")) return;

  // ---------- Knowledge (taken from the site's pages) ----------
  var PRODUCTS = [
    ["Fresh Maize", "R120 / bag", "vegetables"], ["Tomatoes", "R250 / crate", "vegetables"],
    ["Spinach", "R30 / bundle", "vegetables"], ["Apples", "R80 / box", "fruit"],
    ["Oranges", "R70 / box", "fruit"], ["Mangoes", "R120 / box", "fruit"],
    ["Live Chickens", "R150 each", "livestock"], ["Goats", "R2 800", "livestock"],
    ["Tractor", "R450 000", "equipment"], ["Fertiliser", "R350 / bag", "equipment"],
    ["Maize Seeds", "R220", "equipment"], ["Irrigation Kit", "R4 500", "equipment"]
  ];
  var CONTACT = "Email: info@agriconnectsa.co.za\nPhone: +27 12 345 6789\nAddress: Pretoria, Gauteng\nHours: Mon–Fri 08:00–17:00, Sat 08:00–13:00, Sun closed.";
  var FALLBACK = "I'm not sure about that one. I can help with the marketplace, prices, selling, delivery, your cart, the Community Hub, and general farming questions. For anything else, contact our team:\n" + CONTACT;

  function priceLine(p) { return "• " + p[0] + " – " + p[1]; }
  function list(cat) { return PRODUCTS.filter(function (p) { return !cat || p[2] === cat; }).map(priceLine).join("\n"); }

  // Each intent: keywords (any match scores), and a reply string or function(text)
  var INTENTS = [
    { k: ["hello", "hi", "hey", "howzit", "good morning", "good afternoon", "sawubona", "molo", "dumela"],
      r: "Hello! 👋 I'm AgriBot. Ask me about products, prices, selling on AgriConnect, delivery, or farming tips." },
    { k: ["thank", "thanks", "cheers", "appreciate"], r: "You're welcome! 🌱 Anything else I can help with?" },
    { k: ["bye", "goodbye", "see you"], r: "Goodbye! Happy farming. 🚜" },
    { k: ["contact", "phone", "email", "address", "call", "reach", "support", "hours", "open", "where are you", "location"],
      r: "You can reach AgriConnect SA here:\n" + CONTACT + "\n\nOr use the form on the <a href=\"contact.html\">Contact page</a>." },
    { k: ["sell", "list my", "become a farmer", "register as", "farmer account", "advertise"],
      r: "To sell on AgriConnect SA:\n1. <a href=\"register.html\">Create an account</a>\n2. List your products\n3. Buyers browse and order\n4. You receive the order and arrange delivery.\nSee <a href=\"about.html\">How it works</a> for details." },
    { k: ["login", "log in", "sign in", "register", "sign up", "account", "password", "profile"],
      r: "New here? <a href=\"register.html\">Register</a>. Already have an account? <a href=\"login.html\">Log in</a>. Your details are on your <a href=\"profile.html\">Profile</a> page." },
    { k: ["cart", "basket", "checkout", "check out", "pay", "payment", "order", "buy", "purchase"],
      r: "To buy: open the <a href=\"products.html\">Marketplace</a>, press “Add to Cart”, review your items in the <a href=\"cart.html\">Cart</a>, then go to <a href=\"checkout.html\">Checkout</a>. Payments are processed securely." },
    { k: ["deliver", "shipping", "ship", "courier", "how long"],
      r: "We offer nationwide delivery options. Delivery times depend on the farmer and your location, and the details are shown on each product listing. For a specific order, please contact the seller or our team." },
    { k: ["farmer", "farmers", "seller", "verified", "who sells"],
      r: "AgriConnect SA has 500+ registered farmers across all 9 provinces. Browse them on the <a href=\"farmers.html\">Farmers page</a>." },
    { k: ["community", "forum", "discussion", "ask a question", "hub"],
      r: "The <a href=\"community.html\">Community Hub</a> is where farmers and buyers ask questions and share knowledge." },
    { k: ["about us", "about agriconnect", "who are you", "what is agriconnect", "what is this", "mission", "vision"],
      r: "AgriConnect SA is an online marketplace that connects South African farmers directly with buyers, so farmers reach customers nationwide without intermediaries. Read more on the <a href=\"about.html\">About page</a>." },
    { k: ["dark mode", "dark theme", "night"], r: "Use the 🌙 button in the top-right of the header to switch dark mode on or off." },
    { k: ["categories", "category", "what do you sell", "what can i buy", "products", "marketplace", "catalogue", "catalog", "price list", "prices"],
      r: "Marketplace categories: Vegetables, Fruit, Livestock and Equipment.\n\n" + "" , f: function () {
        return "Current listings:\n" + list() + "\n\nBrowse them on the <a href=\"products.html\">Marketplace</a>."; } },
    { k: ["vegetable", "vegetables", "veg"], f: function () { return "Vegetables:\n" + list("vegetables"); } },
    { k: ["fruit", "fruits"], f: function () { return "Fruit:\n" + list("fruit"); } },
    { k: ["livestock", "animals", "animal"], f: function () { return "Livestock:\n" + list("livestock"); } },
    { k: ["equipment", "machinery", "tools"], f: function () { return "Farm equipment & supplies:\n" + list("equipment"); } },
    // Farming advice (general, kept short and cautious)
    { k: ["irrigat", "water", "drip"], r: "Drip irrigation delivers water at the roots and can cut water use a lot compared with overhead sprinklers. Water early morning or late afternoon to reduce evaporation. We list an Irrigation Kit on the <a href=\"products.html\">Marketplace</a>." },
    { k: ["fertili", "manure", "compost", "nutrient"], r: "Test your soil first so you only apply what's needed. Combine fertiliser with compost or manure to build soil health. Follow the label rates, and ask your local agricultural extension officer for crop-specific advice." },
    { k: ["pest", "disease", "insect", "aphid", "fungus", "blight"], r: "Scout your crops regularly, rotate crops, remove infected plants early and encourage beneficial insects. For a specific pest or disease, take a photo to your local extension officer or agri-retailer before spraying." },
    { k: ["plant", "sow", "season", "when to", "harvest", "grow"], r: "Planting and harvest times depend on your crop, region and rainfall. As a rule, most summer crops like maize go in after the last frost with the first good rains. Tell me the crop and province and I'll share general guidance, or ask in the <a href=\"community.html\">Community Hub</a>." },
    { k: ["maize", "corn", "mealie"], r: "Maize: Fresh Maize is R120 per bag and Maize Seeds are R220 on the Marketplace. Plant after the first good rains, space plants evenly, and keep weeds down in the first 6 weeks." },
    { k: ["tomato"], r: "Tomatoes are R250 per crate. They like full sun, regular water and staking; avoid wetting the leaves to limit disease." },
    { k: ["goat", "chicken", "poultry", "cattle", "sheep"], r: "We list Live Chickens (R150 each) and Goats (R2 800). Always check the seller's health and vaccination information before buying animals, and ask a vet for care advice." }
  ];

  var NAMES = PRODUCTS.map(function (p) { return p[0]; });

  function norm(s) { return " " + s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ") + " "; }

  function localReply(text) {
    var t = norm(text);
    // Specific product price lookup: longest matching product name wins
    var hit = null, hitLen = 0;
    PRODUCTS.forEach(function (p) {
      var name = p[0].toLowerCase(), short = name.replace(/^(fresh|live)\s/, "");
      [name, short, short.replace(/s$/, "")].forEach(function (n) {
        if (n.length > hitLen && t.indexOf(" " + n) > -1) { hit = p; hitLen = n.length; }
      });
    });
    if (hit && (/price|cost|how much|rand|\sr\d|sell for|\bfor\b/.test(t) || t.trim().split(" ").length < 4)) {
      return hit[0] + " " + (/s$/.test(hit[0]) ? "are" : "is") + " " + hit[1] + ". Find " + (/s$/.test(hit[0]) ? "them" : "it") + " on the <a href=\"products.html\">Marketplace</a>.";
    }
    var best = null, bestScore = 0;
    INTENTS.forEach(function (it) {
      var s = 0;
      it.k.forEach(function (kw) {
        var needle = kw.length <= 3 ? " " + kw + " " : kw;
        if (t.indexOf(needle) > -1) s += kw.length > 4 ? 2 : 1;
      });
      if (s > bestScore) { bestScore = s; best = it; }
    });
    if (best) return best.f ? best.f() : best.r;
    return FALLBACK;
  }

  function reply(history, text) {
    var url = window.AGRIBOT_API_URL;
    if (!url) return Promise.resolve(localReply(text));
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history }) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { return d.reply ? escapeHtml(d.reply) : localReply(text); })
      .catch(function () { return localReply(text); });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  // ---------- UI ----------
  var root = document.createElement("div");
  root.id = "agribot";
  root.innerHTML =
    '<div class="ab-panel" role="dialog" aria-label="AgriBot chat" aria-hidden="true">' +
      '<div class="ab-head"><span class="ab-av">🤖</span><div><strong>AgriBot</strong><small>AgriConnect SA assistant</small></div>' +
      '<button type="button" class="ab-close" aria-label="Close chat">✕</button></div>' +
      '<div class="ab-log" aria-live="polite"></div>' +
      '<div class="ab-chips"></div>' +
      '<form autocomplete="off"><input type="text" maxlength="300" placeholder="Ask about products, selling, delivery…" aria-label="Your message"><button type="submit">Send</button></form>' +
    '</div>' +
    '<button type="button" class="ab-fab" aria-label="Open AgriBot chat">💬</button>';
  document.body.appendChild(root);

  var panel = root.querySelector(".ab-panel"), log = root.querySelector(".ab-log"),
      chips = root.querySelector(".ab-chips"), form = root.querySelector("form"),
      input = root.querySelector("input"), fab = root.querySelector(".ab-fab");
  var history = [];

  function save() { try { sessionStorage.setItem("agribot", JSON.stringify({ h: history, open: root.classList.contains("open") })); } catch (e) {} }
  function add(who, html) {
    var d = document.createElement("div");
    d.className = "ab-msg " + who; d.innerHTML = html; log.appendChild(d);
    log.scrollTop = log.scrollHeight; return d;
  }
  function setOpen(o) {
    root.classList.toggle("open", o);
    panel.setAttribute("aria-hidden", o ? "false" : "true");
    fab.textContent = o ? "✕" : "💬";
    fab.setAttribute("aria-label", o ? "Close AgriBot chat" : "Open AgriBot chat");
    if (o) setTimeout(function () { input.focus(); }, 150);
    save();
  }
  function setChips(list) {
    chips.innerHTML = "";
    list.forEach(function (c) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = c;
      b.onclick = function () { send(c); }; chips.appendChild(b);
    });
  }
  var DEFAULT_CHIPS = ["Show products", "How do I sell?", "Delivery info", "Contact us"];

  function send(text) {
    text = text.trim(); if (!text) return;
    add("user", escapeHtml(text));
    history.push({ role: "user", content: text }); history = history.slice(-10);
    input.value = ""; chips.innerHTML = "";
    var typing = add("bot ab-typing", "<span></span><span></span><span></span>");
    var started = Date.now();
    reply(history, text).then(function (html) {
      var wait = Math.max(0, 450 - (Date.now() - started));
      setTimeout(function () {
        typing.remove();
        add("bot", html);
        history.push({ role: "assistant", content: html.replace(/<[^>]*>/g, "") });
        setChips(DEFAULT_CHIPS); save();
      }, wait);
    });
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); send(input.value); });
  fab.addEventListener("click", function () { setOpen(!root.classList.contains("open")); });
  root.querySelector(".ab-close").addEventListener("click", function () { setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && root.classList.contains("open")) { setOpen(false); fab.focus(); } });

  // Existing "Chatbot" nav links open the widget instead of the old standalone page
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href$="CustomerSupportBot.html"]');
    if (a) { e.preventDefault(); setOpen(true); }
  });

  // Restore session or greet
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem("agribot")); } catch (e) {}
  if (saved && saved.h && saved.h.length) {
    history = saved.h;
    history.forEach(function (m) { add(m.role === "user" ? "user" : "bot", escapeHtml(m.content)); });
    setChips(DEFAULT_CHIPS);
    if (saved.open) setOpen(true);
  } else {
    add("bot", "Hi! 👋 I'm AgriBot, the AgriConnect SA assistant. How can I help you today?");
    setChips(DEFAULT_CHIPS);
  }
})();
