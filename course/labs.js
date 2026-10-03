/* Course labs for the foundations and annexes: network science (graphLab), transport (lossyChannel), security (hashLab).
   Each is a small seeded model, labelled as a model, with the Membrane mechanism it explains named beside it. */
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

  /* ================= graphLab ================= */
  C.widget("graphLab", (props) => {
    const st = { model: props.model || "smallworld", n: 60, k: 4, beta: 0.12, p: 0.07, m: 2, seed: 7, mode: "look", theta: 0.25, sybil: false, attack: 3 };
    let G = null, layout = null, adopted = new Set(), step = 0;
    const svgBox = h("div", { class: "graph-box" }), stats = h("div", { class: "w-row" }), hist = h("div"), note = h("div", { class: "fig-explain" });

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
        const ends = []; for (let a = 0; a <= m; a++) adj[a].forEach((b) => ends.push(a));
        for (let a = m + 1; a < n; a++) { const t = new Set(); while (t.size < m) t.add(ends[Math.floor(r() * ends.length)]); t.forEach((b) => { link(a, b); ends.push(a, b); }); }
      }
      let honest = n;
      if (st.sybil) {
        const S = 20, base = n;
        for (let i = 0; i < S; i++) adj.push(new Set());
        for (let a = base; a < base + S; a++) for (let b = a + 1; b < base + S; b++) if (r() < 0.45) link(a, b);
        for (let i = 0; i < st.attack; i++) link(base + Math.floor(r() * S), Math.floor(r() * n));
        honest = n;
      }
      G = { adj, n: adj.length, honest };
      layout = lay(G, r);
      adopted = new Set(); step = 0;
    }
    function lay(g, r) {
      const n = g.n, P = [];
      const ring = st.model === "smallworld" && !st.sybil;
      for (let i = 0; i < n; i++) {
        if (ring) { const a = (i / g.honest) * Math.PI * 2; P.push({ x: Math.cos(a) * 0.42, y: Math.sin(a) * 0.42 }); }
        else P.push({ x: (r() - 0.5) * 0.9 + (i >= g.honest ? 0.55 : 0), y: (r() - 0.5) * 0.9 });
      }
      if (!ring) {
        for (let it = 0; it < 220; it++) {
          const cool = 0.02 * (1 - it / 220) + 0.002;
          const F = P.map(() => ({ x: 0, y: 0 }));
          for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
            let dx = P[a].x - P[b].x, dy = P[a].y - P[b].y; const d2 = dx * dx + dy * dy + 1e-4;
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
    function metrics() {
      const n = G.honest, adj = G.adj;
      const deg = adj.slice(0, n).map((s) => [...s].filter((b) => b < n).length);
      const mean = deg.reduce((a, b) => a + b, 0) / n;
      let cc = 0;
      for (let a = 0; a < n; a++) { const nb = [...adj[a]].filter((b) => b < n); const k = nb.length; if (k < 2) continue; let t = 0; for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) if (adj[nb[i]].has(nb[j])) t++; cc += t / (k * (k - 1) / 2); }
      cc /= n;
      let tot = 0, pairs = 0, unreach = 0;
      for (let s = 0; s < n; s++) { const dist = new Array(n).fill(-1); dist[s] = 0; const q = [s]; while (q.length) { const a = q.shift(); adj[a].forEach((b) => { if (b < n && dist[b] < 0) { dist[b] = dist[a] + 1; q.push(b); } }); } for (let t = 0; t < n; t++) if (t !== s) { if (dist[t] > 0) { tot += dist[t]; pairs++; } else unreach++; } }
      return { deg, mean, cc, L: pairs ? tot / pairs : 0, maxd: Math.max(...deg), unreach };
    }
    function trust() {
      // symmetric: global PageRank (every node vouches equally); asymmetric: personalised PageRank from node 0, brainboi's own view
      const n = G.n, adj = G.adj;
      const pr = (personal) => {
        let v = new Array(n).fill(1 / n);
        for (let it = 0; it < 60; it++) {
          const nv = new Array(n).fill(0);
          for (let a = 0; a < n; a++) { const d = adj[a].size; if (!d) continue; adj[a].forEach((b) => { nv[b] += 0.85 * v[a] / d; }); }
          for (let a = 0; a < n; a++) nv[a] += 0.15 * (personal ? (a === 0 ? 1 : 0) : 1 / n);
          const s = nv.reduce((x, y) => x + y, 0); v = nv.map((x) => x / s);
        }
        return v;
      };
      const share = (v) => v.slice(G.honest).reduce((a, b) => a + b, 0);
      return { sym: share(pr(false)), asym: share(pr(true)), frac: (n - G.honest) / n };
    }
    function draw() {
      const W = 560, H = 380, sx = (x) => W / 2 + x * W * 0.95, sy = (y) => H / 2 + y * H * 0.92;
      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "w-svg graph-svg", role: "img", "aria-label": "A generated network" });
      const eg = el("g", {}, svg);
      G.adj.forEach((s, a) => s.forEach((b) => { if (b > a) el("line", { x1: sx(layout[a].x), y1: sy(layout[a].y), x2: sx(layout[b].x), y2: sy(layout[b].y), stroke: a >= G.honest || b >= G.honest ? "var(--refused)" : "var(--rule-strong)", "stroke-width": a >= G.honest !== b >= G.honest ? 1.6 : 0.8, opacity: a >= G.honest && b >= G.honest ? 0.35 : 0.8 }, eg); }));
      const maxd = Math.max(...G.adj.map((s) => s.size));
      G.adj.forEach((s, a) => {
        const c = el("circle", { cx: sx(layout[a].x), cy: sy(layout[a].y), r: 3 + 5 * Math.sqrt(s.size / maxd), fill: a >= G.honest ? "var(--refused)" : adopted.has(a) ? "var(--held)" : a === 0 ? "var(--accent)" : "var(--lipid)", stroke: "var(--surface)", "stroke-width": 1 }, svg);
        if (st.mode === "cascade" && a < G.honest) { c.style.cursor = "pointer"; c.addEventListener("click", () => { adopted.add(a); render(); }); }
      });
      svgBox.textContent = ""; svgBox.appendChild(svg);
    }
    function cascadeStep() {
      const nxt = new Set(adopted);
      for (let a = 0; a < G.honest; a++) { if (adopted.has(a)) continue; const nb = [...G.adj[a]].filter((b) => b < G.honest); if (!nb.length) continue; const f = nb.filter((b) => adopted.has(b)).length / nb.length; if (f >= st.theta) nxt.add(a); }
      const grew = nxt.size > adopted.size; adopted = nxt; step++; render(); return grew;
    }
    function render() {
      draw();
      const m = metrics();
      stats.textContent = "";
      [stat(m.mean.toFixed(1), "mean degree"), stat(m.cc.toFixed(2), "clustering"), stat(m.L.toFixed(2), "mean path"), stat(String(m.maxd), "largest hub")].forEach((x) => stats.appendChild(x));
      if (st.mode === "cascade") stats.appendChild(stat(adopted.size + "/" + G.honest, "adopted · step " + step));
      if (st.sybil) { const t = trust(); stats.appendChild(stat((100 * t.sym).toFixed(0) + "%", "Sybil share · symmetric rank", true)); stats.appendChild(stat((100 * t.asym).toFixed(1) + "%", "Sybil share · flow from brainboi")); }
      const maxd = Math.max(...m.deg), bins = new Array(maxd + 1).fill(0); m.deg.forEach((d) => bins[d]++);
      const HW = 260, HH = 70, bw = HW / bins.length;
      const hs = el("svg", { viewBox: `0 0 ${HW} ${HH + 14}`, class: "w-svg hist", role: "img", "aria-label": "Degree distribution" });
      const top = Math.max(...bins);
      bins.forEach((c, d) => { if (c) el("rect", { x: d * bw + 1, y: HH - (c / top) * HH, width: Math.max(1, bw - 2), height: (c / top) * HH, fill: "var(--accent)" }, hs); });
      const t1 = el("text", { x: 0, y: HH + 12, "font-size": 9, "font-family": "var(--mono)" }, hs); t1.textContent = "degree 0";
      const t2 = el("text", { x: HW, y: HH + 12, "font-size": 9, "text-anchor": "end", "font-family": "var(--mono)" }, hs); t2.textContent = String(maxd);
      hist.textContent = ""; hist.appendChild(h("div", { class: "lab-k" }, "Degree distribution")); hist.appendChild(hs);
      if (typeof run !== "undefined" && run) run.hidden = st.mode !== "cascade";
      note.textContent = "";
      note.appendChild(inline({
        random: "**Random (Erdős–Rényi).** Every pair is linked with the same probability. Degrees bunch around the mean, clustering is low, and paths are short.",
        smallworld: "**Small world (Watts–Strogatz).** A ring of neighbours, a few links rewired at random. A little rewiring keeps the clustering of a village and gives the short paths of a random graph: gossip crosses the network in a few hops.",
        scalefree: "**Scale-free (Barabási–Albert).** New nodes link to well-connected ones. A few hubs carry most links. Hubs speed spreading and are where an attacker or a failure hurts most."
      }[st.model] + (st.sybil ? " **Sybil region (red).** Twenty fake identities, densely linked to each other, joined to the honest network by a few attack edges. A rank where everyone vouches equally lets them inflate one another; trust that flows only outward from brainboi's own view reaches them only through the attack edges [[P§9.4]]." : "") + (st.mode === "cascade" ? " **Cascade.** Tap nodes to seed an idea. A node adopts once the share of its neighbours that adopted reaches the threshold, so dense clusters resist a single source and fall to several." : "")));
    }
    const params = h("div", { class: "w-grid" });
    function paramUI() {
      params.textContent = "";
      if (st.model === "random") params.appendChild(slider("Link probability", 0.02, 0.2, 0.01, st.p, (v) => { st.p = v; build(); render(); }));
      if (st.model === "smallworld") params.appendChild(slider("Rewiring β", 0, 1, 0.02, st.beta, (v) => { st.beta = v; build(); render(); }));
      if (st.model === "scalefree") params.appendChild(slider("Links per newcomer", 1, 4, 1, st.m, (v) => { st.m = v; build(); render(); }));
      if (st.mode === "cascade") params.appendChild(slider("Adoption threshold", 0.05, 0.6, 0.05, st.theta, (v) => { st.theta = v; adopted = new Set(); step = 0; render(); }, (v) => Math.round(v * 100) + "%"));
      if (st.sybil) params.appendChild(slider("Attack edges", 1, 15, 1, st.attack, (v) => { st.attack = v; build(); render(); }));
    }
    let timer = null, run = null;
    run = h("button", { type: "button", class: "btn", onclick: () => { if (timer) { clearInterval(timer); timer = null; run.textContent = "Spread"; return; } if (!adopted.size) adopted.add(0); run.textContent = "Stop"; timer = setInterval(() => { if (!cascadeStep() || !document.body.contains(run)) { clearInterval(timer); timer = null; run.textContent = "Spread"; } }, K.reduceMotion() ? 50 : 420); } }, "Spread");
    build(); paramUI(); render();
    const modeRow = h("div", { class: "w-row" },
      seg([{ v: "random", label: "Random" }, { v: "smallworld", label: "Small world" }, { v: "scalefree", label: "Scale-free" }], st.model, (v) => { st.model = v; build(); paramUI(); render(); }, "model"),
      seg([{ v: "look", label: "Look" }, { v: "cascade", label: "Cascade" }], st.mode, (v) => { st.mode = v; adopted = new Set(); step = 0; paramUI(); render(); }, "mode"),
      h("label", { class: "switch" }, (() => { const i = h("input", { type: "checkbox", role: "switch" }); i.addEventListener("change", () => { st.sybil = i.checked; build(); paramUI(); render(); }); return i; })(), h("span", null, "Add a Sybil region")),
      h("button", { type: "button", class: "btn ghost small", onclick: () => { st.seed++; build(); render(); } }, "New network"));
    return h("div", null, h("div", { class: "check-k" }, "Network lab"), modeRow, params, h("div", { class: "graph-grid" }, svgBox, h("div", { class: "graph-side" }, stats, hist, run)), note);
  });

  /* ================= lossyChannel ================= */
  C.widget("lossyChannel", () => {
    const st = { loss: 0.25, dup: 0.1, reorder: true, mode: "dedup", seed: 3, n: 6 };
    const out = h("div", { class: "w-out" });
    function simulate() {
      const r = rng(st.seed * 7919 + Math.round(st.loss * 100) * 31 + Math.round(st.dup * 100));
      const ev = []; let t = 0;
      const seen = new Set(), processed = [], arrivals = [];
      for (let i = 1; i <= st.n; i++) {
        const tries = st.mode === "atmost" ? 1 : 6;
        let acked = false;
        for (let k = 0; k < tries && !acked; k++) {
          t += 1;
          const sendAt = t;
          if (r() < st.loss) { ev.push({ id: i, k, sendAt, lost: true }); }
          else {
            const copies = r() < st.dup ? 2 : 1;
            for (let c = 0; c < copies; c++) {
              const arrive = sendAt + (st.reorder ? 1 + Math.floor(r() * 3) : 1) + c * 0.5;
              ev.push({ id: i, k, sendAt, arrive, dupCopy: c > 0 });
              arrivals.push({ id: i, at: arrive });
            }
            const ackLost = r() < st.loss;
            acked = st.mode === "atmost" ? true : !ackLost;
            if (ackLost && st.mode !== "atmost") ev.push({ id: i, k, ackLost: true, sendAt });
          }
          if (!acked && st.mode !== "atmost") t += 1; // wait a timeout, then resend the same id
        }
      }
      arrivals.sort((a, b) => a.at - b.at);
      let effects = 0, dupEffects = 0, order = [];
      arrivals.forEach((a) => {
        if (st.mode === "dedup") { if (seen.has(a.id)) return; seen.add(a.id); effects++; order.push(a.id); }
        else { if (seen.has(a.id)) dupEffects++; seen.add(a.id); effects++; order.push(a.id); }
      });
      const lost = st.n - seen.size;
      const inv = order.reduce((acc, id, i) => acc + (i && id < order[i - 1] ? 1 : 0), 0);
      return { ev, seen: seen.size, effects, dupEffects, lost, inv, order };
    }
    function render() {
      const s = simulate();
      out.textContent = "";
      const tmax = Math.max(4, ...s.ev.map((e) => (e.arrive || e.sendAt + 1.5))) + 1, W = 560, k = 26, H = 40 + tmax * k;
      const Y = (t) => 34 + t * k;
      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "w-svg", role: "img", "aria-label": "Transmissions over time, time running down" });
      [["sender", 90], ["receiver", 470]].forEach(([n, x]) => { const t = el("text", { x, y: 14, "text-anchor": "middle", "font-weight": 600 }, svg); t.textContent = n; el("line", { x1: x, y1: 22, x2: x, y2: H - 4, stroke: "var(--rule-strong)", "stroke-dasharray": "3 4" }, svg); });
      const tl = el("text", { x: 14, y: H - 8, "font-size": 10, fill: "var(--ink-3)" }, svg); tl.textContent = "time ↓";
      s.ev.forEach((e) => {
        const y0 = Y(e.sendAt), lab = "m" + e.id + (e.k ? " · resend " + e.k : "");
        if (e.lost) {
          el("line", { x1: 90, y1: y0, x2: 260, y2: y0 + k * 0.6, stroke: "var(--refused)", "stroke-dasharray": "3 3" }, svg);
          const t = el("text", { x: 266, y: y0 + k * 0.6 + 4, "font-size": 10.5, fill: "var(--refused)", "font-family": "var(--mono)" }, svg); t.textContent = "✕ " + lab + " lost";
        } else if (e.ackLost) {
          const ya = Y(e.sendAt + 1);
          el("line", { x1: 470, y1: ya, x2: 320, y2: ya + k * 0.5, stroke: "var(--held)", "stroke-dasharray": "3 3" }, svg);
          const t = el("text", { x: 314, y: ya + k * 0.5 + 4, "font-size": 10.5, fill: "var(--held)", "font-family": "var(--mono)", "text-anchor": "end" }, svg); t.textContent = "ack for m" + e.id + " lost ✕";
        } else {
          const y1 = Y(e.arrive), col = e.dupCopy ? "var(--sealed)" : "var(--accent)";
          el("line", { x1: 90, y1: y0, x2: 464, y2: y1, stroke: col, "stroke-width": 1.4 }, svg);
          el("path", { d: `M456,${y1 - 4} L466,${y1} L456,${y1 + 4}z`, fill: col }, svg);
          const t = el("text", { x: 478, y: y1 + 4, "font-size": 10.5, "font-family": "var(--mono)", fill: col }, svg); t.textContent = lab + (e.dupCopy ? " · copy" : "");
        }
      });
      out.appendChild(h("div", { class: "w-row" }, stat(s.seen + "/" + st.n, "messages that arrived"), stat(String(s.effects), "times an effect ran"), stat(String(s.dupEffects), "effects run twice", s.dupEffects > 0), stat(String(s.lost), "lost for good", s.lost > 0), stat(String(s.inv), "out of order")));
      out.appendChild(h("div", { class: "scroll lossy-svg" }, svg));
      out.appendChild(h("div", { class: "fig-explain" }, inline({
        atmost: "**At most once.** Send and forget. Nothing runs twice, and anything the channel drops is gone.",
        atleast: "**At least once.** Resend the same message until an acknowledgement comes back. Nothing is lost for long, but a lost acknowledgement makes the sender resend something that already arrived, so effects can run twice.",
        dedup: "**At least once, plus a receiver that remembers ids.** The sender resends the same id; the receiver keeps the ids it has seen and answers a repeat with the original receipt. Every message arrives and every effect runs once. This is Membrane's rule for duplicates: same `from`, `id` and body get the original receipt and nothing else [[P§4.2]]. Exactly once is something the two endpoints build together; no channel provides it."
      }[st.mode])));
    }
    render();
    return h("div", null, h("div", { class: "check-k" }, "A lossy channel"),
      h("div", { class: "w-row" }, h("span", { class: "small muted" }, "Sender"), seg([{ v: "atmost", label: "at most once" }, { v: "atleast", label: "at least once" }, { v: "dedup", label: "at least once + dedup by id" }], st.mode, (v) => { st.mode = v; render(); }, "delivery")),
      h("div", { class: "w-grid" }, slider("Loss", 0, 0.5, 0.05, st.loss, (v) => { st.loss = v; render(); }, (v) => Math.round(v * 100) + "%"), slider("Duplication", 0, 0.4, 0.05, st.dup, (v) => { st.dup = v; render(); }, (v) => Math.round(v * 100) + "%")),
      h("div", { class: "w-row" }, h("label", { class: "switch" }, (() => { const i = h("input", { type: "checkbox", role: "switch" }); i.checked = st.reorder; i.addEventListener("change", () => { st.reorder = i.checked; render(); }); return i; })(), h("span", null, "Variable delay (reordering)")), h("button", { type: "button", class: "btn ghost small", onclick: () => { st.seed++; render(); } }, "Run again")),
      out);
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
    const state = { key: null, next: null, nextDigest: null, signed: null, sig: null };
    const header = () => window.Scenario.toWire(window.Scenario.build({}).msg).split("\n---\n")[0];
    async function gen() { return subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]); }
    async function pubDigest(k) { const raw = await subtle.exportKey("raw", k.publicKey); return hex(await subtle.digest("SHA-256", raw)).slice(0, 16); }
    async function sign() { state.signed = header(); state.sig = await subtle.sign({ name: "ECDSA", hash: "SHA-256" }, state.key.privateKey, enc.encode(state.signed)); }
    async function verify(text) { return subtle.verify({ name: "ECDSA", hash: "SHA-256" }, state.key.publicKey, state.sig, enc.encode(text)); }
    async function renderSig(msg) {
      sigOut.textContent = "";
      if (!subtle) { sigOut.appendChild(h("p", { class: "muted small" }, "Signing needs Web Crypto, which this view lacks.")); return; }
      if (!state.key) { sigOut.appendChild(h("p", { class: "small muted" }, "No key yet.")); return; }
      sigOut.appendChild(h("div", { class: "w-row" }, stat(await pubDigest(state.key), "current key (digest)"), stat(state.nextDigest || "–", "committed next key (digest)")));
      if (state.sig) {
        const okHeader = await verify(state.signed);
        sigOut.appendChild(h("div", { class: "w-row" }, h("span", { class: "d " + (okHeader ? "admitted" : "refused") }, okHeader ? "signature valid" : "signature invalid"), h("span", { class: "small muted" }, "over the header, which carries the body hash")));
      }
      if (msg) sigOut.appendChild(h("div", { class: "fb " + (msg.ok ? "ok" : "no") }, inline(msg.text)));
    }
    const btns = h("div", { class: "w-row" },
      h("button", { type: "button", class: "btn primary", onclick: async () => { state.key = await gen(); state.next = await gen(); state.nextDigest = await pubDigest(state.next); await sign(); renderSig({ ok: true, text: "Hermes signs the header. Because the header holds `body: <hash>`, the signature covers the body too." }); } }, "Make keys and sign"),
      h("button", { type: "button", class: "btn", onclick: async () => { if (!state.sig) return; const forged = state.signed.replace("effect: disclose", "effect: irreversible"); const ok = await verify(forged); renderSig({ ok: !ok, text: "Someone changes `effect: disclose` to `irreversible` in transit. Verification over the changed header: **" + (ok ? "valid" : "fails") + "**. The gate logs it and sends nothing back ({{rc.unsigned}})." }); } }, "Tamper with the header"),
      h("button", { type: "button", class: "btn", onclick: async () => { if (!state.sig) return; const ok = await verify(state.signed); renderSig({ ok: true, text: "Someone edits the body and leaves the header alone. The signature still verifies (**" + (ok ? "valid" : "fails") + "**), but the body's hash no longer matches `body:`, so the gate refuses it as {{rc.malformed}}. Either edit is caught." }); } }, "Tamper with the body"),
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
        const nk = "K" + st.seq++; st.ownerKeys.add(nk); st.cur = st.next; st.next = nk; note("owner", "presents " + st.cur + ", which matches the committed digest, and commits to the digest of " + nk + ". Anything signed with the stolen key stops verifying.", true);
      }, "primary"),
      btn("Start over", () => { Object.assign(st, { cur: "K1", next: "K2", stolen: false, log: [], ownerKeys: new Set(["K1", "K2"]), attackerKeys: new Set(["K9"]), seq: 3 }); render(); }, "ghost"));
    const sw = h("label", { class: "switch" }, (() => { const i = h("input", { type: "checkbox", role: "switch" }); i.addEventListener("change", () => { st.noPre = i.checked; Object.assign(st, { cur: "K1", next: "K2", stolen: false, log: [], ownerKeys: new Set(["K1", "K2"]), attackerKeys: new Set(["K9"]), seq: 3 }); render(); }); return i; })(), h("span", null, "No pre-rotation (the current key alone authorises a rotation)"));
    render();
    return h("div", null, h("div", { class: "check-k" }, "Pre-rotation"),
      h("p", { class: "small muted" }, "Digests here use the playground's simulation hash, not SHA-256. Try: steal the key, sign as the attacker, try the attacker's rotation, then let the owner rotate."),
      h("div", { class: "pr-grid" }, card, attacker), ctl, h("div", { class: "w-row" }, sw), log);
  });

})();
