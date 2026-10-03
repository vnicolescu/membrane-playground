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
    const W = 680, H = 272;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "w-svg", role: "img", "aria-label": "Dispositions: received, sealed, held, then admitted, refused or expired" });
    const ex = explainer("Every message the gate accepts for handling is sealed, may be held, and ends in exactly one of admitted, refused or expired. Tap a state.");
    const N = {
      received: { x: 56, y: 118, s: "sent", say: "**Received.** The message has arrived in the transport. Nothing has read it yet." },
      logged: { x: 56, y: 222, s: "sent", label: "logged only", say: "**Logged only.** A message whose signature fails, or that is malformed, gets no receipt. Answering a forged sender would make the receiver a source of backscatter against whoever the forger named [[P§4.2]]." },
      sealed: { x: 236, y: 118, s: "sealed", say: "**{{disp.sealed|sealed}}.** Stored verbatim with its hash before any model reads it. Every later decision refers to the hash, so a summary can never be the thing confirmed." },
      held: { x: 416, y: 200, s: "held", say: "**{{disp.held|held}}.** In quarantine, outside memory and outside the transport, waiting for the owner or a second signal. A held message always has a clock: {{env.expires}}." },
      admitted: { x: 616, y: 40, s: "admitted", say: "**{{disp.admitted|admitted}}.** Entered the receiver's constructed layer at its tier. Admission never means execution: an admitted request is a proposal." },
      refused: { x: 616, y: 118, s: "refused", say: "**{{disp.refused|refused}}.** Terminal, with a reason code from the registry and no prose. A reason in prose is a map for getting around the refusal [[P§6.1]]." },
      expired: { x: 616, y: 200, s: "expired", say: "**{{disp.expired|expired}}.** Held past its expiry. One honest resend under a new id is allowed; a third copy of the same body is refused with `expired-before`." }
    };
    const edges = [["received", "sealed", "checks pass", -10], ["received", "logged", "unsigned or malformed", 0], ["sealed", "admitted", "low tier, released by the gate", -10], ["sealed", "refused", "a rule refuses", -10], ["sealed", "held", "needs the owner or a signal", 14], ["held", "admitted", "released", 14], ["held", "refused", "refused", 14], ["held", "expired", "clock runs out", 14]];
    const defs = el("defs", {}, svg);
    const mk = el("marker", { id: "dz-arr", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
    el("path", { d: "M0,0 L10,5 L0,10 z", fill: "var(--ink-3)" }, mk);
    edges.forEach(([a, b, lab, dy]) => {
      const p = N[a], q = N[b];
      const dx = q.x - p.x, dyy = q.y - p.y, L = Math.hypot(dx, dyy) || 1, ux = dx / L, uy = dyy / L;
      const x0 = p.x + ux * 28, y0 = p.y + uy * 22, x1 = q.x - ux * 30, y1 = q.y - uy * 22;
      el("line", { x1: x0, y1: y0, x2: x1, y2: y1, stroke: "var(--rule-strong)", "stroke-width": 1.3, "marker-end": "url(#dz-arr)" }, svg);
      const mx = x0 + (x1 - x0) * 0.5, my = y0 + (y1 - y0) * 0.5;
      if (lab) text(svg, a === "received" && b === "logged" ? mx + 8 : mx, my + dy, lab, { "text-anchor": a === "received" && b === "logged" ? "start" : "middle", "font-size": 10.5, fill: "var(--ink-3)" });
    });
    Object.entries(N).forEach(([id, n]) => {
      const g = el("g", {}, svg);
      window.Glyphs.envelope(g, { x: n.x, y: n.y, w: 34, h: 24, state: n.s });
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
      text(svg, 385, y + 14, "JSON-RPC", { "text-anchor": "middle", "font-family": "var(--mono)", "font-size": 10, fill: "var(--ink-3)" });
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
    const W = 680, H = 280;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "w-svg", role: "img", "aria-label": "A2A: a client agent finds a remote agent's card, sends a message, follows a task" });
    const ex = explainer("A2A connects two agents that may belong to different organisations. Tap a part.");
    const A = el("g", {}, svg);
    el("rect", { x: 20, y: 60, width: 190, height: 150, rx: 12, fill: "var(--surface)", stroke: "var(--rule-strong)" }, A);
    text(A, 36, 86, "Client agent", { "font-weight": 600, "font-size": 13, fill: "var(--ink)" });
    text(A, 36, 104, "owner A", { "font-size": 11, fill: "var(--ink-3)" });
    tappable(A, () => say(ex, "**The client agent** starts the exchange with `SendMessage` and follows the task it gets back, by polling, streaming or a push webhook [[R10·§8]]."));
    const B = el("g", {}, svg);
    el("rect", { x: 470, y: 60, width: 190, height: 150, rx: 12, fill: "var(--ink)", stroke: "var(--ink)" }, B);
    text(B, 486, 86, "Remote agent", { "font-weight": 600, "font-size": 13, fill: "var(--ground)" });
    text(B, 486, 104, "owner B · opaque by design", { "font-size": 11, fill: "var(--ground)", opacity: .75 });
    tappable(B, () => say(ex, "**The remote agent** is opaque: A2A never exposes its internals. What it does with an inbound message, how far it trusts it, and whether its owner is asked are its own business, and the protocol says nothing about them [[R1·§5]]."));
    const card = el("g", {}, svg);
    el("rect", { x: 500, y: 140, width: 130, height: 50, rx: 6, fill: "var(--surface)", stroke: "var(--accent)" }, card);
    text(card, 565, 160, "Agent Card", { "text-anchor": "middle", "font-size": 11.5, "font-weight": 600, fill: "var(--accent)" });
    text(card, 565, 177, "/.well-known/agent-card.json", { "text-anchor": "middle", "font-family": "var(--mono)", "font-size": 8.5, fill: "var(--ink-2)" });
    tappable(card, () => say(ex, "**The Agent Card** describes the agent: name, interfaces, skills, security schemes, extensions. JWS signatures over it are optional in A2A; Membrane's `card` form requires them [[R10·§1]]."));
    const lanes = [["1 · fetch the card", 92, "var(--accent)"], ["2 · SendMessage", 128, "var(--ink-2)"], ["3 · Task: SUBMITTED → WORKING → COMPLETED", 164, "var(--admitted)"], ["4 · push: statusUpdate, artifactUpdate", 200, "var(--held)"]];
    lanes.forEach(([lab, y, col], i) => {
      const toRight = i < 2;
      el("line", { x1: toRight ? 210 : 470, y1: y, x2: toRight ? 466 : 214, y2: y, stroke: col, "stroke-width": 1.5, "stroke-dasharray": i === 3 ? "4 3" : null }, svg);
      el("path", { d: toRight ? `M458,${y - 4} L466,${y} L458,${y + 4}z` : `M222,${y - 4} L214,${y} L222,${y + 4}z`, fill: col }, svg);
      text(svg, 340, y - 6, lab, { "text-anchor": "middle", "font-family": "var(--mono)", "font-size": 10.5, fill: col });
    });
    text(svg, W / 2, 252, "Two owners. The transport and the task lifecycle are specified; the boundary is not.", { "text-anchor": "middle", "font-size": 11.5, "font-style": "italic", fill: "var(--ink-2)" });
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
    const REL = { borrowed: "admitted", extended: "sealed", breaks: "refused", absent: "held" };
    const box = h("div", { class: "lineage" });
    const ex = h("div", { class: "fig-explain", "aria-live": "polite" }, "Tap a row to see the Membrane form it became.");
    function render() {
      box.textContent = "";
      rows.filter((r) => src === "all" || r.src === src).forEach((r) => {
        const b = h("button", { type: "button", class: "lin-row" }, h("span", { class: "lin-src mono" }, r.src), h("span", { class: "lin-n" }, r.name), h("span", { class: "d " + REL[r.rel] }, r.rel));
        b.addEventListener("click", () => { [...box.children].forEach((x) => x.classList.remove("on")); b.classList.add("on"); ex.textContent = ""; ex.appendChild(h("div", null, h("b", null, r.src + ": "), r.idea)); ex.appendChild(h("div", null, h("b", null, "Membrane: "), r.membrane)); });
        box.appendChild(b);
      });
    }
    const filt = h("div", { class: "seg-ctl" }, ["all", "MCP", "A2A"].map((v) => { const b = h("button", { type: "button", "aria-pressed": String(v === src) }, v); b.addEventListener("click", () => { src = v; [...filt.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b))); render(); }); return b; }));
    render();
    return h("div", null, h("div", { class: "w-row" }, filt, h("span", { class: "small muted" }, "borrowed · extended · breaks (holds inside one owner, fails between two) · absent")), box, ex);
  });
})();
