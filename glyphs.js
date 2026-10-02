/* Shared visual grammar. Every view draws agents, envelopes and the membrane with these, so the page reads as one system.
   Colors come from CSS variables; nothing here hardcodes a theme color except agent identity colors from spec.js. */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const DISPOSITION_VAR = { sealed: "--sealed", held: "--held", admitted: "--admitted", refused: "--refused", expired: "--expired", sent: "--ink-3" };

  /* envelope: a small rounded card with three header lines and a disposition-colored edge */
  function envelope(parent, { x = 0, y = 0, w = 34, h = 24, state = "sent", label = "" } = {}) {
    const g = el("g", { class: "glyph-envelope", transform: `translate(${x - w / 2},${y - h / 2})` }, parent);
    const c = `var(${DISPOSITION_VAR[state] || "--ink-3"})`;
    el("rect", { x: 0, y: 0, width: w, height: h, rx: 4, fill: "var(--surface)", stroke: c, "stroke-width": 1.5 }, g);
    el("rect", { x: 0, y: 0, width: 4, height: h, rx: 2, fill: c }, g);
    [6, 11, 16].forEach((yy, i) => el("line", { x1: 8, x2: w - (i === 2 ? 14 : 6), y1: yy, y2: yy, stroke: "var(--rule-strong)", "stroke-width": 1.4, "stroke-linecap": "round" }, g));
    if (label) { const t = el("text", { x: w / 2, y: h + 12, "text-anchor": "middle", "font-family": "var(--mono)", "font-size": 9, fill: "var(--ink-3)" }, g); t.textContent = label; }
    g.setState = (s) => { const cc = `var(${DISPOSITION_VAR[s] || "--ink-3"})`; g.children[0].setAttribute("stroke", cc); g.children[1].setAttribute("fill", cc); };
    return g;
  }

  /* agent node: outer ring = gate, inner disc = kernel, small arc = quarantine vesicle, name below */
  function agentNode(parent, agent, { x = 0, y = 0, r = 30, held = 0, standing = "" } = {}) {
    const g = el("g", { class: "glyph-agent", transform: `translate(${x},${y})`, "data-agent": agent.id }, parent);
    el("circle", { r: r + 7, fill: "none", stroke: agent.color, "stroke-width": 1, "stroke-dasharray": "2 3", opacity: .55 }, g);
    el("circle", { r, fill: "var(--surface)", stroke: agent.color, "stroke-width": 2 }, g);
    el("circle", { r: r * 0.36, fill: agent.color, opacity: .9 }, g);
    const ves = el("g", { class: "vesicle", transform: `translate(${r * 0.72},${-r * 0.72})` }, g);
    el("circle", { r: 9, fill: "var(--held-bg)", stroke: "var(--held)", "stroke-width": 1.2 }, ves);
    const ht = el("text", { "text-anchor": "middle", y: 3.5, "font-family": "var(--mono)", "font-size": 9, fill: "var(--held)" }, ves);
    ht.textContent = held;
    ves.style.display = held ? "" : "none";
    const name = el("text", { y: r + 22, "text-anchor": "middle", "font-family": "var(--sans)", "font-size": 12, "font-weight": 600, fill: "var(--ink)" }, g);
    name.textContent = agent.name;
    const sub = el("text", { y: r + 36, "text-anchor": "middle", "font-family": "var(--sans)", "font-size": 10.5, fill: "var(--ink-3)" }, g);
    sub.textContent = standing ? `${agent.role} · ${standing}` : agent.role;
    g.setHeld = (n) => { ht.textContent = n; ves.style.display = n ? "" : "none"; };
    return g;
  }

  /* lipid bilayer along a vertical line: two rows of heads with tails, undulating with t (seconds) */
  function bilayer(parent, { x = 0, y0 = 0, y1 = 200, spacing = 11, amp = 3, t = 0, gap = 9 } = {}) {
    let g = parent.querySelector(":scope > g.glyph-bilayer");
    if (!g) g = el("g", { class: "glyph-bilayer" }, parent);
    while (g.firstChild) g.removeChild(g.firstChild);
    for (let y = y0, i = 0; y <= y1; y += spacing, i++) {
      const dx = Math.sin(t * 1.3 + i * 0.45) * amp;
      [-1, 1].forEach((side) => {
        const hx = x + dx + side * gap;
        el("line", { x1: hx, y1: y, x2: hx - side * (gap - 2), y2: y + 2, stroke: "var(--lipid)", "stroke-width": 1, opacity: .45 }, g);
        el("circle", { cx: hx, cy: y, r: 3.2, fill: "var(--lipid-soft)", stroke: "var(--lipid)", "stroke-width": 1 }, g);
      });
    }
    return g;
  }

  function dispositionChip(state, text) {
    const s = document.createElement("span");
    s.className = "d " + state;
    s.textContent = text || state;
    return s;
  }

  window.Glyphs = { el, envelope, agentNode, bilayer, dispositionChip, cssVar, DISPOSITION_VAR };
})();
