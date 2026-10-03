/* Course figures: named drawings lessons call with { t: "figure", name }. SVG built from the theme tokens, so both themes read.
   Parts of a figure that explain themselves on tap are buttons in the SVG (role="button", keyboard focusable). */
(function () {
  "use strict";
  const C = window.Course, K = C.kit, { h, inline, term } = K;
  const M = window.MEMBRANE;
  const el = (tag, attrs, parent) => K.svgEl(tag, attrs, parent);
  function text(parent, x, y, s, attrs) { const t = el("text", Object.assign({ x, y }, attrs || {}), parent); t.textContent = s; return t; }
  function tappable(g, onpick) {
    g.setAttribute("role", "button"); g.setAttribute("tabindex", "0"); g.classList.add("tap");
    g.addEventListener("click", onpick);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onpick(); } });
  }
  function explainer(initial) { const box = h("div", { class: "fig-explain", "aria-live": "polite" }); box.appendChild(inline(initial)); return box; }
  function say(box, s) { box.textContent = ""; box.appendChild(inline(s)); }

  /* Edge-label placement without layout: a label's box is estimated from its length (0.48 em per character, Instrument Sans measures about 0.43), and each label tries positions
     along its edge (middle first), on its preferred side then the other, until its box clears every line, every node, every placed label
     and the frame. A figure that changes its node positions gets clean labels without hand-tuning; the first candidate is the fallback. */
  function placeLabels(edges, obstacles, W, H, fs) {
    const pad = 2.5, boxes = obstacles.slice(), out = [];
    const hitsSeg = (r, [x0, y0, x1, y1]) => {
      const inR = (x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
      if (inR(x0, y0) || inR(x1, y1)) return true;
      const cross = (ax, ay, bx, by, cx, cy, dx, dy) => { const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx); if (!d) return false; const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d, u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d; return t >= 0 && t <= 1 && u >= 0 && u <= 1; };
      const { x, y, w, h: hh } = r;
      return cross(x0, y0, x1, y1, x, y, x + w, y) || cross(x0, y0, x1, y1, x, y + hh, x + w, y + hh) || cross(x0, y0, x1, y1, x, y, x, y + hh) || cross(x0, y0, x1, y1, x + w, y, x + w, y + hh);
    };
    const meets = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    edges.forEach((e) => {
      if (!e.label) return;
      const [x0, y0, x1, y1] = e.seg, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, w = e.label.length * fs * 0.48;
      let pick = null, first = null;
      for (const t of [0.5, 0.4, 0.6, 0.3, 0.7, 0.22, 0.78]) for (const side of [e.side || 1, -(e.side || 1)]) for (const off of [9, 14, 20]) {
        const px = x0 + dx * t - uy * side * off, py = y0 + dy * t + ux * side * off;
        const nxs = -uy * side; // the box grows the way the normal points, where the line falls away from it; near-horizontal lines centre it
        const anchor = Math.abs(nxs) < 0.12 ? "middle" : (nxs > 0 ? "start" : "end");
        const bx = anchor === "middle" ? px - w / 2 : anchor === "start" ? px : px - w;
        const r = { x: bx - pad, y: py - fs * 0.5 - pad, w: w + 2 * pad, h: fs + 2 * pad };
        const c = { x: px, y: py + fs * 0.35, anchor, r };
        if (!first) first = c;
        if (r.x < 1 || r.y < 1 || r.x + r.w > W - 1 || r.y + r.h > H - 1) continue;
        if (edges.some((o) => hitsSeg(r, o.seg)) || boxes.some((b) => meets(r, b))) continue;
        pick = c; break;
      }
      const c = pick || first; boxes.push(c.r); out.push(Object.assign({ edge: e }, c));
    });
    return out;
  }

  /* ---------- hourglass ---------- */
  C.widget("hourglass", () => {
    const W = 680, H = 400;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "w-svg fig-hourglass", role: "img", "aria-label": "The narrow waist" });
    const ex = explainer("Tap a band. The waist is the only part every implementation must share; everything above and below it can vary.");
    const bands = [
      { id: "above", y: 18, h: 92, top: 560, bot: 300, fill: "var(--surface-2)", title: "Forms and extensions", sub: "card · ask · accept · reply · receipt · pulse · alert · quiet · cancel · exit · not-understood · urgency · for · hand · present",
        say: "**Above the waist.** Forms are named compositions of the four acts; extensions add optional fields. A receiver that does not know a form still knows its act, and an unknown extension is ignored unless the sender lists it in {{env.crit}} [[P§3]]." },
      { id: "waist", y: 118, h: 96, top: 300, bot: 300, fill: "var(--accent)", ink: "var(--on-accent)", title: "The waist", sub: "7 required fields · 4 acts · 5 dispositions · 5 evidence kinds · 6 effect classes · byte rules",
        say: "**The waist.** The vocabulary of the boundary: the envelope, the {{act.assert|acts}}, the {{disp.held|dispositions}}, evidence kinds and effect classes, held fixed by seven {{inv.first|invariants}}. It changes only with the version number [[P§4.3]]." },
      { id: "below", y: 222, h: 92, top: 300, bot: 560, fill: "var(--surface-2)", title: "Bindings", sub: "git lanes · shared folder · email · A2A · MCP",
        say: "**Below the waist.** A binding says how a message travels, how it is signed and how delivery is proved. Membrane rides on A2A or MCP as a transport and competes with neither [[P§12]] [[P§15]]." }
    ];
    bands.forEach((b) => {
      const g = el("g", { class: "band" }, svg);
      const cx = W / 2;
      el("path", { d: `M${cx - b.top / 2},${b.y} L${cx + b.top / 2},${b.y} L${cx + b.bot / 2},${b.y + b.h} L${cx - b.bot / 2},${b.y + b.h} Z`, fill: b.fill, stroke: "var(--rule-strong)", "stroke-width": b.id === "waist" ? 0 : 1 }, g);
      text(g, cx, b.y + 30, b.title, { "text-anchor": "middle", "font-family": "var(--display)", "font-size": 20, fill: b.ink || "var(--ink)" });
      const words = b.sub.split(" · ");
      const lines = []; let line = "";
      words.forEach((w) => { const next = line ? line + " · " + w : w; if (next.length > (b.id === "waist" ? 40 : 58)) { lines.push(line); line = w; } else line = next; });
      lines.push(line);
      lines.forEach((l, i) => text(g, cx, b.y + 52 + i * 15, l, { "text-anchor": "middle", "font-family": "var(--mono)", "font-size": 10.5, fill: b.ink || "var(--ink-2)" }));
      tappable(g, () => say(ex, b.say));
    });
    [[18, "left"], [W - 18, "right"]].forEach(([x, side]) => {
      const g = el("g", { class: "band" }, svg);
      el("rect", { x: side === "left" ? x : x - 112, y: 118, width: 112, height: 96, rx: 8, fill: "var(--held-bg)", stroke: "var(--held)", "stroke-dasharray": "4 3" }, g);
      text(g, side === "left" ? x + 56 : x - 56, 142, side === "left" ? "brainboi's edge" : "Hermes' edge", { "text-anchor": "middle", "font-size": 12, "font-weight": 600, fill: "var(--held)" });
      ["gate", "sensor", "tier policy", "standing", "timers"].forEach((s, i) => text(g, side === "left" ? x + 56 : x - 56, 160 + i * 11, s, { "text-anchor": "middle", "font-family": "var(--mono)", "font-size": 9.5, fill: "var(--ink-2)" }));
      tappable(g, () => say(ex, "**The edges.** Policy stays with each owner: the gate's code, the sensor model, the tier policy, how standing is computed, escalation timers, quarantine storage. The end-to-end argument puts these where the knowledge is, at the endpoints [[P§1.3]]."));
    });
    text(svg, W / 2, H - 52, "Policy lives at the ends; the vocabulary of the boundary lives in the waist.", { "text-anchor": "middle", "font-family": "var(--display)", "font-style": "italic", "font-size": 15, fill: "var(--ink-2)" });
    text(svg, W / 2, H - 28, "The internet's waist is IP: many applications above, many links below, one thing everyone runs.", { "text-anchor": "middle", "font-size": 11.5, fill: "var(--ink-3)" });
    return h("div", null, h("div", { class: "scroll" }, svg), ex);
  });

  /* ---------- dispositions ---------- */
  C.widget("dispositions", () => {
    const narrow = window.innerWidth < 640; // on a phone the flow runs top to bottom so all five endings show at rest
    const W = narrow ? 360 : 680, H = narrow ? 520 : 272;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "w-svg" + (narrow ? " tall" : ""), role: "img", "aria-label": "Dispositions: received, sealed, held, then admitted, refused or expired" });
    const ex = explainer("Every message the gate accepts for handling is sealed, may be held, and ends in exactly one of admitted, refused or expired. Tap a state.");
    const N = {
      received: { x: 70, y: 118, s: "sent", say: "**Received.** The message has arrived in the transport. Nothing has read it yet." },
      logged: { x: 70, y: 222, s: "sent", label: "logged only", say: "**Logged only.** A message whose signature fails, or that is malformed, gets no receipt. Answering a forged sender would make the receiver a source of backscatter against whoever the forger named [[P§4.2]]." },
      sealed: { x: 236, y: 118, s: "sealed", say: "**{{disp.sealed|sealed}}.** Stored verbatim with its hash before any model reads it. Every later decision refers to the hash, which pins it to the stored bytes." },
      held: { x: 416, y: 200, s: "held", say: "**{{disp.held|held}}.** In quarantine, outside memory and outside the transport, waiting for the owner or a second signal. A held message always has a clock: {{env.expires}}." },
      admitted: { x: 616, y: 40, s: "admitted", say: "**{{disp.admitted|admitted}}.** Entered the receiver's constructed layer at its tier. An admitted request enters as a proposal; acting on it is a separate decision." },
      refused: { x: 616, y: 118, s: "refused", say: "**{{disp.refused|refused}}.** Terminal, with a reason code from the registry and no prose. A reason in prose is a map for getting around the refusal [[P§6.1]]." },
      expired: { x: 616, y: 200, s: "expired", say: "**{{disp.expired|expired}}.** Held past its expiry. One honest resend under a new id is allowed; a third copy of the same body is refused with `expired-before`." }
    };
    // the phone layout is planar: held sits between admitted and refused, so no two edges cross, and the edge names are short enough for the wedges
    if (narrow) Object.assign(N.received, { x: 110, y: 44 }), Object.assign(N.logged, { x: 270, y: 44 }), Object.assign(N.sealed, { x: 180, y: 176 }),
      Object.assign(N.admitted, { x: 50, y: 336 }), Object.assign(N.held, { x: 180, y: 336 }), Object.assign(N.refused, { x: 310, y: 336 }), Object.assign(N.expired, { x: 180, y: 470 });
    const edges = [["received", "sealed", "checks pass", -1], ["received", "logged", narrow ? "bad signature or form" : "unsigned or malformed", 1], ["sealed", "admitted", narrow ? "low tier" : "low tier, released by the gate", -1], ["sealed", "refused", narrow ? "rule refuses" : "a rule refuses", -1], ["sealed", "held", narrow ? "owner or signal" : "needs the owner or a signal", 1], ["held", "admitted", "released", 1], ["held", "refused", "refused", 1], ["held", "expired", "clock runs out", 1]];
    const defs = el("defs", {}, svg);
    const mk = el("marker", { id: "dz-arr", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
    el("path", { d: "M0,0 L10,5 L0,10 z", fill: "var(--ink-3)" }, mk);
    // a node is its envelope and the name under it; an edge starts and ends where its ray leaves that box, so no line runs through a name
    const half = (n, id) => Math.max(19, (n.label || id).length * 11.5 * 0.31 + 2);
    const exit = (n, id, ux, uy) => { const hw = half(n, id) + 4, top = 18, bottom = 38; const tx = ux ? hw / Math.abs(ux) : Infinity, ty = uy ? (uy > 0 ? bottom : top) / Math.abs(uy) : Infinity; const d = Math.min(tx, ty); return [n.x + ux * d, n.y + uy * d]; };
    const segs = edges.map(([a, b, label, side]) => {
      const p = N[a], q = N[b];
      const dx = q.x - p.x, dyy = q.y - p.y, L = Math.hypot(dx, dyy) || 1, ux = dx / L, uy = dyy / L;
      const seg = exit(p, a, ux, uy).concat(exit(q, b, -ux, -uy));
      el("line", { x1: seg[0], y1: seg[1], x2: seg[2], y2: seg[3], stroke: "var(--rule-strong)", "stroke-width": 1.3, "marker-end": "url(#dz-arr)" }, svg);
      return { seg, label, side };
    });
    const nodeBoxes = Object.entries(N).flatMap(([id, n]) => { const lw = (n.label || id).length * 11.5 * 0.62; return [{ x: n.x - 19, y: n.y - 14, w: 38, h: 28 }, { x: n.x - lw / 2, y: n.y + 19, w: lw, h: 14 }]; });
    placeLabels(segs, nodeBoxes, W, H, 10.5).forEach((l) => text(svg, l.x, l.y, l.edge.label, { "text-anchor": l.anchor, "font-size": 10.5, fill: "var(--ink-3)", class: "halo" }));
    Object.entries(N).forEach(([id, n]) => {
      const g = el("g", {}, svg);
      const env = window.Glyphs.envelope(g, { x: n.x, y: n.y, w: 34, h: 24, state: n.s });
      if (id === "received" || id === "logged") env.classList.add("env-outline");
      text(g, n.x, n.y + 30, n.label || id, { "text-anchor": "middle", "font-family": "var(--mono)", "font-size": 11.5, fill: n.s === "sent" ? "var(--ink-2)" : `var(--${n.s})` });
      tappable(g, () => say(ex, n.say));
    });
    return h("div", null, h("div", { class: "scroll" }, svg), ex);
  });

  /* ---------- mcpArch ---------- */
  C.widget("mcpArch", () => {
    const W = 680, H = 300;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "w-svg", role: "img", "aria-label": "MCP: a host with clients, each connected to one server" });
    const ex = explainer("MCP connects one host to many servers. Tap a part.");
    const host = el("g", {}, svg);
    el("rect", { x: 20, y: 20, width: 300, height: 260, rx: 12, fill: "var(--accent-soft)", stroke: "var(--accent)" }, host);
    text(host, 36, 44, "Host · one owner", { "font-weight": 600, fill: "var(--accent)", "font-size": 13 });
    text(host, 36, 62, "the model, the conversation, consent", { "font-size": 11, fill: "var(--ink-2)" });
    [["model", 110], ["consent", 172]].forEach(([n, y]) => { el("rect", { x: 40, y, width: 100, height: 38, rx: 19, fill: "var(--surface)", stroke: "var(--accent)", "stroke-dasharray": n === "consent" ? "4 3" : null }, host); text(host, 90, y + 24, n, { "text-anchor": "middle", "font-size": 12, fill: "var(--accent)" }); });
    tappable(host, () => say(ex, "**The host** holds the conversation and the user's consent. MCP's own text says the protocol cannot enforce consent; the host must [[R11·§4]]. One owner stands behind the host and every server it chose to connect."));
    const servers = [["Files", "tools · resources"], ["Calendar", "tools"], ["Docs", "resources · prompts"]];
    servers.forEach((s, i) => {
      const y = 92 + i * 62;
      const c = el("g", {}, svg);
      el("rect", { x: 170, y, width: 130, height: 40, rx: 8, fill: "var(--surface)", stroke: "var(--rule-strong)" }, c);
      text(c, 235, y + 25, "client " + (i + 1), { "text-anchor": "middle", "font-family": "var(--mono)", "font-size": 11.5, fill: "var(--ink-2)" });
      tappable(c, () => say(ex, "**A client** lives inside the host, one per server. It sends requests; a server never sends requests of its own and asks for input by returning `input_required` [[R11·§2]]."));
      el("line", { x1: 300, y1: y + 20, x2: 470, y2: y + 20, stroke: "var(--rule-strong)", "stroke-width": 1.4 }, svg);
      text(svg, 385, y + 14, "JSON-RPC", { "text-anchor": "middle", "font-family": "var(--mono)", "font-size": 10, fill: "var(--ink-3)", class: "halo" });
      const g = el("g", {}, svg);
      el("rect", { x: 470, y: y - 4, width: 190, height: 48, rx: 8, fill: "var(--surface-2)", stroke: "var(--rule-strong)" }, g);
      text(g, 485, y + 16, s[0] + " server", { "font-weight": 600, "font-size": 12.5, fill: "var(--ink)" });
      text(g, 485, y + 33, s[1], { "font-family": "var(--mono)", "font-size": 10.5, fill: "var(--ink-3)" });
      tappable(g, () => say(ex, "**A server** offers tools (the model decides to call them), resources (the application decides to read them) and prompts (the user picks them). Servers see only what they need and never each other [[R11·§6]]."));
    });
    text(svg, 36, 270, "Two parties on the wire, one owner behind both.", { "font-size": 11.5, "font-style": "italic", fill: "var(--ink-2)" });
    return h("div", null, h("div", { class: "scroll" }, svg), ex);
  });

  /* ---------- a2aArch ---------- */
  C.widget("a2aArch", () => {
    const W = 760, H = 280, RX = 550; // the remote agent starts at RX; the membrane stands just before it, and the lane labels fit between
    const svg = el("svg", { viewBox: `0 46 ${W} ${H - 46}`, class: "w-svg", role: "img", "aria-label": "A2A: a client agent finds a remote agent's card, sends a message, follows a task" });
    const ex = explainer("A2A connects two agents that may belong to different organisations. Tap a part.");
    const A = el("g", {}, svg);
    el("rect", { x: 20, y: 60, width: 190, height: 150, rx: 12, fill: "var(--surface)", stroke: "var(--rule-strong)" }, A);
    text(A, 36, 86, "Client agent", { "font-weight": 600, "font-size": 13, fill: "var(--ink)" });
    text(A, 36, 104, "owner A", { "font-size": 11, fill: "var(--ink-3)" });
    tappable(A, () => say(ex, "**The client agent** starts the exchange with `SendMessage` and follows the task it gets back, by polling, streaming or a push webhook [[R10·§8]]."));
    const B = el("g", {}, svg);
    el("rect", { x: RX, y: 60, width: 190, height: 150, rx: 12, fill: "var(--ink)", stroke: "var(--ink)" }, B);
    text(B, RX + 16, 86, "Remote agent", { "font-weight": 600, "font-size": 13, fill: "var(--ground)" });
    text(B, RX + 16, 104, "owner B · opaque by design", { "font-size": 11, fill: "var(--ground)", opacity: .75 });
    tappable(B, () => say(ex, "**The remote agent** is opaque: A2A never exposes its internals. What it does with an inbound message, how far it trusts it, and whether its owner is asked are its own business, and the protocol says nothing about them [[R1·§5]]."));
    const card = el("g", {}, svg);
    el("rect", { x: RX + 30, y: 140, width: 130, height: 50, rx: 6, fill: "var(--surface)", stroke: "var(--accent)" }, card);
    text(card, RX + 95, 160, "Agent Card", { "text-anchor": "middle", "font-size": 11.5, "font-weight": 600, fill: "var(--accent)" });
    text(card, RX + 95, 177, "/.well-known/agent-card.json", { "text-anchor": "middle", "font-family": "var(--mono)", "font-size": 8.5, fill: "var(--ink-2)" });
    tappable(card, () => say(ex, "**The Agent Card** describes the agent: name, interfaces, skills, security schemes, extensions. JWS signatures over it are optional in A2A; Membrane's `card` form requires them [[R10·§1]]."));
    const ghost = el("g", { opacity: .32 }, svg);
    window.Glyphs.bilayer(ghost, { x: RX - 30, y0: 70, y1: 206, spacing: 12, amp: 0, gap: 7, r: 2.6 });
    text(svg, RX - 30, 222, "boundary: unspecified", { "text-anchor": "middle", "font-family": "var(--mono)", "font-size": 9.5, fill: "var(--ink-3)", class: "halo" });
    // lanes are told apart by ink and dash, never by a disposition colour: those five hues mean the five dispositions only
    const lanes = [["1 · fetch the card", 92, "var(--accent)", null], ["2 · SendMessage", 128, "var(--ink-2)", null], ["3 · Task: SUBMITTED → WORKING → COMPLETED", 164, "var(--ink)", null], ["4 · push: statusUpdate, artifactUpdate", 200, "var(--ink-2)", "4 3"]];
    const mid = (210 + RX - 44) / 2;
    lanes.forEach(([lab, y, col, dash], i) => {
      const toRight = i < 2;
      el("line", { x1: toRight ? 210 : RX, y1: y, x2: toRight ? RX - 4 : 214, y2: y, stroke: col, "stroke-width": 1.5, "stroke-dasharray": dash }, svg);
      el("path", { d: toRight ? `M${RX - 12},${y - 4} L${RX - 4},${y} L${RX - 12},${y + 4}z` : `M222,${y - 4} L214,${y} L222,${y + 4}z`, fill: col }, svg);
      text(svg, mid, y - 6, lab, { "text-anchor": "middle", "font-family": "var(--mono)", "font-size": 10.5, fill: col, class: "halo" });
    });
    text(svg, W / 2, 252, "Two owners. A2A specifies how messages and tasks travel between them and leaves each side to decide what it lets in.", { "text-anchor": "middle", "font-size": 11.5, "font-style": "italic", fill: "var(--ink-2)" });
    return h("div", null, h("div", { class: "scroll" }, svg), ex);
  });

  /* ---------- stack ---------- */
  C.widget("stack", () => {
    const left = [["Application", "what the program means"], ["HTTP", "requests and responses"], ["TLS", "secrecy and integrity in transit"], ["TCP", "an ordered, reliable byte stream between two hosts"], ["IP", "best-effort packets, end to end: the waist"], ["Link", "one hop"]];
    const right = [["Agent", "model, memory, tools, owner", "edge"], ["Edges", "gate, sensor, tier policy, standing", "edge"], ["Membrane", "envelope, acts, dispositions: the boundary's words", "waist"], ["MCP · A2A", "agent to tool · agent to agent", ""], ["JSON-RPC · gRPC · REST", "framing of calls and results", ""], ["HTTP · git · email · a folder", "how bytes get there", ""]];
    const W = 680, rowH = 44, H = 30 + rowH * 6 + 20;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "w-svg", role: "img", "aria-label": "The internet stack beside the agent stack" });
    text(svg, 160, 20, "The internet", { "text-anchor": "middle", "font-weight": 600, "font-size": 13, fill: "var(--ink)" });
    text(svg, 510, 20, "Agents with owners", { "text-anchor": "middle", "font-weight": 600, "font-size": 13, fill: "var(--ink)" });
    left.forEach(([n, d], i) => {
      const y = 30 + i * rowH;
      el("rect", { x: 20, y, width: 280, height: rowH - 6, rx: 6, fill: n === "IP" ? "var(--accent)" : "var(--surface-2)" }, svg);
      text(svg, 34, y + 16, n, { "font-weight": 600, "font-size": 12.5, fill: n === "IP" ? "var(--on-accent)" : "var(--ink)" });
      text(svg, 34, y + 31, d, { "font-size": 10.5, fill: n === "IP" ? "var(--on-accent)" : "var(--ink-3)" });
    });
    right.forEach(([n, d, k], i) => {
      const y = 30 + i * rowH;
      el("rect", { x: 370, y, width: 290, height: rowH - 6, rx: 6, fill: k === "waist" ? "var(--accent)" : k === "edge" ? "var(--held-bg)" : "var(--surface-2)" }, svg);
      text(svg, 384, y + 16, n, { "font-weight": 600, "font-size": 12.5, fill: k === "waist" ? "var(--on-accent)" : "var(--ink)" });
      text(svg, 384, y + 31, d, { "font-size": 10.5, fill: k === "waist" ? "var(--on-accent)" : "var(--ink-3)" });
    });
    return h("div", { class: "scroll" }, svg);
  });

  /* ---------- twoParents: the lineage group of spec.js ---------- */
  C.widget("twoParents", (props) => {
    const rows = M.groups.find((g) => g.id === "lineage").items;
    let src = props.src || "all";
    // lineage is drawn in ink: the five disposition colours keep one meaning each
    const box = h("div", { class: "lineage" });
    const ex = h("div", { class: "fig-explain", "aria-live": "polite" }, "Tap a row to see the Membrane form it became.");
    function render() {
      box.textContent = "";
      rows.filter((r) => src === "all" || r.src === src).forEach((r) => {
        const b = h("button", { type: "button", class: "lin-row" }, h("span", { class: "lin-src mono" }, r.src), h("span", { class: "lin-n" }, r.name), h("span", { class: "rel " + r.rel }, r.rel));
        b.addEventListener("click", () => { [...box.children].forEach((x) => x.classList.remove("on")); b.classList.add("on"); ex.textContent = ""; ex.appendChild(h("div", null, h("b", null, r.src + ": "), r.idea)); ex.appendChild(h("div", null, h("b", null, "Membrane: "), r.membrane)); });
        box.appendChild(b);
      });
    }
    const filt = h("div", { class: "seg-ctl" }, ["all", "MCP", "A2A"].map((v) => { const b = h("button", { type: "button", "aria-pressed": String(v === src) }, v); b.addEventListener("click", () => { src = v; [...filt.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b))); render(); }); return b; }));
    render();
    return h("div", null, h("div", { class: "w-row" }, filt, h("span", { class: "lin-legend small" }, [["borrowed", "borrowed"], ["extended", "extended"], ["breaks", "breaks: holds inside one owner, fails between two"], ["absent", "absent"]].map(([k, l]) => h("span", null, h("span", { class: "rel " + k }, k), l === k ? "" : l.slice(k.length))))), box, ex);
  });

  /* ---------- twoOwners: the threat surface of a two-owner exchange, each entry point with the gate step that covers it ---------- */
  C.widget("twoOwners", () => {
    const W = 700, H = 380;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "w-svg", role: "img", "aria-label": "Two owners, two agents, two gates and a shared transport, with ten numbered entry points" });
    const ex = explainer("Ten ways in. Tap a number to see which gate step covers it and the reason code it returns.");
    const side = (x, owner, agent, mirror) => {
      const g = el("g", {}, svg);
      el("rect", { x, y: 20, width: 210, height: 330, rx: 12, fill: "var(--surface-2)", stroke: "var(--rule)" }, g);
      text(g, x + 105, 44, owner, { "text-anchor": "middle", "font-weight": 600, "font-size": 13, fill: "var(--ink)" });
      el("rect", { x: x + 20, y: 60, width: 170, height: 110, rx: 10, fill: "var(--surface)", stroke: "var(--rule-strong)" }, g);
      text(g, x + 105, 82, agent, { "text-anchor": "middle", "font-weight": 600, "font-size": 12.5, fill: "var(--ink)" });
      ["kernel", "memory", "tools"].forEach((t, i) => text(g, x + 105, 104 + i * 18, t, { "text-anchor": "middle", "font-family": "var(--mono)", "font-size": 11, fill: "var(--ink-3)" }));
      el("rect", { x: x + 20, y: 190, width: 170, height: 64, rx: 10, fill: "var(--surface)", stroke: "var(--ink)", "stroke-width": 1.5 }, g);
      text(g, x + 105, 214, "gate · own OS user", { "text-anchor": "middle", "font-size": 12, "font-weight": 600, fill: "var(--ink)" });
      // every path inward crosses the gate: transport to gate, gate to agent
      el("line", { x1: x + 105, y1: 188, x2: x + 105, y2: 174, stroke: "var(--ink-2)", "stroke-width": 1.4, "marker-end": "url(#to-arr)" }, g);
      text(g, x + 105, 234, "sensor · quarantine", { "text-anchor": "middle", "font-size": 11, fill: "var(--ink-2)" });
      el("rect", { x: x + 20, y: 272, width: 170, height: 52, rx: 10, fill: "var(--accent-soft)", stroke: "var(--accent)", "stroke-dasharray": "4 3" }, g);
      text(g, x + 105, 294, "pinned trust root", { "text-anchor": "middle", "font-size": 12, "font-weight": 600, fill: "var(--accent)" });
      text(g, x + 105, 311, "keys · accepted contract", { "text-anchor": "middle", "font-size": 10.5, fill: "var(--ink-2)" });
    };
    const defs = el("defs", {}, svg), mk = el("marker", { id: "to-arr", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
    el("path", { d: "M0,0 L10,5 L0,10 z", fill: "var(--ink-2)" }, mk);
    side(14, "Vlad", "brainboi", false); side(W - 224, "Sal", "Hermes", true);
    el("line", { x1: 249, y1: 200, x2: 207, y2: 200, stroke: "var(--ink-2)", "stroke-width": 1.4, "marker-end": "url(#to-arr)" }, svg);
    el("line", { x1: 451, y1: 200, x2: W - 207, y2: 200, stroke: "var(--ink-2)", "stroke-width": 1.4, "marker-end": "url(#to-arr)" }, svg);
    const mid = el("g", {}, svg);
    el("rect", { x: 250, y: 60, width: 200, height: 230, rx: 10, fill: "var(--surface)", stroke: "var(--rule-strong)" }, mid);
    text(mid, 350, 82, "shared transport (git)", { "text-anchor": "middle", "font-weight": 600, "font-size": 12, fill: "var(--ink)" });
    ["lanes/hermes/out/ →", "← lanes/brainboi/out/", "PROTOCOL.md", "allowed_signers", "owners/PAUSE"].forEach((t, i) => text(mid, 350, 112 + i * 24, t, { "text-anchor": "middle", "font-family": "var(--mono)", "font-size": 10.5, fill: i < 2 ? "var(--ink-2)" : "var(--ink-3)" }));
    const POINTS = [
      [262, 110, "signature", "unsigned", "A broken signature is logged only, with no receipt to whatever `from` claims. A valid signature from an identifier the receiver has never seen passes this step and is held for the owner at S0."],
      [438, 134, "lane", "lane", "Hermes signs a commit that writes into brainboi's lane, or `from` names someone other than the signer. Signer, lane and `from` must agree."],
      [266, 160, "scope", "scope", "A commit that touches `.claude/`, `AGENTS.md`, a hook or anything outside `lanes/<sender>/out/*.md`. The transport must stay inert."],
      [350, 256, "bytes and header", "malformed", "Zero-width or control characters in a header value, a CR in the body, a body that no longer matches its hash."],
      [214, 128, "sensor", "policy", "Instruction text in the body. The sensor can raise the tier or hold the message for the owner; release stays with the deterministic steps."],
      [214, 152, "release at T1", "awaiting-owner", "An innocent body with an acceptance line that needs memory files. The answer is drawn by a quarantined run that cannot reach them."],
      [250, 286, "duplicate · rate", "duplicate / rate", "The same message again, then thirty in an hour. A duplicate gets its original receipt; the rate limit refuses the rest."],
      [450, 286, "clock", "clock", "`at` set hours ahead so the message outlives its expiry checks. More than ten minutes ahead of the receiver's clock is refused."],
      [436, 184, "contract · scope", "contract-mismatch / scope", "A commit that edits `PROTOCOL.md` and adds a key to `allowed_signers`. Each gate verifies against its own pinned copy, outside the transport."],
      [214, 222, "hold budget", "hold-budget", "Many harmless-looking messages built to trip the sensor, each costing the owner a read. Past three holds a day per sender, they are refused."]
    ];
    POINTS.forEach(([x, y, step, code, why], i) => {
      const g = el("g", {}, svg);
      el("circle", { cx: x, cy: y, r: 11, fill: "var(--ink)" }, g); // entry points in ink: their codes span refusals, holds and logged-only
      text(g, x, y + 4, String(i + 1), { "text-anchor": "middle", "font-size": 11, "font-weight": 600, fill: "var(--surface)" });
      tappable(g, () => say(ex, "**" + (i + 1) + " · " + step + "** returns `" + code + "`. " + why));
    });
    return h("div", null, h("div", { class: "scroll" }, svg), ex);
  });

})();
