/* Course labs for the foundations and annexes: network science (graphLab), transport (lossyChannel), security (hashLab, preRotation).
   Each is a small seeded model, labelled as a model, with the Membrane mechanism it explains named beside it.
   graphLab and lossyChannel publish their props contracts (LAB_PROPS, below); course/dev/check.js holds lessons to them. */
(function () {
  "use strict";
  const C = window.Course, K = C.kit, { h, inline } = K;
  const el = (tag, attrs, parent) => K.svgEl(tag, attrs, parent);
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function seg(options, value, onchange, label) {
    const wrap = h("div", { class: "seg-ctl", role: "group", "aria-label": label || null });
    options.forEach((o) => {
      const v = typeof o === "object" ? o.v : o;
      const b = h("button", { type: "button", "aria-pressed": String(v === value) }, typeof o === "object" ? o.label : o);
      b.addEventListener("click", () => { [...wrap.children].forEach((x) => x.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); onchange(v); });
      wrap.appendChild(b);
    });
    return wrap;
  }
  function slider(label, min, max, step, value, onchange, fmt) {
    const out = h("output", { class: "num" }, fmt ? fmt(value) : String(value));
    const i = h("input", { type: "range", min, max, step, value });
    i.addEventListener("input", () => { const v = Number(i.value); out.textContent = fmt ? fmt(v) : String(v); onchange(v); });
    return h("label", { class: "w-field" }, h("span", { class: "w-label" }, label, " ", out), i);
  }
  const stat = (v, l, hot) => h("div", { class: "stat" + (hot ? " hot" : "") }, h("b", { class: "num" }, v), h("span", null, l));

  /* ================= props contracts =================
     The props each lab takes, in one place. course/dev/check.js loads this file and reports every lesson block whose props
     break the contract: an unknown key, a value outside `oneOf`, the wrong type, a number out of range. The widgets ignore
     unknown keys and clamp numbers, so a bad prop never breaks a page; the checker is where it shows. */
  const LAB_PROPS = {
    graphLab: {
      model: { oneOf: ["random", "scale-free", "small-world"] },
      mode: { oneOf: ["explore", "cascade", "sybil"] },
      contagion: { oneOf: ["simple", "complex"] },
      threshold: { type: "number", min: 0.05, max: 0.9 },
      n: { type: "number", int: true, min: 20, max: 150 },
      seed: { type: "number", int: true, min: 0 },
      p: { type: "number", min: 0.01, max: 0.2 },
      beta: { type: "number", min: 0, max: 1 },
      m: { type: "number", int: true, min: 1, max: 4 },
      seeds: { type: "number", int: true, min: 1, max: 6 },
      sybils: { type: "number", int: true, min: 5, max: 40 },
      attack: { type: "number", int: true, min: 1, max: 15 }
    },
    lossyChannel: {
      mode: { oneOf: ["at-most-once", "at-least-once", "dedup"] },
      loss: { type: "number", min: 0, max: 0.5 },
      dup: { type: "number", min: 0, max: 0.4 },
      reorder: { type: "boolean" },
      seed: { type: "number", int: true, min: 0 },
      n: { type: "number", int: true, min: 3, max: 8 }
    }
  };
  C.widgetProps = Object.assign(C.widgetProps || {}, LAB_PROPS);
  C.widgetPropProblems = (name, props) => {
    const spec = (C.widgetProps || {})[name], out = [];
    if (!spec) return out;
    Object.keys(props || {}).forEach((key) => {
      const s = spec[key], v = props[key];
      if (!s) return out.push("unknown prop `" + key + "` (" + name + " takes " + Object.keys(spec).join(", ") + ")");
      if (s.oneOf) { if (!s.oneOf.includes(v)) out.push("`" + key + "` is " + JSON.stringify(v) + "; " + name + " takes " + s.oneOf.map((x) => JSON.stringify(x)).join(", ")); return; }
      if (typeof v !== s.type || (s.type === "number" && !isFinite(v))) return out.push("`" + key + "` must be a " + s.type + ", not " + JSON.stringify(v));
      if (s.int && !Number.isInteger(v)) out.push("`" + key + "` must be a whole number, not " + v);
      if ((s.min != null && v < s.min) || (s.max != null && v > s.max)) out.push("`" + key + "` = " + v + " is outside " + s.min + " to " + s.max);
    });
    return out;
  };
  /* read one prop under its contract: a default when missing or wrong, numbers clamped */
  function propReader(name, props) {
    const spec = LAB_PROPS[name];
    return (key, dflt) => {
      const v = props[key], s = spec[key];
      if (v == null || !s) return dflt;
      if (s.oneOf) return s.oneOf.includes(v) ? v : dflt;
      if (typeof v !== s.type || (s.type === "number" && !isFinite(v))) return dflt;
      if (s.type !== "number") return v;
      const x = Math.min(s.max == null ? Infinity : s.max, Math.max(s.min == null ? -Infinity : s.min, v));
      return s.int ? Math.round(x) : x;
    };
  }

  /* phones get their own drawing, not a scaled-down desktop one */
  const NARROW = "(max-width: 560px)";
  const isNarrow = () => !!(window.matchMedia && window.matchMedia(NARROW).matches);
  function onNarrowChange(node, fn) {
    if (!window.matchMedia) return;
    const q = window.matchMedia(NARROW);
    const handler = () => {
      if (!node.isConnected) { if (q.removeEventListener) q.removeEventListener("change", handler); else q.removeListener(handler); return; }
      fn();
    };
    if (q.addEventListener) q.addEventListener("change", handler); else q.addListener(handler);
  }

  /* labels that must not touch: each label offers candidate positions in order of preference, and the first one that clears
     every placed label and every obstacle (a line end, an arrowhead) wins. Widths are estimated for the mono face with a margin. */
  const textW = (s, size) => [...s].reduce((w, c) => w + (c.codePointAt(0) > 0x2000 ? 1.05 : 0.62), 0) * size + 3;
  // the box covers the web font and the system fallback (ascent up to 1.0 em, descent 0.32 em) so a late font swap cannot make labels touch
  function labelBox(c, text, size) {
    const w = textW(c.text || text, size), x0 = c.anchor === "end" ? c.x - w : c.anchor === "middle" ? c.x - w / 2 : c.x;
    return { x0, x1: x0 + w, y0: c.y - size * 1.0, y1: c.y + size * 0.32 };
  }
  const boxesHit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  // does segment (x1,y1)-(x2,y2) pass through box b? (Liang–Barsky clipping)
  function segHitsBox(sg, b) {
    let t0 = 0, t1 = 1;
    const dx = sg.x2 - sg.x1, dy = sg.y2 - sg.y1;
    for (const [p, q] of [[-dx, sg.x1 - b.x0], [dx, b.x1 - sg.x1], [-dy, sg.y1 - b.y0], [dy, b.y1 - sg.y1]]) {
      if (p === 0) { if (q < 0) return false; continue; }
      const r = q / p;
      if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
    return true;
  }
  // hard: a label never touches another label or an obstacle. soft: it avoids crossing a line when some candidate allows it.
  function placeLabels(labels, obstacles, segments) {
    const placed = [], segs = segments || [];
    labels.forEach((L) => {
      let pick = null, fallback = null;
      for (const c of L.cands) {
        const b = labelBox(c, L.text, L.size);
        if (placed.some((p) => boxesHit(p, b)) || obstacles.some((o) => o.owner !== L.owner && boxesHit(o, b))) continue;
        if (!fallback) fallback = { c, b };
        if (!segs.some((sg) => sg.owner !== L.owner && segHitsBox(sg, b))) { pick = { c, b }; break; }
      }
      pick = pick || fallback;
      if (!pick) { const c = L.cands[L.cands.length - 1]; pick = { c, b: labelBox(c, L.text, L.size) }; }
      L.at = pick.c; L.box = pick.b; placed.push(pick.b);
      if (L.lostLine) segs.push({ x1: L.lostLine[0], y1: L.lostLine[1], x2: pick.c.end[0], y2: pick.c.end[1], owner: L.owner });
    });
    return labels;
  }
  // vertical nudges in whole label heights: down first, then up, then further down
  const nudges = (x, y, anchor, size) => { const u = Math.ceil(size * 1.34); return [0, 1, -1, 2, -2, 3, 4, -3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24].map((n) => ({ x, y: y + n * u, anchor, dy: n * u })); };
  function arrowHead(svg, x1, y1, x2, y2, fill, cls) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, px = -uy, py = ux, s = 7, w = 3.4;
    return el("path", { d: `M${x2.toFixed(1)},${y2.toFixed(1)} L${(x2 - ux * s + px * w).toFixed(1)},${(y2 - uy * s + py * w).toFixed(1)} L${(x2 - ux * s - px * w).toFixed(1)},${(y2 - uy * s - py * w).toFixed(1)}z`, fill, class: cls || null }, svg);
  }
  const idList = (ids) => { const m = ids.map((i) => "m" + i); return m.length < 2 ? m.join("") : m.slice(0, -1).join(", ") + " and " + m[m.length - 1]; };

  /* ================= graphLab =================
     Props (the contract is LAB_PROPS.graphLab above; course/dev/check.js flags anything else):
       model      "random" | "scale-free" | "small-world"   the generator that opens (default "small-world")
       mode       "explore" | "cascade" | "sybil"           explore: structure, and nodes to remove; cascade: spreading from seeds;
                                                            sybil: a Sybil region and two trust ranks (default "explore")
       contagion  "simple" | "complex"                      cascade rule. simple: a node adopts once one neighbour has.
                                                            complex: once at least `threshold` of its neighbours have (Watts' rule;
                                                            when that takes two or more sources it is Centola and Macy's complex contagion)
                                                            (default "complex")
       threshold  0.05 to 0.9                               the share for complex contagion (default 0.25)
       seeds      1 to 6                                    how many adjacent nodes Spread seeds, brainboi first (default 1 for simple, 2 for complex)
       n          20 to 150                                 honest nodes (default 60)
       seed       whole number                              which network is drawn (default 7)
       p          0.01 to 0.2                               random: link probability (default 0.07)
       beta       0 to 1                                    small world: rewiring probability (default 0.12)
       m          1 to 4                                    scale-free: links per newcomer (default 2)
       sybils     5 to 40                                   sybil: fake identities (default 20)
       attack     1 to 15                                   sybil: distinct attack edges, never on brainboi (default 3)
     Node 0 is brainboi: the default cascade seed and the trusted seed of personalised PageRank. Colour: honest nodes neutral,
     adopted nodes accent, Sybils ink; the five disposition colours are not used here. */
  C.widget("graphLab", (props) => {
    const get = propReader("graphLab", props);
    const MODEL = { random: "random", er: "random", "erdos-renyi": "random", "small-world": "smallworld", smallworld: "smallworld", ws: "smallworld", "scale-free": "scalefree", scalefree: "scalefree", ba: "scalefree" };
    const MODE = { explore: "explore", look: "explore", cascade: "cascade", sybil: "sybil" };
    const st = {
      model: MODEL[String(props.model || "small-world").toLowerCase()] || "smallworld",
      mode: MODE[String(props.mode || "explore").toLowerCase()] || "explore",
      contagion: get("contagion", "complex"), theta: get("threshold", 0.25), n: get("n", 60), seed: get("seed", 7),
      p: get("p", 0.07), beta: get("beta", 0.12), m: get("m", 2), k: 4, seeds: get("seeds", null), sybils: get("sybils", 20), attack: get("attack", 3)
    };
    let G = null, layout = null, adopted = new Set(), removed = new Set(), step = 0, timer = null;
    const svgBox = h("div", { class: "graph-box" }), side = h("div", { class: "gl-side" }), note = h("div", { class: "fig-explain" });
    const root = h("div", { class: "gl" });

    function build() {
      const r = rng(st.seed * 9973 + st.n);
      const n = st.n, adj = Array.from({ length: n }, () => new Set());
      const link = (a, b) => { if (a !== b) { adj[a].add(b); adj[b].add(a); } };
      if (st.model === "random") { for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (r() < st.p) link(a, b); }
      else if (st.model === "smallworld") {
        for (let a = 0; a < n; a++) for (let j = 1; j <= st.k / 2; j++) link(a, (a + j) % n);
        for (let a = 0; a < n; a++) for (let j = 1; j <= st.k / 2; j++) { const b = (a + j) % n; if (r() < st.beta && adj[a].has(b)) { let c; let tries = 0; do { c = Math.floor(r() * n); tries++; } while ((c === a || adj[a].has(c)) && tries < 50); if (tries < 50) { adj[a].delete(b); adj[b].delete(a); link(a, c); } } }
      } else {
        const m = st.m; for (let a = 0; a <= m; a++) for (let b = a + 1; b <= m; b++) link(a, b);
        const ends = []; for (let a = 0; a <= m; a++) adj[a].forEach(() => ends.push(a));
        for (let a = m + 1; a < n; a++) { const t = new Set(); while (t.size < m) t.add(ends[Math.floor(r() * ends.length)]); t.forEach((b) => { link(a, b); ends.push(a, b); }); }
      }
      const attackEdges = [];
      if (st.mode === "sybil") {
        const S = st.sybils, base = n;
        for (let i = 0; i < S; i++) adj.push(new Set());
        for (let a = base; a < base + S; a++) for (let b = a + 1; b < base + S; b++) if (b === a + 1 || r() < 0.45) link(a, b); // a chain keeps the region in one piece
        // distinct attack edges, landing on honest peers and never on brainboi (node 0)
        const keys = new Set(); let guard = 0;
        while (attackEdges.length < st.attack && guard++ < 1000) { const s = base + Math.floor(r() * S), t = 1 + Math.floor(r() * (n - 1)); if (keys.has(s + ":" + t)) continue; keys.add(s + ":" + t); attackEdges.push([s, t]); link(s, t); }
      }
      G = { adj, n: adj.length, honest: n, attackEdges };
      layout = lay(G, r);
      adopted = new Set(); removed = new Set(); step = 0; stopTimer();
    }
    function lay(g, r) {
      const n = g.n, P = [];
      const ring = st.model === "smallworld" && st.mode !== "sybil";
      for (let i = 0; i < n; i++) {
        if (ring) { const a = (i / g.honest) * Math.PI * 2 - Math.PI / 2; P.push({ x: Math.cos(a) * 0.42, y: Math.sin(a) * 0.42 }); }
        else P.push({ x: (r() - 0.5) * 0.9 + (i >= g.honest ? 0.55 : 0), y: (r() - 0.5) * 0.9 });
      }
      if (!ring) {
        for (let it = 0; it < 220; it++) {
          const cool = 0.02 * (1 - it / 220) + 0.002;
          const F = P.map(() => ({ x: 0, y: 0 }));
          for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
            const dx = P[a].x - P[b].x, dy = P[a].y - P[b].y, d2 = dx * dx + dy * dy + 1e-4;
            const f = 0.0009 / d2; F[a].x += dx * f; F[a].y += dy * f; F[b].x -= dx * f; F[b].y -= dy * f;
          }
          for (let a = 0; a < n; a++) g.adj[a].forEach((b) => { if (b > a) { const dx = P[a].x - P[b].x, dy = P[a].y - P[b].y; const d = Math.hypot(dx, dy) || 1e-3; const f = (d - 0.09) * 0.08; F[a].x -= dx / d * f; F[a].y -= dy / d * f; F[b].x += dx / d * f; F[b].y += dy / d * f; } });
          for (let a = 0; a < n; a++) { F[a].x -= P[a].x * 0.01; F[a].y -= P[a].y * 0.01; const L = Math.hypot(F[a].x, F[a].y) || 1; const s = Math.min(L, cool) / L; P[a].x += F[a].x * s; P[a].y += F[a].y * s; }
        }
        const xs = P.map((p) => p.x), ys = P.map((p) => p.y);
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        P.forEach((p) => { p.x = ((p.x - x0) / ((x1 - x0) || 1) - 0.5) * 0.9; p.y = ((p.y - y0) / ((y1 - y0) || 1) - 0.5) * 0.9; });
      }
      return P;
    }
    const alive = (a) => a < G.honest && !removed.has(a);
    function metrics() {
      const adj = G.adj, nodes = [];
      for (let a = 0; a < G.honest; a++) if (alive(a)) nodes.push(a);
      const N = nodes.length, nb = (a) => [...adj[a]].filter(alive);
      const deg = nodes.map((a) => nb(a).length);
      const mean = N ? deg.reduce((x, y) => x + y, 0) / N : 0;
      let cc = 0;
      nodes.forEach((a) => { const v = nb(a), k = v.length; if (k < 2) return; let t = 0; for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) if (adj[v[i]].has(v[j])) t++; cc += t / (k * (k - 1) / 2); });
      cc = N ? cc / N : 0;
      // components first, so a split network cannot hide behind its mean path
      const comp = new Map(); let nc = 0, giant = 0;
      nodes.forEach((s0) => { if (comp.has(s0)) return; const q = [s0]; comp.set(s0, nc); let size = 0; while (q.length) { const a = q.shift(); size++; nb(a).forEach((b) => { if (!comp.has(b)) { comp.set(b, nc); q.push(b); } }); } giant = Math.max(giant, size); nc++; });
      let tot = 0, pairs = 0;
      nodes.forEach((s) => { const dist = new Map([[s, 0]]), q = [s]; while (q.length) { const a = q.shift(); nb(a).forEach((b) => { if (!dist.has(b)) { dist.set(b, dist.get(a) + 1); q.push(b); } }); } dist.forEach((d) => { if (d > 0) { tot += d; pairs++; } }); });
      const all = N * (N - 1);
      return { N, deg, mean, cc, L: pairs ? tot / pairs : 0, maxd: deg.length ? Math.max(...deg) : 0, giant, comps: nc, unreach: all ? (all - pairs) / all : 0 };
    }
    function trust() {
      // global PageRank: every node vouches the same way (Cheng and Friedman's symmetric kind: relabel the nodes and the scores relabel with them).
      // personalised PageRank from brainboi: the walk restarts at node 0 only, the SybilRank-style trust from one trusted seed.
      const N = G.n, adj = G.adj, S = N - G.honest;
      const pr = (personal) => {
        let v = new Array(N).fill(1 / N);
        for (let it = 0; it < 80; it++) {
          const nv = new Array(N).fill(0);
          for (let a = 0; a < N; a++) { const d = adj[a].size; if (!d) continue; adj[a].forEach((b) => { nv[b] += 0.85 * v[a] / d; }); }
          for (let a = 0; a < N; a++) nv[a] += 0.15 * (personal ? (a === 0 ? 1 : 0) : 1 / N);
          const s = nv.reduce((x, y) => x + y, 0); v = nv.map((x) => x / s);
        }
        return v;
      };
      const order = (v) => v.map((x, i) => [x, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map(([, i]) => i);
      const g = pr(false), pz = pr(true), og = order(g), oz = order(pz);
      const share = (v) => v.slice(G.honest).reduce((a, b) => a + b, 0);
      const top = (o) => o.slice(0, S).filter((i) => i >= G.honest).length;
      const best = (o) => o.findIndex((i) => i >= G.honest) + 1;
      return { N, S, frac: S / N, sym: share(g), asym: share(pz), topSym: top(og), topAsym: top(oz), rankSym: best(og), rankAsym: best(oz) };
    }
    const need = (k) => (st.contagion === "simple" ? 1 : Math.max(1, Math.ceil(st.theta * k - 1e-9)));
    function cascadeStep() {
      const nxt = new Set(adopted);
      for (let a = 0; a < G.honest; a++) {
        if (adopted.has(a) || !alive(a)) continue;
        const nb = [...G.adj[a]].filter(alive); if (!nb.length) continue;
        const c = nb.filter((b) => adopted.has(b)).length;
        if (st.contagion === "simple" ? c >= 1 : c >= 1 && c / nb.length >= st.theta - 1e-9) nxt.add(a);
      }
      const grew = nxt.size > adopted.size; adopted = nxt; step++; return grew;
    }
    function seedCascade() {
      // a connected cluster of seeds grown outward from brainboi: one for simple contagion, two adjacent ones for complex, unless `seeds` says otherwise
      const want = st.seeds || (st.contagion === "simple" ? 1 : 2);
      const start = alive(0) ? 0 : [...Array(G.honest).keys()].find(alive);
      if (start == null) return;
      const q = [start], seen = new Set([start]);
      while (q.length && adopted.size < want) { const a = q.shift(); adopted.add(a); [...G.adj[a]].filter((b) => alive(b) && !seen.has(b)).sort((x, y) => x - y).forEach((b) => { seen.add(b); q.push(b); }); }
    }
    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

    function draw() {
      const narrow = isNarrow(), W = narrow ? 340 : 560, H = narrow ? 300 : 380, fs = narrow ? 11 : 12.5;
      const sx = (x) => W / 2 + x * W * 0.95, sy = (y) => H / 2 + y * H * 0.92;
      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "w-svg graph-svg", role: "img", "aria-label": "A generated network of " + G.honest + " nodes" + (st.mode === "sybil" ? " and " + (G.n - G.honest) + " Sybil identities" : "") });
      const eg = el("g", {}, svg);
      const isAttack = (a, b) => (a >= G.honest) !== (b >= G.honest);
      G.adj.forEach((s, a) => s.forEach((b) => {
        if (b <= a || removed.has(a) || removed.has(b)) return;
        const syb = a >= G.honest && b >= G.honest, att = isAttack(a, b);
        el("line", { x1: sx(layout[a].x), y1: sy(layout[a].y), x2: sx(layout[b].x), y2: sy(layout[b].y), stroke: att ? "var(--ink)" : syb ? "var(--ink-3)" : "var(--rule-strong)", "stroke-width": att ? 1.8 : 0.9, "stroke-dasharray": att ? "5 3" : null, opacity: syb ? 0.45 : 0.9, class: att ? "gl-attack" : null }, eg);
      }));
      const maxd = Math.max(1, ...G.adj.map((s) => s.size)), ring = st.model === "smallworld" && st.mode !== "sybil";
      G.adj.forEach((s, a) => {
        const cx = sx(layout[a].x), cy = sy(layout[a].y), rr = ring ? 2.5 + 3.5 * Math.sqrt(s.size / maxd) : 3 + 5 * Math.sqrt(s.size / maxd);
        if (removed.has(a)) { el("circle", { cx, cy, r: 3, fill: "none", stroke: "var(--ink-3)", "stroke-dasharray": "2 2", "stroke-width": 1 }, svg); return; }
        const syb = a >= G.honest;
        const c = el("circle", { cx, cy, r: rr, fill: syb ? "var(--ink)" : adopted.has(a) ? "var(--accent)" : a === 0 && st.mode !== "explore" ? "var(--ink-2)" : "var(--surface)", stroke: syb ? "var(--surface)" : adopted.has(a) ? "var(--surface)" : "var(--ink-3)", "stroke-width": syb || adopted.has(a) ? 1 : 1.1, class: syb ? "gl-sybil" : adopted.has(a) ? "gl-adopted" : "gl-node" }, svg);
        if (st.mode === "cascade" && !syb) { c.style.cursor = "pointer"; c.addEventListener("click", () => { stopTimer(); adopted.add(a); render(); }); }
      });
      if (st.mode !== "explore" && !removed.has(0)) {
        const x = sx(layout[0].x), y = sy(layout[0].y), right = x < W - 80;
        const t = el("text", { x: right ? x + 9 : x - 9, y: y - 8, "text-anchor": right ? "start" : "end", "font-size": fs, "font-family": "var(--mono)", fill: "var(--ink)", class: "halo" }, svg);
        t.textContent = "brainboi";
      }
      svgBox.textContent = ""; svgBox.appendChild(svg);
    }
    const kv = (rows) => h("dl", { class: "gl-kv" }, rows.filter(Boolean).map(([k, v, cls]) => h("div", { class: cls || null }, h("dt", null, k), h("dd", null, v))));
    const pct = (x, d) => (100 * x).toFixed(d || 0) + "%";
    function histogram(m) {
      const bins = new Array(m.maxd + 1).fill(0); m.deg.forEach((d) => bins[d]++);
      const HW = 260, HH = 64, bw = HW / bins.length, topc = Math.max(1, ...bins);
      const hs = el("svg", { viewBox: `0 0 ${HW} ${HH + 14}`, class: "w-svg hist", role: "img", "aria-label": "Degree distribution" });
      bins.forEach((c, d) => { if (c) el("rect", { x: d * bw + 1, y: HH - (c / topc) * HH, width: Math.max(1, bw - 2), height: (c / topc) * HH, fill: "var(--accent)" }, hs); });
      const t1 = el("text", { x: 0, y: HH + 12, "font-size": 9.5, "font-family": "var(--mono)", fill: "var(--ink-3)" }, hs); t1.textContent = "degree 0";
      const t2 = el("text", { x: HW, y: HH + 12, "font-size": 9.5, "text-anchor": "end", "font-family": "var(--mono)", fill: "var(--ink-3)" }, hs); t2.textContent = String(m.maxd);
      return h("div", { class: "gl-hist" }, h("div", { class: "lab-k" }, "Degree distribution"), hs, h("div", { class: "gl-small" }, "Linear axes. At this size a power law cannot be told from other skewed shapes by eye; the long right tail of hubs is what to look for."));
    }
    function renderSide() {
      side.textContent = "";
      if (st.mode === "sybil") {
        const t = trust();
        const row = (label, base, a, b) => h("tr", null, h("th", { scope: "row" }, label), h("td", null, base), h("td", null, a), h("td", null, b));
        side.appendChild(h("table", { class: "gl-trust" },
          h("thead", null, h("tr", null, h("th", null, ""), h("th", { scope: "col" }, "by headcount"), h("th", { scope: "col" }, "global PageRank"), h("th", { scope: "col" }, "personalised PageRank from brainboi"))),
          h("tbody", null,
            row("Sybil share of all rank", pct(t.frac), pct(t.sym, 1), pct(t.asym, 1)),
            row("Sybils among the top " + t.S, Math.round(t.frac * t.S) + " of " + t.S, t.topSym + " of " + t.S, t.topAsym + " of " + t.S),
            row("the attacker's best-placed identity", "–", "#" + t.rankSym + " of " + t.N, "#" + t.rankAsym + " of " + t.N))));
        side.appendChild(h("p", { class: "gl-small" }, t.S + " Sybils among " + t.N + " nodes; " + G.attackEdges.length + " attack edge" + (G.attackEdges.length === 1 ? "" : "s") + " (dashed). Global PageRank is symmetric: relabel the nodes and the scores follow. The personalised walk restarts only at brainboi, the trusted seed."));
        return;
      }
      const m = metrics(), split = m.comps > 1;
      side.appendChild(kv([
        ["nodes", removed.size ? m.N + " of " + G.honest + " (" + removed.size + " removed)" : String(m.N)],
        ["mean degree", m.mean.toFixed(1)],
        ["clustering", m.cc.toFixed(2)],
        [split ? "mean path, connected pairs" : "mean path", m.L ? m.L.toFixed(2) : "–"],
        ["largest degree", String(m.maxd)],
        ["largest component", m.giant + " of " + m.N + " (" + pct(m.N ? m.giant / m.N : 0) + ")", split ? "gl-flag" : null],
        split ? ["pairs with no path", pct(m.unreach), "gl-flag"] : null,
        st.mode === "cascade" ? ["adopted", adopted.size + " of " + m.N + (step ? " · step " + step : "")] : null
      ]));
      if (st.mode === "explore") side.appendChild(histogram(m));
    }
    const MODEL_NOTE = {
      random: () => "**Random (Erdős–Rényi).** Every pair is linked with the same probability p. Degrees bunch around the mean and clustering is low. A giant component appears once p passes about 1/n; the whole network is connected only above about ln n / n (" + pct(Math.log(st.n) / st.n, 1) + " at " + st.n + " nodes), so near the default some nodes are cut off, and the mean path then counts only the pairs that can reach each other.",
      smallworld: () => "**Small world (Watts–Strogatz).** A ring of neighbours with a few links rewired at random. A little rewiring keeps the clustering of a village and gives the short paths of a random network. Something that spreads on one contact crosses it in a few hops; something that needs two sources gains nothing from the long links (try Cascade with complex contagion at 50%, rewiring 0 and then 0.12).",
      scalefree: () => "**Scale-free (Barabási–Albert).** New nodes link to well-connected ones, so a few hubs carry a large share of the links. Hubs speed spreading, and they hold the network together: remove the biggest hubs one by one, then restore and remove as many at random, and compare the largest component."
    };
    const MODEL_NAME = { random: "Random network", smallworld: "Small world", scalefree: "Scale-free network" };
    const seedWords = () => { const n = st.seeds || (st.contagion === "simple" ? 1 : 2); return n === 1 ? "brainboi" : n === 2 ? "brainboi and one neighbour" : "brainboi and " + (n - 1) + " nodes around it"; };
    function noteText() {
      if (st.mode === "explore") return MODEL_NOTE[st.model]() + " **Remove** takes nodes out, the biggest hub first or one at random; the numbers then describe what is left, and a split network shows its largest component and the share of pairs with no path between them.";
      if (st.mode === "cascade") {
        const k = Math.max(1, Math.round(metrics().mean)), c = need(k);
        let s = st.contagion === "simple"
          ? "**" + MODEL_NAME[st.model] + ", simple contagion.** A node adopts as soon as one neighbour has: one contact is enough, as for a forwarded message. Spread starts from " + seedWords() + "; tap nodes to add seeds."
          : "**" + MODEL_NAME[st.model] + ", complex contagion.** A node adopts once at least " + pct(st.theta) + " of its neighbours have (Watts' threshold rule). Here a node with " + k + " neighbours needs " + c + (c >= 2 ? ": two or more sources, which Centola and Macy call a complex contagion; a long link carries one signal and does not help it." : ": one source, so most nodes behave as in a simple contagion.") + " Spread starts from " + seedWords() + "; tap nodes to add seeds.";
        if (st.model === "smallworld") s += " On this ring, compare rewiring 0 with 0.12 at a 50% threshold, then switch to simple.";
        if (st.model === "scalefree") s += " Remove the biggest hubs before spreading to see what targeting the hubs does, which spreading at random cannot.";
        if (removed.size) s += " Removed nodes never adopt and pass nothing on.";
        return s;
      }
      return "**Sybil region.** " + st.sybils + " fake identities (the filled cluster), densely linked to each other and joined to honest peers of a " + MODEL_NAME[st.model].toLowerCase() + " by " + st.attack + " attack edge" + (st.attack === 1 ? "" : "s") + ". Under global PageRank, where every node vouches the same way, they get about their headcount share of all rank and a little more with each attack edge; their links to each other cost nothing and can still place single Sybils high in the global ranking (the attacker's best-placed identity), the kind of gain Cheng and Friedman show no symmetric reputation function can rule out. Personalised PageRank from brainboi, SybilRank-style trust from one trusted seed, reaches them only across the attack edges, so their share stays bounded by the number of attack edges: the property SybilGuard and SybilRank build on. Neither number is a proof of sybilproofness. Membrane's standing is computed the second way, locally, from the receiver's own view [[P§9.4]].";
    }
    const params = h("div", { class: "w-grid" }), actions = h("div", { class: "w-row gl-actions" });
    // the sliders are built only when the model, mode or contagion changes, never on a redraw, so a drag in progress survives
    function paramUI() {
      params.textContent = "";
      if (st.model === "random") params.appendChild(slider("Link probability p", 0.01, 0.2, 0.01, st.p, (v) => { st.p = v; build(); render(); }));
      if (st.model === "smallworld") params.appendChild(slider("Rewiring β", 0, 1, 0.02, st.beta, (v) => { st.beta = v; build(); render(); }));
      if (st.model === "scalefree") params.appendChild(slider("Links per newcomer", 1, 4, 1, st.m, (v) => { st.m = v; build(); render(); }));
      if (st.mode === "cascade") {
        params.appendChild(h("div", { class: "w-field" }, h("span", { class: "w-label" }, "Contagion"), seg([{ v: "simple", label: "Simple" }, { v: "complex", label: "Complex" }], st.contagion, (v) => { st.contagion = v; stopTimer(); adopted = new Set(); step = 0; refresh(); }, "contagion")));
        if (st.contagion === "complex") params.appendChild(slider("Adoption threshold", 0.05, 0.9, 0.05, st.theta, (v) => { st.theta = v; stopTimer(); adopted = new Set(); step = 0; render(); }, (v) => Math.round(v * 100) + "%"));
      }
      if (st.mode === "sybil") {
        params.appendChild(slider("Sybil identities", 5, 40, 1, st.sybils, (v) => { st.sybils = v; build(); render(); }));
        params.appendChild(slider("Attack edges", 1, 15, 1, st.attack, (v) => { st.attack = v; build(); render(); }));
      }
    }
    const runBtn = h("button", { type: "button", class: "btn primary small", onclick: () => {
      if (timer) { stopTimer(); render(); return; }
      if (!adopted.size) seedCascade();
      timer = setInterval(() => { if (!root.isConnected || !cascadeStep()) stopTimer(); render(); }, K.reduceMotion() ? 60 : 420);
      render();
    } }, "Spread");
    function renderActions() {
      actions.textContent = "";
      if (st.mode === "cascade") { runBtn.textContent = timer ? "Stop" : "Spread"; actions.appendChild(runBtn); }
      if (st.mode === "sybil") return;
      actions.appendChild(h("button", { type: "button", class: "btn small", onclick: () => { let best = -1, bd = -1; for (let a = 0; a < G.honest; a++) if (alive(a)) { const d = [...G.adj[a]].filter(alive).length; if (d > bd) { bd = d; best = a; } } if (best >= 0) { removed.add(best); adopted.delete(best); render(); } } }, "Remove the biggest hub"));
      actions.appendChild(h("button", { type: "button", class: "btn small", onclick: () => { const left = []; for (let a = 0; a < G.honest; a++) if (alive(a)) left.push(a); if (left.length) { const r = rng(st.seed * 131 + removed.size * 7 + 1); const a = left[Math.floor(r() * left.length)]; removed.add(a); adopted.delete(a); render(); } } }, "Remove a random node"));
      if (removed.size) actions.appendChild(h("button", { type: "button", class: "btn ghost small", onclick: () => { removed = new Set(); render(); } }, "Restore"));
      if (st.mode === "cascade" && adopted.size && !timer) actions.appendChild(h("button", { type: "button", class: "btn ghost small", onclick: () => { adopted = new Set(); step = 0; render(); } }, "Clear"));
    }
    function render() {
      draw(); renderSide(); renderActions();
      note.textContent = ""; note.appendChild(inline(noteText()));
      root.dataset.model = st.model; root.dataset.mode = st.mode; root.dataset.contagion = st.contagion;
    }
    function refresh() { paramUI(); render(); }
    build(); refresh();
    onNarrowChange(root, draw);
    const modeRow = h("div", { class: "w-row" },
      seg([{ v: "random", label: "Random" }, { v: "smallworld", label: "Small world" }, { v: "scalefree", label: "Scale-free" }], st.model, (v) => { st.model = v; build(); refresh(); }, "model"),
      seg([{ v: "explore", label: "Explore" }, { v: "cascade", label: "Cascade" }, { v: "sybil", label: "Sybil" }], st.mode, (v) => { const re = (v === "sybil") !== (st.mode === "sybil"); st.mode = v; stopTimer(); if (re) build(); else { adopted = new Set(); step = 0; } refresh(); }, "mode"),
      h("button", { type: "button", class: "btn ghost small", onclick: () => { st.seed++; build(); render(); } }, "New network"));
    root.append(h("div", { class: "check-k" }, "Network lab"), modeRow, params, actions, h("div", { class: "graph-grid" }, svgBox, side), note);
    return root;
  });

  /* ================= lossyChannel =================
     Props (the contract is LAB_PROPS.lossyChannel above; course/dev/check.js flags anything else):
       mode     "at-most-once" | "at-least-once" | "dedup"   the sender and receiver that open (default "dedup")
       loss     0 to 0.5     chance the channel drops a message, and separately an acknowledgement (default 0.25)
       dup      0 to 0.4     chance the channel delivers a second copy of a message (default 0.1)
       reorder  boolean      a delay drawn per copy, so messages can overtake each other (default true)
       seed     whole number which run (default 3)
       n        3 to 8       messages sent (default 6)
     The model, which the captions describe exactly: the sender sends m1 to mn one time unit apart.
       at-most-once   no acknowledgements and no resends. The receiver records an id before it processes the message and drops
                      any later copy whose id it has recorded, so no effect runs twice; what the channel drops is gone.
       at-least-once  the receiver processes every copy that arrives and acknowledges each one, from the moment it arrives.
                      The sender resends when no acknowledgement has reached it within the timeout, up to six tries.
       dedup          as at-least-once, but a copy whose id the receiver has seen gets the original receipt again and runs nothing.
     Every random draw is keyed by (seed, message, try, copy), so switching mode replays the same channel. */
  function u01(...keys) {
    let x = 0x811c9dc5;
    for (const k of keys) { x = Math.imul(x ^ (k | 0), 0x01000193); x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d); x ^= x >>> 12; x = Math.imul(x, 0x297a2d39); x ^= x >>> 15; }
    return (x >>> 0) / 4294967296;
  }
  const LOSSY = { GAP: 1, TIMEOUT: 5.5, TRIES: 6, MODES: { "at-most-once": "atmost", atmost: "atmost", "at-least-once": "atleast", atleast: "atleast", dedup: "dedup" } };
  function lossySim(o) {
    const mode = LOSSY.MODES[o.mode] || "dedup", seed = o.seed | 0, n = o.n || 6, TRIES = mode === "atmost" ? 1 : LOSSY.TRIES;
    const delay = (i, k, c, kind) => (o.reorder ? 0.6 + 1.8 * u01(seed, i, k, c, kind) : 1.2);
    const tx = [], arrivals = [], msgs = [];
    for (let i = 1; i <= n; i++) {
      let t = (i - 1) * LOSSY.GAP, ackAt = Infinity, gaveUp = null;
      for (let k = 0; k < TRIES; k++) {
        const send = { id: i, k, at: t, lost: u01(seed, i, k, 0, 1) < o.loss };
        tx.push(send);
        if (!send.lost) {
          const copies = u01(seed, i, k, 0, 2) < o.dup ? 2 : 1;
          for (let c = 0; c < copies; c++) {
            const a = { id: i, k, c, sent: t, at: t + delay(i, k, c, 3) };
            if (mode !== "atmost") { // the receiver answers each copy when it arrives, never before
              a.ackLost = u01(seed, i, k, c, 4) < o.loss;
              a.ackAt = a.at + delay(i, k, c, 5);
              if (!a.ackLost) ackAt = Math.min(ackAt, a.ackAt);
            }
            arrivals.push(a);
          }
        }
        if (mode === "atmost") break;
        const due = t + LOSSY.TIMEOUT;
        if (ackAt <= due) break; // an acknowledgement reached the sender before the timer fired
        if (k === TRIES - 1) { gaveUp = due; break; }
        t = due; // no acknowledgement by the timeout: resend the same id
      }
      msgs.push({ id: i, ackAt: ackAt < Infinity ? ackAt : null, gaveUp });
    }
    let effects = 0, repeats = 0;
    const twice = [], lost = [], gaveUpArrived = [];
    msgs.forEach((m) => {
      const mine = arrivals.filter((a) => a.id === m.id).sort((a, b) => a.at - b.at);
      mine.forEach((a, j) => {
        a.first = j === 0;
        a.act = j === 0 ? "ran" : mode === "atleast" ? "again" : mode === "atmost" ? "dropped" : "receipt";
        if (a.act === "ran" || a.act === "again") effects++; else repeats++;
      });
      m.runs = mine.filter((a) => a.act === "ran" || a.act === "again").length;
      if (m.runs > 1) twice.push(m.id);
      if (!mine.length) lost.push(m.id);
      else if (m.gaveUp != null) gaveUpArrived.push(m.id);
    });
    const late = []; let hi = 0;
    arrivals.filter((a) => a.first).sort((a, b) => a.at - b.at).forEach((a) => { if (a.id < hi) late.push(a.id); hi = Math.max(hi, a.id); });
    return { mode, n, tx, arrivals, msgs, effects, repeats, twice, lost, late, gaveUpArrived, resends: tx.filter((x) => x.k > 0).length, arrived: n - lost.length };
  }
  C.labSims = Object.assign(C.labSims || {}, { lossy: lossySim });

  C.widget("lossyChannel", (props) => {
    const get = propReader("lossyChannel", props);
    const st = { mode: LOSSY.MODES[props.mode] || "dedup", loss: get("loss", 0.25), dup: get("dup", 0.1), reorder: get("reorder", true), seed: get("seed", 3), n: get("n", 6) };
    const PUBLIC = { atmost: "at-most-once", atleast: "at-least-once", dedup: "dedup" };
    const out = h("div", { class: "lc-out" }), root = h("div", { class: "lc" });

    // where a lost message or acknowledgement stops: along its own line, with its words, else the bare ✕
    const FRACS = [0.42, 0.3, 0.54, 0.22, 0.64, 0.36, 0.48, 0.14, 0.72, 0.26, 0.6, 0.18];
    function lostCands(at, text, anchor, fs) {
      const word = FRACS.map((f) => { const [ex, ey] = at(f); return { x: anchor === "start" ? ex - fs * 0.55 : ex + fs * 0.55, y: ey + fs * 0.35, anchor, end: [ex, ey], text }; });
      const bare = FRACS.map((f) => { const [ex, ey] = at(f); return { x: ex, y: ey + fs * 0.35, anchor: "middle", end: [ex, ey], text: "✕" }; });
      return word.concat(bare);
    }
    function draw(s, narrow) {
      const g = narrow ? { W: 340, sx: 44, rx: 214, fs: 10.5 } : { W: 600, sx: 92, rx: 398, fs: 10.5 };
      const span = g.rx - g.sx, fs = g.fs;
      const ends = [4];
      s.tx.forEach((t) => ends.push(t.at + 1));
      s.arrivals.forEach((a) => { ends.push(a.at); if (a.ackAt != null) ends.push(a.ackLost ? a.at + 1 : a.ackAt); });
      const tEnd = Math.max(...ends), k = Math.max(14, Math.min(30, 440 / tEnd)), top = 38, Y = (t) => top + t * k;
      const svg = el("svg", { class: "w-svg lc-svg", role: "img" });
      const lines = el("g", { class: "lc-lines" }, svg), heads = el("g", {}, svg), texts = el("g", {}, svg);
      const labels = [], obstacles = [], segments = [];
      // the two lifeline names are fixed boxes
      [["sender", g.sx], ["receiver", g.rx]].forEach(([name, x]) => obstacles.push(Object.assign(labelBox({ x, y: 16, anchor: "middle" }, name, 12), { owner: "names" })));
      // lines: messages that arrive, copies, acknowledgements
      s.arrivals.forEach((a, ai) => {
        const y0 = Y(a.sent), y1 = Y(a.at), own = "a" + ai;
        segments.push({ x1: g.sx, y1: y0, x2: g.rx - 1, y2: y1, owner: own });
        el("line", { x1: g.sx, y1: y0, x2: g.rx - 1, y2: y1, stroke: a.c ? "var(--accent)" : "var(--ink-2)", "stroke-width": 1.3, "stroke-dasharray": a.c ? "6 3" : null, class: "lc-msg", "data-owner": own }, lines);
        arrowHead(heads, g.sx, y0, g.rx - 1, y1, a.c ? "var(--accent)" : "var(--ink-2)", "lc-head");
        obstacles.push({ x0: g.rx - 9, x1: g.rx + 2, y0: y1 - 5, y1: y1 + 5, owner: own });
        const act = { ran: "ran", again: "ran again", dropped: "dropped", receipt: "receipt again" }[a.act];
        const tag = "m" + a.id + (narrow ? "" : (a.k ? " r" + a.k : "") + (a.c ? " copy" : "") + " ·");
        labels.push({ group: 2, owner: own, text: tag + " " + act, size: fs, bold: a.act === "again", muted: a.act === "dropped" || a.act === "receipt", lead: [g.rx + 2, y1], cands: nudges(g.rx + 8, y1 + fs * 0.35, "start", fs) });
        if (a.ackAt == null) return;
        if (!a.ackLost) {
          const ya = Y(a.ackAt);
          segments.push({ x1: g.rx, y1, x2: g.sx + 1, y2: ya, owner: own + "k" });
          el("line", { x1: g.rx, y1, x2: g.sx + 1, y2: ya, stroke: "var(--ink-3)", "stroke-width": 1.1, "stroke-dasharray": "1.5 2.5", class: "lc-ack", "data-owner": own + "k" }, lines);
          arrowHead(heads, g.rx, y1, g.sx + 1, ya, "var(--ink-3)", "lc-head");
          obstacles.push({ x0: g.sx - 1, x1: g.sx + 9, y0: ya - 5, y1: ya + 5, owner: own + "k" });
        } else {
          // a lost acknowledgement leaves from the arrival point and stops part way, at its ✕
          const cands = lostCands((f) => [g.rx - f * span, Y(a.at + f * 1.2)], "ack lost ✕", "end", fs);
          labels.push({ group: 0, owner: own + "k", text: "ack lost ✕", size: fs, muted: true, lostLine: [g.rx, y1, "ack"], cands });
        }
      });
      // sends: a label at the sender for every try, and a stub for each one the channel lost
      s.tx.forEach((t, ti) => {
        const y = Y(t.at), own = "t" + ti;
        obstacles.push({ x0: g.sx - 3, x1: g.sx + 3, y0: y - 3, y1: y + 3, owner: "send" });
        labels.push({ group: 1, owner: own, text: "m" + t.id + (t.k ? " r" + t.k : ""), size: fs, lead: [g.sx - 2, y], cands: nudges(g.sx - 7, y + fs * 0.35, "end", fs) });
        if (t.lost) {
          const cands = lostCands((f) => [g.sx + f * span, Y(t.at + f * 1.2)], "✕ lost", "start", fs);
          labels.push({ group: 0, owner: own + "x", text: "✕ lost", size: fs, muted: true, lostLine: [g.sx, y, "msg"], cands });
        }
      });
      labels.sort((a, b) => a.group - b.group || a.cands[0].y - b.cands[0].y);
      placeLabels(labels, obstacles, segments);
      let bottom = Y(tEnd);
      labels.forEach((L) => {
        const c = L.at;
        if (L.lostLine) {
          const [x0, y0, kind] = L.lostLine;
          el("line", { x1: x0, y1: y0, x2: c.end[0], y2: c.end[1], stroke: "var(--ink-3)", "stroke-width": kind === "ack" ? 1.1 : 1.3, "stroke-dasharray": kind === "ack" ? "1.5 2.5" : "3 3", class: "lc-lost", "data-owner": L.owner }, lines);
        } else if (L.lead && Math.abs(c.dy) > 3) {
          el("line", { x1: L.lead[0], y1: L.lead[1], x2: c.anchor === "start" ? c.x - 1 : c.x + 1, y2: c.y - fs * 0.35, stroke: "var(--rule-strong)", "stroke-width": 0.8, class: "lc-leader", "data-owner": L.owner }, lines);
        }
        const t = el("text", { x: c.x.toFixed(1), y: c.y.toFixed(1), "text-anchor": c.anchor, "font-size": L.size, "font-family": "var(--mono)", "font-weight": L.bold ? 700 : null, fill: L.muted ? "var(--ink-3)" : "var(--ink)", class: "halo lc-label", "data-owner": L.owner }, texts);
        t.textContent = c.text || L.text;
        bottom = Math.max(bottom, L.box.y1);
      });
      const H = Math.ceil(bottom + 30);
      [["sender", g.sx], ["receiver", g.rx]].forEach(([name, x]) => {
        el("line", { x1: x, y1: 24, x2: x, y2: H - 22, stroke: "var(--rule-strong)", "stroke-dasharray": "3 4" }, lines);
        const t = el("text", { x, y: 16, "text-anchor": "middle", "font-size": 12, "font-family": "var(--mono)", fill: "var(--ink-2)", class: "lc-name" }, texts); t.textContent = name;
      });
      const tl = el("text", { x: 4, y: H - 6, "font-size": 10, "font-family": "var(--mono)", fill: "var(--ink-3)" }, texts); tl.textContent = "time ↓";
      svg.setAttribute("viewBox", `0 0 ${g.W} ${H}`);
      svg.setAttribute("aria-label", "Sender and receiver lifelines, time running down: " + s.tx.length + " sends, " + s.arrivals.length + " arrivals");
      return svg;
    }
    function sentence(s) {
      const parts = [];
      parts.push(s.arrived + " of " + s.n + " arrived" + (s.lost.length ? "; " + idList(s.lost) + (s.lost.length > 1 ? " were" : " was") + " lost for good." : "."));
      if (s.mode === "atleast") parts.push(s.twice.length ? "Effects ran " + s.effects + " times for " + s.arrived + " messages: " + idList(s.twice) + " ran more than once." : "Each effect ran once.");
      else parts.push("No effect ran twice" + (s.repeats ? "; the receiver " + (s.mode === "atmost" ? "dropped " : "answered ") + s.repeats + " repeat" + (s.repeats > 1 ? "s" : "") + (s.mode === "atmost" ? " without running them." : " with the original receipt.") : "."));
      if (s.mode !== "atmost") parts.push(s.resends ? "The sender resent " + s.resends + " time" + (s.resends > 1 ? "s" : "") + "." : "Nothing was resent.");
      if (s.gaveUpArrived.length) parts.push("The sender gave up on " + idList(s.gaveUpArrived) + " after six tries with no acknowledgement, though " + (s.gaveUpArrived.length > 1 ? "they had" : "it had") + " arrived.");
      parts.push(s.late.length ? idList(s.late) + (s.late.length > 1 ? " were" : " was") + " overtaken by a later message." : "No message was overtaken.");
      return parts.join(" ");
    }
    function legend(mode, narrow) {
      const sw = (attrs) => { const s = el("svg", { viewBox: "0 0 28 10", "aria-hidden": "true" }); el("line", Object.assign({ x1: 1, y1: 5, x2: 27, y2: 5 }, attrs), s); return s; };
      return h("div", { class: "lc-legend" },
        h("span", null, sw({ stroke: "var(--ink-2)", "stroke-width": 1.6 }), "message"),
        h("span", null, sw({ stroke: "var(--accent)", "stroke-width": 1.6, "stroke-dasharray": "6 3" }), "extra copy made by the channel"),
        mode === "atmost" ? null : h("span", null, sw({ stroke: "var(--ink-3)", "stroke-width": 1.4, "stroke-dasharray": "1.5 2.5" }), "acknowledgement"),
        h("span", null, h("b", { class: "lc-x" }, "✕"), "lost on the way"),
        mode !== "atmost" ? h("span", null, h("b", { class: "lc-x" }, "r1"), "first resend, r2 the second") : null);
    }
    const CAPTION = {
      atmost: "**At most once.** The sender sends each message once, waits for nothing and never resends. The receiver records an id before it processes the message, and drops any later copy with an id it has already recorded, so no effect runs twice. Whatever the channel drops is gone for good.",
      atleast: "**At least once.** The receiver processes every copy that arrives and acknowledges each one as it arrives. The sender resends a message when no acknowledgement has reached it within the timeout, up to six tries. A lost acknowledgement brings a resend, and a resend or a copy the channel duplicated runs the effect again. A message is lost for good only if all six tries are lost.",
      dedup: "**At least once, plus a receiver that remembers ids.** The sender resends as in at least once. The receiver records each id it processes; a copy with an id it has seen gets the original receipt again and runs nothing, so no effect runs twice, and a message is lost for good only if all six tries are lost. This is Membrane's rule for duplicates: same `from`, `id` and body get the original receipt and nothing else [[P§4.2]]. The endpoints build exactly-once between them, from resends and remembered ids."
    };
    function render() {
      const s = lossySim({ mode: st.mode, loss: st.loss, dup: st.dup, reorder: st.reorder, seed: st.seed, n: st.n }), narrow = isNarrow();
      out.textContent = "";
      out.appendChild(h("p", { class: "w-sentence lc-sentence" }, sentence(s)));
      out.appendChild(h("div", { class: "lc-fig" }, draw(s, narrow)));
      out.appendChild(legend(st.mode, narrow));
      out.appendChild(h("div", { class: "fig-explain" }, inline(CAPTION[st.mode])));
      Object.assign(root.dataset, { mode: PUBLIC[st.mode], seed: String(st.seed), effects: String(s.effects), twice: String(s.twice.length), lost: String(s.lost.length) });
    }
    render();
    onNarrowChange(root, render);
    root.append(h("div", { class: "check-k" }, "A lossy channel"),
      h("div", { class: "w-row" }, h("span", { class: "small muted" }, "Sender and receiver"), seg([{ v: "atmost", label: "at most once" }, { v: "atleast", label: "at least once" }, { v: "dedup", label: "at least once + dedup by id" }], st.mode, (v) => { st.mode = v; render(); }, "delivery")),
      h("div", { class: "w-grid" }, slider("Loss", 0, 0.5, 0.05, st.loss, (v) => { st.loss = v; render(); }, (v) => Math.round(v * 100) + "%"), slider("Duplication", 0, 0.4, 0.05, st.dup, (v) => { st.dup = v; render(); }, (v) => Math.round(v * 100) + "%")),
      h("div", { class: "w-row" }, h("label", { class: "switch" }, (() => { const i = h("input", { type: "checkbox", role: "switch" }); i.checked = st.reorder; i.addEventListener("change", () => { st.reorder = i.checked; render(); }); return i; })(), h("span", null, "Variable delay (reordering)")), h("button", { type: "button", class: "btn ghost small", onclick: () => { st.seed++; render(); } }, "Run again")),
      out);
    return root;
  });

  /* ================= hashLab ================= */
  C.widget("hashLab", () => {
    const subtle = window.crypto && window.crypto.subtle;
    const enc = new TextEncoder();
    const orig = window.Scenario.BASES.ask.body;
    const ta = h("textarea", { rows: 2, spellcheck: "false", "aria-label": "Body text" }); ta.value = orig;
    const hashOut = h("div", { class: "w-out" });
    let origBits = null;
    const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    const bits = (hx) => hx.split("").map((c) => parseInt(c, 16).toString(2).padStart(4, "0")).join("");
    async function sha(s) { return subtle ? hex(await subtle.digest("SHA-256", enc.encode(s))) : null; }
    async function renderHash() {
      const s = ta.value.replace(/\r/g, "");
      const hx = await sha(s);
      hashOut.textContent = "";
      if (!hx) { hashOut.appendChild(h("p", { class: "muted small" }, "This view has no Web Crypto, so only the simulation hash is shown: " + window.Gate.simHash(s))); return; }
      if (!origBits) origBits = bits(await sha(orig));
      const b = bits(hx);
      let diff = 0;
      const grid = h("div", { class: "bitgrid", "aria-hidden": "true" }, b.split("").map((x, i) => { const d = x !== origBits[i]; if (d) diff++; return h("span", { class: (x === "1" ? "one" : "") + (d ? " diff" : "") }); }));
      hashOut.appendChild(h("div", { class: "mono small hexline" }, "SHA-256 " + hx));
      hashOut.appendChild(grid);
      hashOut.appendChild(h("div", { class: "w-row" }, stat(diff + "/256", "bits differ from the original body"), h("span", { class: "small muted" }, s === orig ? "This is the original body." : "One changed character flips about half the bits. No one can steer a change to keep the hash.")));
      hashOut.appendChild(h("p", { class: "small muted" }, "The playground's gate uses a fast stand-in, ", h("code", null, "simHash"), " (", window.Gate.simHash(s), "), which is not cryptographic. A real implementation computes SHA-256, as here."));
    }
    ta.addEventListener("input", renderHash);
    renderHash();

    /* signing and pre-rotation */
    const sigOut = h("div", { class: "w-out" });
    const state = { key: null, next: null, nextDigest: null, signed: null, sig: null, alg: null };
    const header = () => window.Scenario.toWire(window.Scenario.build({}).msg).split("\n---\n")[0];
    // Ed25519, the scheme the pilot's SSH keys use, where this browser's Web Crypto has it; ECDSA P-256 otherwise, named on screen
    const ALGS = { ed: { gen: { name: "Ed25519" }, sign: { name: "Ed25519" }, label: "Ed25519" }, ec: { gen: { name: "ECDSA", namedCurve: "P-256" }, sign: { name: "ECDSA", hash: "SHA-256" }, label: "ECDSA P-256 (this browser has no Ed25519; the pilot's SSH keys are Ed25519)" } };
    async function gen() {
      if (!state.alg) { try { await subtle.generateKey(ALGS.ed.gen, true, ["sign", "verify"]); state.alg = ALGS.ed; } catch (e) { state.alg = ALGS.ec; } }
      return subtle.generateKey(state.alg.gen, true, ["sign", "verify"]);
    }
    async function pubDigest(k) { const raw = await subtle.exportKey("raw", k.publicKey); return hex(await subtle.digest("SHA-256", raw)).slice(0, 16); }
    async function sign() { state.signed = header(); state.sig = await subtle.sign(state.alg.sign, state.key.privateKey, enc.encode(state.signed)); }
    async function verify(text) { return subtle.verify(state.alg.sign, state.key.publicKey, state.sig, enc.encode(text)); }
    async function renderSig(msg) {
      sigOut.textContent = "";
      if (!subtle) { sigOut.appendChild(h("p", { class: "muted small" }, "Signing needs Web Crypto, which this view lacks.")); return; }
      if (!state.key) { sigOut.appendChild(h("p", { class: "small muted" }, "No key yet.")); return; }
      sigOut.appendChild(h("div", { class: "w-row" }, stat(await pubDigest(state.key), "current key (digest)"), stat(state.nextDigest || "–", "committed next key (digest)")));
      sigOut.appendChild(h("p", { class: "small muted" }, "Signature scheme: " + state.alg.label + "."));
      if (state.sig) {
        const okHeader = await verify(state.signed);
        sigOut.appendChild(h("div", { class: "w-row" }, h("span", { class: "d " + (okHeader ? "admitted" : "refused") }, okHeader ? "signature valid" : "signature invalid"), h("span", { class: "small muted" }, "over the header, which carries the body hash")));
      }
      if (msg) sigOut.appendChild(h("div", { class: "fb " + (msg.ok ? "ok" : "no") }, inline(msg.text)));
    }
    const btns = h("div", { class: "w-row" },
      h("button", { type: "button", class: "btn primary", onclick: async () => { state.key = await gen(); state.next = await gen(); state.nextDigest = await pubDigest(state.next); await sign(); renderSig({ ok: true, text: "Hermes signs the header. Because the header holds `body: <hash>`, the signature covers the body too." }); } }, "Make keys and sign"),
      h("button", { type: "button", class: "btn", onclick: async () => { if (!state.sig) return; const forged = state.signed.replace("effect: disclose", "effect: irreversible"); const ok = await verify(forged); renderSig({ ok: !ok, text: "Someone changes `effect: disclose` to `irreversible` in transit. Verification over the changed header: **" + (ok ? "valid" : "fails") + "**. The gate logs it and sends nothing back ({{rc.unsigned}})." }); } }, "Tamper with the header"),
      h("button", { type: "button", class: "btn", onclick: async () => {
        if (!state.sig) return;
        // edit one character of the body, leave the header alone, and recompute the body's hash the way the gate does
        const ok = await verify(state.signed);
        const said = (/^body: *(\S+)/m.exec(state.signed) || [])[1] || "?";
        const edited = orig.replace(/[a-z]/, (c) => (c === "a" ? "e" : "a"));
        const now = window.Gate.simHash(edited);
        renderSig({ ok: true, text: "Someone edits one character of the body and leaves the header alone. The signature over the header still verifies (**" + (ok ? "valid" : "fails") + "**). The edited body hashes to `" + now + "`, and the header says `body: " + said + "`, so step 4 logs the message as {{rc.malformed}} and sends nothing back: no disposition. Either edit is caught." });
      } }, "Tamper with the body"),
      h("button", { type: "button", class: "btn", onclick: async () => { if (!state.key) return; const thief = await gen(); const d = await pubDigest(thief); renderSig({ ok: true, text: "A thief who stole the current key tries to rotate to their own key (digest `" + d + "`). The identity committed to `" + state.nextDigest + "` in advance, so the rotation is refused. This is pre-rotation, as in KERI [[P§9.2]]." }); } }, "A thief tries to rotate"),
      h("button", { type: "button", class: "btn ghost", onclick: async () => { if (!state.next) return; state.key = state.next; state.next = await gen(); state.nextDigest = await pubDigest(state.next); await sign(); renderSig({ ok: true, text: "The owner rotates with the committed next key, kept offline until now, and commits to a new next key in the same event." }); } }, "Owner rotates"));
    renderSig();
    return h("div", null, h("div", { class: "check-k" }, "Hashes and signatures"),
      h("div", { class: "lab-k" }, "1 · The body and its hash"), ta, hashOut,
      h("div", { class: "lab-k", style: { marginTop: "14px" } }, "2 · Signing the header, rotating the key"), btns, sigOut);
  });

  /* ================= preRotation: the signature proves the key; the committed next key proves the controller (P§9.2, KERI) ================= */
  C.widget("preRotation", () => {
    const H = (k) => window.Gate.simHash("pub:" + k).slice(0, 12);
    const st = { cur: "K1", next: "K2", stolen: false, noPre: false, log: [], ownerKeys: new Set(["K1", "K2"]), attackerKeys: new Set(["K9"]), seq: 3 };
    const card = h("div", { class: "pr-card" }), log = h("ol", { class: "pr-log" }), attacker = h("div", { class: "pr-att" });
    const verify = (k) => k === st.cur;
    function note(who, text, ok) { st.log.unshift({ who, text, ok }); render(); }
    function render() {
      card.textContent = "";
      K.append(card, [h("div", { class: "lab-k" }, "Identifier card · hermes"),
        h("dl", { class: "kv" }, h("div", null, h("dt", null, "current key"), h("dd", null, st.cur + " · " + H(st.cur))),
          h("div", null, h("dt", null, "next key"), h("dd", null, st.noPre ? "not committed" : "digest " + H(st.next) + " (the key itself stays offline)")))]);
      attacker.textContent = "";
      K.append(attacker, [h("div", { class: "lab-k" }, "Attacker"), h("div", { class: "small" }, st.stolen ? "holds " + [...st.attackerKeys].join(", ") : "holds only K9, a key of its own")]);
      log.textContent = "";
      st.log.slice(0, 8).forEach((e) => log.appendChild(h("li", { class: e.ok ? "ok" : "no" }, h("b", null, e.who + ": "), e.text)));
    }
    const btn = (label, fn, cls) => h("button", { type: "button", class: "btn" + (cls ? " " + cls : ""), onclick: fn }, label);
    const ctl = h("div", { class: "w-row" },
      btn("Owner signs with " + "the current key", () => { const k = [...st.ownerKeys].find(verify); note("owner", k ? "signed with " + k + ": verifies against the card" : "every key the owner holds fails: the owner is locked out", !!k); }),
      btn("Steal the current key", () => { st.stolen = true; st.attackerKeys.add(st.cur); note("attacker", "copied " + st.cur + " from the agent's machine", false); }),
      btn("Attacker signs a message", () => { const k = [...st.attackerKeys].find(verify); note("attacker", k ? "signed with " + k + ": valid signature, same identifier. Messages can be forged until the owner rotates." : "no key it holds matches the card: signature fails", !k); }),
      btn("Attacker rotates to K9", () => {
        const canSign = [...st.attackerKeys].includes(st.cur);
        if (st.noPre ? canSign : false) { st.cur = "K9"; st.ownerKeys.delete("K9"); note("attacker", "rotation signed with the stolen current key is accepted: the identifier now answers to K9, and the owner is locked out", false); }
        else note("attacker", st.noPre ? "cannot sign the rotation: it holds no current key" : "rejected: a rotation must be signed with the key whose digest is on the card (" + H(st.next) + "), and K9 is not it", true);
      }),
      btn("Owner rotates", () => {
        if (st.noPre) { if ([...st.ownerKeys].includes(st.cur)) { const nk = "K" + st.seq++; st.ownerKeys.add(nk); st.cur = nk; note("owner", "rotated to " + nk + " by signing with the current key", true); } else note("owner", "cannot rotate: the card answers to a key the owner does not hold", false); return; }
        const nk = "K" + st.seq++; st.ownerKeys.add(nk); st.cur = st.next; st.next = nk; note("owner", "presents " + st.cur + ", which matches the committed digest, and commits to the digest of " + nk + ". From here on, the stolen key no longer verifies; what it signed before the rotation has already been judged, and anything admitted then stays admitted.", true);
      }, "primary"),
      btn("Start over", () => { Object.assign(st, { cur: "K1", next: "K2", stolen: false, log: [], ownerKeys: new Set(["K1", "K2"]), attackerKeys: new Set(["K9"]), seq: 3 }); render(); }, "ghost"));
    const sw = h("label", { class: "switch" }, (() => { const i = h("input", { type: "checkbox", role: "switch" }); i.addEventListener("change", () => { st.noPre = i.checked; Object.assign(st, { cur: "K1", next: "K2", stolen: false, log: [], ownerKeys: new Set(["K1", "K2"]), attackerKeys: new Set(["K9"]), seq: 3 }); render(); }); return i; })(), h("span", null, "No pre-rotation (the current key alone authorises a rotation)"));
    render();
    return h("div", null, h("div", { class: "check-k" }, "Pre-rotation"),
      h("p", { class: "small muted" }, "Digests here use the playground's simulation hash, not SHA-256. Try: steal the key, sign as the attacker, try the attacker's rotation, then let the owner rotate."),
      h("div", { class: "pr-grid" }, card, attacker), ctl, h("div", { class: "w-row" }, sw), log);
  });

})();
