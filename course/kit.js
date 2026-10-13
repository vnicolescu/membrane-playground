/* Course kit: the renderer for lesson data (course/dev/CONTENT-FORMAT.md).
   Loads after spec.js, glyphs.js, gate.js and course/scenario.js. Exports window.Course:
     Course.parts(list), Course.lesson(obj)   collectors the lesson files call
     Course.widget(name, build)               widgets.js registers named interactives here
     Course.kit                               h, inline, term, refChip, block renderers, store, traceView, wireView
   No view hardcodes a field name or reason code: definitions come from window.MEMBRANE. */
(function () {
  "use strict";
  const M = window.MEMBRANE;
  const REPO = "https://github.com/vnicolescu/membrane-playground/blob/main/";
  const SPEC_URL = { A2A: "https://a2a-protocol.org/latest/specification/", MCP: "https://modelcontextprotocol.io/specification/2026-07-28" };
  /* where the Playground lives: next to this page in the repository, or a published copy when the page is hosted elsewhere */
  const playLink = (route) => window.COURSE_PLAYGROUND ? window.COURSE_PLAYGROUND : "index.html" + (route ? "#/" + route : "");
  const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- data collectors ---------- */
  const PARTS = [], LESSONS = [], WIDGETS = Object.create(null);
  const Course = window.Course = {
    parts: (list) => { (list || []).forEach((p) => { if (!PARTS.some((x) => x.id === p.id)) PARTS.push(p); }); },
    lesson: (o) => { if (o && o.id && !LESSONS.some((x) => x.id === o.id)) LESSONS.push(o); },
    widget: (name, build) => { WIDGETS[name] = build; },
    PARTS, LESSONS, WIDGETS
  };

  /* ---------- DOM ---------- */
  function h(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    if (attrs) for (const k of Object.keys(attrs)) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "style" && typeof v === "object") Object.assign(n.style, v);
      else if (k === "dataset") Object.assign(n.dataset, v);
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else if (k === "text") n.textContent = v;
      else n.setAttribute(k, v === true ? "" : v);
    }
    append(n, kids);
    return n;
  }
  function append(n, kids) {
    for (const c of kids.flat(Infinity)) {
      if (c == null || c === false) continue;
      n.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return n;
  }
  const svgEl = (tag, attrs, parent) => window.Glyphs.el(tag, attrs, parent);

  /* ---------- store: per-viewer progress, browser only ---------- */
  const KEY = "membrane-course:v1";
  const store = {
    data: (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })(),
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* private window: progress lives for this view only */ } },
    get(k, d) { return this.data[k] === undefined ? d : this.data[k]; },
    set(k, v) { this.data[k] = v; this.save(); document.dispatchEvent(new CustomEvent("course:progress")); },
    mark(kind, key, value) { const all = this.get(kind, {}); all[key] = value; this.set(kind, all); }
  };

  /* ---------- the contract: item lookup ---------- */
  const ITEMS = new Map();
  M.groups.forEach((g) => g.items.forEach((i) => ITEMS.set(i.id, Object.assign({ group: g.id, groupTitle: g.title }, i))));
  M.laws.forEach((l) => ITEMS.set(l.id, { id: l.id, name: l.id + " · " + l.name, kind: "law", groupTitle: "Design law", def: l.consequence, why: "Reached in: " + l.fields.join(", ") + ".", refs: l.refs }));
  const itemFor = (fieldOrId) => ITEMS.get(fieldOrId) || ITEMS.get("env." + fieldOrId) || ITEMS.get("ext." + fieldOrId) || null;

  /* ---------- references ---------- */
  function refChip(code) {
    code = String(code || "").trim();
    let m;
    const link = (href, label, title) => h("a", { class: "chip ref", href, target: "_blank", rel: "noopener", title: title || null }, label);
    if ((m = code.match(/^P§([^·\s]+)(.*)$/))) {
      const key = m[1], anchor = M.paperAnchors[key];
      return link(M.paper + (anchor ? "#" + anchor : ""), "§" + key + m[2], "Paper, " + (/^[A-D]$/.test(key) ? "appendix " + key : "section " + key));
    }
    if ((m = code.match(/^(Rev\d+)(?:·.*)?$/)) || (m = code.match(/^(R\d+)(?:·.*)?$/))) {
      const src = M.sources[m[1]];
      if (src && src.file) return link(REPO + src.file, code, src.title);
    }
    if ((m = code.match(/^(S\d+|Rev01)(?:·.*)?$/))) return h("span", { class: "chip", title: "house record, not published" }, code);
    if ((m = code.match(/^RFC\s*(\d+)/))) return link("https://www.rfc-editor.org/rfc/rfc" + m[1], code, "IETF " + code);
    if (/^A2A:/.test(code)) return link(SPEC_URL.A2A, code, "A2A v1.0 specification");
    if (/^MCP:/.test(code)) return link(SPEC_URL.MCP, code, "MCP specification 2026-07-28");
    return h("span", { class: "chip" }, code);
  }

  /* ---------- the term popover ---------- */
  let pop = null, popFor = null;
  function closePop() { if (pop) { pop.hidden = true; popFor = null; } }
  function openPop(anchor, item) {
    if (!pop) {
      pop = h("div", { class: "cx-pop", role: "dialog", "aria-label": "Definition" });
      pop.hidden = true;
      document.body.appendChild(pop);
      document.addEventListener("click", (e) => { if (pop && !pop.hidden && !pop.contains(e.target) && e.target !== popFor && !(popFor && popFor.contains(e.target))) closePop(); });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePop(); });
      window.addEventListener("scroll", closePop, { passive: true });
    }
    if (popFor === anchor && !pop.hidden) return closePop();
    pop.textContent = "";
    append(pop, [
      h("div", { class: "cx-pop-k" }, item.groupTitle || "Contract"),
      h("div", { class: "cx-pop-n" }, item.name),
      item.def ? h("p", null, item.def) : null,
      item.why ? h("p", { class: "cx-pop-why" }, h("b", null, "Why: "), item.why) : null,
      Array.isArray(item.enum) && item.enum.length ? h("ul", { class: "cx-pop-enum" }, item.enum.slice(0, 8).map((e) => h("li", null, h("code", null, e.v), " ", e.m || ""))) : null,
      item.a2a && item.a2a.map ? h("p", { class: "cx-pop-par" }, h("b", null, "MCP / A2A: "), item.a2a.map) : null,
      item.refs ? h("div", { class: "refs" }, item.refs.slice(0, 6).map(refChip)) : null
    ]);
    pop.hidden = false;
    popFor = anchor;
    const r = anchor.getBoundingClientRect();
    const w = Math.min(380, window.innerWidth - 24);
    pop.style.width = w + "px";
    let left = Math.min(Math.max(12, r.left), window.innerWidth - w - 12);
    pop.style.left = left + "px";
    const below = r.bottom + 8, ph = pop.offsetHeight;
    pop.style.top = (below + ph > window.innerHeight - 8 && r.top > ph + 16 ? r.top - ph - 8 : below) + "px";
  }
  function term(id, label) {
    const item = itemFor(id);
    if (!item) return h("code", null, label || id);
    const b = h("button", { type: "button", class: "term", "aria-haspopup": "dialog", title: item.def || "" }, label || item.name.split(" · ")[0]);
    b.addEventListener("click", (e) => { e.stopPropagation(); openPop(b, item); });
    return b;
  }

  /* ---------- inline markup ---------- */
  const TOKEN = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\s\n][^*\n]*\*)|(\[\[[^\]\n]+\]\])|(\{\{[^}\n]+\}\})|(\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))/g;
  function inline(text) {
    const frag = document.createDocumentFragment();
    const s = String(text == null ? "" : text);
    let last = 0, m;
    const re = new RegExp(TOKEN.source, "g"); // own regex per call: inline() recurses for bold and italic
    while ((m = re.exec(s))) {
      if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
      const tok = m[0];
      if (m[1]) frag.appendChild(h("code", null, tok.slice(1, -1)));
      else if (m[2]) frag.appendChild(h("strong", null, inline(tok.slice(2, -2))));
      else if (m[3]) frag.appendChild(h("em", null, inline(tok.slice(1, -1))));
      else if (m[4]) {
        const inner = tok.slice(2, -2);
        if (inner.startsWith("lesson:")) {
          const [id, label] = inner.slice(7).split("|");
          const L = LESSONS.find((x) => x.id === id.trim());
          frag.appendChild(h("a", { class: "lessonlink", href: "#" + id.trim() }, label || (L ? L.title : id)));
        } else {
          const chip = refChip(inner);
          const tail = /^[.,;:)\]]+/.exec(s.slice(re.lastIndex));
          if (tail) { frag.appendChild(h("span", { class: "nb" }, chip, tail[0])); re.lastIndex += tail[0].length; last = re.lastIndex; continue; }
          frag.appendChild(chip);
        }
      } else if (m[5]) {
        const [id, label] = tok.slice(2, -2).split("|");
        frag.appendChild(term(id.trim(), label && label.trim()));
      } else if (m[6]) {
        const mm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok);
        frag.appendChild(h("a", { href: mm[2], target: "_blank", rel: "noopener" }, mm[1]));
      }
      last = m.index + tok.length;
    }
    if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    return frag;
  }

  /* ---------- wire and code ---------- */
  const INVISIBLE = /[\u0000-\u0009\u000b-\u001f\u007f\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/g;
  const INV_NAME = { "\u200b": "ZWSP", "\u200c": "ZWNJ", "\u200d": "ZWJ", "\u200e": "LRM", "\u200f": "RLM", "\u2060": "WJ", "\ufeff": "BOM", "\u00ad": "SHY", "\r": "CR", "\t": "TAB" };
  function visible(text) {
    const frag = document.createDocumentFragment(), str = String(text);
    let last = 0, m;
    INVISIBLE.lastIndex = 0;
    while ((m = INVISIBLE.exec(str))) {
      if (m.index > last) frag.appendChild(document.createTextNode(str.slice(last, m.index)));
      const c = m[0];
      frag.appendChild(h("span", { class: "inv", title: "invisible character U+" + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") }, INV_NAME[c] || "U+" + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")));
      last = m.index + 1;
    }
    if (last < str.length) frag.appendChild(document.createTextNode(str.slice(last)));
    return frag;
  }
  function wireView(text, mark, diff) {
    const marks = new Set(mark || []);
    const pre = h("pre", { class: "wire", "aria-label": "Membrane message" });
    const s = String(text);
    const cut = s.indexOf("\n---\n");
    const head = cut >= 0 ? s.slice(0, cut) : s;
    const body = cut >= 0 ? s.slice(cut + 5) : null;
    head.split("\n").forEach((line) => {
      const i = line.indexOf(":");
      const k = i > 0 ? line.slice(0, i) : "";
      const row = h("span", { class: "wl" + (marks.has(k) ? " mark" : "") + (diff && diff.keys.has(k) ? " diff" : ""), dataset: { k } });
      if (k) {
        const item = itemFor(k);
        if (item) { const t = term(item.id, k); t.classList.add("wk"); row.appendChild(t); } else row.appendChild(h("span", { class: "wk" }, k));
        row.appendChild(h("span", { class: "wc" }, ":"));
        row.appendChild(h("span", { class: "wv" }, visible(line.slice(i + 1))));
      } else row.appendChild(visible(line));
      pre.appendChild(row);
    });
    if (body != null) {
      pre.appendChild(h("span", { class: "wl wdash" }, "---"));
      pre.appendChild(h("span", { class: "wb" + (diff && diff.body ? " diff" : "") }, visible(body.replace(/\n$/, ""))));
    }
    return pre;
  }
  function codeView(lang, text, mark) {
    const marks = new Set(mark || []);
    const pre = h("pre", { class: "code lang-" + (lang || "text") });
    String(text).replace(/\n$/, "").split("\n").forEach((line, i) => {
      const ind = /^ */.exec(line)[0].length + 2; // a wrapped line continues under its own indent plus two
      const row = h("span", { class: "cl" + (marks.has(i + 1) ? " mark" : ""), style: { paddingLeft: ind + "ch", textIndent: -ind + "ch" } });
      if (lang === "json" || lang === "js") {
        const re = /("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false|null)\b|(-?\b\d+(?:\.\d+)?\b)|(\/\/.*$)/g;
        let last = 0, m;
        while ((m = re.exec(line))) {
          if (m.index > last) row.appendChild(document.createTextNode(line.slice(last, m.index)));
          if (m[1]) { row.appendChild(h("span", { class: m[2] ? "jk" : "js" }, m[1])); if (m[2]) row.appendChild(document.createTextNode(m[2])); }
          else if (m[3]) row.appendChild(h("span", { class: "jb" }, m[3]));
          else if (m[4]) row.appendChild(h("span", { class: "jn" }, m[4]));
          else if (m[5]) row.appendChild(h("span", { class: "jc" }, m[5]));
          last = m.index + m[0].length;
        }
        if (last < line.length) row.appendChild(document.createTextNode(line.slice(last)));
      } else if (lang === "http") {
        const m = /^([A-Za-z-]+)(:\s?)(.*)$/.exec(line);
        if (m && !/^(GET|POST|PUT|DELETE|HTTP)/.test(line)) { row.appendChild(h("span", { class: "jk" }, m[1])); row.appendChild(document.createTextNode(m[2] + m[3])); }
        else row.appendChild(h("span", { class: /^(GET|POST|PUT|DELETE|HTTP)/.test(line) ? "jh" : "" }, line));
      } else row.textContent = line;
      pre.appendChild(row);
    });
    return pre;
  }
  const figure = (inner, caption) => h("figure", { class: "cx-fig" }, inner, caption ? h("figcaption", null, inline(caption)) : null);

  /* ---------- feedback helpers ---------- */
  function verdict(ok, text) { return h("div", { class: "fb " + (ok ? "ok" : "no"), role: "status" }, h("b", null, ok ? "Right. " : "Not quite. "), inline(text || "")); }
  const blockKey = (ctx, i) => (ctx && ctx.lesson ? ctx.lesson.id : "x") + ":" + i;

  /* ---------- blocks ---------- */
  const B = {};
  B.p = (b) => h("p", null, inline(b.text));
  B.h = (b) => h("h3", { class: "cx-h" }, inline(b.text));
  B.list = (b) => h(b.ordered ? "ol" : "ul", { class: "cx-list" }, (b.items || []).map((t) => h("li", null, inline(t))));
  B.define = (b) => {
    const panel = h("div", { class: "term-defs", "aria-live": "polite" });
    const words = (b.terms || []).map((t, j) => {
      const btn = h("button", { type: "button", class: "term-word", "aria-expanded": "false" }, inline(t.term));
      btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") === "true";
        words.forEach((w) => w.setAttribute("aria-expanded", "false"));
        panel.textContent = "";
        if (!open) { btn.setAttribute("aria-expanded", "true"); panel.appendChild(h("div", { class: "term-def" }, h("b", null, inline(t.term)), inline(t.def), t.ref ? h("span", { class: "refs" }, " ", [].concat(t.ref).map(refChip)) : null)); }
      });
      return btn;
    });
    const all = h("button", { type: "button", class: "btn ghost small" }, "Show all");
    all.addEventListener("click", () => { words.forEach((w) => w.setAttribute("aria-expanded", "false")); panel.textContent = ""; (b.terms || []).forEach((t) => panel.appendChild(h("div", { class: "term-def" }, h("b", null, inline(t.term)), inline(t.def)))); });
    return h("div", { class: "cx-terms" }, h("div", { class: "terms-row" }, h("span", { class: "terms-k" }, b.title || "Words used here"), words, (b.terms || []).length > 1 ? all : null), panel);
  };
  const CALLOUT = { law: "Law", parent: "In MCP and A2A", field: "Another field got here first", warn: "Careful", note: "Note", brobber: "From brobber's pack", web: "Checked on the web", history: "History" };
  B.callout = (b) => {
    const law = b.law && M.laws.find((l) => l.id === b.law);
    return h("aside", { class: "callout " + (b.kind || "note") },
      h("div", { class: "callout-k" }, law ? law.id + " · law" : CALLOUT[b.kind] || "Note"),
      b.title || law ? h("div", { class: "callout-t" }, inline(b.title || law.name)) : null,
      b.text ? h("div", { class: "callout-b" }, inline(b.text)) : null,
      law && !b.text ? h("div", { class: "callout-b" }, inline(law.consequence)) : null,
      law ? h("div", { class: "callout-f" }, "Reached in " + law.fields.join(" · ")) : null);
  };
  B.wire = (b) => figure(wireView(b.text, b.mark), b.caption);
  B.code = (b) => figure(codeView(b.lang, b.text, b.mark), b.caption);
  B.table = (b) => { const long = (b.rows || []).length > 8; const tbl = figure(h("div", { class: "scroll" }, h("table", { class: "t cx-t" + (long ? " longtable" : "") },
    h("thead", null, h("tr", null, (b.head || []).map((c) => h("th", null, inline(c))))),
    h("tbody", null, (b.rows || []).map((r) => h("tr", null, r.map((c, j) => h("td", { "data-label": (b.head || [])[j] ? String(b.head[j]).replace(/[`*]/g, "") : null }, inline(c)))))))), b.caption);
    if (long) { const btn = h("button", { type: "button", class: "btn ghost small table-more" }, "Show all " + b.rows.length + " rows"); btn.addEventListener("click", () => { tbl.classList.toggle("expanded"); btn.textContent = tbl.classList.contains("expanded") ? "Show fewer rows" : "Show all " + b.rows.length + " rows"; }); tbl.appendChild(btn); }
    return tbl; };
  B.compare = (b) => figure(h("div", { class: "cx-compare", style: { "--n": (b.cols || []).length } }, (b.cols || []).map((c) =>
    h("div", { class: "col" }, h("h4", null, inline(c.title)), c.text ? h("p", null, inline(c.text)) : null, c.items ? h("ul", null, c.items.map((t) => h("li", null, inline(t)))) : null))), b.caption);
  B.takeaways = (b) => h("section", { class: "cx-take" }, h("h4", null, "Keep"), h("ol", null, (b.items || []).map((t) => h("li", null, inline(t)))));
  B.deeper = (b) => h("section", { class: "cx-deeper" }, h("h4", null, "Go deeper"), h("ul", { class: "deeper-list" }, (b.links || []).map((l) => {
    const a = deeperLink(l); if (a) a.classList.remove("chip"); return h("li", null, a);
  })));
  const deeperLink = (l) => {
    if (l.ref) return refChip(l.ref);
    if (l.research) { const src = M.sources[l.research]; return h("a", { class: "chip ref", href: REPO + (src && src.file || ""), target: "_blank", rel: "noopener" }, l.label || (l.research + (src ? " · " + src.title : ""))); }
    if (l.scenario) { const sc = M.scenarios.find((s) => s.id === l.scenario); return h("a", { class: "chip ref play", href: playLink("playground/" + l.scenario), target: "_blank", rel: "noopener", title: "Opens the Playground" }, "Playground · " + (sc ? sc.title : l.scenario)); }
    if (l.challenge) { const c = M.challenges.find((x) => x.id === l.challenge); return h("a", { class: "chip ref play", href: playLink("gatekeeper/" + l.challenge), target: "_blank", rel: "noopener" }, "Gatekeeper · " + (c ? c.title : l.challenge)); }
    if (l.lesson) return h("a", { class: "chip lessonlink", href: "#" + l.lesson }, l.label || l.lesson);
    if (l.playground != null) return h("a", { class: "chip ref play", href: playLink(l.playground || ""), target: "_blank", rel: "noopener" }, l.label || "The Playground");
    return h("a", { class: "chip ref", href: l.href, target: "_blank", rel: "noopener" }, l.label || l.href);
  };
  B.tutor = (b, ctx) => { if (ctx) ctx.tutorPrompts = (ctx.tutorPrompts || []).concat(b.prompts || []); return null; };

  /* quiz */
  B.quiz = (b, ctx, i) => {
    const key = blockKey(ctx, i);
    const prior = (store.get("answers", {}))[key];
    const out = h("div", { class: "fbwrap" });
    let firstOk = prior && prior.kind === "quiz" ? prior.ok : undefined; // the first attempt counts; later choices only show feedback
    // display order: a permutation seeded by the quiz's key, so where the right answer sits varies across the course and stays put on reload
    const order = b.shuffle === false ? (b.options || []).map((_, j) => j) : window.Scenario.quizOrder(key, (b.options || []).length);
    const optByIndex = {};
    const opts = order.map((j, pos) => { const btn = h("button", { type: "button", class: "opt", onclick: () => choose(j) }, h("span", { class: "opt-l" }, String.fromCharCode(65 + pos)), h("span", null, inline(b.options[j]))); optByIndex[j] = btn; return btn; });
    function choose(j, silent) {
      Object.entries(optByIndex).forEach(([k0, btn]) => { const k = Number(k0); btn.classList.toggle("chosen", k === j); btn.classList.toggle("right", k === b.answer); btn.classList.toggle("wrong", k === j && j !== b.answer); btn.setAttribute("aria-pressed", k === j ? "true" : "false"); });
      out.textContent = "";
      const why = b.why && b.why[j] ? b.why[j] + " " : "";
      out.appendChild(verdict(j === b.answer, why + (b.explain || "")));
      if (!silent) { if (firstOk === undefined) firstOk = j === b.answer; store.mark("answers", key, { ok: firstOk, choice: j, kind: "quiz" }); }
    }
    const el = h("div", { class: "cx-check quiz" }, h("div", { class: "check-k" }, "Check"), h("div", { class: "check-q" }, inline(b.q)), h("div", { class: "opts" }, opts), out);
    if (prior && prior.kind === "quiz") choose(prior.choice, true);
    return el;
  };

  /* sort */
  B.sort = (b, ctx, i) => {
    const key = blockKey(ctx, i);
    let sel = null, misses = 0;
    const placed = new Map();
    const fb = h("div", { class: "fbwrap" });
    const pool = h("div", { class: "sort-pool", "aria-label": "Items to place" });
    const bucketEls = {};
    const items = (b.items || []).map((it, j) => {
      const btn = h("button", { type: "button", class: "sort-item", onclick: () => pick(j) }, inline(it.text));
      return { it, btn, j };
    });
    function pick(j) {
      if (placed.get(j)) return;
      sel = sel === j ? null : j;
      items.forEach((x) => x.btn.classList.toggle("sel", x.j === sel));
      Object.values(bucketEls).forEach((bk) => bk.classList.toggle("armed", sel != null));
      wrap.classList.toggle("armed", sel != null);
    }
    function drop(bid) {
      if (sel == null) return;
      const x = items[sel];
      const ok = x.it.bucket === bid;
      fb.textContent = "";
      fb.appendChild(verdict(ok, x.it.why || ""));
      if (ok) { placed.set(sel, bid); x.btn.classList.remove("sel"); x.btn.classList.add("done"); x.btn.disabled = true; bucketEls[bid].querySelector(".bucket-items").appendChild(x.btn); }
      else { misses++; x.btn.classList.add("shake"); setTimeout(() => x.btn.classList.remove("shake"), 400); }
      sel = null;
      items.forEach((y) => y.btn.classList.remove("sel"));
      Object.values(bucketEls).forEach((bk) => bk.classList.remove("armed"));
      wrap.classList.remove("armed");
      if (placed.size === items.length) { fb.appendChild(h("div", { class: "fb ok" }, h("b", null, "All placed. "), misses ? misses + (misses === 1 ? " item" : " items") + " needed a second try." : "First time, every one.")); const prev = store.get("answers", {})[key]; if (!prev) store.mark("answers", key, { ok: misses === 0, misses, kind: "sort" }); }
    }
    items.forEach((x) => pool.appendChild(x.btn));
    const buckets = h("div", { class: "sort-buckets", style: { "--n": (b.buckets || []).length } }, (b.buckets || []).map((bk) => {
      const el = h("button", { type: "button", class: "bucket", onclick: () => drop(bk.id) }, h("span", { class: "bucket-l" }, inline(bk.label)), h("span", { class: "bucket-items" }));
      bucketEls[bk.id] = el;
      return el;
    }));
    const wrap = h("div", { class: "cx-check sort" }, h("div", { class: "check-k" }, "Sort"), b.prompt ? h("div", { class: "check-q" }, inline(b.prompt)) : null, h("div", { class: "sort-how" }, "Tap an item, then the bucket it belongs in."), pool, buckets, fb);
    return wrap;
  };

  /* steps */
  B.steps = (b) => {
    const frames = b.frames || [];
    let k = 0;
    const stage = h("div", { class: "steps-stage", "aria-live": "polite" });
    const dots = h("div", { class: "steps-dots" }, frames.map((f, j) => h("button", { type: "button", class: "dot", "aria-label": "Step " + (j + 1), onclick: () => go(j) })));
    const prev = h("button", { type: "button", class: "btn", onclick: () => go(k - 1) }, "Back");
    const next = h("button", { type: "button", class: "btn primary", onclick: () => go(k + 1) }, "Next");
    function actorRow(actor) {
      const m = /^(.*?)\s*(?:→|->)\s*(.*)$/.exec(actor || "");
      if (!m) return actor ? h("div", { class: "actor" }, actor) : null;
      return h("div", { class: "actor hop" }, h("span", { class: "a-from" }, m[1]), h("span", { class: "a-line" }, h("span", { class: "a-env" })), h("span", { class: "a-to" }, m[2]));
    }
    function go(j) {
      if (j < 0 || j >= frames.length) return;
      k = j;
      const f = frames[k];
      stage.textContent = "";
      append(stage, [
        h("div", { class: "steps-n num" }, (k + 1) + " / " + frames.length),
        h("div", { class: "steps-t" }, inline(f.title)),
        actorRow(f.actor),
        f.text ? h("p", null, inline(f.text)) : null,
        f.wire ? wireView(f.wire, f.mark) : null,
        f.code ? codeView(f.lang || "json", f.code, f.mark) : null
      ]);
      [...dots.children].forEach((d, i) => d.classList.toggle("on", i === k));
      prev.disabled = k === 0; next.disabled = k === frames.length - 1;
    }
    const el = h("div", { class: "cx-steps", tabindex: "0", onkeydown: (e) => { if (e.key === "ArrowRight") go(k + 1); if (e.key === "ArrowLeft") go(k - 1); } },
      b.title ? h("div", { class: "check-k" }, inline(b.title)) : null, stage, h("div", { class: "steps-nav" }, prev, dots, next));
    go(0);
    return el;
  };

  /* machine */
  B.machine = (b, ctx, i) => {
    const narrow = window.innerWidth < 640; // on a phone the graph becomes an ordered list of states; the transition buttons carry the edges
    const W = 640, H = 340, PAD = 46;
    const states = b.states || [], edges = b.edges || [];
    const pos = (s) => ({ x: PAD + (s.x / 100) * (W - 2 * PAD), y: PAD * 0.7 + (s.y / 100) * (H - 1.4 * PAD) });
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "machine-svg", role: "img", "aria-label": b.title || "State machine" });
    const KIND_ORDER = { start: 0, active: 1, interrupted: 2, terminal: 3 };
    const listEl = h("ol", { class: "m-list", "aria-label": "States" }, states.slice().sort((a, c) => (KIND_ORDER[a.kind] ?? 1) - (KIND_ORDER[c.kind] ?? 1) || a.x - c.x || a.y - c.y).map((st) =>
      h("li", { class: "m-item k-" + (st.kind || "active"), dataset: { id: st.id } }, h("span", { class: "m-item-l" }, st.label || st.id), h("span", { class: "m-item-k" }, st.kind === "terminal" ? "terminal" : st.kind === "interrupted" ? "waits" : st.kind === "start" ? "start" : ""))));
    const defs = svgEl("defs", {}, svg);
    const mk = svgEl("marker", { id: "arr-" + i, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
    svgEl("path", { d: "M0,0 L10,5 L0,10 z", fill: "var(--ink-3)" }, mk);
    const nodeG = {}, edgeG = [];
    edges.forEach((e, j) => {
      const a = states.find((s) => s.id === e.from), c = states.find((s) => s.id === e.to);
      if (!a || !c) return;
      const p = pos(a), q = pos(c);
      const g = svgEl("g", { class: "m-edge" }, svg);
      if (a === c) {
        svgEl("path", { d: `M${p.x - 14},${p.y - 18} C${p.x - 40},${p.y - 70} ${p.x + 40},${p.y - 70} ${p.x + 14},${p.y - 18}`, fill: "none", stroke: "var(--rule-strong)", "stroke-width": 1.4, "marker-end": `url(#arr-${i})` }, g);
      } else {
        const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
        const bend = edges.some((o) => o.from === e.to && o.to === e.from) ? 22 : 0;
        const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
        const shrink = (x0, y0, x1, y1, r) => { const L = Math.hypot(x1 - x0, y1 - y0) || 1; return [x1 - ((x1 - x0) / L) * r, y1 - ((y1 - y0) / L) * r]; };
        const [sx, sy] = shrink(cx, cy, p.x, p.y, 30), [ex, ey] = shrink(cx, cy, q.x, q.y, 34);
        svgEl("path", { d: `M${sx},${sy} Q${cx},${cy} ${ex},${ey}`, fill: "none", stroke: "var(--rule-strong)", "stroke-width": 1.4, "marker-end": `url(#arr-${i})` }, g);
      }
      edgeG.push({ e, g });
    });
    states.forEach((s) => {
      const p = pos(s);
      const g = svgEl("g", { class: "m-node k-" + (s.kind || "active"), transform: `translate(${p.x},${p.y})` }, svg);
      const label = String(s.label || s.id);
      const w = Math.max(64, label.length * 7.2 + 22);
      svgEl("rect", { x: -w / 2, y: -15, width: w, height: 30, rx: s.kind === "terminal" ? 4 : 15, class: "m-box" }, g);
      if (s.kind === "terminal") svgEl("rect", { x: -w / 2 + 3, y: -12, width: w - 6, height: 24, rx: 2, class: "m-inner" }, g);
      const t = svgEl("text", { "text-anchor": "middle", y: 4.5, class: "m-label" }, g); t.textContent = label;
      nodeG[s.id] = g;
    });
    let cur = b.start || (states[0] && states[0].id);
    const trail = [cur];
    // targets: [{ text, state, via?: [ids], avoid?: [ids] }] tick when the walk reaches `state` having passed every `via` and no `avoid`
    const targets = b.targets || [], tkey = (j) => blockKey(ctx, i) + ":target:" + j, answersM = store.get("answers", {});
    const targetBox = targets.length ? h("ul", { class: "goals m-targets" }) : null;
    function renderTargets() {
      if (!targetBox) return;
      targets.forEach((t, j) => {
        if (answersM[tkey(j)]) return;
        const hit = cur === t.state && (t.via || []).every((v) => trail.includes(v)) && !(t.avoid || []).some((v) => trail.includes(v));
        if (hit) { answersM[tkey(j)] = { ok: true, kind: "make" }; store.mark("answers", tkey(j), answersM[tkey(j)]); }
      });
      targetBox.textContent = "";
      targets.forEach((t, j) => { const ok = !!answersM[tkey(j)]; targetBox.appendChild(h("li", { class: "goal" + (ok ? " done" : "") }, h("span", { class: "goal-box", "aria-hidden": "true" }, ok ? "✓" : ""), h("span", null, inline(t.text)))); });
    }
    const choices = h("div", { class: "m-choices" });
    const note = h("div", { class: "m-note", "aria-live": "polite" });
    function render() {
      Object.entries(nodeG).forEach(([id, g]) => { g.classList.toggle("cur", id === cur); g.classList.toggle("seen", trail.includes(id) && id !== cur); });
      [...listEl.children].forEach((li) => { li.classList.toggle("cur", li.dataset.id === cur); li.classList.toggle("seen", trail.includes(li.dataset.id) && li.dataset.id !== cur); });
      edgeG.forEach(({ e, g }) => g.classList.toggle("live", e.from === cur));
      const s = states.find((x) => x.id === cur);
      note.textContent = "";
      append(note, [h("b", null, s ? s.label : cur), s && s.note ? h("span", null, " · ", inline(s.note)) : null]);
      choices.textContent = "";
      const out = edges.filter((e) => e.from === cur);
      if (!out.length) choices.appendChild(h("span", { class: "muted" }, "No way out of this state: it is terminal."));
      out.forEach((e) => choices.appendChild(h("button", { type: "button", class: "btn", onclick: () => { cur = e.to; trail.push(cur); render(); } }, inline(e.label || "→ " + e.to), " → ", states.find((x) => x.id === e.to).label)));
      choices.appendChild(h("button", { type: "button", class: "btn ghost", onclick: () => { cur = b.start || states[0].id; trail.length = 0; trail.push(cur); render(); } }, "Reset"));
      renderTargets();
    }
    render();
    return h("div", { class: "cx-check machine" }, h("div", { class: "check-k" }, inline(b.title || "State machine")), b.prompt ? h("div", { class: "check-q" }, inline(b.prompt)) : null, targetBox,
      narrow ? listEl : h("div", { class: "scroll" }, svg), note, choices, b.caption ? h("div", { class: "cap" }, inline(b.caption)) : null);
  };

  /* widgets and figures */
  B.widget = B.figure = (b, ctx, i) => {
    const build = WIDGETS[b.name];
    if (build) {
      try { return h("div", { class: "cx-widget w-" + b.name }, build(b.props || {}, b, { h, inline, term, refChip, wireView, codeView, traceView, store, key: blockKey(ctx, i), lesson: ctx && ctx.lesson }), b.caption ? h("div", { class: "cap" }, inline(b.caption)) : null); }
      catch (e) { console.error("widget " + b.name, e); }
    }
    return h("div", { class: "cx-widget missing" }, h("div", { class: "check-k" }, "Interactive · " + b.name), b.spec ? h("p", { class: "muted" }, inline(b.spec)) : null);
  };

  /* ---------- the gate lab ---------- */
  const STEP_ORDER = Object.keys(window.Gate.STEPS);
  const dispClass = (d) => (d == null ? "logged" : d);
  const dispName = (d) => (d == null ? "no disposition (logged only)" : d);
  /* which lesson teaches each gate step: a lesson may list its own in `gateSteps`; this is the fallback */
  const STEP_LESSON = { signature: "gatekeeper", lane: "gatekeeper", scope: "gatekeeper", syntax: "envelope", version: "envelope", addressed: "envelope", duplicate: "dispositions", clock: "envelope",
    expiry: "dispositions", contract: "contracts", crit: "envelope", turn: "contracts", rate: "gatekeeper", paused: "gatekeeper", seal: "dispositions", effect: "effects", evidence: "evidence",
    standing: "standing", sensor: "gatekeeper", budget: "gatekeeper", release: "effects" };
  function teacherOfStep(id) {
    const own = LESSONS.find((L) => (L.gateSteps || []).includes(id));
    return own || LESSONS.find((L) => L.id === STEP_LESSON[id]) || null;
  }
  const coreIds = () => (Course.coreIds || LESSONS.map((L) => L.id));
  /* a step is "later" for a reader on lesson `cur` when the lesson that teaches it comes after `cur` in the core and is not finished */
  function stepLater(id, cur) {
    if (!cur) return null;
    const T = teacherOfStep(id); if (!T) return null;
    const ids = coreIds(), ti = ids.indexOf(T.id), ci = ids.indexOf(cur.id);
    if (ti < 0 || ci < 0 || ti <= ci) return null;
    if ((store.get("done", {}))[T.id]) return null;
    return { lesson: T, n: ti + 1 };
  }
  Course.teacherOfStep = teacherOfStep;

  function traceView(trace, opts) {
    const cur = opts && opts.lesson;
    const byId = new Map(trace.steps.map((s) => [s.id, s]));
    const decisive = trace.decisiveStep;
    const dc = dispClass(trace.disposition);
    const bar = membraneBar(trace, byId);
    const rows = h("ol", { class: "trace" }, STEP_ORDER.map((id, n) => {
      const s = byId.get(id);
      const st = !s ? "skip" : s.id === decisive ? "dec" : s.ok === true ? "pass" : s.ok === "flag" ? "flag" : "fail";
      const icon = { skip: "·", dec: "◆", pass: "✓", flag: "⚑", fail: "✕" }[st];
      const later = st !== "dec" ? stepLater(id, cur) : null;
      const ref = s && s.ref && itemFor(s.ref) && (st === "dec" || st === "fail" || st === "flag") ? term(s.ref, s.ref) : null; // the contract item behind a row shows where it decided or objected
      return h("li", { class: "tr " + st + (st === "dec" ? " d-" + dc : "") + (later ? " later" : ""), style: { "--i": n } },
        h("span", { class: "tr-n num" }, n + 1), h("span", { class: "tr-i", "aria-hidden": "true" }, icon),
        h("span", { class: "tr-l" }, window.Gate.STEPS[id].label),
        h("span", { class: "tr-note" }, later ? h("a", { class: "later-link", href: "#" + later.lesson.id }, "taught in lesson " + later.n + " · " + later.lesson.title) : s ? sensorNote(id, s, trace) : "not reached"),
        h("span", { class: "tr-ref" }, later ? null : ref));
    }));
    if (!reduceMotion()) rows.classList.add("anim");
    const fold = h("details", { class: "trace-fold", open: window.innerWidth >= 900 ? true : null }, h("summary", null, "All 21 steps"), rows);
    return h("div", { class: "tracebox" }, bar, fold);
  }
  // the sensor row prints all four label fields, so a reader can see which one the hold rule read
  function sensorNote(id, s, trace) {
    const L = trace.sensor;
    if (id !== "sensor" || !L || !/^impact /.test(s.note || "")) return s.note || "";
    return "impact " + L.impact + ", reach " + L.reach + ", asks_for_action " + !!L.asks_for_action + ", injection_suspected " + !!L.injection_suspected + (s.ok === true ? "" : ": hold");
  }
  /* the trace bar as a membrane: 21 heads in two leaflets, the envelope parked at the deciding step.
     On a phone the membrane folds into two rows (steps 1–11, 12–21) so heads and numerals keep a readable size. */
  function membraneBar(trace, byId) {
    const narrow = window.innerWidth <= 560, perRow = narrow ? 11 : 21, rowH = 70;
    const W = narrow ? 340 : 640, H = narrow ? 2 * rowH - 4 : 66, x0 = 22, dx = (W - 44) / (perRow - 1);
    const at = (n) => ({ x: x0 + (n % perRow) * dx, y: Math.floor(n / perRow) * rowH });
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "tmem", role: "img", "aria-label": "The gate's 21 steps; the message stopped at step " + (STEP_ORDER.indexOf(trace.decisiveStep) + 1) });
    const dIdx = STEP_ORDER.indexOf(trace.decisiveStep), dc = dispClass(trace.disposition);
    const DC = { admitted: "--admitted", held: "--held", refused: "--refused", expired: "--expired", logged: "--logged" };
    STEP_ORDER.forEach((id, n) => {
      const s = byId.get(id), { x, y: oy } = at(n);
      const st = !s ? "skip" : n === dIdx ? "dec" : s.ok === true ? "pass" : s.ok === "flag" ? "flag" : "fail";
      const fill = st === "pass" ? "var(--lipid)" : st === "flag" ? "var(--accent)" : st === "dec" ? "var(" + (DC[dc] || "--ink") + ")" : st === "fail" ? "var(--ink)" : "none";
      const stroke = st === "skip" ? "var(--rule-strong)" : "none";
      svgEl("path", { d: `M${x - 2},${oy + 20} Q${x - 4},${oy + 28} ${x - 2},${oy + 33} M${x + 2},${oy + 20} Q${x + 4},${oy + 28} ${x + 2},${oy + 33} M${x - 2},${oy + 37} Q${x - 4},${oy + 40} ${x - 2},${oy + 46} M${x + 2},${oy + 37} Q${x + 4},${oy + 40} ${x + 2},${oy + 46}`, fill: "none", stroke: st === "skip" ? "var(--rule)" : "var(--lipid)", "stroke-width": .9, opacity: st === "skip" ? .5 : .6 }, svg);
      svgEl("circle", { cx: x, cy: oy + 16, r: 5.2, fill, stroke, "stroke-width": 1.2 }, svg);
      svgEl("circle", { cx: x, cy: oy + 50, r: 5.2, fill, stroke, "stroke-width": 1.2 }, svg);
      // numerals: every step on a phone; on a wide bar the landmarks and the deciding step, never two side by side
      const landmark = [0, 4, 9, 14, 20].includes(n) && Math.abs(n - dIdx) > 1;
      if (narrow || landmark || n === dIdx) { const t = svgEl("text", { x, y: oy + 64, "text-anchor": "middle", "font-weight": n === dIdx ? 600 : null }, svg); t.textContent = String(n + 1); }
    });
    if (dIdx >= 0) { const p = at(dIdx); const env = window.Glyphs.envelope(svg, { x: p.x, y: p.y + 33, w: 22, h: 15, state: dc === "logged" ? "sent" : dc }); env.classList.add("tmem-env"); }
    return svg;
  }

  const FIELD_LESSON = { tier: "effects", admittedAs: "evidence", awaiting: "effects", answerScope: "effects", standing: "standing", receipt: "dispositions" };
  function laterTag(field, cur) {
    if (!cur) return null;
    const T = LESSONS.find((L) => L.id === FIELD_LESSON[field]); if (!T) return null;
    const ids = coreIds(), ti = ids.indexOf(T.id), ci = ids.indexOf(cur.id);
    if (ti < 0 || ci < 0 || ti <= ci || (store.get("done", {}))[T.id]) return null;
    return h("a", { class: "res-later", href: "#" + T.id }, "(lesson " + (ti + 1) + ")");
  }
  function resultView(trace, opts) {
    const cur = opts && opts.lesson;
    const d = trace.disposition, dc = dispClass(d);
    const receipt = trace.duplicate ? "the original receipt is sent again, nothing else" :
      d == null ? "none: nothing is sent to an unverified or malformed sender" :
      trace.receiptOwed ? "a receipt is owed now" : trace.ackDeferred ? "acknowledged by the next message in the context (cumulative)" : "none";
    return h("div", { class: "result d-" + dc },
      h("div", { class: "res-main" }, h("span", { class: "d big " + dc }, dispName(d)),
        trace.reason ? term("rc." + trace.reason, trace.reason) : null,
        trace.steps.some((s) => s.id === "effect") ? h("span", { class: "res-tier" }, term("tier." + (trace.tier || "T0"), trace.tier || "T0"), laterTag("tier", cur)) : h("span", { class: "res-tier muted small" }, "no tier: stopped before the effect class is computed")),
      h("dl", { class: "res-kv" },
        h("div", null, h("dt", null, "deciding step"), h("dd", null, trace.decisiveStep ? (STEP_ORDER.indexOf(trace.decisiveStep) + 1) + " · " + window.Gate.STEPS[trace.decisiveStep].label : "–")),
        trace.admittedAs ? h("div", null, h("dt", null, "enters as"), h("dd", null, trace.admittedAs, laterTag("admittedAs", cur))) : null,
        trace.awaiting ? h("div", null, h("dt", null, "waiting on"), h("dd", null, trace.awaiting === "owner" ? "the owner" : "a second independent signal", laterTag("awaiting", cur))) : null,
        trace.answerScope ? h("div", null, h("dt", null, "answered by"), h("dd", null, trace.answerScope === "shareable" ? "a quarantined run over shareable data" : "the privileged agent, memory loaded", laterTag("answerScope", cur))) : null,
        h("div", null, h("dt", null, "receipt"), h("dd", null, receipt, laterTag("receipt", cur)))),
      trace.notes && trace.notes.length ? h("ul", { class: "res-notes" }, trace.notes.map((n) => h("li", { class: /FAILURE/.test(n) ? "bad" : "" }, n))) : null);
  }

  /* why the gate decided what it did, in one sentence built from the trace */
  function whyLine(trace) {
    const st = trace.steps.find((s) => s.id === trace.decisiveStep);
    if (!st) return "";
    const n = STEP_ORDER.indexOf(st.id) + 1;
    const what = trace.disposition == null ? "logged it and sent nothing" : trace.disposition === "admitted" ? "admitted it" : trace.disposition === "held" ? "held it" : trace.disposition === "expired" ? "let it expire" : "refused it";
    const lead = trace.disposition === "held" && trace.awaiting ? "Held, waiting on " + (trace.awaiting === "owner" ? "the owner" : "a second signal") + ". " : "";
    return lead + "The gate " + what + " at step " + n + ", " + window.Gate.STEPS[st.id].label + (st.note ? ": " + st.note : "") + (trace.reason ? " (reason code `" + trace.reason + "`)." : ".");
  }
  /* why one predicted part came out as it did, read from the field and the step that set it, so a wrong part is explained by its own cause */
  function partWhy(dim, t) {
    const at = (id) => t.steps.find((s) => s.id === id), num = (id) => STEP_ORDER.indexOf(id) + 1, lab = (id) => window.Gate.STEPS[id].label;
    const stoppedBefore = (id) => !at(id) ? "The message stopped at step " + num(t.decisiveStep) + ", " + lab(t.decisiveStep) + ", before step " + num(id) + " reads it." : null;
    const said = (id) => { const st = at(id); return "Step " + num(id) + ", " + lab(id) + (st && st.note ? ": " + st.note : "") + "."; };
    switch (dim) {
      case "tier": return stoppedBefore("effect") || said("effect") + (at("sensor") && at("sensor").note && /T\d/.test(at("sensor").note) ? " " + said("sensor") : "");
      case "reason": return t.reason ? "Step " + num(t.decisiveStep) + ", " + lab(t.decisiveStep) + ", returned `" + t.reason + "`." : "No step returned a code: codes come with a refusal or a hold.";
      case "decisiveStep": return said(t.decisiveStep);
      case "standing": return stoppedBefore("standing") || said("standing");
      case "answerScope": return stoppedBefore("release") || (t.disposition === "admitted" ? said("release") : "Only an admitted request is answered.");
      case "awaiting": return t.disposition === "held" ? said(t.decisiveStep) : "Only a held message waits on anyone; this one was " + (t.disposition || "logged only") + ".";
      case "admittedAs": return t.disposition !== "admitted" ? "Only an admitted message enters memory." : "The act decides it: an `assert` enters as a fact only with evidence a reader can check, otherwise as a claim; a `request` as a proposal; a `commit` as a commitment.";
      case "receiptOwed":
        if (t.disposition == null) return "A message with no disposition gets no receipt.";
        if (t.ackDeferred) return "An admitted message is acknowledged cumulatively, inside the next message to its sender, so nothing goes back now.";
        if (t.disposition === "admitted") return "With cumulative acknowledgement off, an admitted message gets its receipt at once.";
        if (t.reason === "rate") return "Past the rate limit, one refusal receipt goes back at the limit and then nothing.";
        return t.receiptOwed ? "A verified sender gets a receipt for a " + t.disposition + " message at once." : "Receipts never earn receipts.";
      default: return "";
    }
  }

  const CTX_LABEL = { standing: "standing", holdsToday: "holds today", rateToday: "messages today", acceptedContracts: "accepted contract", seenIds: "seen ids", expiredBodies: "expired bodies", paused: "pause", shareable: "shareable data", ownerSigned: "owner signed", secondSignals: "second signals", capabilities: "capabilities", ceiling: "urgency ceiling", interruptsThisWeek: "interrupts this week", trustRoot: "trust root", now: "receiver clock", measurements: "named measurements", contractEffects: "contract effects" };
  function ctxValue(k, v) {
    if (v instanceof Map) return v.size ? [...v.keys()].map((x) => x.length > 28 ? x.slice(0, 26) + "…" : x).join(", ") : "none";
    if (v instanceof Set) return v.size ? [...v].join(", ") : "none";
    if (k === "now") return new Date(v).toISOString().replace(".000Z", "Z");
    if (k === "trustRoot") return (v.pinned ? "pinned outside the transport" : "inside the transport") + " · keys: " + Object.keys(v.keys || {}).join(", ");
    if (Array.isArray(v)) return v.length ? v.join(", ") : "none";
    if (v && typeof v === "object") { const e = Object.entries(v); return e.length ? e.map(([a, b]) => a + " " + (typeof b === "string" && b.length > 20 ? b.slice(0, 8) + "…" : b)).join(" · ") : "none"; }
    return String(v);
  }

  function knobControl(p, value, onchange) {
    const id = "k-" + p.id + "-" + Math.random().toString(36).slice(2, 7);
    if (p.type === "bool") {
      const inp = h("input", { type: "checkbox", id, role: "switch" }); inp.checked = !!value;
      inp.addEventListener("change", () => onchange(inp.checked));
      return h("label", { class: "switch knob", for: id, title: p.why || "" }, inp, h("span", null, p.label));
    }
    if (p.type === "range") {
      const out = h("output", { class: "num" }, String(value));
      const inp = h("input", { type: "range", id, min: p.min, max: p.max, value });
      inp.addEventListener("input", () => { out.textContent = inp.value; onchange(Number(inp.value)); });
      return h("label", { class: "knob range", for: id }, h("span", null, p.label, " ", out), inp);
    }
    const sel = h("select", { id }, (p.options || []).map((o) => h("option", { value: o, selected: o === value ? true : null }, o)));
    sel.addEventListener("change", () => onchange(sel.value));
    return h("label", { class: "knob sel", for: id }, h("span", null, p.label), sel);
  }

  /* what a reader may predict: each dimension reads one field of the trace (or of the page decision) */
  const REASONS = () => (M.groups.find((g) => g.id === "reasons") || { items: [] }).items.map((i) => i.name);
  const DIMS = {
    disposition: { label: "Disposition", opts: () => [["admitted"], ["held"], ["refused"], ["expired"], [null, "no disposition · logged only"]], get: (t) => t.disposition, chip: true },
    tier: { label: "Tier", opts: () => ["T0", "T1", "T2", "T3", "T4"].map((x) => [x]).concat([[null, "not read: stops before step 16"]]), get: (t) => (t.steps && t.steps.some((s) => s.id === "effect") ? t.tier : null) },
    reason: { label: "Reason code", select: true, opts: () => [[null, "none"]].concat(REASONS().map((r) => [r])), get: (t) => t.reason || null },
    decisiveStep: { label: "Deciding step", select: true, opts: () => STEP_ORDER.map((id, n) => [id, (n + 1) + " · " + window.Gate.STEPS[id].label]), get: (t) => t.decisiveStep },
    receiptOwed: { label: "A receipt now?", opts: () => [[true, "yes, a receipt is owed"], [false, "no receipt now"]], get: (t) => !!t.receiptOwed },
    admittedAs: { label: "Enters as", opts: () => [["fact"], ["claim"], ["proposal"], ["commitment"], ["declaration"], [null, "nothing: not admitted"]], get: (t) => t.admittedAs || null },
    standing: { label: "Standing", opts: () => ["S0", "S1", "S2", "S3"].map((x) => [x]).concat([[null, "not read: stops before step 18"]]), get: (t) => (t.steps && t.steps.some((s) => s.id === "standing") ? t.standing : null) },
    awaiting: { label: "Waiting on", opts: () => [["owner", "the owner"], ["second-signal", "a second signal"], [null, "nothing: not held"]], get: (t) => t.awaiting || null },
    answerScope: { label: "Answered by", opts: () => [["shareable", "a quarantined run"], ["privileged", "the privileged agent"], [null, "nobody: not a request"]], get: (t) => t.answerScope || null },
    page: { label: "Page the owner?", opts: () => [[true, "pages the owner"], [false, "no page"]], get: (p) => !!p.page },
    level: { label: "Delivered at", opts: () => [["cycle"], ["prompt"], ["interrupt"]], get: (p) => p.level }
  };
  const showVal = (dim, v) => { const o = DIMS[dim].opts().find((x) => x[0] === v); return o ? (o[1] || String(o[0])) : v == null ? "nothing" : String(v); };

  B.gate = (b, ctx, i) => {
    const key = blockKey(ctx, i);
    const S = window.Scenario;
    const lesson = ctx && ctx.lesson;
    const isPage = !!(b.preset && b.preset.call === "page");
    const goals = b.goals || [];
    const dims = b.predict === false ? [] : Array.isArray(b.predict) ? b.predict.filter((d) => DIMS[d]) : [isPage ? "page" : "disposition"];
    const cases = [{ label: b.presetLabel || "The clean case", change: {}, expect: b.expect, explain: b.explain }].concat(b.variants || []);
    const editable = b.editable === "wire" || goals.length > 0;
    // a lab before the lesson's first heading is its cold open: a warm-up, stored with the reader's guess, never scored; a later case labelled "From the cold open" recalls the guess
    const blocks = (lesson && lesson.blocks) || [], firstH = blocks.findIndex((x) => x.t === "h");
    const coldIndex = blocks.findIndex((x, j) => x.t === "gate" && (x.cold === true || (x.cold !== false && firstH > j)));
    const isCold = coldIndex === i;
    let ci = 0, pred = {}, editedWire = null, rehash = true, knobState = {};
    let goalTries = 0, solutionNote = null; const shown = new Set(); // "Show one way" appears after a run that missed; a goal reached from a shown solution is recorded as shown, never as made
    const answers = store.get("answers", {});
    const caseBar = h("div", { class: "cases", role: "tablist" });
    const msgBox = h("div", { class: "lab-msg" });
    const ctxBox = h("div", { class: "lab-ctx" });
    const predictBox = h("div", { class: "predict-box", role: "group", "aria-label": "Your prediction" });
    const goalBox = h("div", { class: "goals" });
    const runBtn = h("button", { type: "button", class: "btn primary run" }, goals.length ? "Run the gate" : "Run the gate");
    const skip = h("button", { type: "button", class: "btn ghost small" }, "Run without predicting");
    const resultBox = h("div", { class: "lab-out", "aria-live": "polite" });
    const caseParams = () => (S.merge(b.preset || {}, cases[ci].change || {}).params || {});
    const descriptor = () => S.merge(b.preset || {}, cases[ci].change || {});
    const tinkered = () => editedWire != null || Object.keys(knobState).length > 0;

    function currentBuild() {
      const d = descriptor();
      d.params = Object.assign({}, d.params || {}, knobState);
      const built = S.build(d);
      if (editedWire != null) {
        const parsed = S.fromWire(editedWire);
        if (parsed.error) return { error: parsed.error };
        built.msg.header = parsed.header;
        built.msg.bodyText = parsed.bodyText;
        if (rehash && "body" in parsed.header) parsed.header.body = window.Gate.simHash(parsed.bodyText);
      }
      return built;
    }
    function renderGoals() {
      goalBox.textContent = "";
      if (!goals.length) return;
      goalBox.appendChild(h("div", { class: "lab-k" }, "Make the gate do this"));
      goals.forEach((g, gi) => {
        const rec = answers[key + ":goal:" + gi], done = !!(rec && rec.ok), wasShown = !!(rec && rec.kind === "shown");
        const show = g.solution && !rec && goalTries > 0 && !shown.has(gi) ? h("button", { type: "button", class: "btn ghost small", onclick: () => {
          const before = currentBuild();
          const sol = S.build(S.merge(descriptor(), g.solution));
          editedWire = S.toWire(sol.msg); if (g.solution.params) Object.assign(knobState, g.solution.params);
          shown.add(gi);
          const bh = before.msg ? before.msg.header : {}, sh = sol.msg.header;
          const changed = Object.keys(Object.assign({}, bh, sh)).filter((k) => k !== "body" && JSON.stringify(bh[k]) !== JSON.stringify(sh[k]));
          if (sol.msg.bodyText !== (before.msg && before.msg.bodyText)) changed.push("the body");
          const knobs = g.solution.params ? Object.keys(g.solution.params) : [];
          solutionNote = "One way: " + [changed.length ? "changed " + changed.map((k) => k === "the body" ? k : "`" + k + "`").join(", ") : "", knobs.length ? "set the knob " + knobs.map((k) => "`" + k + "`").join(", ") : ""].filter(Boolean).join("; ") + ". Run it to see the gate's answer; a goal reached this way counts as shown.";
          renderCase();
        } }, "Show one way") : null;
        goalBox.appendChild(h("div", { class: "goal" + (done ? " done" : wasShown ? " shown" : "") }, h("span", { class: "goal-box", "aria-hidden": "true" }, done ? "✓" : wasShown ? "·" : ""), h("span", null, inline(g.text), wasShown ? h("span", { class: "muted small" }, " · shown") : null), show));
      });
    }
    function renderPredict() {
      predictBox.textContent = "";
      if (!dims.length) { runBtn.disabled = false; skip.hidden = true; return; }
      dims.forEach((dim) => {
        const D = DIMS[dim];
        const row = h("div", { class: "predict" }, h("span", { class: "predict-l" }, D.label));
        if (D.select) {
          const sel = h("select", { "aria-label": D.label }, [h("option", { value: "", selected: true }, "choose…")].concat(D.opts().map(([v, l]) => h("option", { value: JSON.stringify(v) }, l || String(v)))));
          if (dim in pred) sel.value = JSON.stringify(pred[dim]);
          sel.addEventListener("change", () => { if (sel.value === "") delete pred[dim]; else pred[dim] = JSON.parse(sel.value); markRun(); });
          row.appendChild(sel);
        } else {
          D.opts().forEach(([v, l]) => {
            if (dim === "disposition" && v === null) row.appendChild(h("span", { class: "pick-sep", "aria-hidden": "true" }));
            const btn = h("button", { type: "button", class: D.chip ? "d pick " + dispClass(v) : "pickopt", "aria-pressed": dim in pred && pred[dim] === v ? "true" : "false" }, l || String(v));
            btn.addEventListener("click", () => { pred[dim] = v; [...row.querySelectorAll("button")].forEach((x) => x.setAttribute("aria-pressed", "false")); btn.setAttribute("aria-pressed", "true"); markRun(); });
            row.appendChild(btn);
          });
        }
        if (dim === "disposition") row.appendChild(h("p", { class: "predict-hint" }, "Every handled message is sealed first; predict where it ends."));
        const recall = (cases[ci].fromCold || /^From the cold open/.test(cases[ci].label || "")) && coldIndex >= 0 && coldIndex !== i ? store.get("answers", {})[(lesson && lesson.id) + ":" + coldIndex + ":0"] : null; // read fresh: the cold lab wrote it after this lab rendered
        if (recall && recall.pred && dim in recall.pred) row.appendChild(h("p", { class: "predict-hint" }, "Before the lesson you said: " + showVal(dim, recall.pred[dim]) + "."));
        predictBox.appendChild(row);
      });
      markRun();
    }
    function markRun() { runBtn.disabled = dims.length > 0 && dims.some((d) => !(d in pred)); }
    function renderCase() {
      caseBar.textContent = "";
      cases.forEach((c, j) => caseBar.appendChild(h("button", { type: "button", role: "tab", class: "case" + (j === ci ? " on" : "") + (answers[key + ":" + j] ? (answers[key + ":" + j].ok ? " got" : " miss") : ""), "aria-selected": j === ci ? "true" : "false",
        onclick: () => { ci = j; editedWire = null; pred = {}; knobState = {}; solutionNote = null; renderCase(); } }, inline(c.label))));
      const built = currentBuild();
      msgBox.textContent = "";
      const wireText = editedWire != null ? editedWire : S.toWire(built.msg);
      msgBox.appendChild(h("div", { class: "lab-k" }, "Message from ", h("b", null, built.msg.signer || "?"), built.msg.lane !== built.msg.signer ? " in lane " + built.msg.lane : "", built.msg.sigValid === false ? " · signature invalid" : ""));
      if (editable) {
        const ta = h("textarea", { class: "wire-edit", rows: Math.min(18, wireText.split("\n").length + 1), spellcheck: "false", "aria-label": "Edit the message" });
        ta.value = wireText;
        ta.addEventListener("input", () => { editedWire = ta.value; resultBox.textContent = ""; solutionNote = null; });
        const cb = h("input", { type: "checkbox", id: key + "-rh" }); cb.checked = rehash;
        cb.addEventListener("change", () => { rehash = cb.checked; });
        msgBox.appendChild(ta);
        msgBox.appendChild(h("div", { class: "row small" }, h("label", { class: "switch", for: key + "-rh" }, cb, h("span", null, "Recompute the body hash when I edit")),
          h("button", { type: "button", class: "btn ghost small", onclick: () => { editedWire = null; knobState = {}; solutionNote = null; renderCase(); } }, "Reset")));
        if (solutionNote) msgBox.appendChild(h("div", { class: "diff-note" }, inline(solutionNote)));
      } else msgBox.appendChild(wireView(wireText, cases[ci].mark, ci > 0 ? caseDiff(built) : null));
      if (ci > 0 && !editable) { const df = caseDiff(built); const note = [df.keys.size ? "changed: " + [...df.keys].join(", ") : "", df.removed.length ? "removed: " + df.removed.join(", ") : "", df.body ? "the body" : "", df.msg.length ? df.msg.join(", ") : ""].filter(Boolean).join(" · "); if (note) msgBox.appendChild(h("div", { class: "diff-note" }, "Against the clean case, " + note + ".")); }
      const extras = [];
      const m = built.msg;
      if (m.touchedPaths) extras.push(["touches", m.touchedPaths.join(", ")]);
      if (m.reads) extras.push(["reads", m.reads.join(", ")]);
      if (m.origin) extras.push(["relayed from", (m.origin.from || "?") + " · " + (m.origin.evidence || "unverified")]);
      if (m.sources) extras.push(["sources signed by", m.sources.map((s) => s.signer).join(", ")]);
      if (m.secondSignal) extras.push(["second signal", "present"]);
      if (m.recordOk != null) extras.push(["record opened", m.recordOk ? "matches" : "does not match"]);
      if (m.capability) extras.push(["capability", m.capability]);
      if (extras.length) msgBox.appendChild(h("dl", { class: "kv small" }, extras.map(([k, v]) => h("div", null, h("dt", null, k), h("dd", null, v)))));
      ctxBox.textContent = "";
      ctxBox.appendChild(h("div", { class: "lab-k" }, (built.ctx.receiver || "brainboi") + "'s gate · receiver state"));
      const keys = b.showCtx || ["standing", "acceptedContracts", "holdsToday"];
      ctxBox.appendChild(h("dl", { class: "kv" }, keys.map((k) => h("div", null, h("dt", null, CTX_LABEL[k] || k), h("dd", null, ctxValue(k, built.ctx[k]))))));
      if (b.knobs && b.knobs.length) {
        ctxBox.appendChild(h("div", { class: "lab-k" }, "Contract knobs"));
        const cp = caseParams();
        ctxBox.appendChild(h("div", { class: "knobs" }, b.knobs.map((id) => M.params.find((p) => p.id === id)).filter(Boolean).map((p) => {
          const val = p.id in knobState ? knobState[p.id] : p.id in cp ? cp[p.id] : p.def;
          return knobControl(p, val, (v) => { knobState[p.id] = v; resultBox.textContent = ""; });
        })));
      }
      resultBox.textContent = "";
      renderGoals();
      renderPredict();
    }
    function caseDiff(built) {
      const base = S.build(S.merge(b.preset || {}, {}));
      const bh = base.msg.header, ch = built.msg.header, keys = new Set(), removed = [];
      Object.keys(ch).forEach((k) => { if (k !== "body" && JSON.stringify(ch[k]) !== JSON.stringify(bh[k])) keys.add(k); });
      Object.keys(bh).forEach((k) => { if (!(k in ch)) removed.push(k); });
      const msg = [];
      ["signer", "lane", "sigValid", "recordOk", "secondSignal", "capability"].forEach((k) => { if (JSON.stringify(built.msg[k]) !== JSON.stringify(base.msg[k])) msg.push(k + " " + (built.msg[k] === undefined ? "unset" : JSON.stringify(built.msg[k]))); });
      if (JSON.stringify(built.msg.touchedPaths) !== JSON.stringify(base.msg.touchedPaths) && !keys.has("id")) msg.push("paths touched");
      if (JSON.stringify(built.ctx) !== JSON.stringify(base.ctx)) msg.push("receiver state");
      const cp = (cases[ci].change || {}).params || {};
      Object.keys(cp).forEach((id) => { const p = M.params.find((x) => x.id === id); msg.push((p ? p.label : id) + " → " + (cp[id] === true ? "on" : cp[id] === false ? "off" : cp[id])); });
      return { keys, removed, body: built.msg.bodyText !== base.msg.bodyText, msg };
    }
    function scorePrediction(get) {
      const wrong = dims.filter((d) => JSON.stringify(DIMS[d].get(get)) !== JSON.stringify(pred[d]));
      return { ok: wrong.length === 0, wrong };
    }
    function recordCase(ok) {
      if (tinkered()) return;
      const k = key + ":" + ci;
      if (!answers[k]) { answers[k] = isCold ? { ok, kind: "cold", pred: Object.assign({}, pred) } : { ok, kind: "gate" }; store.mark("answers", k, answers[k]); } // the first attempt counts
      [...caseBar.children][ci].classList.add(answers[k].ok ? "got" : "miss");
    }
    function checkGoals(get) {
      const made = [], seen = [];
      goals.forEach((g, gi) => {
        const k = key + ":goal:" + gi;
        if (answers[k]) return;
        if (!S.check(isPage ? { page: get } : { trace: get }, g.want || {}).length && tinkered()) {
          answers[k] = shown.has(gi) ? { ok: false, kind: "shown" } : { ok: true, kind: "make" };
          store.mark("answers", k, answers[k]); (shown.has(gi) ? seen : made).push(g);
        }
      });
      if (goals.some((g, gi) => !answers[key + ":goal:" + gi])) goalTries++;
      return { made, seen };
    }
    function run(withPrediction) {
      const built = currentBuild();
      resultBox.textContent = "";
      if (built.error) { resultBox.appendChild(h("div", { class: "fb no" }, h("b", null, "The text does not parse. "), built.error)); return; }
      const c = cases[ci];
      const out = isPage ? window.Gate.pageDecision(built.msg, built.ctx, built.params) : window.Gate.evaluate(built.msg, built.ctx, built.params);
      if (withPrediction && dims.length) {
        const sc = scorePrediction(out);
        // the banner says only what the reader got wrong and why that part came out so; the card and the trace below carry the rest
        const lines = sc.wrong.map((d) => DIMS[d].label.replace(/\?$/, "") + ": you said " + showVal(d, pred[d]) + "; it is " + showVal(d, DIMS[d].get(out)) + "." + (isPage ? "" : " " + (d === "disposition" ? "Step " + (STEP_ORDER.indexOf(out.decisiveStep) + 1) + " decided it." : partWhy(d, out))));
        const explained = c.explain && !tinkered();
        resultBox.appendChild(verdict(sc.ok, sc.ok ? (dims.length > 1 ? "Every part of your prediction holds." : "") + (explained ? "" : " " + (isPage ? out.note + "." : whyLine(out))) : [lines.join(" "), isPage ? "Why: " + out.note + "." : "", c.whyNot || ""].filter(Boolean).join(" ")));
        recordCase(sc.ok);
      }
      const { made, seen } = checkGoals(out);
      made.forEach((g) => resultBox.appendChild(h("div", { class: "fb ok" }, h("b", null, "Made it. "), inline(g.text))));
      seen.forEach((g) => resultBox.appendChild(h("div", { class: "fb no" }, h("b", null, "Shown. "), inline(g.text), " The shown edit reaches the goal, and it is recorded as shown.")));
      if (goals.length && !made.length && !seen.length && tinkered()) {
        const open = goals.filter((g, gi) => !(answers[key + ":goal:" + gi] && answers[key + ":goal:" + gi].ok));
        if (open.length) resultBox.appendChild(h("div", { class: "fb no" }, h("b", null, "Not yet. "), isPage ? out.note : whyLine(out)));
      }
      if (goals.length) renderGoals();
      if (c.explain && !tinkered()) resultBox.appendChild(h("div", { class: "lab-explain" }, inline(c.explain)));
      if (isPage) {
        resultBox.appendChild(h("div", { class: "result" },
          h("div", { class: "res-main" }, h("span", { class: "d big logged" }, out.page ? "page the owner" : "no page"), h("span", { class: "res-tier" }, "delivered at ", term("ch.axes", out.level))),
          h("dl", { class: "res-kv" }, h("div", null, h("dt", null, "why"), h("dd", null, out.note)), h("div", null, h("dt", null, "decided by"), h("dd", null, h("code", null, "Gate.pageDecision"), ", after the gate admits the alert")))));
      } else {
        resultBox.appendChild(resultView(out, { lesson }));
        resultBox.appendChild(traceView(out, { lesson }));
      }
      if (c.expect && !tinkered()) { const miss = S.check(isPage ? { page: out } : { trace: out }, c.expect); if (miss.length) console.warn("[course] gate case mismatch", key, c.label, JSON.stringify(miss)); }
    }
    runBtn.addEventListener("click", () => run(true));
    skip.addEventListener("click", () => run(false));
    renderCase();
    return h("div", { class: "cx-lab" + (goals.length ? " goal-mode" : "") },
      h("div", { class: "lab-head" }, h("div", { class: "check-k" }, isCold ? "Cold open · not scored" : goals.length ? "Gate lab · goals to reach" : "Gate lab"), h("div", { class: "lab-title" }, inline(b.title || "Run it through the gate")), b.intro ? h("p", { class: "lab-intro" }, inline(b.intro)) : null),
      cases.length > 1 ? caseBar : null,
      goalBox,
      h("div", { class: "lab-grid" }, msgBox, ctxBox),
      h("div", { class: "lab-act" }, predictBox, h("div", { class: "row" }, runBtn, skip)),
      resultBox);
  };

  /* figures and widgets that scroll sideways on a phone say so */
  function markScrollers(root) {
    root.querySelectorAll(".scroll").forEach((el) => {
      if (!el.querySelector(".w-svg, .machine-svg:not(.vertical)")) return;
      el.classList.add("figscroll");
      if (!el.nextElementSibling || !el.nextElementSibling.classList.contains("scroll-cue")) el.after(h("div", { class: "scroll-cue" }, "Swipe sideways to see the whole figure →"));
      const check = () => el.classList.toggle("can-scroll", el.scrollWidth > el.clientWidth + 4);
      requestAnimationFrame(check);
    });
  }
  /* ---------- render a lesson's blocks ---------- */
  function renderBlocks(lesson, container, ctx) {
    (lesson.blocks || []).forEach((b, i) => {
      const fn = B[b.t];
      if (!fn) return;
      let el = null;
      try { el = fn(b, ctx, i); } catch (e) { console.error("[course] block " + i + " (" + b.t + ") in " + lesson.id, e); el = h("div", { class: "fb no" }, "This block failed to render: " + b.t); }
      if (el) container.appendChild(el);
    });
  }

  Course.kit = { markScrollers, visible, playLink, h, append, svgEl, inline, term, refChip, itemFor, wireView, codeView, traceView, resultView, whyLine, figure, verdict, store, renderBlocks, blocks: B, REPO, reduceMotion, closePop, STEP_ORDER };
})();
