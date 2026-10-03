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
        } else frag.appendChild(refChip(inner));
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
  function wireView(text, mark) {
    const marks = new Set(mark || []);
    const pre = h("pre", { class: "wire", "aria-label": "Membrane message" });
    const s = String(text);
    const cut = s.indexOf("\n---\n");
    const head = cut >= 0 ? s.slice(0, cut) : s;
    const body = cut >= 0 ? s.slice(cut + 5) : null;
    head.split("\n").forEach((line) => {
      const i = line.indexOf(":");
      const k = i > 0 ? line.slice(0, i) : "";
      const row = h("span", { class: "wl" + (marks.has(k) ? " mark" : ""), dataset: { k } });
      if (k) {
        const item = itemFor(k);
        if (item) { const t = term(item.id, k); t.classList.add("wk"); row.appendChild(t); } else row.appendChild(h("span", { class: "wk" }, k));
        row.appendChild(h("span", { class: "wc" }, ":"));
        row.appendChild(h("span", { class: "wv" }, line.slice(i + 1)));
      } else row.textContent = line;
      pre.appendChild(row);
    });
    if (body != null) {
      pre.appendChild(h("span", { class: "wl wdash" }, "---"));
      pre.appendChild(h("span", { class: "wb" }, body.replace(/\n$/, "") + (body.endsWith("\n") ? "" : "")));
    }
    return pre;
  }
  function codeView(lang, text, mark) {
    const marks = new Set(mark || []);
    const pre = h("pre", { class: "code lang-" + (lang || "text") });
    String(text).replace(/\n$/, "").split("\n").forEach((line, i) => {
      const row = h("span", { class: "cl" + (marks.has(i + 1) ? " mark" : "") });
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
  B.define = (b) => h("dl", { class: "cx-define" }, (b.terms || []).map((t) => h("div", { class: "def" }, h("dt", null, inline(t.term)), h("dd", null, inline(t.def), t.ref ? h("span", { class: "refs" }, [].concat(t.ref).map(refChip)) : null))));
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
  B.table = (b) => figure(h("div", { class: "scroll" }, h("table", { class: "t cx-t" },
    h("thead", null, h("tr", null, (b.head || []).map((c) => h("th", null, inline(c))))),
    h("tbody", null, (b.rows || []).map((r) => h("tr", null, r.map((c) => h("td", null, inline(c)))))))), b.caption);
  B.compare = (b) => figure(h("div", { class: "cx-compare", style: { "--n": (b.cols || []).length } }, (b.cols || []).map((c) =>
    h("div", { class: "col" }, h("h4", null, inline(c.title)), c.text ? h("p", null, inline(c.text)) : null, c.items ? h("ul", null, c.items.map((t) => h("li", null, inline(t)))) : null))), b.caption);
  B.takeaways = (b) => h("section", { class: "cx-take" }, h("h4", null, "Keep"), h("ol", null, (b.items || []).map((t) => h("li", null, inline(t)))));
  B.deeper = (b) => h("section", { class: "cx-deeper" }, h("h4", null, "Go deeper"), h("div", { class: "chips" }, (b.links || []).map((l) => {
    if (l.ref) return refChip(l.ref);
    if (l.research) { const src = M.sources[l.research]; return h("a", { class: "chip ref", href: REPO + (src && src.file || ""), target: "_blank", rel: "noopener" }, l.label || (l.research + (src ? " · " + src.title : ""))); }
    if (l.scenario) { const sc = M.scenarios.find((s) => s.id === l.scenario); return h("a", { class: "chip ref play", href: "index.html#/playground/" + l.scenario, target: "_blank", rel: "noopener", title: "Opens the Playground" }, "Playground · " + (sc ? sc.title : l.scenario)); }
    if (l.challenge) { const c = M.challenges.find((x) => x.id === l.challenge); return h("a", { class: "chip ref play", href: "index.html#/gatekeeper/" + l.challenge, target: "_blank", rel: "noopener" }, "Gatekeeper · " + (c ? c.title : l.challenge)); }
    if (l.lesson) return h("a", { class: "chip lessonlink", href: "#" + l.lesson }, l.label || l.lesson);
    return h("a", { class: "chip ref", href: l.href, target: "_blank", rel: "noopener" }, l.label || l.href);
  })));
  B.tutor = (b, ctx) => { if (ctx) ctx.tutorPrompts = (ctx.tutorPrompts || []).concat(b.prompts || []); return null; };

  /* quiz */
  B.quiz = (b, ctx, i) => {
    const key = blockKey(ctx, i);
    const prior = (store.get("answers", {}))[key];
    const out = h("div", { class: "fbwrap" });
    const opts = (b.options || []).map((o, j) => h("button", { type: "button", class: "opt", onclick: () => choose(j) }, h("span", { class: "opt-l" }, String.fromCharCode(65 + j)), h("span", null, inline(o))));
    function choose(j, silent) {
      opts.forEach((btn, k) => { btn.classList.toggle("chosen", k === j); btn.classList.toggle("right", k === b.answer); btn.classList.toggle("wrong", k === j && j !== b.answer); btn.setAttribute("aria-pressed", k === j ? "true" : "false"); });
      out.textContent = "";
      const why = b.why && b.why[j] ? b.why[j] + " " : "";
      out.appendChild(verdict(j === b.answer, why + (b.explain || "")));
      if (!silent) store.mark("answers", key, { ok: j === b.answer, choice: j, kind: "quiz" });
    }
    const el = h("div", { class: "cx-check quiz" }, h("div", { class: "check-k" }, "Check"), h("div", { class: "check-q" }, inline(b.q)), h("div", { class: "opts" }, opts), out);
    if (prior && prior.kind === "quiz") choose(prior.choice, true);
    return el;
  };

  /* sort */
  B.sort = (b, ctx, i) => {
    const key = blockKey(ctx, i);
    let sel = null;
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
    }
    function drop(bid) {
      if (sel == null) return;
      const x = items[sel];
      const ok = x.it.bucket === bid;
      fb.textContent = "";
      fb.appendChild(verdict(ok, x.it.why || ""));
      if (ok) { placed.set(sel, bid); x.btn.classList.remove("sel"); x.btn.classList.add("done"); x.btn.disabled = true; bucketEls[bid].querySelector(".bucket-items").appendChild(x.btn); }
      else { x.btn.classList.add("shake"); setTimeout(() => x.btn.classList.remove("shake"), 400); }
      sel = null;
      items.forEach((y) => y.btn.classList.remove("sel"));
      Object.values(bucketEls).forEach((bk) => bk.classList.remove("armed"));
      if (placed.size === items.length) { fb.appendChild(h("div", { class: "fb ok" }, h("b", null, "All placed."))); store.mark("answers", key, { ok: true, kind: "sort" }); }
    }
    items.forEach((x) => pool.appendChild(x.btn));
    const buckets = h("div", { class: "sort-buckets", style: { "--n": (b.buckets || []).length } }, (b.buckets || []).map((bk) => {
      const el = h("button", { type: "button", class: "bucket", onclick: () => drop(bk.id) }, h("span", { class: "bucket-l" }, inline(bk.label)), h("span", { class: "bucket-items" }));
      bucketEls[bk.id] = el;
      return el;
    }));
    return h("div", { class: "cx-check sort" }, h("div", { class: "check-k" }, "Sort"), h("div", { class: "check-q" }, inline(b.prompt || "Tap an item, then the bucket it belongs in.")), pool, buckets, fb);
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
    const W = 640, H = 340, PAD = 46;
    const states = b.states || [], edges = b.edges || [];
    const pos = (s) => ({ x: PAD + (s.x / 100) * (W - 2 * PAD), y: PAD * 0.7 + (s.y / 100) * (H - 1.4 * PAD) });
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "machine-svg", role: "img", "aria-label": b.title || "State machine" });
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
    const choices = h("div", { class: "m-choices" });
    const note = h("div", { class: "m-note", "aria-live": "polite" });
    function render() {
      Object.entries(nodeG).forEach(([id, g]) => { g.classList.toggle("cur", id === cur); g.classList.toggle("seen", trail.includes(id) && id !== cur); });
      edgeG.forEach(({ e, g }) => g.classList.toggle("live", e.from === cur));
      const s = states.find((x) => x.id === cur);
      note.textContent = "";
      append(note, [h("b", null, s ? s.label : cur), s && s.note ? h("span", null, " · ", inline(s.note)) : null]);
      choices.textContent = "";
      const out = edges.filter((e) => e.from === cur);
      if (!out.length) choices.appendChild(h("span", { class: "muted" }, "No way out of this state: it is terminal."));
      out.forEach((e) => choices.appendChild(h("button", { type: "button", class: "btn", onclick: () => { cur = e.to; trail.push(cur); render(); } }, inline(e.label || "→ " + e.to), " → ", states.find((x) => x.id === e.to).label)));
      choices.appendChild(h("button", { type: "button", class: "btn ghost", onclick: () => { cur = b.start || states[0].id; trail.length = 0; trail.push(cur); render(); } }, "Reset"));
    }
    render();
    return h("div", { class: "cx-check machine" }, h("div", { class: "check-k" }, inline(b.title || "State machine")), b.prompt ? h("div", { class: "check-q" }, inline(b.prompt)) : null,
      h("div", { class: "scroll" }, svg), note, choices, b.caption ? h("div", { class: "cap" }, inline(b.caption)) : null);
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
  const DISP_OPTIONS = [
    { v: "admitted", label: "admitted" }, { v: "held", label: "held" }, { v: "refused", label: "refused" },
    { v: "expired", label: "expired" }, { v: null, label: "logged only" }
  ];
  const dispClass = (d) => (d == null ? "logged" : d);
  const dispName = (d) => (d == null ? "logged only" : d);

  function traceView(trace) {
    const byId = new Map(trace.steps.map((s) => [s.id, s]));
    const decisive = trace.decisiveStep;
    const dc = dispClass(trace.disposition);
    const bar = h("div", { class: "tbar d-" + dc, "aria-hidden": "true" }, STEP_ORDER.map((id) => {
      const s = byId.get(id);
      return h("span", { class: "seg " + (!s ? "skip" : s.id === decisive ? "dec" : s.ok === true ? "pass" : s.ok === "flag" ? "flag" : "fail"), title: window.Gate.STEPS[id].label });
    }));
    const rows = h("ol", { class: "trace" }, STEP_ORDER.map((id, n) => {
      const s = byId.get(id);
      const st = !s ? "skip" : s.id === decisive ? "dec" : s.ok === true ? "pass" : s.ok === "flag" ? "flag" : "fail";
      const icon = { skip: "·", dec: "◆", pass: "✓", flag: "⚑", fail: "✕" }[st];
      const ref = s && s.ref && itemFor(s.ref) ? term(s.ref, s.ref) : null;
      return h("li", { class: "tr " + st + (st === "dec" ? " d-" + dc : ""), style: { "--i": n } },
        h("span", { class: "tr-n num" }, n + 1), h("span", { class: "tr-i", "aria-hidden": "true" }, icon),
        h("span", { class: "tr-l" }, window.Gate.STEPS[id].label), h("span", { class: "tr-note" }, s ? s.note || "" : "not reached"),
        h("span", { class: "tr-ref" }, ref));
    }));
    if (!reduceMotion()) rows.classList.add("anim");
    return h("div", { class: "tracebox" }, bar, rows);
  }

  function resultView(trace) {
    const d = trace.disposition, dc = dispClass(d);
    const receipt = trace.duplicate ? "the original receipt is sent again, nothing else" :
      d == null ? "none: nothing is sent to an unverified or malformed sender" :
      trace.receiptOwed ? "a receipt is owed now" : trace.ackDeferred ? "acknowledged by the next message in the context (cumulative)" : "none";
    return h("div", { class: "result d-" + dc },
      h("div", { class: "res-main" }, h("span", { class: "d big " + dc }, dispName(d)),
        trace.reason ? term("rc." + trace.reason, trace.reason) : null,
        h("span", { class: "res-tier" }, term("tier." + (trace.tier || "T0"), trace.tier || "T0"))),
      h("dl", { class: "res-kv" },
        h("div", null, h("dt", null, "deciding step"), h("dd", null, trace.decisiveStep ? window.Gate.STEPS[trace.decisiveStep].label : "–")),
        trace.admittedAs ? h("div", null, h("dt", null, "enters as"), h("dd", null, trace.admittedAs)) : null,
        trace.awaiting ? h("div", null, h("dt", null, "waiting on"), h("dd", null, trace.awaiting === "owner" ? "the owner" : "a second independent signal")) : null,
        trace.answerScope ? h("div", null, h("dt", null, "answered by"), h("dd", null, trace.answerScope === "shareable" ? "a quarantined run over shareable data" : "the privileged agent, memory loaded")) : null,
        h("div", null, h("dt", null, "receipt"), h("dd", null, receipt))),
      trace.notes && trace.notes.length ? h("ul", { class: "res-notes" }, trace.notes.map((n) => h("li", { class: /FAILURE/.test(n) ? "bad" : "" }, n))) : null);
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

  function knobControl(p, state, onchange) {
    const id = "k-" + p.id + "-" + Math.random().toString(36).slice(2, 7);
    const val = state[p.id] !== undefined ? state[p.id] : p.def;
    if (p.type === "bool") {
      const inp = h("input", { type: "checkbox", id, role: "switch" }); inp.checked = !!val;
      inp.addEventListener("change", () => { state[p.id] = inp.checked; onchange(); });
      return h("label", { class: "switch knob", for: id, title: p.why || "" }, inp, h("span", null, p.label));
    }
    if (p.type === "range") {
      const out = h("output", { class: "num" }, String(val));
      const inp = h("input", { type: "range", id, min: p.min, max: p.max, value: val });
      inp.addEventListener("input", () => { state[p.id] = Number(inp.value); out.textContent = inp.value; onchange(); });
      return h("label", { class: "knob range", for: id }, h("span", null, p.label, " ", out), inp);
    }
    const sel = h("select", { id }, (p.options || []).map((o) => h("option", { value: o, selected: o === val ? true : null }, o)));
    sel.addEventListener("change", () => { state[p.id] = sel.value; onchange(); });
    return h("label", { class: "knob sel", for: id }, h("span", null, p.label), sel);
  }

  B.gate = (b, ctx, i) => {
    const key = blockKey(ctx, i);
    const S = window.Scenario;
    const cases = [{ label: b.presetLabel || "The clean case", change: {}, expect: b.expect, explain: b.explain }].concat(b.variants || []);
    let ci = 0, predicted, editedWire = null, rehash = true;
    const knobState = {};
    const answers = store.get("answers", {});
    const caseBar = h("div", { class: "cases", role: "tablist" });
    const msgBox = h("div", { class: "lab-msg" });
    const ctxBox = h("div", { class: "lab-ctx" });
    const predictRow = h("div", { class: "predict", role: "group", "aria-label": "Your prediction" });
    const runBtn = h("button", { type: "button", class: "btn primary run" }, "Run the gate");
    const skip = h("button", { type: "button", class: "btn ghost small" }, "Run without predicting");
    const resultBox = h("div", { class: "lab-out", "aria-live": "polite" });
    const descriptor = () => S.merge(b.preset || {}, cases[ci].change || {});

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
    function renderCase() {
      caseBar.textContent = "";
      cases.forEach((c, j) => caseBar.appendChild(h("button", { type: "button", role: "tab", class: "case" + (j === ci ? " on" : "") + (answers[key + ":" + j] ? (answers[key + ":" + j].ok ? " got" : " miss") : ""), "aria-selected": j === ci ? "true" : "false",
        onclick: () => { ci = j; editedWire = null; predicted = undefined; renderCase(); } }, inline(c.label))));
      const built = currentBuild();
      msgBox.textContent = "";
      const wireText = editedWire != null ? editedWire : S.toWire(built.msg);
      msgBox.appendChild(h("div", { class: "lab-k" }, "Message from ", h("b", null, built.msg.signer || "?"), built.msg.lane !== built.msg.signer ? " in lane " + built.msg.lane : "", built.msg.sigValid === false ? " · signature invalid" : ""));
      if (b.editable === "wire") {
        const ta = h("textarea", { class: "wire-edit", rows: Math.min(18, wireText.split("\n").length + 1), spellcheck: "false", "aria-label": "Edit the message" });
        ta.value = wireText;
        ta.addEventListener("input", () => { editedWire = ta.value; predicted = undefined; markPredict(); resultBox.textContent = ""; });
        const cb = h("input", { type: "checkbox", id: key + "-rh" }); cb.checked = rehash;
        cb.addEventListener("change", () => { rehash = cb.checked; });
        msgBox.appendChild(ta);
        msgBox.appendChild(h("div", { class: "row small" }, h("label", { class: "switch", for: key + "-rh" }, cb, h("span", null, "Recompute the body hash when I edit")),
          h("button", { type: "button", class: "btn ghost small", onclick: () => { editedWire = null; renderCase(); } }, "Reset")));
      } else msgBox.appendChild(wireView(wireText, cases[ci].mark));
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
      ctxBox.appendChild(h("div", { class: "lab-k" }, "brainboi's gate · receiver state"));
      const keys = b.showCtx || ["standing", "acceptedContracts", "holdsToday"];
      ctxBox.appendChild(h("dl", { class: "kv" }, keys.map((k) => h("div", null, h("dt", null, CTX_LABEL[k] || k), h("dd", null, ctxValue(k, built.ctx[k]))))));
      if (b.knobs && b.knobs.length) {
        ctxBox.appendChild(h("div", { class: "lab-k" }, "Contract knobs"));
        ctxBox.appendChild(h("div", { class: "knobs" }, b.knobs.map((id) => M.params.find((p) => p.id === id)).filter(Boolean).map((p) => knobControl(p, knobState, () => { predicted = undefined; markPredict(); resultBox.textContent = ""; }))));
      }
      resultBox.textContent = "";
      markPredict();
    }
    function markPredict() {
      [...predictRow.querySelectorAll("button")].forEach((x) => { const v = x.dataset.v === "null" ? null : x.dataset.v; x.setAttribute("aria-pressed", predicted !== undefined && v === predicted ? "true" : "false"); });
      runBtn.disabled = predicted === undefined;
    }
    const isPage = (b.preset && b.preset.call === "page");
    const OPTIONS = isPage ? [{ v: "page", label: "pages the owner", cls: "refused" }, { v: "nopage", label: "no page", cls: "admitted" }] : DISP_OPTIONS.map((o) => ({ v: o.v, label: o.label, cls: dispClass(o.v) }));
    append(predictRow, [h("span", { class: "predict-l" }, "Your prediction"), OPTIONS.map((o) => h("button", { type: "button", class: "d pick " + o.cls, dataset: { v: String(o.v) }, onclick: () => { predicted = o.v; markPredict(); } }, o.label))]);
    function run(withPrediction) {
      const built = currentBuild();
      resultBox.textContent = "";
      if (built.error) { resultBox.appendChild(h("div", { class: "fb no" }, h("b", null, "The text does not parse. "), built.error)); return; }
      const c = cases[ci];
      if (isPage) {
        const pd = window.Gate.pageDecision(built.msg, built.ctx, built.params);
        const got = pd.page ? "page" : "nopage";
        if (withPrediction) {
          const ok = predicted === got;
          resultBox.appendChild(verdict(ok, ok ? "The receiver did what you predicted." : "You predicted " + (predicted === "page" ? "a page" : "no page") + "; the receiver's answer is " + (pd.page ? "a page" : "no page") + "."));
          if (editedWire == null && !Object.keys(knobState).length) { store.mark("answers", key + ":" + ci, { ok, kind: "gate" }); answers[key + ":" + ci] = { ok }; }
          [...caseBar.children][ci].classList.add(ok ? "got" : "miss");
        }
        resultBox.appendChild(h("div", { class: "result " + (pd.page ? "d-refused" : "d-admitted") },
          h("div", { class: "res-main" }, h("span", { class: "d big " + (pd.page ? "refused" : "admitted") }, pd.page ? "page the owner" : "no page"), h("span", { class: "res-tier" }, "delivered at ", term("ch.axes", pd.level))),
          h("dl", { class: "res-kv" }, h("div", null, h("dt", null, "why"), h("dd", null, pd.note)), h("div", null, h("dt", null, "decided by"), h("dd", null, h("code", null, "Gate.pageDecision"), ", after the gate admits the alert")))));
        if (c.explain && editedWire == null) resultBox.appendChild(h("div", { class: "lab-explain" }, inline(c.explain)));
        if (c.expect && editedWire == null && !Object.keys(knobState).length) { const miss = S.check({ page: pd }, c.expect); if (miss.length) console.warn("[course] gate case mismatch", key, c.label, JSON.stringify(miss)); }
        return;
      }
      const trace = window.Gate.evaluate(built.msg, built.ctx, built.params);
      if (withPrediction) {
        const ok = predicted === trace.disposition;
        resultBox.appendChild(verdict(ok, ok ? "The gate did what you predicted." : "You predicted " + dispName(predicted) + "; the gate's answer is " + dispName(trace.disposition) + "."));
        if (editedWire == null && !Object.keys(knobState).length) { store.mark("answers", key + ":" + ci, { ok, kind: "gate" }); answers[key + ":" + ci] = { ok }; }
        [...caseBar.children][ci].classList.add(ok ? "got" : "miss");
      }
      resultBox.appendChild(resultView(trace));
      resultBox.appendChild(traceView(trace));
      if (c.explain && editedWire == null) resultBox.appendChild(h("div", { class: "lab-explain" }, inline(c.explain)));
      if (c.expect && editedWire == null && !Object.keys(knobState).length) {
        const miss = S.check({ trace }, c.expect);
        if (miss.length) console.warn("[course] gate case mismatch", key, c.label, JSON.stringify(miss));
      }
    }
    runBtn.addEventListener("click", () => run(true));
    skip.addEventListener("click", () => run(false));
    renderCase();
    return h("div", { class: "cx-lab" },
      h("div", { class: "lab-head" }, h("div", { class: "check-k" }, "Gate lab"), h("div", { class: "lab-title" }, inline(b.title || "Run it through the gate")), b.intro ? h("p", { class: "lab-intro" }, inline(b.intro)) : null),
      cases.length > 1 ? caseBar : null,
      h("div", { class: "lab-grid" }, msgBox, ctxBox),
      h("div", { class: "lab-act" }, predictRow, h("div", { class: "row" }, runBtn, skip)),
      resultBox);
  };

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

  Course.kit = { h, append, svgEl, inline, term, refChip, itemFor, wireView, codeView, traceView, resultView, figure, verdict, store, renderBlocks, blocks: B, REPO, reduceMotion, closePop };
})();
