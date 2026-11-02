/* Greenfield Call Desk: territory ranking, call sheets, cadence planner and dial log.
   Data comes from assets/site-data.js (window.GCD), built by python/build_site_data.py. */
(function () {
  "use strict";

  var D = window.GCD;
  var ASOF = parseDate(D.asof);
  var VIEWS = ["territory", "account", "cadence", "log", "method"];

  // ---------- event types: label, strength and the words the call sheet is built from ----------
  var TYPES = {
    expansion: {
      label: "Expansion", strength: 0.9,
      when: "a company opens a new site",
      pain: "the systems behind it usually have to stretch too: more people who need access, more locations and more data to keep in sync",
      painShort: "running systems across more locations",
      disc: [
        "When the new site opens, what has to be set up on the technology side, and who owns that?",
        "How do your locations share data today, for example inventory, orders or scheduling?",
        "What would make this rollout easier than the last one?"
      ],
      obj: ["Our IT team is already handling the new site.",
        "That makes sense, and I'm not trying to replace them. Teams are often stretched during a rollout. The meeting is to compare how other companies set up new locations, and if it isn't useful you'll know in 20 minutes."]
    },
    acquisition: {
      label: "Acquisition", strength: 0.85,
      when: "two companies come together",
      pain: "combining their systems and data is often one of the slowest parts of the integration",
      painShort: "bringing two companies' systems together",
      disc: [
        "Are you planning to run both companies' systems side by side, or move onto one?",
        "Which part of the integration is taking the most time so far?",
        "Who is making the call on which systems stay?"
      ],
      obj: ["We're too busy with the integration right now.",
        "Understood. That's partly why I'm calling now: decisions about which systems to keep tend to get made early. Would a 20-minute call in two weeks be easier?"]
    },
    funding: {
      label: "Funding", strength: 0.85,
      when: "a company raises money to grow",
      pain: "the setup that worked for a small team often has to scale faster than the team can manage it",
      painShort: "scaling the technology as the team grows",
      disc: [
        "What does the new funding let you do in the next 12 months that you couldn't before?",
        "As you hire, which part of your technology do you expect to strain first?",
        "How much of your engineering time goes into keeping infrastructure running rather than building product?"
      ],
      obj: ["We're happy with our current provider.",
        "Good to hear. Plenty of companies use more than one provider for different jobs. Would it be worth 20 minutes to check whether there's one part of your setup where a second option saves time or money? If not, I'll leave it there."]
    },
    digital_initiative: {
      label: "New digital service", strength: 1,
      when: "a company rolls out new digital systems",
      pain: "they have to connect to everything already in place and stay reliable at the busiest times, without someone watching servers all day",
      painShort: "connecting and running the new systems",
      disc: [
        "What does success for the new system look like in the first six months?",
        "Which of your existing systems does it have to connect to, and where will the data end up?",
        "Who on your team keeps it running day to day?"
      ],
      obj: ["We built it in-house and it works.",
        "That's great. What I'd want to understand is how it behaves at your busiest hour, and how much of your team's time goes into keeping it running. If the answer is 'none', I'll get out of your way."]
    },
    product_launch: {
      label: "Product launch", strength: 0.9,
      when: "a company ships a new product",
      pain: "usage can grow faster than expected, and the cost and reliability of running it grow with it",
      painShort: "running a new product as usage grows",
      disc: [
        "How are early customers using the new product so far?",
        "If usage doubled next quarter, what would break first?",
        "How do you keep track of what it costs to run per customer?"
      ],
      obj: ["We built it in-house and it works.",
        "That's great. What I'd want to understand is what happens if usage doubles, and what it costs you per customer to run. If you've got that covered, I'll get out of your way."]
    },
    leadership_hire: {
      label: "New leader", strength: 0.85,
      when: "a new leader takes over",
      pain: "the first months usually include a review of which systems to keep, modernise or retire",
      painShort: "the first-year technology review",
      disc: [
        "What has the new leader said they want to change in the first year?",
        "Is there a review of systems or vendors planned?",
        "What would you want them to see in their first 90 days?"
      ],
      obj: ["They're new and not taking meetings yet.",
        "Makes sense. Could I send a one-page summary they can read when they're ready, and check back in a month?"]
    },
    contract_win: {
      label: "Contract win", strength: 0.75,
      when: "a large new contract lands",
      pain: "it often comes with new requirements for reporting, security or uptime",
      painShort: "meeting a new contract's requirements",
      disc: [
        "Does the new contract change what you need to report, store or secure?",
        "How much extra volume does it bring compared with today?",
        "Who is responsible for delivering the technology side of it?"
      ],
      obj: ["Just send me an email.",
        "Happy to. So I send something useful instead of a brochure: which requirement in the new contract is the most work for your team?"]
    },
    grant: {
      label: "Grant", strength: 0.7,
      when: "a funded project starts",
      pain: "the deadline rarely leaves time to build the technology underneath it from scratch",
      painShort: "delivering a funded project on time",
      disc: [
        "What does the funded project have to deliver, and by when?",
        "Which part of it depends on new software, data or computing power?",
        "Who signs off on how the money is spent?"
      ],
      obj: ["We don't have budget for anything new.",
        "Understood, and I'm not asking for budget today. The meeting is to see whether any part of the project could be done for less than you've planned. If not, I'll tell you."]
    }
  };

  // Ontario statutory holidays (including observed days), Nov 2026 - Dec 2027
  var HOLIDAYS = {
    "2026-12-25": "Christmas Day", "2026-12-28": "Boxing Day (observed)", "2027-01-01": "New Year's Day",
    "2027-02-15": "Family Day", "2027-03-26": "Good Friday", "2027-05-24": "Victoria Day",
    "2027-07-01": "Canada Day", "2027-09-06": "Labour Day", "2027-10-11": "Thanksgiving",
    "2027-12-27": "Christmas Day (observed)", "2027-12-28": "Boxing Day (observed)"
  };

  var CADENCE = [
    { day: 1, kind: "Call", what: "Call and leave the voicemail", note: "Opener, then discovery if they pick up" },
    { day: 1, kind: "Email", what: "Send the follow-up email", note: "Same day, after the voicemail" },
    { day: 3, kind: "LinkedIn", what: "Connection request", note: "Short note, no pitch" },
    { day: 5, kind: "Call", what: "Second call", note: "Lead with discovery question 1" },
    { day: 8, kind: "Email", what: "One idea email", note: "Reply on the first thread with one relevant idea" },
    { day: 10, kind: "Call", what: "Last call and close the loop", note: "Ask if you should check back next quarter" }
  ];

  // ---------- utilities ----------
  function $(id) { return document.getElementById(id); }
  function parseDate(s) {
    var p = String(s).split("-").map(Number);
    return new Date(p[0], (p[1] || 1) - 1, p[2] || 15);
  }
  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var WDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function fmtDate(s) {
    var p = String(s).split("-");
    if (p.length < 3) return MONTHS[Number(p[1]) - 1] + " " + p[0];
    return MONTHS[Number(p[1]) - 1] + " " + Number(p[2]) + ", " + p[0];
  }
  function fmtShort(d) { return WDAYS[d.getDay()] + " " + MONTHS[d.getMonth()] + " " + d.getDate(); }
  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // ⟦text⟧ marks a placeholder the caller fills in before using the script
  function withPh(s) { return esc(s).replace(/⟦([^⟧]+)⟧/g, '<span class="ph">[$1]</span>'); }
  function plain(s) { return String(s).replace(/⟦([^⟧]+)⟧/g, "[$1]"); }
  function store(key, val) {
    try {
      if (val === undefined) { var v = localStorage.getItem(key); return v == null ? null : JSON.parse(v); }
      if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
    return null;
  }
  function copyText(text, toastId, msg) {
    var t = $(toastId);
    function done(ok) { t.textContent = ok ? msg : "Copy blocked here. Select the text and copy it by hand."; setTimeout(function () { t.textContent = ""; }, 2600); }
    try {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } catch (e) { done(false); }
  }
  function csvCell(v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }

  // ---------- scoring ----------
  function employeesMid(e) {
    if (e == null) return null;
    var nums = String(e).replace(/,/g, "").match(/\d+/g);
    if (!nums) return null;
    if (nums.length >= 2) return (Number(nums[0]) + Number(nums[1])) / 2;
    return Number(nums[0]);
  }
  function sizeFit(e) {
    var n = employeesMid(e);
    if (n == null) return 0.6;
    if (n < 15) return 0.3;
    if (n < 50) return 0.7;
    if (n <= 1000) return 1;
    if (n <= 3000) return 0.8;
    return 0.5;
  }
  function recency(days) {
    if (days <= 21) return 1;
    if (days >= 90) return 0.2;
    return 1 - 0.8 * (days - 21) / 69;
  }
  D.accounts.forEach(function (a) {
    a.days = daysBetween(parseDate(a.trigger_date), ASOF);
    a.f = {
      rec: recency(a.days),
      trig: (TYPES[a.trigger_type] || { strength: 0.6 }).strength,
      size: sizeFit(a.employees),
      conf: a.confidence === "high" ? 1 : 0.75
    };
  });
  var W = { rec: 3, trig: 3, size: 2, conf: 1 };
  var ranked = [];
  function rank() {
    var tot = W.rec + W.trig + W.size + W.conf || 1;
    D.accounts.forEach(function (a) {
      a.score = Math.round(100 * (W.rec * a.f.rec + W.trig * a.f.trig + W.size * a.f.size + W.conf * a.f.conf) / tot);
    });
    ranked = D.accounts.slice().sort(function (x, y) { return y.score - x.score || x.days - y.days || x.name.localeCompare(y.name); });
    ranked.forEach(function (a, i) { a.rank = i + 1; });
  }

  // ---------- views ----------
  var current = "territory";
  function show(view) {
    if (VIEWS.indexOf(view) < 0) view = "territory";
    current = view;
    VIEWS.forEach(function (v) { $("view-" + v).hidden = v !== view; });
    document.querySelectorAll(".tabs a").forEach(function (a) {
      if (a.dataset.view === view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (view === "cadence") renderCadence();
    if (view === "log") renderLog();
  }
  function route() {
    var h = (location.hash || "").slice(1);
    if (h.indexOf("a-") === 0) {
      var acc = D.accounts.find(function (a) { return a.id === h.slice(2); });
      if (acc) { selectAccount(acc.id); show("account"); window.scrollTo(0, 0); return; }
    }
    show(h || "territory");
    window.scrollTo(0, 0);
  }

  // ---------- territory ----------
  function fillFilters() {
    var provs = Array.from(new Set(D.accounts.map(function (a) { return a.province; }))).sort();
    $("f-prov").innerHTML = '<option value="">All provinces</option>' + provs.map(function (p) {
      var n = D.accounts.filter(function (a) { return a.province === p; }).length;
      return '<option value="' + esc(p) + '">' + esc(p) + " (" + n + ")</option>";
    }).join("");
    var types = Array.from(new Set(D.accounts.map(function (a) { return a.trigger_type; })));
    $("f-type").innerHTML = '<option value="">All events</option>' + types.map(function (t) {
      return '<option value="' + esc(t) + '">' + esc((TYPES[t] || { label: t }).label) + "</option>";
    }).join("");
  }
  function filtered() {
    var p = $("f-prov").value, t = $("f-type").value, q = $("f-q").value.trim().toLowerCase();
    return ranked.filter(function (a) {
      if (p && a.province !== p) return false;
      if (t && a.trigger_type !== t) return false;
      if (q && (a.name + " " + a.city + " " + a.sector).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  function renderStats() {
    var hot = D.accounts.filter(function (a) { return a.days <= 21; }).length;
    var provs = new Set(D.accounts.map(function (a) { return a.province; })).size;
    var sectors = new Set(D.accounts.map(function (a) { return a.sector_group || a.sector; })).size;
    $("stats").innerHTML = [
      ["Accounts", D.accounts.length], ["Provinces", provs], ["Events in last 21 days", hot], ["Sectors", sectors]
    ].map(function (s) { return "<div><dt>" + s[0] + "</dt><dd>" + s[1] + "</dd></div>"; }).join("");
  }
  function renderTerritory() {
    var rows = filtered();
    var tb = $("terr").querySelector("tbody");
    tb.innerHTML = rows.map(function (a) {
      var t = TYPES[a.trigger_type] || { label: a.trigger_type };
      return '<tr tabindex="0" data-id="' + esc(a.id) + '">' +
        '<td class="num">' + a.rank + "</td>" +
        '<td><span class="acct-name">' + esc(a.name) + '</span><span class="acct-meta">' + esc(a.city) + ", " + esc(a.province) + " · " + esc(a.sector) + "</span></td>" +
        '<td class="why"><span class="chip t-' + esc(a.trigger_type) + '">' + esc(t.label) + "</span>" + esc(a.trigger_summary) + "</td>" +
        '<td class="num"><span class="days-ago' + (a.days <= 21 ? " hot" : "") + '">' + a.days + " d</span></td>" +
        '<td><div class="score"><div class="score-bar"><i style="width:' + a.score + '%"></i></div><b>' + a.score + "</b></div></td></tr>";
    }).join("");
    $("terr-empty").hidden = rows.length > 0;
  }
  function openAccount(id) { location.hash = "a-" + id; }

  // ---------- call sheet ----------
  var selected = null;
  function hookOf(a) { return a.hook || ("the news from " + fmtDate(a.trigger_date)); }
  function scripts(a) {
    var t = TYPES[a.trigger_type] || TYPES.expansion;
    var hook = hookOf(a);
    var opener = "Hi ⟦first name⟧, it's Abdullah calling from ⟦company⟧. I saw " + hook + ", congratulations. I'll be quick: when " +
      t.when + ", " + t.pain + ". I don't know yet whether that's true at " + a.name +
      ", which is why I'm calling. Is that something you're working through, or am I off base?";
    var vm = "Hi ⟦first name⟧, it's Abdullah from ⟦company⟧. I'm calling about " + (a.hook_short || hook) +
      ". I have one idea on " + t.painShort + ", and I'll send it in a short email. You can reach me at ⟦phone⟧. Again, Abdullah, ⟦phone⟧.";
    var mail = "Subject: " + a.name + ": " + (a.hook_short || "your recent news") + "\n\n" +
      "Hi ⟦first name⟧,\n\n" +
      "I saw " + hook + " (" + a.source_publisher + ", " + fmtDate(a.trigger_date) + "). Congratulations.\n\n" +
      "When " + t.when + ", " + t.pain + ". I don't know whether that's true at " + a.name + ", so I'd rather ask than guess.\n\n" +
      "Would 20 minutes with one of our cloud specialists next week be useful? I can work around your schedule.\n\n" +
      "Best,\nAbdullah\n⟦company⟧ · ⟦phone⟧";
    var ask = "If it's relevant: \"Would it be worth 20 minutes with one of our specialists next week to look at " + t.painShort + "? I can send two times.\"";
    return { t: t, opener: opener, vm: vm, mail: mail, ask: ask };
  }
  function selectAccount(id) {
    var a = D.accounts.find(function (x) { return x.id === id; }) || ranked[0];
    selected = a;
    store("gcd-selected", a.id);
    $("acct-pick").value = a.id;
    var s = scripts(a);
    $("a-rank").textContent = "Rank " + a.rank + " of " + D.accounts.length + " · score " + a.score;
    $("h-account").textContent = a.name;
    $("a-meta").innerHTML = esc(a.city) + ", " + esc(a.province) + " · " + esc(a.sector) + " · " +
      (a.employees && a.employees !== "unknown"
        ? (a.employees_source ? '<a href="' + esc(a.employees_source) + '" target="_blank" rel="noopener">' + esc(a.employees) + " employees</a>" : esc(a.employees) + " employees")
        : "employees unknown") +
      (a.website ? ' · <a href="' + esc(a.website) + '" target="_blank" rel="noopener">website</a>' : "");
    $("a-type").className = "chip t-" + a.trigger_type;
    $("a-type").textContent = s.t.label;
    $("a-date").textContent = fmtDate(a.trigger_date) + " · " + a.days + " days ago";
    $("a-trigger").textContent = a.trigger_summary;
    $("a-src").innerHTML = 'Source: <a href="' + esc(a.source_url) + '" target="_blank" rel="noopener">' + esc(a.source_publisher) + "</a>" +
      (a.second_source_url ? ' · <a href="' + esc(a.second_source_url) + '" target="_blank" rel="noopener">second source</a>' : "");
    $("a-personas").innerHTML = (a.personas || []).map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("");
    $("a-angle").textContent = a.cloud_angle.replace(/^Hypothesis:\s*/, "");
    $("a-opener").innerHTML = withPh(s.opener);
    $("a-disc").innerHTML = s.t.disc.map(function (q) { return "<li>" + esc(q) + "</li>"; }).join("") + "<li><strong>Ask:</strong> " + esc(s.ask) + "</li>";
    $("a-obj-q").textContent = s.t.obj[0];
    $("a-obj-a").textContent = s.t.obj[1];
    $("a-vm").innerHTML = withPh(s.vm);
    $("a-mail").innerHTML = withPh(s.mail);
    loadPq(a.id);
  }
  var PQ = ["pq-who", "pq-setup", "pq-pain", "pq-auth", "pq-time", "pq-budget", "pq-next"];
  function loadPq(id) {
    var v = store("gcd-pq-" + id) || {};
    PQ.forEach(function (k) { $(k).value = v[k] || ""; });
  }
  function savePq() {
    if (!selected) return;
    var v = {}, any = false;
    PQ.forEach(function (k) { v[k] = $(k).value; if (v[k]) any = true; });
    store("gcd-pq-" + selected.id, any ? v : null);
  }
  function handoff() {
    var a = selected, g = function (k, fb) { return $(k).value.trim() || fb; };
    return [
      "Account: " + a.name + " (" + a.city + ", " + a.province + "), " + a.sector,
      "Why now: " + a.trigger_summary + " (" + fmtDate(a.trigger_date) + "). Source: " + a.source_url,
      "Spoke with: " + g("pq-who", "not recorded"),
      "Current setup: " + g("pq-setup", "unknown"),
      "Pain in their words: " + g("pq-pain", "not recorded"),
      "Who else decides: " + g("pq-auth", "unknown"),
      "Timing: " + g("pq-time", "not discussed"),
      "Budget signal: " + g("pq-budget", "not discussed"),
      "Next step: " + g("pq-next", "none agreed"),
      "Logged " + iso(new Date()) + " by Abdullah"
    ].join("\n");
  }

  // ---------- cadence ----------
  function isWorkday(d) { return d.getDay() !== 0 && d.getDay() !== 6 && !HOLIDAYS[iso(d)]; }
  function addWorkdays(d, n) {
    var x = new Date(d);
    while (!isWorkday(x)) x.setDate(x.getDate() + 1);
    while (n > 0) { x.setDate(x.getDate() + 1); if (isWorkday(x)) n--; }
    return x;
  }
  function cadencePlan() {
    var start = parseDate($("c-start").value || iso(new Date()));
    var nSel = $("c-n").value, stagger = Number($("c-stagger").value);
    var list = nSel === "all" ? ranked : ranked.slice(0, Number(nSel));
    var items = [];
    list.forEach(function (a, i) {
      var offset = stagger ? Math.floor(i / stagger) : 0;
      CADENCE.forEach(function (c, k) {
        var d = addWorkdays(start, offset + c.day - 1);
        items.push({ date: d, key: iso(d), a: a, step: k + 1, c: c });
      });
    });
    items.sort(function (x, y) { return x.date - y.date || x.step - y.step || x.a.rank - y.a.rank; });
    return items;
  }
  function skippedHolidays(items) {
    if (!items.length) return [];
    var first = items[0].date, last = items[items.length - 1].date, out = [];
    Object.keys(HOLIDAYS).forEach(function (k) { var d = parseDate(k); if (d >= first && d <= last) out.push(fmtShort(d) + " (" + HOLIDAYS[k] + ")"); });
    return out;
  }
  function renderCadence() {
    $("c-steps").innerHTML = CADENCE.map(function (c) {
      return "<li><b>" + esc(c.what) + "</b><span>Business day " + c.day + " · " + esc(c.note) + "</span></li>";
    }).join("");
    var items = cadencePlan(), byDay = {};
    items.forEach(function (it) { (byDay[it.key] = byDay[it.key] || []).push(it); });
    var hol = skippedHolidays(items);
    $("c-days").innerHTML = Object.keys(byDay).map(function (k) {
      var list = byDay[k], d = list[0].date;
      var calls = list.filter(function (x) { return x.c.kind === "Call"; }).length;
      return '<div class="day"><div class="day-date"><b>' + fmtShort(d) + "</b><span>" + list.length + " touches · " + calls + " calls</span></div><ul>" +
        list.map(function (it) {
          return '<li><span class="mono">T' + it.step + " " + esc(it.c.kind) + '</span><a href="#a-' + esc(it.a.id) + '">' + esc(it.a.name) + "</a><span>" + esc(it.c.what) + "</span></li>";
        }).join("") + "</ul></div>";
    }).join("") + (hol.length ? '<p class="hint">Skipped for holidays: ' + esc(hol.join(", ")) + "</p>" : "");
  }
  function cadenceCsv() {
    var rows = [["date", "touch", "channel", "account", "province", "action", "trigger", "source"]];
    cadencePlan().forEach(function (it) {
      rows.push([it.key, "T" + it.step, it.c.kind, it.a.name, it.a.province, it.c.what, it.a.trigger_summary, it.a.source_url]);
    });
    return rows.map(function (r) { return r.map(csvCell).join(","); }).join("\n");
  }

  // ---------- dial log ----------
  function mondayOf(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); var k = (x.getDay() + 6) % 7; x.setDate(x.getDate() - k); return x; }
  function sampleLog() {
    // Made-up numbers, shown only until the first real block is logged.
    var mon = mondayOf(new Date()), out = [], v = [[52, 7, 4, 1], [60, 9, 5, 1], [48, 6, 3, 0], [57, 8, 5, 2], [55, 7, 4, 1]];
    v.forEach(function (r, i) { var d = new Date(mon); d.setDate(d.getDate() + i); out.push({ id: "s" + i, date: iso(d), dials: r[0], conn: r[1], conv: r[2], meet: r[3] }); });
    return out;
  }
  function getLog() { var l = store("gcd-log-v1"); return Array.isArray(l) ? l : []; }
  function getTarget() { var t = store("gcd-target"); return t && t > 0 ? t : 5; }
  function pct(a, b) { return b ? Math.round(1000 * a / b) / 10 + "%" : "–"; }
  function renderLog() {
    var mine = getLog(), sample = mine.length === 0, log = sample ? sampleLog() : mine;
    $("sample-banner").hidden = !sample;
    $("clear-log").hidden = sample;
    $("l-target").value = getTarget();
    log = log.slice().sort(function (x, y) { return x.date < y.date ? 1 : x.date > y.date ? -1 : 0; });
    var sum = log.reduce(function (s, r) { s.dials += r.dials; s.conn += r.conn; s.conv += r.conv; s.meet += r.meet; return s; }, { dials: 0, conn: 0, conv: 0, meet: 0 });
    $("log-stats").innerHTML = [
      ["Dials", sum.dials], ["Connect rate", pct(sum.conn, sum.dials)], ["Meetings", sum.meet],
      ["Meetings per 100 dials", sum.dials ? (Math.round(1000 * sum.meet / sum.dials) / 10).toFixed(1) : "–"]
    ].map(function (s) { return "<div><dt>" + s[0] + "</dt><dd>" + s[1] + "</dd></div>"; }).join("");
    $("funnel").innerHTML = funnelSvg(sum);
    var latest = log.length ? parseDate(log[0].date) : new Date();
    var mon = mondayOf(latest);
    $("week-label").textContent = "week of " + fmtShort(mon);
    $("pace").innerHTML = paceSvg(log, mon, getTarget());
    $("logt").querySelector("tbody").innerHTML = log.map(function (r) {
      return "<tr><td>" + esc(r.date) + '</td><td class="num">' + r.dials + '</td><td class="num">' + r.conn + '</td><td class="num">' + r.conv +
        '</td><td class="num">' + r.meet + '</td><td class="num">' + pct(r.conn, r.dials) + "</td><td>" +
        (sample ? "" : '<button class="rm" type="button" data-id="' + esc(r.id) + '" aria-label="Remove block from ' + esc(r.date) + '">×</button>') + "</td></tr>";
    }).join("");
  }
  function funnelSvg(s) {
    var rows = [["Dials", s.dials], ["Connects", s.conn], ["Conversations", s.conv], ["Meetings", s.meet]];
    var W0 = 640, L = 116, R = 176, bw = W0 - L - R, h = 30, gap = 12, max = Math.max(1, s.dials);
    var H = rows.length * (h + gap) - gap + 4;
    var out = '<svg viewBox="0 0 ' + W0 + " " + H + '" role="img" aria-label="Funnel from dials to meetings">';
    rows.forEach(function (r, i) {
      var y = i * (h + gap), w = Math.max(2, bw * r[1] / max);
      var conv = i === 0 ? "" : pct(r[1], rows[i - 1][1]) + " of " + rows[i - 1][0].toLowerCase();
      out += '<text class="lab" x="0" y="' + (y + h / 2 + 4) + '">' + r[0] + "</text>";
      out += '<rect x="' + L + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="4" fill="var(--sunk)"></rect>';
      out += '<rect x="' + L + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="var(--accent)" opacity="' + (1 - i * 0.18) + '"></rect>';
      out += '<text class="val" x="' + (L + bw + 8) + '" y="' + (y + h / 2 - 2) + '">' + r[1] + "</text>";
      if (conv) out += '<text x="' + (L + bw + 8) + '" y="' + (y + h / 2 + 12) + '">' + conv + "</text>";
    });
    return out + "</svg>";
  }
  function paceSvg(log, mon, target) {
    var days = [];
    for (var i = 0; i < 5; i++) { var d = new Date(mon); d.setDate(d.getDate() + i); days.push(d); }
    var per = days.map(function (d) { return log.filter(function (r) { return r.date === iso(d); }).reduce(function (s, r) { return s + r.meet; }, 0); });
    var cum = [], c = 0; per.forEach(function (p) { c += p; cum.push(c); });
    var W0 = 640, H = 220, L = 34, R = 16, T = 14, B = 34, pw = W0 - L - R, ph = H - T - B;
    var max = Math.max(target, c, 1), step = max > 10 ? Math.ceil(max / 5) : 1;
    max = Math.ceil(max / step) * step;
    var x = function (i) { return L + pw * (i + 0.5) / 5; }, y = function (v) { return T + ph - ph * v / max; };
    var out = '<svg viewBox="0 0 ' + W0 + " " + H + '" role="img" aria-label="Meetings booked this week, cumulative, against the weekly target">';
    for (var g = 0; g <= max; g += step) {
      out += '<line x1="' + L + '" x2="' + (W0 - R) + '" y1="' + y(g) + '" y2="' + y(g) + '" stroke="var(--line)" stroke-width="1"></line>';
      out += '<text x="' + (L - 8) + '" y="' + (y(g) + 4) + '" text-anchor="end">' + g + "</text>";
    }
    var bw = pw / 5 * 0.42;
    per.forEach(function (p, i) {
      out += '<rect x="' + (x(i) - bw / 2) + '" y="' + y(p) + '" width="' + bw + '" height="' + (y(0) - y(p)) + '" rx="3" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1"></rect>';
      out += '<text x="' + x(i) + '" y="' + (H - 12) + '" text-anchor="middle">' + WDAYS[days[i].getDay()] + "</text>";
    });
    out += '<line x1="' + x(0) + '" y1="' + y(target / 5) + '" x2="' + x(4) + '" y2="' + y(target) + '" stroke="var(--hot)" stroke-width="2" stroke-dasharray="5 4"></line>';
    out += '<text x="' + (x(4) - 6) + '" y="' + (y(target) - 8) + '" text-anchor="end" fill="var(--hot)">target ' + target + "</text>";
    var pts = cum.map(function (v, i) { return x(i) + "," + y(v); }).join(" ");
    out += '<polyline points="' + pts + '" fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"></polyline>';
    out += '<circle cx="' + x(4) + '" cy="' + y(c) + '" r="5" fill="var(--ink)"></circle>';
    out += '<text class="val" x="' + (x(4) + 10) + '" y="' + (y(c) + 4) + '">' + c + "</text>";
    return out + "</svg>";
  }

  // ---------- wiring ----------
  function init() {
    $("asof").textContent = "events " + fmtDate(D.window_from) + " to " + fmtDate(D.window_to);
    $("m-from").textContent = fmtDate(D.window_from);
    $("m-to").textContent = fmtDate(D.window_to);
    $("m-sources").textContent = D.accounts.length + " accounts across " + new Set(D.accounts.map(function (a) { return a.province; })).size +
      " provinces, researched from public sources and checked " + fmtDate(D.asof) + ". " + D.source_note;

    var saved = store("gcd-weights");
    if (saved) Object.keys(W).forEach(function (k) { if (typeof saved[k] === "number") W[k] = saved[k]; });
    ["rec", "trig", "size", "conf"].forEach(function (k) {
      var el = $("w-" + k); el.value = W[k]; $("o-" + k).textContent = W[k];
      el.addEventListener("input", function () {
        W[k] = Number(el.value); $("o-" + k).textContent = W[k]; store("gcd-weights", W);
        rank(); renderTerritory(); fillPick();
      });
    });
    rank();
    fillFilters();
    renderStats();
    renderTerritory();
    ["f-prov", "f-type"].forEach(function (id) { $(id).addEventListener("change", renderTerritory); });
    $("f-q").addEventListener("input", renderTerritory);
    var tb = $("terr").querySelector("tbody");
    tb.addEventListener("click", function (e) { var tr = e.target.closest("tr"); if (tr) openAccount(tr.dataset.id); });
    tb.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { var tr = e.target.closest("tr"); if (tr) { e.preventDefault(); openAccount(tr.dataset.id); } } });
    $("copy-csv").addEventListener("click", function () {
      var rows = [["rank", "score", "account", "city", "province", "sector", "employees", "event_type", "event_date", "event", "source", "call_titles"]];
      filtered().forEach(function (a) {
        rows.push([a.rank, a.score, a.name, a.city, a.province, a.sector, a.employees, (TYPES[a.trigger_type] || {}).label, a.trigger_date, a.trigger_summary, a.source_url, (a.personas || []).join("; ")]);
      });
      copyText(rows.map(function (r) { return r.map(csvCell).join(","); }).join("\n"), "toast-csv", "Copied " + (rows.length - 1) + " accounts");
    });

    fillPick();
    $("acct-pick").addEventListener("change", function () { openAccount($("acct-pick").value); });
    $("prev-acct").addEventListener("click", function () { var i = ranked.indexOf(selected); openAccount(ranked[(i - 1 + ranked.length) % ranked.length].id); });
    $("next-acct").addEventListener("click", function () { var i = ranked.indexOf(selected); openAccount(ranked[(i + 1) % ranked.length].id); });
    PQ.forEach(function (k) { $(k).addEventListener("input", savePq); $(k).addEventListener("change", savePq); });
    $("copy-handoff").addEventListener("click", function () { copyText(handoff(), "toast-pq", "Handoff note copied"); });
    $("clear-pq").addEventListener("click", function () { PQ.forEach(function (k) { $(k).value = ""; }); savePq(); });
    $("prequal").addEventListener("submit", function (e) { e.preventDefault(); });
    selectAccount(store("gcd-selected") || ranked[0].id);

    var nb = addWorkdays(new Date(), 1);
    $("c-start").value = iso(nb);
    ["c-start", "c-n", "c-stagger"].forEach(function (id) { $(id).addEventListener("change", renderCadence); });
    $("copy-cad").addEventListener("click", function () { copyText(cadenceCsv(), "toast-cad", "Cadence copied"); });

    $("l-date").value = iso(new Date());
    $("log-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var r = { id: "b" + Date.now(), date: $("l-date").value, dials: Number($("l-dials").value), conn: Number($("l-conn").value), conv: Number($("l-conv").value), meet: Number($("l-meet").value) };
      var err = !r.date ? "Pick a date." :
        [r.dials, r.conn, r.conv, r.meet].some(function (n) { return !Number.isInteger(n) || n < 0; }) ? "Enter whole numbers, zero or more." :
        r.conn > r.dials ? "Connects can't be more than dials." :
        r.conv > r.conn ? "Conversations can't be more than connects." :
        r.meet > r.conv ? "Meetings can't be more than conversations." : "";
      $("l-error").hidden = !err; $("l-error").textContent = err;
      if (err) return;
      var log = getLog(); log.push(r); store("gcd-log-v1", log);
      ["l-dials", "l-conn", "l-conv", "l-meet"].forEach(function (k) { $(k).value = ""; });
      renderLog();
    });
    $("l-target").addEventListener("change", function () { var t = Number($("l-target").value); if (t > 0) { store("gcd-target", Math.round(t)); renderLog(); } });
    $("logt").addEventListener("click", function (e) {
      var b = e.target.closest(".rm"); if (!b) return;
      store("gcd-log-v1", getLog().filter(function (r) { return r.id !== b.dataset.id; })); renderLog();
    });
    $("clear-log").addEventListener("click", function () { $("confirm-clear").hidden = false; });
    $("confirm-no").addEventListener("click", function () { $("confirm-clear").hidden = true; });
    $("confirm-yes").addEventListener("click", function () { store("gcd-log-v1", null); $("confirm-clear").hidden = true; renderLog(); });

    window.addEventListener("hashchange", route);
    route();
  }
  function fillPick() {
    $("acct-pick").innerHTML = ranked.map(function (a) { return '<option value="' + esc(a.id) + '">' + a.rank + ". " + esc(a.name) + " (" + esc(a.province) + ")</option>"; }).join("");
    if (selected) { $("acct-pick").value = selected.id; $("a-rank").textContent = "Rank " + selected.rank + " of " + D.accounts.length + " · score " + selected.score; }
  }

  init();
})();
