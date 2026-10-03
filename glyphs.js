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

  /* envelope: a paper envelope in its disposition colour, flap closed; the colour rides on currentColor so the glow follows it */
  function envelope(parent, { x = 0, y = 0, w = 34, h = 24, state = "sent", label = "" } = {}) {
    const g = el("g", { class: "glyph-envelope", transform: `translate(${x - w / 2},${y - h / 2})` }, parent);
    const colour = (s) => `var(${DISPOSITION_VAR[s] || "--ink-3"})`;
    g.style.color = colour(state); g.dataset.state = state;
    el("rect", { x: 0, y: 0, width: w, height: h, rx: 2.5, fill: "currentColor" }, g);
    el("path", { d: `M0,${h} L${w * 0.38},${h * 0.52} M${w},${h} L${w * 0.62},${h * 0.52}`, fill: "none", stroke: "var(--env-crease)", "stroke-width": 1, "stroke-linecap": "round", opacity: .5 }, g);
    el("path", { d: `M0.6,0.6 L${w / 2},${h * 0.6} L${w - 0.6},0.6 Z`, fill: "var(--env-flap)", stroke: "var(--env-crease)", "stroke-width": 1, "stroke-linejoin": "round", opacity: .6 }, g);
    if (label) { const t = el("text", { x: w / 2, y: h + 12, "text-anchor": "middle", "font-family": "var(--mono)", "font-size": 9, fill: "var(--ink-3)" }, g); t.textContent = label; }
    g.setState = (s) => { g.style.color = colour(s); g.dataset.state = s; };
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

  /* lipid bilayer along a vertical line: two rows of beads, each with two wavy tails that meet in the middle; breathes with t (seconds) */
  function bilayer(parent, { x = 0, y0 = 0, y1 = 200, spacing = 11, amp = 3, t = 0, gap = 9 } = {}) {
    let g = parent.querySelector(":scope > g.glyph-bilayer");
    if (!g) g = el("g", { class: "glyph-bilayer" }, parent);
    while (g.firstChild) g.removeChild(g.firstChild);
    let tails = "";
    const heads = [];
    for (let y = y0, i = 0; y <= y1; y += spacing, i++) {
      const dx = Math.sin(t * 1.3 + i * 0.45) * amp;
      const wob = Math.sin(t * 2.1 + i * 1.7) * 1.1;
      [-1, 1].forEach((side) => {
        const hx = x + dx + side * gap, len = gap - 1.2;
        [-1.6, 1.6].forEach((off) => {
          const ex = hx - side * len, ey = y + off + wob * 0.5;
          tails += `M${hx.toFixed(1)},${(y + off * 0.5).toFixed(1)} Q${(hx - side * len * 0.5).toFixed(1)},${(y + off * 3 + wob * 1.6).toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)} `;
        });
        heads.push([hx, y]);
      });
    }
    el("path", { class: "bilayer-tails", d: tails, fill: "none", stroke: "var(--lipid)", "stroke-width": .8, "stroke-linecap": "round", opacity: .55 }, g);
    heads.forEach(([hx, y]) => {
      el("circle", { cx: hx, cy: y, r: 3.3, fill: "var(--lipid)" }, g);
      el("circle", { cx: hx - 0.9, cy: y - 0.9, r: 1.1, fill: "var(--lipid-hi)", opacity: .8 }, g);
    });
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
