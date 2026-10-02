/* app.js (builder A): router, window.App helpers, Abstract view (visual abstract), Contract explorer and drawer,
   Decisions board, Sources. Every contract fact comes from window.MEMBRANE (spec.js). */
(function () {
  "use strict";
  const M = window.MEMBRANE;
  const G = window.Glyphs;
  const S = window.Store;
  const RM = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  let REDUCED = !!(RM && RM.matches);
  const rmListeners = new Set();
  if (RM) {
    const onRM = () => { REDUCED = RM.matches; rmListeners.forEach((fn) => { try { fn(REDUCED); } catch (e) { console.error(e); } }); };
    if (RM.addEventListener) RM.addEventListener("change", onRM); else if (RM.addListener) RM.addListener(onRM);
  }

  /* ================= small DOM helpers ================= */
  function h(tag, props, ...kids) {
    const n = document.createElement(tag);
    if (props) for (const k in props) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v; // static markup only (icons)
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else if (k === "style" && typeof v === "object") Object.assign(n.style, v);
      else n.setAttribute(k, v === true ? "" : v);
    }
    add(n, kids);
    return n;
  }
  function add(n, kids) {
    for (const c of [kids].flat(Infinity)) {
      if (c == null || c === false) continue;
      n.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    }
    return n;
  }
  const clear = (n) => { while (n.firstChild) n.removeChild(n.firstChild); return n; };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const easeIO = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const easeOut = (p) => 1 - Math.pow(1 - p, 3);
  const fmtTime = (at) => { try { return new Date(at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return String(at); } };
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + "s"}`;

  const ICONS = {
    lock: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
    comment: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    play: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7.5-4.5z" fill="currentColor"/></svg>',
    pause: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><rect x="4" y="3.5" width="2.8" height="9" rx=".6" fill="currentColor"/><rect x="9.2" y="3.5" width="2.8" height="9" rx=".6" fill="currentColor"/></svg>',
    close: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    arrow: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  const icon = (name) => h("span", { class: "icw", html: ICONS[name] });

  /* ================= index ================= */
  const INDEX = new Map(); // id -> { item, type, group }
  M.groups.forEach((g) => g.items.forEach((it) => INDEX.set(it.id, { item: it, type: "item", group: g })));
  M.laws.forEach((it) => INDEX.set(it.id, { item: it, type: "law" }));
  M.decisions.forEach((it) => INDEX.set(it.id, { item: it, type: "decision" }));
  M.challenges.forEach((it) => INDEX.set(it.id, { item: it, type: "challenge" }));
  M.scenarios.forEach((it) => INDEX.set(it.id, { item: it, type: "scenario" }));
  const GROUPS = new Map(M.groups.map((g) => [g.id, g]));
  const ALL_ITEMS = M.groups.flatMap((g) => g.items);
  const TOTAL = ALL_ITEMS.length;
  const itemById = (id) => (INDEX.get(id) || {}).item || null;
  const agent = (id) => M.agents.find((a) => a.id === id);

  const KIND_LABEL = { field: "Envelope field", act: "Act", form: "Form", state: "Task state", disposition: "Disposition", reason: "Reason code", tier: "Effect tier", evidence: "Evidence kind", channel: "Channel", rung: "Ladder rung", level: "Standing level", rule: "Rule", invariant: "Invariant", lineage: "Lineage", extension: "Extension", law: "Design law", decision: "Open decision" };
  const FIELDLIKE = (it) => it.kind === "field" || it.kind === "extension";

  /* ================= live collections from Store ================= */
  const live = { locks: new Map(), threads: new Map(), stances: new Map() };
  const liveListeners = new Set();
  let liveQueued = false;
  function liveChanged() {
    if (liveQueued) return; liveQueued = true;
    requestAnimationFrame(() => { liveQueued = false; liveListeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } }); });
  }
  function watchCollection(name, key) {
    S.subscribeAll(name, (docs) => {
      const m = new Map();
      (docs || []).forEach((d) => { if (d && d[key]) m.set(d[key], d); });
      live[name] = m; liveChanged();
    });
  }
  const isLocked = (id) => { const d = live.locks.get(id); return !!(d && d.locked); };
  function hashText(txt) {
    txt = String(txt);
    try { if (window.Gate && typeof window.Gate.simHash === "function") return String(window.Gate.simHash(txt)); } catch (e) {}
    let a = 0x811c9dc5, b = 0x9e3779b9;
    for (let i = 0; i < txt.length; i++) { const c = txt.charCodeAt(i); a ^= c; a = Math.imul(a, 16777619) >>> 0; b ^= c + i; b = Math.imul(b ^ (b >>> 15), 0x2c1b3c6d) >>> 0; }
    return a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0");
  }
  const itemHash = (it) => hashText(JSON.stringify(it));
  /* accepted proposals are part of the item's content: [field, to] pairs, sorted */
  function acceptedPairs(entries) {
    const st = proposalStatuses(entries || []);
    return (entries || []).filter((e) => e.kind === "proposal" && proposalState(e, st) === "accepted")
      .map((e) => [e.field || "", e.to || ""]).sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1));
  }
  function effectiveHash(it, entries) {
    const pairs = acceptedPairs(entries !== undefined ? entries : (live.threads.get(it.id) || {}).entries);
    return hashText(JSON.stringify(it) + (pairs.length ? JSON.stringify(pairs) : ""));
  }
  const lockStale = (id) => { const d = live.locks.get(id); if (!d || !d.locked || !d.hash) return false; const it = itemById(id); return !!it && d.hash !== effectiveHash(it); };
  const propId = (e) => e.id || String(e.at) + "|" + (e.author || "");
  function proposalStatuses(entries) {
    const m = new Map();
    (entries || []).forEach((e) => { if (e.kind === "status" && e.target) m.set(e.target, e); });
    return m;
  }
  function proposalState(p, statuses) { const s = statuses.get(propId(p)); return s ? s.status : (p.status && p.status !== "open" ? p.status : "open"); }
  const threadCount = (id) => ((live.threads.get(id) || {}).entries || []).filter((e) => e.kind !== "status").length;
  function stanceTally(id) {
    const latest = new Map();
    ((live.stances.get(id) || {}).entries || []).forEach((e) => latest.set(e.author || "anon", e.stance));
    const t = { agree: 0, disagree: 0, "needs-data": 0 };
    latest.forEach((s) => { if (s in t) t[s]++; });
    return t;
  }

  /* ================= App helpers ================= */
  const SPEC_URL = { A2A: "https://a2a-protocol.org/latest/specification/", MCP: "https://modelcontextprotocol.io/specification/2026-07-28" };
  function sourceUrl(file) { return (location.port === "8126" ? "../" : "") + file; }

  function refChip(code) {
    code = String(code || "").trim();
    let m;
    const link = (href, label, title) => h("a", { class: "chip ref", href, target: "_blank", rel: "noopener", title: title || null }, label);
    if ((m = code.match(/^P§([^·\s]+)(.*)$/))) {
      const key = m[1];
      const anchor = M.paperAnchors[key];
      return link(M.paper + (anchor ? "#" + anchor : ""), "§" + key + m[2], "Paper, " + (/^[A-D]$/.test(key) ? "appendix " + key : "section " + key) + (m[2] ? " " + m[2].replace(/^·/, "") : ""));
    }
    if ((m = code.match(/^(Rev\d+)(?:·.*)?$/)) || (m = code.match(/^(R\d+)(?:·.*)?$/))) {
      const src = M.sources[m[1]];
      if (src && src.file) return link(sourceUrl(src.file), code, src.title);
    }
    if ((m = code.match(/^(S\d+)(?:·.*)?$/))) return h("span", { class: "chip", title: "house record, private" }, code);
    if ((m = code.match(/^RFC\s*(\d+)$/))) return link("https://www.rfc-editor.org/rfc/rfc" + m[1], code, "IETF " + code);
    if (/^A2A:/.test(code)) return link(SPEC_URL.A2A, code, "A2A v1.0 specification");
    if (/^MCP:/.test(code)) return link(SPEC_URL.MCP, code, "MCP specification 2026-07-28");
    return h("span", { class: "chip" }, code);
  }
  const refRow = (codes) => h("div", { class: "refs" }, (codes || []).map(refChip));

  function statusPill(status) { return h("span", { class: "pill " + status, title: M.statuses[status] || null }, status); }

  let toastTimer = null;
  function toast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }
  function route(hash) {
    if (!hash.startsWith("#")) hash = "#" + hash;
    if (location.hash === hash) onRoute(); else location.hash = hash;
  }
  function openItem(id) {
    const e = INDEX.get(id);
    if (!e) { toast("Unknown item " + id); return; }
    if (e.type === "scenario") return route("#/playground/" + id);
    if (e.type === "challenge") return route("#/gatekeeper/" + id);
    if (e.type === "decision") return openDecisionDrawer(e.item);
    if (e.type === "law") return openLawDrawer(e.item);
    openItemDrawer(e.item);
  }

  window.App = { refChip, sourceUrl, route, toast, openItem, itemById, statusPill };

  /* ================= drawer ================= */
  const drawer = document.getElementById("drawer");
  let drawerCleanup = [];
  let drawerReturn = null;
  let drawerReturnKey = null; // data-open-id of the opener, to refind it if the grid re-rendered
  let drawerKey = null; // "item:<id>" etc.
  drawer.setAttribute("tabindex", "-1");
  drawer.setAttribute("role", "dialog");
  drawer.setAttribute("aria-modal", "true");

  let lastInteract = null;
  const noteInteract = (e) => {
    const t = e.target && e.target.closest ? e.target.closest('button,a[href],[tabindex],g.env,input,select,textarea,summary') : null;
    if (t && !drawer.contains(t)) lastInteract = t;
  };
  document.addEventListener("pointerdown", noteInteract, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") noteInteract(e); }, true);
  function setBackgroundInert(on) {
    document.querySelectorAll("header.bar, main, footer.foot").forEach((n) => { if (on) n.setAttribute("inert", ""); else n.removeAttribute("inert"); });
  }
  function focusable(n) { return n && document.contains(n) && typeof n.focus === "function" && !drawer.contains(n); }
  function openDrawer(key, build) {
    drawerCleanup.forEach((fn) => { try { fn(); } catch (e) {} });
    drawerCleanup = [];
    if (!drawer.classList.contains("open")) {
      const a = document.activeElement;
      drawerReturn = a && a !== document.body && !drawer.contains(a) ? a : lastInteract;
      drawerReturnKey = drawerReturn && drawerReturn.dataset ? drawerReturn.dataset.openId || null : null;
    }
    drawerKey = key;
    clear(drawer);
    const closeBtn = h("button", { class: "xbtn", type: "button", "aria-label": "Close detail", onclick: () => closeDrawer() }, icon("close"));
    const head = h("div", { class: "drawer-head" });
    const body = h("div", { class: "drawer-body" });
    build(head, body, (fn) => drawerCleanup.push(fn));
    head.appendChild(closeBtn);
    add(drawer, [head, body]);
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    drawer.removeAttribute("inert");
    setBackgroundInert(true);
    body.scrollTop = 0;
    setTimeout(() => closeBtn.focus({ preventScroll: true }), 30);
  }
  function closeDrawer(restoreFocus = true) {
    if (!drawer.classList.contains("open")) return;
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    drawer.setAttribute("inert", "");
    setBackgroundInert(false);
    drawerCleanup.forEach((fn) => { try { fn(); } catch (e) {} });
    drawerCleanup = []; drawerKey = null;
    const r = parseHash();
    if (r.param && (r.view === "contract" && INDEX.get(r.param) || r.view === "decisions")) {
      history.replaceState(null, "", "#/" + r.view);
    }
    if (restoreFocus) {
      let target = drawerReturn;
      if (!(target && document.contains(target)) && drawerReturnKey) target = document.querySelector('[data-open-id="' + CSS.escape(drawerReturnKey) + '"]');
      if (target && target.closest && target.closest("g.env")) target = document.querySelector(".stage .stage-cap button.d") || document.querySelector(".stage .dots button[aria-current]");
      if (focusable(target)) {
        const ae = () => document.activeElement;
        target.focus({ preventScroll: true });
        // the drawer's visibility transition can swallow a synchronous focus; retry once it has settled
        setTimeout(() => { if (ae() === document.body && focusable(target)) target.focus({ preventScroll: true }); }, 40);
      }
    }
    drawerReturn = null; drawerReturnKey = null;
  }
  drawer.setAttribute("inert", "");
  document.addEventListener("keydown", (e) => {
    if (!drawer.classList.contains("open")) return;
    if (e.key === "Escape") { e.preventDefault(); closeDrawer(); return; }
    if (e.key !== "Tab") return;
    const f = [...drawer.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,summary,[tabindex]:not([tabindex="-1"])')].filter((n) => (n.checkVisibility ? n.checkVisibility() : n.getClientRects().length > 0) && !n.closest("details:not([open]) > :not(summary)"));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (!drawer.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  function drawerHead(head, kind, name, { title = false, pills = [] } = {}) {
    add(head, h("div", { class: "dh-main" },
      h("div", { class: "dh-kind" }, kind),
      h("h2", { class: "dh-name" + (title ? " title" : ""), id: "drawer-title" }, name),
      pills.length ? h("div", { class: "row" }, pills) : null));
    drawer.setAttribute("aria-labelledby", "drawer-title");
  }
  const dsec = (label, ...kids) => h("section", { class: "dsec" }, label ? h("h4", {}, label) : null, kids);

  /* author: asked once, inline */
  function authorLine() {
    const wrap = h("div", { class: "author" });
    const render = () => {
      clear(wrap);
      const name = S.author();
      if (name) {
        add(wrap, ["Writing as ", h("b", {}, name), " · ", h("button", { class: "linkish", type: "button", onclick: () => { S.setAuthor(""); render(); wrap.querySelector("input")?.focus(); } }, "change")]);
      } else {
        const inp = h("input", { type: "text", placeholder: "Your name, shown on comments", "aria-label": "Your name, shown on comments", maxlength: "60" });
        const save = h("button", { class: "btn", type: "button", onclick: () => { const v = inp.value.trim(); if (!v) { inp.focus(); return; } S.setAuthor(v); render(); } }, "Save name");
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); save.click(); } });
        add(wrap, [inp, save]);
      }
    };
    render();
    wrap.need = () => {
      const name = S.author();
      if (name) return name;
      const inp = wrap.querySelector("input");
      const typed = inp && inp.value.trim();
      if (typed) { S.setAuthor(typed); render(); return typed; }
      toast("Add your name first"); inp && inp.focus();
      return null;
    };
    return wrap;
  }

  function renderEntry(e, statuses, onAct) {
    if (e.kind === "status") {
      return h("li", { class: "entry status-line" }, h("div", { class: "who" }, h("span", {}, h("b", {}, e.author || "anonymous"), " marked a proposal ", h("span", { class: "tag st-" + e.status }, e.status)), h("time", {}, fmtTime(e.at))));
    }
    const who = h("div", { class: "who" }, h("span", {}, h("b", {}, e.author || "anonymous"), e.kind === "proposal" ? " proposes a change" : ""), h("time", {}, fmtTime(e.at)));
    if (e.kind === "proposal") {
      const st = proposalState(e, statuses || new Map());
      return h("li", { class: "entry proposal st-" + st }, who,
        h("div", { class: "row", style: { gap: "6px" } }, h("span", { class: "tag" }, e.field || "change"), h("span", { class: "tag st-" + st, tabindex: "-1", "data-fk-tag": propId(e) }, st)),
        e.to ? h("div", { class: "to" }, e.to) : null,
        e.text ? h("p", {}, e.text) : null,
        st === "open" && onAct ? h("div", { class: "row", style: { justifyContent: "flex-end", gap: "6px" } },
          h("button", { class: "btn", type: "button", "data-fk": propId(e) + ":accepted", onclick: () => onAct(e, "accepted") }, "Accept"),
          h("button", { class: "btn ghost", type: "button", "data-fk": propId(e) + ":closed", onclick: () => onAct(e, "closed") }, "Close")) : null);
    }
    return h("li", { class: "entry" }, who, h("p", {}, e.text || ""));
  }

  /* comments + proposals block for any id */
  function discussion(id, onCleanup, { proposals = true, author } = {}) {
    const box = h("div", { class: "form" });
    const list = h("ul", { class: "thread", "aria-live": "polite" });
    const countEl = h("span", { class: "muted" });
    onCleanup(S.subscribe("threads/" + id, (doc) => {
      /* keep keyboard focus inside the thread when the list is rebuilt */
      const ae = document.activeElement;
      const hadFocus = !!ae && list.contains(ae);
      const fk = hadFocus ? ae.getAttribute("data-fk") || ae.getAttribute("data-fk-tag") : null;
      const focusables = () => [...list.querySelectorAll("button, a[href], [data-fk-tag]")];
      const oldIndex = hadFocus ? focusables().indexOf(ae) : -1;
      clear(list);
      const entries = (doc && doc.entries) || [];
      const statuses = proposalStatuses(entries);
      const n = entries.filter((e) => e.kind !== "status").length;
      countEl.textContent = n ? plural(n, "entry", "entries") : "Nothing yet";
      const onAct = async (p, st) => {
        const name = author.need(); if (!name) return;
        const res = await S.appendEntry("threads/" + id, { itemId: id }, { kind: "status", target: propId(p), status: st, author: name, at: new Date().toISOString() });
        if (res && res.ok === false) toast("Not saved (" + (res.code || "error") + ")"); else toast(st === "accepted" ? "Proposal accepted" : "Proposal closed");
      };
      entries.forEach((e) => list.appendChild(renderEntry(e, statuses, proposals ? onAct : null)));
      if (hadFocus) {
        let target = null;
        if (fk) {
          target = [...list.querySelectorAll("[data-fk]")].find((n) => n.getAttribute("data-fk") === fk) || null;
          if (!target) {
            const cut = fk.lastIndexOf(":");
            const pid = /:(accepted|closed)$/.test(fk) ? fk.slice(0, cut) : fk;
            target = [...list.querySelectorAll("[data-fk-tag]")].find((n) => n.getAttribute("data-fk-tag") === pid) || null;
          }
        }
        if (!target) { const f = focusables(); target = f[Math.min(Math.max(oldIndex, 0), f.length - 1)] || box.querySelector("textarea"); }
        if (target) target.focus({ preventScroll: false });
      }
    }));
    const ta = h("textarea", { rows: "3", placeholder: "Comment", "aria-label": "Comment" });
    const post = h("button", { class: "btn primary", type: "button", onclick: async () => {
      const text = ta.value.trim(); if (!text) { ta.focus(); return; }
      const name = author.need(); if (!name) return;
      const res = await S.appendEntry("threads/" + id, { itemId: id }, { kind: "comment", author: name, text, at: new Date().toISOString() });
      if (res && res.ok === false) toast("Comment not saved (" + (res.code || "error") + ")"); else { ta.value = ""; toast("Comment added"); }
    } }, "Comment");
    add(box, [h("div", { class: "row", style: { justifyContent: "space-between" } }, countEl), list, ta, h("div", { class: "row" }, post)]);

    if (proposals) {
      const what = h("select", { "aria-label": "What to change" }, ["definition", "enum value", "default", "required", "remove"].map((v) => h("option", { value: v }, v)));
      const to = h("textarea", { rows: "2", placeholder: "Change it to…", "aria-label": "Proposed value" });
      const why = h("input", { type: "text", placeholder: "One-line rationale", "aria-label": "Rationale", maxlength: "240" });
      const send = h("button", { class: "btn", type: "button", onclick: async () => {
        const name = author.need(); if (!name) return;
        if (!to.value.trim() && what.value !== "remove") { to.focus(); return; }
        const res = await S.appendEntry("threads/" + id, { itemId: id }, { kind: "proposal", id: "p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), author: name, field: what.value, to: to.value.trim(), text: why.value.trim(), status: "open", at: new Date().toISOString() });
        if (res && res.ok === false) toast("Proposal not saved (" + (res.code || "error") + ")");
        else { to.value = ""; why.value = ""; det.open = false; const sm = det.querySelector("summary"); if (sm) sm.focus(); toast("Proposal recorded"); }
      } }, "Record proposal");
      const det = h("details", { class: "propose" }, h("summary", {}, "Propose a change"),
        h("div", { class: "form" }, h("label", {}, "What", what), h("label", {}, "To", to), h("label", {}, "Why", why), h("div", { class: "row" }, send)));
      box.appendChild(det);
    }
    return box;
  }

  function lockBox(id, onCleanup, author) {
    const box = h("div", { class: "lockbox", "aria-live": "polite" });
    const item = itemById(id);
    let lockDoc = null, threadEntries = [], ready = false;
    onCleanup(S.subscribe("threads/" + id, (doc) => { threadEntries = (doc && doc.entries) || []; if (ready && lockDoc && lockDoc.locked) render(lockDoc); }));
    ready = true;
    onCleanup(S.subscribe("locks/" + id, (doc) => { lockDoc = doc; render(doc); }));
    function render(doc) {
      const hadFocus = box.contains(document.activeElement);
      if (hadFocus) setTimeout(() => { const b = box.querySelector("button"); if (b) b.focus({ preventScroll: true }); }, 0);
      clear(box);
      const on = !!(doc && doc.locked);
      const stale = on && !!doc.hash && !!item && doc.hash !== effectiveHash(item, threadEntries);
      box.classList.toggle("on", on);
      box.classList.toggle("stale", stale);
      if (on) {
        add(box, [h("span", { class: "lockstate" }, icon("lock"), h("span", {}, "Locked by ", h("b", {}, doc.by || "someone"), " · ", fmtTime(doc.at), doc.note ? " · " + doc.note : "",
            stale ? h("span", { class: "stale-note" }, "Lock stale: item changed since locking") : doc.hash ? h("span", { class: "hashline" }, "hash " + doc.hash) : null)),
          h("button", { class: "btn", type: "button", onclick: async () => {
            const res = await S.deleteDoc("locks/" + id);
            if (res && res.ok === false) toast("Only editors can lock items"); else toast("Unlocked");
          } }, "Unlock")]);
      } else {
        const note = h("input", { type: "text", placeholder: "Note (optional)", "aria-label": "Lock note", style: { flex: "1 1 160px", width: "auto" }, maxlength: "120" });
        add(box, [h("span", { class: "lockstate muted" }, icon("lock"), "Not locked"), note,
          h("button", { class: "btn primary", type: "button", onclick: async () => {
            const name = author.need(); if (!name) return;
            const res = await S.setDoc("locks/" + id, { itemId: id, locked: true, by: name, at: new Date().toISOString(), note: note.value.trim(), hash: item ? effectiveHash(item, threadEntries) : null });
            if (res && res.ok === false) { toast("Only editors can lock items"); S.deleteDoc("locks/" + id); } else toast("Locked");
          } }, "Lock")]);
      }
    }
    return box;
  }

  function axisValue(v) {
    if (v == null) return "";
    if (Array.isArray(v)) return v.map((x) => (x && typeof x === "object" ? (x.v || x.name || x.value || JSON.stringify(x)) : String(x))).join(" · ");
    if (typeof v === "object") return v.v || v.value || v.name || Object.entries(v).map(([k, x]) => k + ": " + axisValue(x)).join("; ");
    return String(v);
  }
  function renderAxes(ax) {
    if (!ax) return null;
    let rows = [];
    if (Array.isArray(ax)) rows = ax.map((a) => (a && typeof a === "object" ? [a.axis || a.name || a.k || "", a.values || a.enum || a.value || a.v] : ["", a]));
    else if (typeof ax === "object") rows = Object.entries(ax);
    else rows = [["", ax]];
    if (!rows.length) return null;
    return h("dl", { class: "kv" }, rows.map(([k, v]) => [h("dt", {}, String(k)), h("dd", {}, axisValue(v))]));
  }

  /* contract item drawer */
  function openItemDrawer(it) {
    const e = INDEX.get(it.id);
    const g = e && e.group;
    openDrawer("item:" + it.id, (head, body, onCleanup) => {
      const pills = [statusPill(it.status)];
      if (isLocked(it.id)) pills.push(statusPill("locked"));
      if (lockStale(it.id)) pills.push(h("span", { class: "badge stale" }, "lock stale"));
      if (FIELDLIKE(it) && it.required) pills.push(h("span", { class: "badge req" }, it.required));
      drawerHead(head, (KIND_LABEL[it.kind] || it.kind) + (g ? " · " + g.title : ""), it.name, { pills, title: it.kind === "lineage" });

      const author = authorLine();
      const main = dsec(null,
        it.def ? h("p", { class: "def-big" }, it.def) : null,
        it.why ? h("p", { class: "why" }, it.why) : null);
      body.appendChild(main);

      if (it.kind === "lineage") {
        body.appendChild(dsec("Two parents",
          h("dl", { class: "kv" }, h("dt", {}, it.src + " idea"), h("dd", { style: { fontFamily: "var(--sans)", fontSize: "13.5px" } }, it.idea),
            h("dt", {}, "In Membrane"), h("dd", { style: { fontFamily: "var(--sans)", fontSize: "13.5px" } }, it.membrane),
            h("dt", {}, "Relation"), h("dd", {}, h("span", { class: "rel " + it.rel }, it.rel)))));
      }

      const kv = [];
      const kvp = (k, v) => { if (v != null && v !== "") kv.push(h("dt", {}, k), h("dd", {}, String(v))); };
      kvp("required", FIELDLIKE(it) ? it.required : null);
      kvp("type", it.type); kvp("default", it.default); kvp("act", it.act); kvp("release", it.release); kvp("reach", it.reach); kvp("maps to", it.map);
      if (kv.length) body.appendChild(dsec("Shape", h("dl", { class: "kv" }, kv)));
      const axes = renderAxes(it.axes);
      if (axes) body.appendChild(dsec("Axes", axes));

      if (it.enum && it.enum.length) {
        const hasWhy = it.enum.some((x) => x.why);
        body.appendChild(dsec("Values · " + it.enum.length,
          h("div", { class: "scroll" }, h("table", { class: "t" },
            h("thead", {}, h("tr", {}, h("th", {}, "value"), h("th", {}, "meaning"), hasWhy ? h("th", {}, "why") : null)),
            h("tbody", {}, it.enum.map((x) => h("tr", {}, h("td", {}, h("code", {}, x.v)), h("td", {}, x.m), hasWhy ? h("td", { class: "muted" }, x.why || "") : null)))))));
      }

      if (it.a2a && (it.a2a.rel === "none" || (!it.a2a.map && !it.a2a.rel))) {
        body.appendChild(dsec("A2A and MCP", h("div", { class: "rel-line" }, h("span", { class: "rel none" }, "none"), h("span", {}, "No A2A or MCP counterpart" + (it.a2a.map ? ": " + it.a2a.map : ".")))));
      } else if (it.a2a) {
        const map = String(it.a2a.map || "");
        const pm = map.match(/^(A2A|MCP):([^\s;,({]+)/);
        const specKey = /^MCP:/.test(map) ? "MCP" : "A2A";
        const chip = pm ? refChip(pm[1] + ":" + pm[2]) : refChip(specKey + ":specification");
        body.appendChild(dsec("A2A and MCP", h("div", { class: "rel-line" }, h("span", { class: "rel " + it.a2a.rel }, it.a2a.rel), h("span", {}, map)), h("div", { class: "refs" }, chip)));
      } else if (it.kind !== "lineage") {
        body.appendChild(dsec("A2A and MCP", h("p", { class: "why muted" }, "Relation not written yet.")));
      }

      const scen = M.scenarios.filter((s) => (s.shows || []).includes(it.id));
      const chal = M.challenges.filter((c) => (c.defends || []).includes(it.id));
      if (it.try || scen.length || chal.length) {
        const tryScen = it.try && INDEX.get(it.try);
        body.appendChild(dsec("Try it",
          it.try ? h("div", { class: "row" }, h("button", { class: "btn primary", type: "button", onclick: () => { closeDrawer(false); route("#/playground/" + it.try); } }, "Try it in the playground", icon("arrow")),
            tryScen ? h("span", { class: "muted", style: { fontSize: "13px" } }, tryScen.item.title) : null) : null,
          scen.length ? h("div", { class: "chips", style: { justifyContent: "flex-start" } }, scen.filter((s) => s.id !== it.try).map((s) => h("button", { class: "lk", type: "button", onclick: () => { closeDrawer(false); route("#/playground/" + s.id); } }, "▸ " + s.title))) : null,
          chal.length ? h("div", { class: "chips", style: { justifyContent: "flex-start" } }, chal.map((c) => h("button", { class: "lk", type: "button", onclick: () => { closeDrawer(false); route("#/gatekeeper/" + c.id); } }, "Gatekeeper " + c.level + " · " + c.title))) : null));
      }

      body.appendChild(dsec("References", refRow(it.refs)));
      if (g && currentView !== "contract") {
        body.appendChild(dsec(null, h("div", { class: "row" }, h("button", { class: "btn ghost", type: "button", onclick: () => { closeDrawer(false); route("#/contract/" + it.id); } }, "Show in the contract explorer", icon("arrow")))));
      }
      body.appendChild(dsec("Lock", lockBox(it.id, onCleanup, author)));
      body.appendChild(dsec("Comments and proposals", author, discussion(it.id, onCleanup, { proposals: true, author })));
    });
  }

  function openLawDrawer(law) {
    openDrawer("law:" + law.id, (head, body, onCleanup) => {
      drawerHead(head, "Design law · " + law.id, law.name, { title: true });
      const author = authorLine();
      body.appendChild(dsec(null, h("p", { class: "def-big" }, law.consequence)));
      body.appendChild(dsec("Disciplines that reached it", h("div", { class: "row", style: { gap: "6px" } }, law.fields.map((f) => h("span", { class: "tag" }, f)))));
      body.appendChild(dsec("References", refRow(law.refs)));
      body.appendChild(dsec("Comments", author, discussion(law.id, onCleanup, { proposals: false, author })));
    });
  }

  function openDecisionDrawer(d) {
    openDrawer("decision:" + d.id, (head, body, onCleanup) => {
      drawerHead(head, "Open decision · " + d.id, d.title, { title: true });
      const author = authorLine();
      body.appendChild(dsec(null, h("p", { class: "def-big" }, d.q), h("p", { class: "why" }, d.why)));
      const kv = [h("dt", {}, "owner"), h("dd", {}, d.owner), h("dt", {}, "settled here"), h("dd", {}, RESOLVE[resKey(d)].short)];
      if (d.settles) kv.push(h("dt", {}, "settled by"), h("dd", { style: { fontFamily: "var(--sans)" } }, d.settles));
      const simEl = simLink(d, true);
      if (simEl) kv.push(h("dt", {}, "playground"), h("dd", { style: { fontFamily: "var(--sans)" } }, simEl));
      body.appendChild(dsec("Shape", h("dl", { class: "kv" }, kv)));
      body.appendChild(dsec("References", refRow(d.refs)));

      const tallyEl = h("div", { class: "tally", style: { borderTop: "0", paddingTop: "0" } });
      const mine = { stance: null };
      const btns = {};
      const note = h("input", { type: "text", placeholder: "Note (optional)", "aria-label": "Stance note", maxlength: "200" });
      const stanceList = h("ul", { class: "thread", "aria-live": "polite" });
      const setStance = async (stance) => {
        const name = author.need(); if (!name) return;
        const res = await S.appendEntry("stances/" + d.id, { decisionId: d.id }, { author: name, stance, note: note.value.trim(), at: new Date().toISOString() });
        if (res && res.ok === false) toast("Stance not saved (" + (res.code || "error") + ")"); else { note.value = ""; toast("Stance recorded"); }
      };
      [["agree", "Agree"], ["disagree", "Disagree"], ["needs-data", "Needs data"]].forEach(([k, label]) => {
        btns[k] = h("button", { class: "btn", type: "button", "aria-pressed": "false", onclick: () => setStance(k) }, label);
      });
      onCleanup(S.subscribe("stances/" + d.id, (doc) => {
        const entries = (doc && doc.entries) || [];
        const latest = new Map(); entries.forEach((e) => latest.set(e.author || "anonymous", e));
        const t = { agree: 0, disagree: 0, "needs-data": 0 }; latest.forEach((e) => { if (e.stance in t) t[e.stance]++; });
        clear(tallyEl); add(tallyEl, [h("span", {}, h("b", {}, t.agree), " agree"), h("span", {}, h("b", {}, t.disagree), " disagree"), h("span", {}, h("b", {}, t["needs-data"]), " need data")]);
        const me = latest.get(S.author()); mine.stance = me ? me.stance : null;
        Object.keys(btns).forEach((k) => btns[k].setAttribute("aria-pressed", String(mine.stance === k)));
        clear(stanceList);
        [...latest.values()].filter((e) => e.note).forEach((e) => stanceList.appendChild(h("li", { class: "entry" }, h("div", { class: "who" }, h("span", {}, h("b", {}, e.author), " · ", e.stance), h("time", {}, fmtTime(e.at))), h("p", {}, e.note))));
      }));
      body.appendChild(dsec("Your stance", author, tallyEl, h("div", { class: "stance-btns" }, Object.values(btns)), note, stanceList));
      body.appendChild(dsec("Comments", discussion(d.id, onCleanup, { proposals: false, author })));
    });
  }

  /* ================= decision helpers ================= */
  const RESOLVE = {
    partly: { title: "The playground informs it", sub: "Play shows the tradeoff; the named owner still chooses.", short: "partly: the playground informs it", count: "the playground informs" },
    research: { title: "Research not yet done", sub: "A reading or research pass comes first; then the owner chooses.", short: "not yet: research comes first", count: "wait on research" },
    no: { title: "Owners decide", sub: "Values, money, custody or authorship: only the named owner decides.", short: "no: the owners decide", count: "owners decide" }
  };
  const resKey = (d) => (d && RESOLVE[d.resolvable] ? d.resolvable : "no");
  function simOf(d) { if (!d || !d.sim) return null; return typeof d.sim === "string" ? { text: d.sim } : d.sim; }
  function simLink(d, inDrawer) {
    const sim = simOf(d);
    if (!sim) return null;
    const scen = sim.scenario && INDEX.get(sim.scenario);
    const param = sim.param && M.params.find((x) => x.id === sim.param);
    const text = sim.text || (scen ? scen.item.title : "");
    const parts = [];
    if (scen && scen.type === "scenario") {
      parts.push(h("a", { class: "simlink", href: "#/playground/" + sim.scenario, onclick: inDrawer ? () => closeDrawer(false) : null }, text || scen.item.title, " ", icon("arrow")));
    } else if (text) parts.push(h("span", { class: "simtext" }, text));
    if (param) parts.push(h("span", { class: "badge", title: "Playground parameter" }, param.label));
    return parts.length ? h("span", { class: "simline" }, parts) : null;
  }

  /* ================= Abstract view ================= */
  const Abstract = { active: false, setActive() {} };

  function buildAbstract(root) {
    const envelope = GROUPS.get("envelope");
    const required = envelope.items.filter((i) => /^always/.test(i.required || "")).length;
    const effectItem = itemById("env.effect");

    /* ---- hero ---- */
    const stage = buildStage();
    const stats = [
      [required, "required fields"], [GROUPS.get("acts").items.length, "acts"], [GROUPS.get("dispositions").items.length, "dispositions"],
      [GROUPS.get("reasons").items.length, "reason codes"], [M.laws.length, "laws"]
    ];
    const hero = h("div", { class: "hero" },
      h("div", {},
        h("div", { class: "eyebrow" }, "Contract " + M.version + " · visual abstract"),
        h("h1", { tabindex: "-1", "data-focus": "" }, "Membrane"),
        h("p", { class: "thesis" },
          h("span", {}, "The wire is solved."),
          h("span", {}, "Membrane standardizes the boundary: the words for what happens to a message when it crosses between agents with different owners.")),
        h("ul", { class: "stats" }, stats.map(([n, l]) => h("li", {}, h("b", { class: "num" }, n), h("span", {}, l)))),
        h("div", { class: "row" },
          h("button", { class: "btn primary", type: "button", onclick: () => route("#/contract") }, "Explore the contract", icon("arrow")),
          h("button", { class: "btn", type: "button", onclick: () => route("#/playground") }, "Run a scenario"))),
      stage.el);
    root.appendChild(hero);

    /* ---- the waist at a glance ---- */
    const go = (hash) => () => route(hash);
    const lk = (label, hash, title) => h("button", { class: "lk", type: "button", onclick: go(hash), title: title || null }, label);
    const forms = GROUPS.get("forms").items;
    const waist = h("section", { class: "sec", "aria-labelledby": "h-waist" },
      h("div", { class: "sec-head" }, h("h2", { id: "h-waist" }, "The waist at a glance"), h("p", {}, "Small in the middle, free above and below; each owner keeps the edges.")),
      h("div", { class: "waist" },
        h("div", { class: "edge" }, h("div", { class: "layer-label" }, "Edges · left to each owner"),
          h("button", { type: "button", onclick: go("#/contract/reasons") }, "gate"),
          h("button", { type: "button", onclick: go("#/gatekeeper") }, "sensor model"),
          h("button", { type: "button", onclick: go("#/contract/effects") }, "tier policy")),
        h("div", { class: "hg", role: "group", "aria-label": "Membrane layers" },
          h("div", { class: "hg-layer hg-top" },
            h("div", { class: "layer-label" }, "Registered forms"),
            h("div", { class: "chips" }, forms.map((f) => lk(f.name, "#/contract/" + f.id, f.def))),
            h("div", { class: "layer-label" }, "Extensions"),
            h("div", { class: "chips" }, GROUPS.has("extensions") && GROUPS.get("extensions").items.length
              ? GROUPS.get("extensions").items.map((x) => lk(x.name, "#/contract/" + x.id, x.def))
              : [lk("crit", "#/contract/env.crit"), lk("urgency claim", "#/contract/ch.urgency"), lk("page channel", "#/contract/ch.page")])),
          h("div", { class: "hg-layer hg-waist" },
            h("div", { class: "layer-label" }, "The waist"),
            h("div", { class: "segs" },
              seg(required, "required fields", "#/contract/envelope"),
              seg(GROUPS.get("acts").items.length, "acts", "#/contract/acts"),
              seg(GROUPS.get("dispositions").items.length, "dispositions", "#/contract/dispositions"),
              seg(GROUPS.get("evidence").items.length, "evidence kinds", "#/contract/evidence"),
              seg(effectItem.enum.length, "effect classes", "#/contract/env.effect")),
            h("button", { class: "inv-link", type: "button", onclick: go("#/contract/invariants") }, GROUPS.get("invariants").items.length + " invariants hold it in place")),
          h("div", { class: "hg-layer hg-bot" },
            h("div", { class: "layer-label" }, "Bindings"),
            h("div", { class: "chips" }, lk("git lanes", "#/decisions/D3", "Week-one transport decision"), lk("shared folder", "#/decisions/D3", "Week-one transport decision"),
              lk("A2A", "#/contract/lineage"), lk("MCP", "#/contract/lineage")))),
        h("div", { class: "edge" }, h("div", { class: "layer-label" }, "Edges · left to each owner"),
          h("button", { type: "button", onclick: go("#/contract/standing") }, "standing computation"),
          h("button", { type: "button", onclick: go("#/contract/ladder") }, "escalation timers"),
          h("button", { type: "button", onclick: go("#/contract/disp.held") }, "quarantine storage"))));
    function seg(n, label, hash) { return h("button", { class: "seg", type: "button", onclick: go(hash) }, h("b", {}, n), h("span", {}, label)); }
    root.appendChild(waist);

    /* ---- nine laws ---- */
    root.appendChild(h("section", { class: "sec", "aria-labelledby": "h-laws" },
      h("div", { class: "sec-head" }, h("h2", { id: "h-laws" }, M.laws.length === 9 ? "Nine laws" : M.laws.length + " laws"), h("p", {}, "Each one reached independently by several disciplines.")),
      h("div", { class: "laws" }, M.laws.map((law, i) => h("article", { class: "card law hov rise", style: { animationDelay: Math.min(i, 12) * 35 + "ms" } },
        h("div", { class: "lid" }, law.id),
        h("h3", { class: "lname" }, h("button", { class: "stretch", type: "button", "data-open-id": law.id, onclick: () => openLawDrawer(law) }, law.name)),
        h("div", { class: "tags" }, law.fields.map((f) => h("span", { class: "tag" }, f))),
        h("div", { class: "refs above" }, law.refs.map(refChip)))))));

    /* ---- two parents ---- */
    const lin = GROUPS.get("lineage");
    const bySrc = (src) => lin.items.filter((i) => i.src === src);
    const relOrder = ["borrowed", "extended", "breaks", "absent"];
    const REL_HELP = { borrowed: "kept as is", extended: "kept and widened", breaks: "holds inside one owner, fails between two", absent: "the parent has nothing here" };
    const relCounts = (items) => relOrder.map((r) => [r, items.filter((i) => i.rel === r).length]).filter(([, n]) => n);
    const linCol = (src, blurb) => {
      const items = bySrc(src);
      return h("div", { class: "card lin-col" },
        h("div", { class: "lin-src" }, h("b", {}, src), h("span", {}, plural(items.length, "idea") + " · " + relCounts(items).map(([r, n]) => n + " " + r).join(" · "))),
        h("ul", { class: "lin-list" }, items.map((it) => h("li", {}, h("button", { class: "lin-row", type: "button", "data-open-id": it.id, onclick: () => openItemDrawer(it), title: it.idea },
          h("span", { class: "lin-name" }, it.name), h("span", { class: "rel " + it.rel }, it.rel))))));
    };
    root.appendChild(h("section", { class: "sec", "aria-labelledby": "h-lin" },
      h("div", { class: "sec-head" }, h("h2", { id: "h-lin" }, "Two parents"), h("p", {}, "What Membrane takes from MCP and A2A, and where both break between owners.")),
      h("div", { class: "lin" }, linCol("MCP"), linCol("A2A")),
      h("div", { class: "lin-legend" }, relOrder.map((r) => h("span", { class: "row", style: { gap: "6px" }, title: REL_HELP[r] }, h("span", { class: "rel " + r }, r), h("span", { class: "rel-help" }, REL_HELP[r]))), h("span", {}, "Open any idea for the Membrane form it became."), refRow(lin.refs))));

    /* ---- four ways ---- */
    const ways = [
      ["Contract", "Learn every field and lock the ones you agree with.", "#/contract"],
      ["Playground", "Run agents with different temperaments and break a rule on purpose.", "#/playground"],
      ["Gatekeeper", "Try to get a hostile message past the gate.", "#/gatekeeper"],
      ["Decisions", "See what the playground cannot settle, and take a stance.", "#/decisions"]
    ];
    root.appendChild(h("section", { class: "sec", "aria-labelledby": "h-ways" },
      h("div", { class: "sec-head" }, h("h2", { id: "h-ways" }, "Four ways to use this page")),
      h("div", { class: "ways" }, ways.map(([t, d, hash], i) => h("article", { class: "card way hov rise", style: { animationDelay: i * 50 + "ms" } },
        h("div", { class: "wn" }, "0" + (i + 1)),
        h("h3", { class: "wt" }, h("button", { class: "stretch", type: "button", onclick: go(hash) }, t)),
        h("p", {}, d),
        h("span", { class: "go" }, "Open ", icon("arrow")))))));

    Abstract.setActive = stage.setActive;
  }

  /* ---- the animated membrane ---- */
  function buildStage() {
    const W = 680, H = 380, CY = 170, MX = 340;
    const hermes = agent("hermes"), brainboi = agent("brainboi");
    const tierT1 = itemById("tier.T1"), tierT4 = itemById("tier.T4"), evInt = itemById("ev.intention"), rcLane = itemById("rc.lane"), dispExp = itemById("disp.expired"), envExp = itemById("env.expires");

    const STEPS = [
      { key: "ask", kind: "travel", tag: "ask", title: "Hermes asks for shareable data", fields: [["act", "request"], ["form", "ask"], ["effect", "disclose"], ["tier", "T1"]], outcome: "admitted", item: "tier.T1", note: "Release at T1: " + tierT1.release + "." },
      { key: "relay", kind: "travel", tag: "assert", title: "A relayed intention arrives", fields: [["act", "assert"], ["evidence", "intention"], ["origin", "set"]], outcome: "held", item: "ev.intention", note: evInt.def },
      { key: "lane", kind: "travel", tag: "ask", title: "A message signed outside its lane", fields: [["from", "hermes"], ["signer", "another key"]], outcome: "refused", reason: "lane", item: "rc.lane", note: rcLane.def + " Refused before any model reads it." },
      { key: "t4", kind: "travel", tag: "ask", title: "An irreversible ask", fields: [["act", "request"], ["effect", "irreversible"], ["tier", "T4"]], outcome: "held", item: "tier.T4", note: "Release at T4: " + tierT4.release + "." },
      { key: "exp", kind: "expire", target: "relay", title: "Nobody releases the hold", fields: [["expires", envExp.default || "at + 48 h"]], outcome: "expired", item: "disp.expired", note: dispExp.def }
    ];
    const TRAVEL = 1500, SEAL = 1500, SENSE = 2000, DECIDE = 2800, OUT = 3200, OUT_DUR = 1500, STEP_LEN = 5300, EXP_LEN = 2700, CLEAR_LEN = 900;
    const SLOTS = [[452, 268], [478, 280], [460, 292]];

    const svg = G.el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-labelledby": "stage-t stage-d", class: "stage-svg" });
    G.el("title", { id: "stage-t" }, svg).textContent = "A message crossing the membrane";
    G.el("desc", { id: "stage-d" }, svg).textContent = "Envelopes travel from Hermes to brainboi, stop at the membrane, are sealed, read by the sensor, and then admitted, held in quarantine, refused with a reason code, or expired.";
    const defs = G.el("defs", {}, svg);
    const pat = G.el("pattern", { id: "stage-dots", width: 18, height: 18, patternUnits: "userSpaceOnUse" }, defs);
    G.el("circle", { cx: 2, cy: 2, r: 0.9, fill: "var(--rule-strong)", opacity: 0.55 }, pat);
    G.el("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#stage-dots)" }, svg);
    G.el("rect", { x: MX, y: 0, width: W - MX, height: H, fill: "var(--surface-2)", opacity: 0.6 }, svg);
    const txt = (x, y, s, style, anchor = "start", parent = svg) => { const t = G.el("text", { x, y, "text-anchor": anchor, style: style.replace(/font-size:[^;]+;?/, ""), class: "lbl" }, parent); t.textContent = s; return t; };
    const small = "font-family:var(--mono);font-size:10px;fill:var(--ink-3);letter-spacing:.04em";
    txt(20, 26, "OUTSIDE", small);
    const insideLbl = txt(W - 20, 26, "INSIDE BRAINBOI'S BOUNDARY", small, "end");

    const upper = G.el("g", {}, svg), lower = G.el("g", {}, svg);
    const vesicle = G.el("g", { transform: "translate(464,280)" }, svg);
    G.el("circle", { r: 36, fill: "var(--held-bg)", stroke: "var(--held)", "stroke-width": 1.2, "stroke-dasharray": "3 3", opacity: 0.9 }, vesicle);
    const quarLbl = txt(44, 4, "quarantine", "font-family:var(--mono);font-size:10px;fill:var(--held)", "start", vesicle);

    G.agentNode(svg, hermes, { x: 104, y: CY, r: 32 });
    const bNode = G.agentNode(svg, brainboi, { x: 578, y: CY, r: 32 });

    // gate stage track
    const track = G.el("g", { transform: "translate(0,356)" }, svg);
    G.el("line", { x1: 226, x2: 454, y1: 0, y2: 0, stroke: "var(--rule-strong)", "stroke-width": 1 }, track);
    const trackLine = track.firstChild;
    const stageDots = ["sealed", "sensor", "disposition"].map((label) => {
      const bg = G.el("rect", { rx: 9, fill: "var(--surface)", stroke: "var(--rule)" }, track);
      const c = G.el("circle", { cy: 0, r: 4, fill: "var(--surface)", stroke: "var(--ink-3)", "stroke-width": 1.2 }, track);
      const t = txt(0, 3.5, label, "font-family:var(--mono);fill:var(--ink-2)", "start", track);
      return { c, bg, t, label };
    });
    const agentTexts = [...svg.querySelectorAll(".glyph-agent")].map((g) => ({ g, t: [...g.children].filter((n) => n.tagName === "text") }));
    let K = 0;
    function layoutLabels(k) {
      if (Math.abs(k - K) < 0.02) return;
      K = k;
      svg.style.setProperty("--k", k.toFixed(3));
      insideLbl.textContent = k > 1.5 ? "INSIDE" : "INSIDE BRAINBOI'S BOUNDARY";
      quarLbl.style.display = k > 1.5 ? "none" : "";
      const fs = 10 * k, pad = 8, gap = 10 + 4 * k;
      const widths = stageDots.map((d) => 12 + 8 + d.label.length * 0.62 * fs + pad);
      const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
      let x = MX - total / 2;
      const hgt = Math.max(18, fs + 8);
      stageDots.forEach((d, i) => {
        d.bg.setAttribute("x", x.toFixed(1)); d.bg.setAttribute("y", (-hgt / 2).toFixed(1)); d.bg.setAttribute("width", widths[i].toFixed(1)); d.bg.setAttribute("height", hgt.toFixed(1)); d.bg.setAttribute("rx", (hgt / 2).toFixed(1));
        d.c.setAttribute("cx", (x + 12).toFixed(1));
        d.t.setAttribute("x", (x + 20).toFixed(1)); d.t.setAttribute("y", (fs * 0.35).toFixed(1));
        x += widths[i] + gap;
      });
      trackLine.setAttribute("x1", (MX - total / 2 + 10).toFixed(1)); trackLine.setAttribute("x2", (MX + total / 2 - 10).toFixed(1));
      track.setAttribute("transform", `translate(0,${(H - hgt / 2 - 6).toFixed(1)})`);
      agentTexts.forEach(({ t }) => {
        if (t[0]) t[0].setAttribute("y", (32 + 8 + 12 * k).toFixed(1));
        if (t[1]) t[1].setAttribute("y", (32 + 8 + 12 * k + 4 + 10.5 * k).toFixed(1));
      });
    }
    layoutLabels(1);
    if (window.ResizeObserver) new ResizeObserver(() => { const w = svg.clientWidth; if (w) layoutLabels(clamp(W / w, 1, 2.2)); }).observe(svg);

    const envLayer = G.el("g", {}, svg);
    const scan = G.el("rect", { x: 0, y: 0, width: 50, height: 2, rx: 1, fill: "var(--accent)", opacity: 0 }, svg);

    /* caption + controls (HTML) */
    const cap = h("div", { class: "stage-cap" });
    const dots = h("div", { class: "dots", role: "group", "aria-label": "Sequence steps" });
    const playBtn = h("button", { class: "btn", type: "button", "aria-label": "Pause animation" }, icon("pause"), h("span", {}, "Pause"));
    const legend = h("div", { class: "legend", "aria-label": "Dispositions" }, h("span", { class: "muted" }, "Dispositions"),
      GROUPS.get("dispositions").items.map((d) => h("button", { class: "d " + d.name, type: "button", title: d.def, onclick: () => openItemDrawer(d) }, d.name)));
    playBtn.hidden = REDUCED;
    const bar = h("div", { class: "stage-bar" }, playBtn, dots, legend);
    const el = h("figure", { class: "stage" }, svg, cap, bar);

    STEPS.forEach((s, i) => dots.appendChild(h("button", { type: "button", "aria-label": `Step ${i + 1}: ${s.title}`, title: s.title, onclick: () => jump(i) }, String(i + 1))));

    function setCaption(s, decided) {
      clear(cap);
      const i = STEPS.indexOf(s);
      add(cap, [
        h("div", { class: "cap-top" }, h("span", { class: "cap-n" }, `${i + 1} / ${STEPS.length}`), h("span", { class: "cap-title" }, s.title),
          decided ? h("button", { class: "d " + s.outcome, type: "button", onclick: () => openItem(s.item), title: "Open " + s.item }, s.outcome + (s.reason ? " · " + s.reason : ""))
            : h("span", { class: "muted", style: { fontSize: "12.5px" } }, "at the gate…")),
        h("div", { class: "cap-fields" }, s.fields.map(([k, v]) => h("code", {}, k + ": " + v))),
        decided ? h("p", { class: "cap-note" }, s.note) : h("p", { class: "cap-note muted" }, "Sealed verbatim, then read by the sensor, then a disposition.")
      ]);
      [...dots.children].forEach((b, j) => b.toggleAttribute("aria-current", false) || (j === i && b.setAttribute("aria-current", "step")));
    }

    /* scene state */
    let sc = null;
    function makeEnv(s, x, y) {
      const outer = G.el("g", { class: "env" }, envLayer);
      const inner = G.envelope(outer, { x: 0, y: 0, w: 40, h: 28, state: "sent" });
      const tag = txt(0, -22, s.tag || "", "font-family:var(--mono);font-size:10px;fill:var(--ink-2)", "middle", outer);
      outer.addEventListener("click", () => openItem(s.item));
      const e = { outer, inner, tag, key: s.key, item: s.item, x, y, o: 1, sc: 1 };
      place(e);
      return e;
    }
    function place(e) { e.outer.setAttribute("transform", `translate(${e.x.toFixed(1)},${e.y.toFixed(1)}) scale(${e.sc.toFixed(3)})`); e.outer.setAttribute("opacity", e.o.toFixed(3)); }
    function setTag(e, s, color) { e.tag.textContent = s; e.tag.style.fill = color || "var(--ink-2)"; }
    function resetScene() {
      clear(envLayer);
      sc = { idx: 0, t: 0, env: null, parked: [], flags: {}, clearing: false };
      bNode.setHeld(0);
    }
    function park(s) {
      const slot = SLOTS[sc.parked.length % SLOTS.length];
      const e = makeEnv(s, slot[0], slot[1]);
      e.inner.setState("held"); e.sc = 0.62; setTag(e, ""); place(e);
      sc.parked.push(e); bNode.setHeld(sc.parked.length);
      return e;
    }
    function startStep(i) {
      sc.idx = i; sc.t = 0; sc.flags = {}; sc.clearing = false;
      const s = STEPS[i];
      sc.env = s.kind === "travel" ? makeEnv(s, 150, CY) : sc.parked.find((p) => p.key === s.target) || null;
      stageDots.forEach((d) => { d.c.setAttribute("fill", "var(--surface)"); d.c.setAttribute("stroke", "var(--ink-3)"); });
      setCaption(s, false);
    }
    function jump(i) {
      resetScene();
      for (let j = 0; j < i; j++) {
        const s = STEPS[j];
        if (s.kind === "travel" && s.outcome === "held") park(s);
        if (s.kind === "expire") { const p = sc.parked.find((q) => q.key === s.target); if (p) { p.outer.remove(); sc.parked.splice(sc.parked.indexOf(p), 1); bNode.setHeld(sc.parked.length); } }
      }
      if (REDUCED) { composeStatic(i); return; }
      startStep(i);
      if (!playing) { playing = true; syncPlay(); }
      kick();
    }
    const once = (k, fn) => { if (!sc.flags[k]) { sc.flags[k] = true; fn(); } };
    const dispVar = (d) => `var(--${d})`;
    function lightStage(n, outcome) {
      if (n >= 1) { stageDots[0].c.setAttribute("fill", "var(--sealed)"); stageDots[0].c.setAttribute("stroke", "var(--sealed)"); }
      if (n >= 2) { stageDots[1].c.setAttribute("fill", "var(--accent)"); stageDots[1].c.setAttribute("stroke", "var(--accent)"); }
      if (n >= 3) { stageDots[2].c.setAttribute("fill", dispVar(outcome)); stageDots[2].c.setAttribute("stroke", dispVar(outcome)); }
    }

    let clock = 0;
    function drawMembrane(pore) {
      G.bilayer(upper, { x: MX, y0: 30, y1: 164, t: clock });
      G.bilayer(lower, { x: MX, y0: 173, y1: 330, t: clock + (13 * 0.45) / 1.3 });
      upper.setAttribute("transform", `translate(0,${(-pore).toFixed(1)})`);
      lower.setAttribute("transform", `translate(0,${pore.toFixed(1)})`);
    }

    function tick(dt) {
      clock += dt / 1000;
      let pore = 0;
      if (sc.clearing) {
        sc.t += dt;
        const p = clamp(sc.t / CLEAR_LEN);
        sc.parked.forEach((e) => { e.o = 1 - p; place(e); });
        if (p >= 1) { resetScene(); startStep(0); }
        drawMembrane(0); return;
      }
      sc.t += dt;
      const s = STEPS[sc.idx], t = sc.t, e = sc.env;
      if (s.kind === "travel" && e) {
        if (t < TRAVEL) { const p = easeIO(t / TRAVEL); e.x = lerp(150, 298, p); e.y = CY - Math.sin(p * Math.PI) * 16; }
        else if (t < OUT) { e.x = 298; e.y = CY; }
        if (t >= SEAL) once("seal", () => { e.inner.setState("sealed"); setTag(e, "sealed", "var(--sealed)"); lightStage(1); });
        if (t >= SENSE && t < DECIDE) {
          lightStage(2);
          const ph = (t - SENSE) / (DECIDE - SENSE);
          scan.setAttribute("x", e.x - 25); scan.setAttribute("y", CY - 15 + 30 * (0.5 - 0.5 * Math.cos(ph * Math.PI * 4)));
          scan.setAttribute("opacity", 0.85);
          if (t >= SENSE) once("sense", () => setTag(e, "sensor", "var(--accent)"));
        } else scan.setAttribute("opacity", 0);
        if (t >= DECIDE) once("decide", () => {
          e.inner.setState(s.outcome); lightStage(3, s.outcome);
          setTag(e, s.outcome + (s.reason ? " · " + s.reason : ""), dispVar(s.outcome));
          setCaption(s, true);
        });
        if (s.outcome === "refused" && t >= DECIDE && t < OUT) { const k = (t - DECIDE) / (OUT - DECIDE); e.x = 298 + Math.sin(k * Math.PI * 6) * 3 * (1 - k); }
        if (t >= OUT) {
          const p = clamp((t - OUT) / OUT_DUR);
          if (s.outcome === "admitted") {
            pore = 15 * Math.sin(Math.PI * clamp(p / 0.5));
            const q = easeIO(p); e.x = lerp(298, 578, q); e.y = CY; e.sc = lerp(1, 0.35, q); e.o = p > 0.72 ? lerp(1, 0, (p - 0.72) / 0.28) : 1;
            if (p > 0.3) setTag(e, "");
          } else if (s.outcome === "held") {
            pore = 15 * Math.sin(Math.PI * clamp(p / 0.5));
            const slot = SLOTS[sc.parked.length % SLOTS.length];
            if (p < 0.4) { const q = easeIO(p / 0.4); e.x = lerp(298, 390, q); e.y = CY; }
            else { const q = easeIO((p - 0.4) / 0.6); e.x = lerp(390, slot[0], q); e.y = lerp(CY, slot[1], q); e.sc = lerp(1, 0.62, q); }
            if (p > 0.5) setTag(e, "");
            if (p >= 1) once("park", () => { sc.parked.push(e); bNode.setHeld(sc.parked.length); });
          } else if (s.outcome === "refused") {
            const q = easeOut(p); e.x = lerp(298, 190, q); e.y = CY - Math.sin(p * Math.PI) * 38; e.o = p > 0.75 ? lerp(1, 0, (p - 0.75) / 0.25) : 1;
          }
          if (p >= 1 && s.outcome !== "held") once("gone", () => e.outer.remove());
        }
        place(e);
        if (t >= STEP_LEN) next();
      } else if (s.kind === "expire") {
        if (e) {
          if (t < 700) { setTag(e, "expires", "var(--held)"); e.sc = 0.62 + Math.sin((t / 700) * Math.PI) * 0.1; }
          if (t >= 700) once("exp", () => { e.inner.setState("expired"); setTag(e, "expired", "var(--expired)"); lightStage(3, "expired"); setCaption(s, true); });
          if (t >= 700) { const p = clamp((t - 700) / 1300); e.o = 1 - p; e.y = SLOTS[0][1] - p * 18; }
          if (t >= 2000) once("gone", () => { e.outer.remove(); sc.parked.splice(sc.parked.indexOf(e), 1); bNode.setHeld(sc.parked.length); });
          if (!sc.flags.gone) place(e);
        } else once("exp", () => setCaption(s, true));
        if (t >= EXP_LEN) next();
      }
      drawMembrane(pore);
    }
    function next() {
      if (sc.idx + 1 < STEPS.length) startStep(sc.idx + 1);
      else { sc.clearing = true; sc.t = 0; }
    }

    /* static composed frame for reduced motion */
    function composeStatic(i = 0) {
      resetScene();
      const a = makeEnv(STEPS[0], 516, 112); a.inner.setState("admitted"); setTag(a, "admitted · T1", "var(--admitted)"); a.sc = 0.8; place(a);
      park(STEPS[1]); park(STEPS[3]);
      const r = makeEnv(STEPS[2], 214, 104); r.inner.setState("refused"); setTag(r, "refused · lane", "var(--refused)"); place(r);
      const x = makeEnv(STEPS[4], 392, 222); x.inner.setState("expired"); setTag(x, "expired", "var(--expired)"); x.o = 0.6; x.sc = 0.8; place(x);
      drawMembrane(0);
      lightStage(3, STEPS[i].outcome);
      setCaption(STEPS[i], true);
    }

    /* loop control */
    let playing = !REDUCED, active = false, raf = null, last = null;
    const running = () => playing && active && !document.hidden && !REDUCED;
    function frame(now) {
      raf = null;
      if (!running()) { last = null; return; }
      const dt = last == null ? 16 : Math.min(now - last, 64);
      last = now;
      tick(dt);
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (running() && raf == null) { last = null; raf = requestAnimationFrame(frame); } }
    function syncPlay() {
      clear(playBtn);
      add(playBtn, playing ? [icon("pause"), h("span", {}, "Pause")] : [icon("play"), h("span", {}, "Play")]);
      playBtn.setAttribute("aria-label", playing ? "Pause animation" : "Play animation");
    }
    playBtn.addEventListener("click", () => { playing = !playing; syncPlay(); kick(); });
    document.addEventListener("visibilitychange", kick);

    resetScene();
    if (REDUCED) composeStatic(0);
    else { startStep(0); drawMembrane(0); }
    rmListeners.add((reduced) => {
      playBtn.hidden = reduced;
      scan.setAttribute("opacity", 0);
      if (reduced) { if (raf != null) { cancelAnimationFrame(raf); raf = null; } composeStatic(sc && !sc.clearing ? sc.idx : 0); }
      else { playing = true; syncPlay(); resetScene(); startStep(0); drawMembrane(0); kick(); }
    });

    return { el, setActive(v) { active = !!v; kick(); } };
  }

  /* ================= Contract view ================= */
  const C = { group: M.groups[0].id, query: "", status: "all", built: false, els: {} };
  let downloads = null;

  function buildContract(root) {
    const locked = h("span", { class: "num" });
    const meter = h("i");
    const exportBtn = h("button", { class: "btn", type: "button", onclick: exportContract }, "Export contract");
    const lockedOnly = h("input", { type: "checkbox", "aria-label": "Export locked items only" });
    C.els.lockedOnly = lockedOnly;
    const saveBtn = h("button", { class: "btn", type: "button", hidden: true, onclick: saveContract }, "Save as .md");
    C.els.saveBtn = saveBtn;
    root.appendChild(h("div", { class: "c-top" },
      h("div", { class: "view-head", style: { marginBottom: 0 } },
        h("div", { class: "eyebrow" }, "Contract " + M.version + " · learn and lock"),
        h("h2", { tabindex: "-1", "data-focus": "" }, "Contract"),
        h("p", { class: "lede" }, "Every field, act and code in " + M.version + ", with why it exists and where it came from.")),
      h("div", { class: "lockline" },
        h("div", { class: "row" }, h("span", {}, locked), h("span", { class: "row", style: { gap: "8px" } }, h("label", { class: "switch", style: { fontSize: "12.5px" } }, lockedOnly, "Locked only"), exportBtn, saveBtn)),
        h("div", { class: "meter", role: "progressbar", "aria-label": "Items locked", "aria-valuemin": "0", "aria-valuemax": String(TOTAL) }, meter))));
    C.els.locked = locked; C.els.meter = meter;

    const rail = h("nav", { class: "rail", "aria-label": "Contract groups" });
    const main = h("div", { class: "c-main" });
    const headEl = h("div", { class: "grp-head" });
    const search = h("input", { type: "text", class: "search", placeholder: "Search every item", "aria-label": "Search contract items" });
    const chips = h("div", { class: "fchips", role: "group", "aria-label": "Filter by status" });
    ["all", "kept", "changed", "added", "open", "locked"].forEach((st) => chips.appendChild(h("button", { class: "fchip", type: "button", "aria-pressed": String(st === C.status), "data-st": st, onclick: () => { C.status = st; [...chips.children].forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.st === st))); renderItems(true); } }, st)));
    search.addEventListener("input", () => { C.query = search.value.trim().toLowerCase(); renderItems(true); });
    const note = h("p", { class: "results-note", "aria-live": "polite" });
    const grid = h("div", { class: "items" });
    add(main, [headEl, h("div", { class: "toolbar" }, search, chips), note, grid]);
    root.appendChild(h("div", { class: "c-layout" }, rail, main));
    edgeFade(rail);
    Object.assign(C.els, { rail, headEl, grid, note, search });
    C.built = true;
    renderRail(); renderHead(); renderItems(true); renderSummary();
  }

  function renderSummary() {
    if (!C.built) return;
    const n = ALL_ITEMS.filter((i) => isLocked(i.id)).length;
    const st = ALL_ITEMS.filter((i) => lockStale(i.id)).length;
    C.els.locked.textContent = `${n} of ${TOTAL} items locked` + (st ? ` · ${st} stale` : "");
    C.els.meter.style.width = (100 * n / TOTAL).toFixed(1) + "%";
    C.els.meter.parentElement.setAttribute("aria-valuenow", String(n));
  }
  function renderRail() {
    const rail = C.els.rail;
    const keep = rail.scrollLeft;
    clear(rail);
    M.groups.forEach((g) => {
      const n = g.items.length, l = g.items.filter((i) => isLocked(i.id)).length;
      rail.appendChild(h("button", { type: "button", "aria-current": String(g.id === C.group), onclick: () => selectGroup(g.id, true) },
        h("span", { class: "rt" }, h("span", {}, g.title), h("span", { class: "rc" }, l ? `${l}/${n}` : n)),
        h("span", { class: "meter", "aria-hidden": "true" }, h("i", { style: { width: (100 * l / n).toFixed(1) + "%" } }))));
    });
    rail.scrollLeft = keep;
    if (C.centered !== C.group) { const cur = rail.querySelector('[aria-current="true"]'); if (cur && centerIn(rail, cur)) C.centered = C.group; }
    if (rail.updFade) rail.updFade();
  }
  function renderHead() {
    const g = GROUPS.get(C.group);
    clear(C.els.headEl);
    add(C.els.headEl, [h("h3", { class: "display" }, g.title), h("p", {}, g.blurb), refRow(g.refs)]);
  }
  function selectGroup(id, userAction) {
    if (!GROUPS.has(id)) return;
    const changed = C.group !== id;
    C.group = id;
    if (userAction && C.query) { C.query = ""; C.els.search.value = ""; }
    renderRail(); renderHead(); renderItems(changed || userAction);
    if (userAction) history.replaceState(null, "", "#/contract/" + id);
  }
  function itemMatches(it) {
    if (C.status === "locked" && !isLocked(it.id)) return false;
    if (C.status !== "all" && C.status !== "locked" && it.status !== C.status) return false;
    if (!C.query) return true;
    const hay = [it.id, it.name, it.def, it.why, it.idea, it.membrane, it.type, it.map, (it.enum || []).map((x) => x.v + " " + x.m).join(" ")].join(" ").toLowerCase();
    return hay.includes(C.query);
  }
  function renderItems(animate) {
    if (!C.built) return;
    const grid = clear(C.els.grid);
    const pool = C.query ? ALL_ITEMS : GROUPS.get(C.group).items;
    const items = pool.filter(itemMatches);
    C.els.note.textContent = C.query ? `${plural(items.length, "result")} across all groups` : (C.status !== "all" ? `${items.length} of ${pool.length} in this group` : "");
    if (!items.length) { grid.appendChild(h("div", { class: "empty", style: { gridColumn: "1 / -1" } }, "No items match.")); return; }
    items.forEach((it, i) => {
      const lockedNow = isLocked(it.id), cc = threadCount(it.id), stale = lockStale(it.id);
      const g = INDEX.get(it.id).group;
      const card = h("button", { type: "button", "data-open-id": it.id, class: "card item hov" + (animate ? " rise" : "") + (lockedNow ? " is-locked" : ""), style: animate ? { animationDelay: Math.min(i, 18) * 22 + "ms" } : null, onclick: () => route("#/contract/" + it.id) },
        h("span", { class: "nm" + (it.kind === "lineage" ? " prose" : "") }, h("span", {}, it.name), lockedNow ? h("span", { class: "lockmark" + (stale ? " stale" : ""), title: stale ? "lock stale: item changed since locking" : "locked" }, icon("lock")) : null),
        h("span", { class: "df" }, it.def || it.idea || ""),
        h("span", { class: "meta" },
          statusPill(it.status),
          FIELDLIKE(it) && /^always/.test(it.required || "") ? h("span", { class: "badge req" }, "required") : null,
          stale ? h("span", { class: "badge stale" }, "lock stale") : null,
          it.kind === "lineage" ? h("span", { class: "rel " + it.rel }, it.src + " · " + it.rel) : null,
          !FIELDLIKE(it) && it.kind !== "lineage" && g && g.items.some((x) => x.kind !== it.kind) ? h("span", { class: "badge" }, KIND_LABEL[it.kind] || it.kind) : null,
          it.enum && it.enum.length ? h("span", { class: "badge" }, plural(it.enum.length, "value")) : null,
          it.try ? h("span", { class: "badge" }, "try it") : null,
          C.query ? h("span", { class: "badge" }, g.title) : null,
          cc ? h("span", { class: "cc", title: plural(cc, "comment") }, icon("comment"), cc) : null));
      grid.appendChild(card);
    });
  }

  function buildMarkdown(lockedOnly) {
    const L = [];
    const lockedItems = ALL_ITEMS.filter((i) => isLocked(i.id));
    const fresh = lockedItems.filter((i) => !lockStale(i.id));
    const stale = lockedItems.filter((i) => lockStale(i.id));
    const contractHash = hashText(fresh.map((i) => i.id + "=" + effectiveHash(i)).sort().join("\n"));
    L.push(`# Membrane contract ${M.version}${lockedOnly ? " (locked items only)" : ""}`, "",
      `Exported ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · ${lockedItems.length} of ${TOTAL} items locked${stale.length ? ` · ${stale.length} stale` : ""} · notes: ${S.mode === "shared" ? "shared" : "this browser only"}`, "",
      `Locked-contract hash: \`${contractHash}\` over ${fresh.length} current locked items (simulation hash, not SHA-256)`, "",
      `Paper: ${M.paper}`, "");
    if (stale.length) { L.push("Stale locks (item changed since locking): " + stale.map((i) => "`" + i.id + "`").join(", "), ""); }
    M.groups.forEach((g) => {
      const items = lockedOnly ? g.items.filter((i) => isLocked(i.id)) : g.items;
      if (!items.length) return;
      L.push(`## ${g.title}`, "", g.blurb || "", "", `Refs: ${(g.refs || []).join(", ")}`, "");
      items.forEach((it) => {
        const lk = live.locks.get(it.id);
        L.push(`### ${it.name} \`${it.id}\``, "");
        L.push(`- status: ${it.status}${lk && lk.locked ? ` · **locked** by ${lk.by || "?"} on ${String(lk.at || "").slice(0, 10)}${lk.note ? ` (${lk.note})` : ""}${lockStale(it.id) ? " · **stale**" : ""}` : ""}`);
        L.push(`- hash: \`${effectiveHash(it)}\`${acceptedPairs((live.threads.get(it.id) || {}).entries).length ? " (includes accepted proposals)" : ""}`);
        if (FIELDLIKE(it) && it.required) L.push(`- required: ${it.required}`);
        if (it.type) L.push(`- type: ${it.type}`);
        if (it.default) L.push(`- default: ${it.default}`);
        if (it.act) L.push(`- act: ${it.act}`);
        if (it.release) L.push(`- release: ${it.release}`);
        if (it.reach) L.push(`- reach: ${it.reach}`);
        if (it.map) L.push(`- maps to: ${it.map}`);
        if (it.def) L.push(`- definition: ${it.def}`);
        if (it.why) L.push(`- why: ${it.why}`);
        if (it.axes) L.push(`- axes: ${axisValue(it.axes)}`);
        if (it.kind === "lineage") L.push(`- ${it.src}: ${it.idea}`, `- in Membrane (${it.rel}): ${it.membrane}`);
        if (it.enum) { L.push(`- values:`); it.enum.forEach((x) => L.push(`  - \`${x.v}\`: ${x.m}${x.why ? ` (${x.why})` : ""}`)); }
        if (it.a2a) L.push(it.a2a.rel === "none" ? `- A2A/MCP: no counterpart${it.a2a.map ? ` (${it.a2a.map})` : ""}` : `- A2A/MCP (${it.a2a.rel}): ${it.a2a.map}`);
        if (it.refs && it.refs.length) L.push(`- refs: ${it.refs.join(", ")}`);
        const entries = (live.threads.get(it.id) || {}).entries || [];
        const statuses = proposalStatuses(entries);
        entries.filter((e) => e.kind === "proposal").forEach((p) => {
          const st = proposalState(p, statuses);
          if (st === "closed") return;
          L.push(`- ${st === "accepted" ? "accepted proposal · applied in this contract hash" : st + " proposal"} (${p.author || "anonymous"}, ${String(p.at || "").slice(0, 10)}): ${p.field} → ${p.to || "(remove)"}${p.text ? ` · ${p.text}` : ""}`);
        });
        L.push("");
      });
    });
    let current = null;
    try { if (window.SimView && typeof window.SimView.getParams === "function") current = window.SimView.getParams() || null; } catch (e) { current = null; }
    L.push("## Parameters (starting values)", "", current ? "Current values come from the Playground session at export time." : "Open the Playground to include current values.", "",
      "| parameter | id | starting value | " + (current ? "current | " : "") + "range | governs |", "|---|---|---|" + (current ? "---|" : "") + "---|---|");
    M.params.forEach((pp) => {
      const range = pp.type === "range" ? `${pp.min}–${pp.max}` : pp.type === "enum" ? (pp.options || []).join(" / ") : "on / off";
      const fmt = (v) => (typeof v === "boolean" ? (v ? "on" : "off") : String(v));
      L.push(`| ${pp.label} | \`${pp.id}\` | ${fmt(pp.def)} | ${current ? (pp.id in current ? fmt(current[pp.id]) : "") + " | " : ""}${range} | ${pp.item || ""} |`);
    });
    L.push("", "## Open decisions", "");
    M.decisions.forEach((d) => L.push(`- **${d.id} ${d.title}** (${d.owner}; ${RESOLVE[resKey(d)].short}): ${d.q}${d.settles ? ` Settled by: ${d.settles}` : ""}`));
    L.push("");
    return L.join("\n");
  }
  async function copyText(s) {
    try { await navigator.clipboard.writeText(s); return true; } catch (e) {
      const ta = h("textarea", { style: { position: "fixed", top: "-100px", opacity: "0" } }); ta.value = s; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (_) {}
      ta.remove(); return ok;
    }
  }
  async function exportContract() {
    const md = buildMarkdown(!!(C.els.lockedOnly && C.els.lockedOnly.checked));
    const ok = await copyText(md);
    if (ok) { toast(downloads ? "Contract copied as Markdown · Save as .md also available" : "Contract copied as Markdown"); return; }
    if (downloads) { toast("Copy blocked here; use Save as .md"); return; }
    openDrawer("export", (head, body) => {
      drawerHead(head, "Export", "Contract as Markdown", { title: true });
      const ta = h("textarea", { readonly: true, "aria-label": "Contract Markdown" }); ta.value = md;
      body.appendChild(dsec("Copy blocked in this frame: select all and copy", h("div", { class: "export-box" }, ta)));
      setTimeout(() => ta.select(), 60);
    });
  }
  async function saveContract() {
    if (!downloads) return;
    try { await downloads.save({ filename: `membrane-contract-${M.version}.md`, data: buildMarkdown(!!(C.els.lockedOnly && C.els.lockedOnly.checked)) }); toast("Saved"); }
    catch (e) {
      const code = e && e.code;
      if (code === "declined") return;
      if (code === "rate_limited") { toast("A save prompt is already open"); return; }
      toast("Saving is unavailable here"); downloads = null; C.els.saveBtn.hidden = true;
    }
  }

  /* ================= Decisions view ================= */
  const D = { built: false, els: {} };
  function buildDecisions(root) {
    const byKey = { partly: [], research: [], no: [] };
    M.decisions.forEach((d) => byKey[resKey(d)].push(d));
    const owners = [...new Set(M.agents.filter((a) => a.owner && !/unknown|third|hostile/.test(a.owner)).map((a) => `${a.owner} (${a.name})`))];
    root.appendChild(h("div", { class: "view-head" },
      h("div", { class: "eyebrow" }, "Open decisions · " + M.decisions.length),
      h("h2", { tabindex: "-1", "data-focus": "" }, "Decisions"),
      h("p", { class: "lede" }, "What the playground cannot settle. Take a stance; the owners decide."),
      owners.length ? h("p", { class: "muted", style: { margin: 0, fontSize: "13.5px" } }, "Owners: " + owners.join(" and ") + "; each decides for his own agent.") : null,
      h("ul", { class: "counts" },
        h("li", {}, h("b", { class: "num" }, M.decisions.length), h("span", {}, "open decisions")),
        ["no", "research", "partly"].filter((k) => byKey[k].length).map((k) => h("li", {}, h("b", { class: "num" }, byKey[k].length), h("span", {}, RESOLVE[k].count))),
        h("li", {}, h("b", { class: "num", "data-stances": "" }, "0"), h("span", {}, "stances recorded")))));
    const cards = new Map();
    const group = (key, list) => h("section", { class: "dec-group" },
      h("header", {}, h("h3", {}, RESOLVE[key].title), h("p", {}, RESOLVE[key].sub)),
      h("div", { class: "decs" }, list.map((d, i) => {
        const tally = h("div", { class: "tally" });
        cards.set(d.id, tally);
        const sim = simLink(d, false);
        return h("article", { class: "card dec hov rise", style: { animationDelay: Math.min(i, 14) * 30 + "ms" } },
          h("div", { class: "dtop" }, h("span", { class: "did" }, d.id), h("span", { class: "badge" }, d.owner)),
          h("h3", { class: "dtitle" }, h("button", { class: "stretch", type: "button", "data-open-id": d.id, onclick: () => route("#/decisions/" + d.id) }, d.title)),
          h("p", { class: "q" }, d.q),
          d.settles ? h("p", { class: "settles" }, h("span", { class: "k" }, "Settled by "), d.settles) : h("p", { class: "whyl" }, d.why),
          sim ? h("p", { class: "simhint above" }, h("span", { class: "k" }, "Playground "), sim) : null,
          h("div", { class: "refs above" }, (d.refs || []).map(refChip)),
          tally);
      })));
    ["partly", "research", "no"].forEach((k) => { if (byKey[k].length) root.appendChild(group(k, byKey[k])); });
    D.els.cards = cards; D.els.stances = root.querySelector("[data-stances]");
    D.built = true; renderTallies();
  }
  function renderTallies() {
    if (!D.built) return;
    let total = 0;
    D.els.cards.forEach((el, id) => {
      const t = stanceTally(id); total += t.agree + t.disagree + t["needs-data"];
      const c = threadCount(id);
      clear(el); add(el, [h("span", {}, h("b", {}, t.agree), " agree"), h("span", {}, h("b", {}, t.disagree), " disagree"), h("span", {}, h("b", {}, t["needs-data"]), " need data"), c ? h("span", { style: { marginLeft: "auto" } }, icon("comment"), " ", c) : null]);
    });
    D.els.stances.textContent = String(total);
  }

  /* ================= Sources view ================= */
  function buildSources(root) {
    root.appendChild(h("div", { class: "view-head" },
      h("div", { class: "eyebrow" }, "References"),
      h("h2", { tabindex: "-1", "data-focus": "" }, "Sources"),
      h("p", { class: "lede" }, "The depth lives here; every chip on the page points into one of these.")));
    const anchors = M.paperAnchors;
    const titleOf = (slug) => {
      let m = slug.match(/^appendix-([a-d])--(.*)$/);
      if (m) return "Appendix " + m[1].toUpperCase() + ": " + m[2].replace(/-/g, " ");
      const s = slug.replace(/^\d+-/, "").replace(/-/g, " ");
      return s.charAt(0).toUpperCase() + s.slice(1);
    };
    const tops = Object.keys(anchors).filter((k) => !k.includes("."));
    const toc = h("ul", { class: "toc" }, tops.map((k) => {
      const subs = Object.keys(anchors).filter((s) => s.startsWith(k + "."));
      return h("li", {}, h("span", { class: "sn" }, /^\d+$|^[A-D]$/.test(k) ? "§" + k : ""),
        h("div", {}, h("a", { href: M.paper + "#" + anchors[k], target: "_blank", rel: "noopener" }, titleOf(anchors[k])),
          subs.length ? h("div", { class: "subs" }, subs.map((s) => h("a", { href: M.paper + "#" + anchors[s], target: "_blank", rel: "noopener" }, s + " " + titleOf(anchors[s])))) : null));
    }));
    const srcList = h("ul", { class: "src-list" }, Object.entries(M.sources).map(([code, s]) => h("li", {},
      h("span", { class: "code" }, code),
      h("div", {}, s.file ? h("a", { href: sourceUrl(s.file), target: "_blank", rel: "noopener" }, s.title) : h("span", {}, s.title, " ", h("span", { class: "badge" }, "private"))))));
    root.appendChild(h("div", { class: "src-grid" },
      h("section", { class: "card", "aria-labelledby": "h-paper" }, h("div", { class: "row", style: { justifyContent: "space-between", marginBottom: "10px" } }, h("h3", { id: "h-paper" }, "The paper"), h("a", { class: "btn", href: M.paper, target: "_blank", rel: "noopener" }, "Open working draft", icon("arrow"))), toc),
      h("div", {},
        h("section", { class: "card", "aria-labelledby": "h-research" }, h("h3", { id: "h-research", style: { marginBottom: "6px" } }, "Research and review"), srcList),
        h("section", { class: "card how", "aria-labelledby": "h-how" }, h("h3", { id: "h-how", style: { marginBottom: "8px" } }, "How references work"),
          h("p", { style: { fontSize: "14px", color: "var(--ink-2)", margin: 0 } }, "Each chip names its source: §6.2 is a paper section, R3·F5 is finding 5 of research file R3, Rev02·#7 is a second-reader finding, and S-codes point to private house records."),
          h("div", { class: "refs", style: { marginTop: "12px" } }, ["P§6.2", "R3·F5", "Rev02·#7", "S1·F10", "RFC 6710"].map(refChip))))));
  }

  /* ================= horizontal scrollers ================= */
  function edgeFade(el) {
    const upd = () => {
      const max = el.scrollWidth - el.clientWidth;
      el.style.setProperty("--fl", max > 2 && el.scrollLeft > 2 ? "24px" : "0px");
      el.style.setProperty("--fr", max > 2 && el.scrollLeft < max - 2 ? "32px" : "0px");
    };
    el.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    el.updFade = upd; upd();
    return upd;
  }
  /* returns true once the child is centred (or the scroll was issued), false if nothing could be done yet */
  function centerIn(container, child, behavior) {
    if (!container || !child || container.scrollWidth <= container.clientWidth + 1) return false;
    const cr = container.getBoundingClientRect(), r = child.getBoundingClientRect();
    if (!cr.width || !r.width) return false;
    const max = container.scrollWidth - container.clientWidth;
    const target = clamp(container.scrollLeft + (r.left + r.width / 2) - (cr.left + cr.width / 2), 0, max);
    const before = container.scrollLeft;
    if (Math.abs(target - before) < 2) return true;
    const b = behavior || (REDUCED ? "auto" : "smooth");
    container.scrollTo({ left: target, behavior: b });
    if (b === "auto") { if (Math.abs(container.scrollLeft - before) < 0.5) container.scrollLeft = target; return Math.abs(container.scrollLeft - before) >= 0.5; }
    return true;
  }

  /* ================= router ================= */
  const VIEWS = ["abstract", "contract", "playground", "gatekeeper", "decisions", "sources"];
  const built = {};
  let currentView = null;

  function parseHash() {
    const raw = (location.hash || "").replace(/^#\/?/, "");
    const [view, ...rest] = raw.split("/");
    return { view: VIEWS.includes(view) ? view : "abstract", param: rest.length ? decodeURIComponent(rest.join("/")) : null };
  }
  function placeholder(el, label) {
    clear(el);
    el.appendChild(h("div", { class: "card placeholder" }, h("div", { class: "pulse", "aria-hidden": "true" }), h("h2", { tabindex: "-1", "data-focus": "" }, label + " loading"), h("p", { class: "muted", style: { margin: 0 } }, "This part of the page has not arrived yet.")));
  }
  function mountExternal(name, el, param, label) {
    const V = window[name];
    if (!V || typeof V.mount !== "function") { if (el.dataset.mounted !== "placeholder") { placeholder(el, label); el.dataset.mounted = "placeholder"; } return; }
    if (el.dataset.mounted !== "1") {
      clear(el);
      try { V.mount(el); el.dataset.mounted = "1"; } catch (e) { console.error(e); placeholder(el, label); el.dataset.mounted = "placeholder"; return; }
    }
    if (typeof V.show === "function") { try { V.show(param || undefined); } catch (e) { console.error(e); } }
  }

  function onRoute() {
    const { view, param } = parseHash();
    const el = document.getElementById("view-" + view);
    const changed = view !== currentView;
    if (changed) {
      closeDrawer(false);
      VIEWS.forEach((v) => { const s = document.getElementById("view-" + v); if (s) s.hidden = v !== view; });
      document.querySelectorAll(".tabs a[data-view]").forEach((a) => { if (a.dataset.view === view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
      const tabs = document.querySelector(".tabs"), cur = tabs && tabs.querySelector('[aria-current="page"]');
      if (cur) requestAnimationFrame(() => centerIn(tabs, cur, booted ? undefined : "auto"));
      currentView = view;
    }
    Abstract.setActive(view === "abstract");

    if (view === "abstract" && !built.abstract) { buildAbstract(el); built.abstract = true; Abstract.setActive(true); }
    if (view === "contract") {
      if (!built.contract) { buildContract(el); built.contract = true; }
      if (param) {
        const e = INDEX.get(param);
        if (GROUPS.has(param)) { selectGroup(param, false); if (drawerKey && drawerKey.startsWith("item:")) closeDrawer(false); }
        else if (e && e.type === "item") { selectGroup(e.group.id, false); if (drawerKey !== "item:" + param) openItemDrawer(e.item); }
        else if (e) openItem(param);
      }
    }
    if (view === "contract" && C.built) {
      const fresh = changed;
      const centreRail = () => {
        const rail = C.els.rail, cur = rail && rail.querySelector('[aria-current="true"]');
        if (cur && centerIn(rail, cur, fresh ? "auto" : undefined)) C.centered = C.group;
        if (rail && rail.updFade) rail.updFade();
      };
      requestAnimationFrame(centreRail);
      if (fresh && document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(centreRail));
    }
    if (view === "decisions") {
      if (!built.decisions) { buildDecisions(el); built.decisions = true; }
      if (param) { const e = INDEX.get(param); if (e && e.type === "decision" && drawerKey !== "decision:" + param) openDecisionDrawer(e.item); }
    }
    if (view === "sources" && !built.sources) { buildSources(el); built.sources = true; }
    if (view === "playground") mountExternal("SimView", el, param, "Playground");
    if (view === "gatekeeper") mountExternal("GameView", el, param, "Gatekeeper");

    if (changed && booted) {
      window.scrollTo(0, 0);
      const target = el.querySelector("[data-focus]") || el.querySelector("h1,h2");
      if (target && !drawer.classList.contains("open")) {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      } else if (!target && !drawer.classList.contains("open")) { el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true }); }
    }
  }

  let booted = false;
  function boot() {
    const paperLink = document.getElementById("paper-link");
    if (paperLink) paperLink.href = M.paper;
    const foot = document.querySelector(".foot");
    if (foot) {
      const modeEl = h("span", { class: "store-mode", title: "Where comments, proposals, locks and stances are kept" });
      const setMode = () => { modeEl.textContent = "Notes: " + (S.mode === "shared" ? "shared" : "this browser only"); };
      setMode(); foot.appendChild(modeEl);
      document.addEventListener("store:shared", setMode);
    }
    const tabsEl = document.querySelector(".tabs");
    if (tabsEl) edgeFade(tabsEl);
    watchCollection("locks", "itemId");
    watchCollection("threads", "itemId");
    watchCollection("stances", "decisionId");
    liveListeners.add(() => {
      if (C.built) { renderSummary(); renderRail(); renderItems(false); }
      renderTallies();
    });
    if (window.claude && typeof window.claude.use === "function") {
      try {
        window.claude.use("downloads").then((ns) => { if (ns && typeof ns.save === "function") { downloads = ns; if (C.els.saveBtn) C.els.saveBtn.hidden = false; } }).catch(() => {});
      } catch (e) {}
    }
    window.addEventListener("hashchange", onRoute);
    if (!location.hash) history.replaceState(null, "", "#/abstract");
    onRoute();
    booted = true;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
