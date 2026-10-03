/* Course shell: loads the lesson files listed in course/manifest.js, then renders the home page, the lesson pages,
   the navigation, the running envelope and the tutor. Routes are plain #anchors (#home, #<lesson id>). */
(function () {
  "use strict";
  const C = window.Course, K = C.kit, { h, append, inline, refChip, store } = K;
  const M = window.MEMBRANE, S = window.Scenario;
  const base = (document.currentScript && document.currentScript.src || "").replace(/main\.js(\?.*)?$/, "");

  /* ---------- load lessons ---------- */
  function loadScript(src) {
    return new Promise((res) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => { console.error("[course] could not load " + src); res(); }; document.head.appendChild(s); });
  }
  async function loadLessons() {
    for (const f of C.manifest || []) await loadScript(base + "lessons/" + f);
  }

  /* ---------- ordering ---------- */
  const TRACK_ORDER = { foundation: 0, core: 1, annex: 2 };
  const partOf = (L) => C.PARTS.find((p) => p.id === L.part) || { id: L.part, title: L.part, track: "core" };
  const trackOf = (L) => L.track || partOf(L).track || "core";
  let ORDER = [];
  function computeOrder() {
    const pIndex = new Map(C.PARTS.map((p, i) => [p.id, i]));
    ORDER = C.LESSONS.slice().sort((a, b) => (TRACK_ORDER[trackOf(a)] - TRACK_ORDER[trackOf(b)]) || ((pIndex.get(a.part) ?? 99) - (pIndex.get(b.part) ?? 99)) || (C.LESSONS.indexOf(a) - C.LESSONS.indexOf(b)));
    C.coreIds = ORDER.filter((L) => trackOf(L) === "core").map((L) => L.id);
  }
  const core = () => ORDER.filter((L) => trackOf(L) === "core");
  const done = () => store.get("done", {});
  const lessonById = (id) => C.LESSONS.find((L) => L.id === id);

  /* ---------- the running envelope ---------- */
  const ENV_FIELDS = ["membrane", "id", "from", "to", "act", "form", "at", "by", "effect", "contract", "context", "acceptance", "turn", "body"];
  /* a lesson's stamps light when it is finished and, if it has scored checks, at least one of them was answered right */
  const SCORED = ["quiz", "sort", "gate"];
  function earned(L) {
    if (!done()[L.id]) return false;
    if (!(L.blocks || []).some((b) => SCORED.includes(b.t))) return true;
    const ans = store.get("answers", {});
    return Object.keys(ans).some((k) => k.startsWith(L.id + ":") && ans[k].ok);
  }
  function stamped() {
    const set = new Set();
    C.LESSONS.forEach((L) => { if (earned(L)) (L.stamps || []).forEach((f) => set.add(f)); });
    return set;
  }
  function teacherOf(field) { return core().find((L) => (L.stamps || []).includes(field)) || C.LESSONS.find((L) => (L.stamps || []).includes(field)); }
  function dock(current) {
    const msg = S.build({}).msg;
    const have = stamped();
    const now = new Set(current ? current.stamps || [] : []);
    const lines = S.toWire(msg).split("\n");
    const cut = lines.indexOf("---");
    const head = lines.slice(0, cut), body = lines.slice(cut + 1).join("\n");
    const n = ENV_FIELDS.filter((f) => have.has(f)).length;
    const pre = h("pre", { class: "wire dockwire", "aria-label": "The running envelope" });
    head.forEach((line) => {
      const k = line.slice(0, line.indexOf(":"));
      const known = have.has(k), fresh = now.has(k);
      const t = teacherOf(k);
      const row = h("span", { class: "wl" + (known ? " known" : " unknown") + (fresh ? " fresh" : ""), title: known ? "" : t ? "Taught in: " + t.title : "" });
      if (known || fresh) { const it = K.itemFor(k); const tk = it ? K.term(it.id, k) : h("span", null, k); tk.classList.add("wk"); row.appendChild(tk); row.appendChild(h("span", { class: "wc" }, ":")); row.appendChild(h("span", { class: "wv" }, line.slice(k.length + 1))); }
      else { row.appendChild(h("span", { class: "wk" }, k)); row.appendChild(h("span", { class: "wc" }, ":")); row.appendChild(h("span", { class: "wv veil" }, line.slice(k.length + 1))); }
      pre.appendChild(row);
    });
    pre.appendChild(h("span", { class: "wl wdash" }, "---"));
    pre.appendChild(h("span", { class: "wb" }, body.replace(/\n$/, "")));
    return h("div", { class: "dock-in" },
      h("div", { class: "dock-k" }, "The running envelope"),
      h("p", { class: "dock-p" }, "Hermes asks brainboi which week of the pilot it is. Each lesson stamps the fields it teaches."),
      h("div", { class: "dock-meter", role: "meter", "aria-valuemin": 0, "aria-valuemax": ENV_FIELDS.length, "aria-valuenow": n }, h("span", { style: { width: (100 * n / ENV_FIELDS.length) + "%" } })),
      h("div", { class: "dock-n num" }, n + " of " + ENV_FIELDS.length + " fields learned"),
      pre,
      gateSide(),
      n === ENV_FIELDS.length ? h("a", { class: "btn primary small", href: "#" + (C.LESSONS.some((L) => L.id === "capstone") ? "capstone" : (core().slice(-1)[0] || {}).id) }, "Send it through the gate") : null);
  }

  /* the receiver side of the dock: brainboi's 21 gate steps, lit as the lessons that teach them are finished */
  function gateSide() {
    const steps = C.kit.STEP_ORDER;
    const d = done();
    const lit = steps.map((id) => { const T = C.teacherOfStep && C.teacherOfStep(id); return !!(T && d[T.id]); });
    const n = lit.filter(Boolean).length;
    return h("div", { class: "dock-gate" },
      h("div", { class: "dock-k" }, "brainboi's gate"),
      h("div", { class: "dock-steps", role: "img", "aria-label": n + " of 21 gate steps learned" }, steps.map((id, i) => {
        const T = C.teacherOfStep && C.teacherOfStep(id);
        return h("a", { class: "dstep" + (lit[i] ? " on" : ""), href: T ? "#" + T.id : null, title: (i + 1) + " · " + window.Gate.STEPS[id].label + (T ? " · taught in " + T.title : "") }, String(i + 1));
      })),
      h("div", { class: "dock-n num" }, n + " of 21 steps learned"));
  }

  /* ---------- progress meter ---------- */
  function meter() {
    const el = document.getElementById("progress");
    if (!el) return;
    const d = done(), ans = Object.values(store.get("answers", {}));
    const total = ORDER.length, n = ORDER.filter((L) => d[L.id]).length;
    const right = ans.filter((a) => a.ok).length;
    el.textContent = "";
    append(el, [h("span", { class: "pm-bar" }, h("span", { style: { width: total ? (100 * n / total) + "%" : "0" } })), h("span", { class: "num" }, n + "/" + total + " lessons"), ans.length ? h("span", { class: "num muted" }, " · " + right + "/" + ans.length + " checks right") : null]);
  }

  /* ---------- navigation ---------- */
  function nav(currentId) {
    const el = document.getElementById("nav");
    el.textContent = "";
    const d = done();
    const tracks = [["foundation", "Foundations", "Prerequisites. Skip what you know."], ["core", "The course", null], ["annex", "Annexes", "Deep dives."]];
    el.appendChild(h("a", { class: "nav-home" + (currentId === "home" ? " on" : ""), href: "#home" }, "Course map"));
    for (const [t, title, blurb] of tracks) {
      const ls = ORDER.filter((L) => trackOf(L) === t);
      if (!ls.length) continue;
      const parts = C.PARTS.filter((p) => ls.some((L) => L.part === p.id));
      const open = t === "core" || ls.some((L) => L.id === currentId);
      const det = h("details", { class: "nav-track t-" + t, open: open ? true : null }, h("summary", null, title, h("span", { class: "num muted" }, " " + ls.filter((L) => d[L.id]).length + "/" + ls.length)));
      if (blurb) det.appendChild(h("p", { class: "nav-blurb" }, blurb));
      parts.forEach((p) => {
        if (t === "core" || parts.length > 1) det.appendChild(h("div", { class: "nav-part" }, p.title));
        ls.filter((L) => L.part === p.id).forEach((L) => {
          const n = t === "core" ? core().indexOf(L) + 1 : null;
          det.appendChild(h("a", { class: "nav-l" + (L.id === currentId ? " on" : "") + (d[L.id] ? " done" : ""), href: "#" + L.id, "aria-current": L.id === currentId ? "page" : null },
            h("span", { class: "nav-n num" }, d[L.id] ? "✓" : n != null ? String(n) : "·"), h("span", { class: "nav-t" }, L.title), h("span", { class: "nav-m num" }, (L.minutes || "") + "")));
        });
      });
      el.appendChild(det);
    }
  }

  /* ---------- home ---------- */
  function hero() {
    const W = 460, H = 420;
    const svg = K.svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "hero-svg", role: "img", "aria-label": "Envelopes meet a membrane and receive one of five dispositions" });
    const bil = K.svgEl("g", {}, svg);
    // where each envelope comes to rest: sealed before the wall, held inside it, admitted through it, refused turned back, expired fading in the queue
    const lanes = [
      { y: 64, state: "sealed", end: 0.36 }, { y: 140, state: "held", end: 0.53 }, { y: 216, state: "admitted", end: 0.82 },
      { y: 292, state: "refused", end: 0.34 }, { y: 368, state: "expired", end: 0.3 }];
    const envs = lanes.map((l, i) => {
      const g = window.Glyphs.envelope(svg, { x: 24, y: l.y, w: 46, h: 32, state: "sent" });
      const lab = K.svgEl("text", l.state === "held" ? { x: 54, y: 21, "text-anchor": "start", class: "hero-lab d-held" } : { x: 23, y: 50, "text-anchor": "middle", class: "hero-lab d-" + l.state }, g);
      lab.textContent = l.state;
      return { g, l, phase: i * 0.19, lab };
    });
    const still = K.reduceMotion();
    function frame(ts) {
      const t = (ts || 0) / 1000;
      window.Glyphs.bilayer(bil, { x: W * 0.53, y0: 12, y1: H - 12, spacing: 17, amp: still ? 1.5 : 3.6, t: still ? 1 : t, gap: 17, r: 5.6 });
      envs.forEach((e) => {
        const p = still ? 1 : ((t * 0.11 + e.phase) % 1.25) / 1.0;
        const q = Math.min(1, p);
        const turn = e.l.state === "refused" && q > 0.62 ? (q - 0.62) * 2.2 : 0; // refused bounces back off the wall
        const x = 30 + Math.min(q, e.l.state === "refused" ? 0.62 : 1) * (W * (e.l.state === "refused" ? 0.44 : e.l.end) - 30) - turn * 70;
        const y = e.l.y;
        e.g.setAttribute("transform", `translate(${x - 23},${y - 16})`);
        e.g.setState(q < 0.3 ? "sent" : q < 0.45 ? "sealed" : e.l.state);
        e.g.style.opacity = e.l.state === "expired" && q > 0.8 ? String(Math.max(0.35, 1 - (q - 0.8) * 3)) : "1";
        e.lab.style.opacity = q > 0.5 ? "1" : "0";
      });
      if (!still && document.body.contains(svg)) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return svg;
  }
  function home() {
    const d = done();
    const next = ORDER.find((L) => trackOf(L) === "core" && !d[L.id]) || core()[0];
    const started = Object.keys(d).length > 0;
    const mins = core().reduce((a, L) => a + (L.minutes || 0), 0);
    const gates = C.LESSONS.reduce((a, L) => a + (L.blocks || []).filter((b) => b.t === "gate").reduce((x, b) => x + 1 + (b.variants || []).length, 0), 0);
    const map = h("div", { class: "map" });
    const card = (L, n) => h("a", { class: "lcard" + (d[L.id] ? " done" : ""), href: "#" + L.id },
      h("span", { class: "lc-n num" }, d[L.id] ? "✓" : n), h("span", { class: "lc-b" }, h("span", { class: "lc-t" }, L.title), L.kicker ? h("span", { class: "lc-k" }, L.kicker) : null), h("span", { class: "lc-m num" }, (L.minutes || "") + (L.minutes ? " min" : "")));
    const found = ORDER.filter((L) => trackOf(L) === "foundation");
    const annex = ORDER.filter((L) => trackOf(L) === "annex");
    if (found.length) map.appendChild(h("section", { class: "map-track t-foundation" }, h("div", { class: "mt-head" }, h("h4", null, "Foundations"), h("p", null, "Prerequisites the course leans on. Each core lesson links the ones it needs.")), h("div", { class: "lcards" }, found.map((L) => card(L, "·")))));
    const coreSec = h("section", { class: "map-track t-core" }, h("div", { class: "mt-head" }, h("h4", null, "The course"), h("p", null, "In order. Each lesson ends with a check you can run.")));
    C.PARTS.filter((p) => core().some((L) => L.part === p.id)).forEach((p) => {
      coreSec.appendChild(h("div", { class: "map-part" }, h("div", { class: "mp-t" }, p.title), p.blurb ? h("div", { class: "mp-b" }, p.blurb) : null,
        h("div", { class: "lcards" }, core().filter((L) => L.part === p.id).map((L) => card(L, String(core().indexOf(L) + 1))))));
    });
    map.appendChild(coreSec);
    if (annex.length) map.appendChild(h("section", { class: "map-track t-annex" }, h("div", { class: "mt-head" }, h("h4", null, "Annexes"), h("p", null, "Network science, transport and security, each tied back to the mechanism it explains.")), h("div", { class: "lcards" }, annex.map((L) => card(L, "+")))));
    return h("div", { class: "home" },
      h("section", { class: "hero night" },
        h("div", { class: "hero-text" },
          h("div", { class: "eyebrow" }, h("span", { class: "dots" }, "●●●"), " Contract 0.3 draft · course"),
          h("h1", null, "Membrane, step by step"),
          h("p", { class: "lede" }, "What a receiving agent does with a message from an agent it does not own. Learn MCP and A2A, then the layer they leave open, by running the real gate yourself."),
          h("div", { class: "row hero-cta" },
            next ? h("a", { class: "btn primary", href: "#" + next.id }, started ? "Continue: " + next.title : "Start the course") : null,
            found.length ? h("a", { class: "btn", href: "#" + found[0].id }, "Start with the foundations") : null),
          h("div", { class: "hero-stats num" }, [core().length + " lessons", mins + " minutes", gates + " gate cases", "21 gate steps"].join(" · "))),
        h("div", { class: "hero-art" }, hero())),
      h("section", { class: "how" },
        h("div", null, h("b", null, "Predict"), h("span", null, "Each check asks what the receiver will do before it shows you.")),
        h("div", null, h("b", null, "Run"), h("span", null, "The gate on this page is the contract's reference gate, the same code the Playground runs.")),
        h("div", null, h("b", null, "Read the trace"), h("span", null, "Every decision names the step that made it and the contract item behind it."))),
      map);
  }

  /* ---------- lesson page ---------- */
  function lessonPage(L) {
    const t = trackOf(L), p = partOf(L);
    const cs = core(), n = cs.indexOf(L);
    const eyebrow = t === "core" ? p.title + " · lesson " + (n + 1) + " of " + cs.length : (t === "foundation" ? "Foundations · " : "Annex · ") + p.title.replace(/^Annex · /, "");
    const ctx = { lesson: L, tutorPrompts: [] };
    const body = h("div", { class: "lesson-body" });
    K.renderBlocks(L, body, ctx);
    const idx = ORDER.indexOf(L);
    const prev = ORDER[idx - 1], next = ORDER[idx + 1];
    const nextCore = t === "core" ? cs[n + 1] : null;
    const isDone = !!done()[L.id];
    const finish = h("button", { type: "button", class: "btn primary", onclick: () => {
      store.mark("done", L.id, true);
      meter(); nav(L.id); renderDock(L);
      const strip = document.getElementById("dockstrip"); if (strip) { strip.classList.remove("flash"); void strip.offsetWidth; strip.classList.add("flash"); }
      finish.textContent = "Finished"; finish.disabled = true;
      const go = nextCore || next;
      if (go) setTimeout(() => { location.hash = "#" + go.id; }, K.reduceMotion() ? 0 : 650);
    } }, isDone ? "Finished · next" : "Finish lesson");
    if (isDone) finish.onclick = () => { const go = nextCore || next; if (go) location.hash = "#" + go.id; };
    const page = h("article", { class: "lesson t-" + t },
      h("header", { class: "lesson-head" },
        h("div", { class: "eyebrow" }, eyebrow),
        h("h1", null, inline(L.title)),
        L.kicker ? h("p", { class: "lede" }, inline(L.kicker)) : null,
        h("div", { class: "lesson-meta" },
          L.minutes ? h("span", { class: "chip" }, L.minutes + " min") : null,
          (L.prereq || []).some(lessonById) ? h("span", { class: "pre" }, "Before this: ", (L.prereq || []).filter(lessonById).map((id) => h("a", { class: "chip lessonlink", href: "#" + id }, lessonById(id).title))) : null),
        (L.objectives || []).length ? h("div", { class: "objectives" }, h("h4", null, "You will be able to"), h("ul", null, L.objectives.map((o) => h("li", null, inline(o))))) : null),
      body,
      h("footer", { class: "lesson-foot" },
        h("div", { class: "row" }, finish, (L.stamps || []).length ? h("span", { class: "muted small stamps-line" }, "Stamps ", (L.stamps || []).map((f, j) => [j ? " " : "", h("code", null, f)]), " on the envelope") : null),
        h("nav", { class: "pn", "aria-label": "Lesson navigation" },
          prev ? h("a", { class: "pn-prev", href: "#" + prev.id }, h("span", { class: "muted" }, "Previous"), h("span", null, prev.title)) : h("span"),
          (nextCore || next) ? h("a", { class: "pn-next", href: "#" + (nextCore || next).id, onclick: () => { store.mark("done", L.id, true); } }, h("span", { class: "muted" }, "Next"), h("span", null, (nextCore || next).title)) : h("span"))));
    tutor.bind(L, ctx.tutorPrompts, page);
    return page;
  }

  function renderDock(L) {
    const el = document.getElementById("dock");
    el.textContent = "";
    document.body.classList.remove("dock-open");
    const strip = document.getElementById("dockstrip");
    if (strip) strip.textContent = "";
    if (L && trackOf(L) !== "core") { el.hidden = true; if (strip) strip.hidden = true; return; }
    el.hidden = false;
    if (L && core().indexOf(L) === 0) {
      el.appendChild(h("div", { class: "dock-in" }, h("div", { class: "dock-k" }, "The running envelope"), h("p", { class: "dock-p" }, "The message in this lesson is the one the course follows. From the next lesson on, it waits here with its fields veiled, and each lesson stamps the fields it teaches.")));
    } else el.appendChild(dock(L));
    if (strip) {
      const have = stamped(), n = ENV_FIELDS.filter((f) => have.has(f)).length;
      const steps = C.kit.STEP_ORDER, d = done();
      const lit = steps.filter((id) => { const T = C.teacherOfStep && C.teacherOfStep(id); return T && d[T.id]; }).length;
      strip.hidden = false;
      append(strip, [h("span", null, "Envelope ", h("b", { class: "num" }, n + "/" + ENV_FIELDS.length)), h("span", { class: "ds-meter", "aria-hidden": "true" }, h("span", { style: { width: (100 * n / ENV_FIELDS.length) + "%" } })),
        h("span", null, "Gate ", h("b", { class: "num" }, lit + "/21")),
        h("button", { type: "button", class: "btn ghost small", onclick: () => document.body.classList.toggle("dock-open") }, "Show")]);
    }
  }

  /* ---------- tutor (the sample capability; hidden where the page cannot ask Claude) ---------- */
  const tutor = {
    sample: null, lesson: null, prompts: [], page: null, turns: [], ctl: null,
    async init() {
      try { this.sample = window.claude && typeof window.claude.use === "function" ? await window.claude.use("sample") : null; } catch (e) { this.sample = null; }
      if (this.sample) { document.getElementById("tutor-btn").hidden = false; if (this.lesson) this.bind(this.lesson, this.prompts, this.page); }
    },
    bind(L, prompts, page) {
      this.lesson = L; this.prompts = prompts || []; this.page = page; this.turns = [];
      const panel = document.getElementById("tutor");
      if (!panel) return;
      const sugg = panel.querySelector(".tutor-sugg"), out = panel.querySelector(".tutor-out");
      out.textContent = "";
      sugg.textContent = "";
      (this.prompts.length ? this.prompts : ["Explain this lesson's main rule with a new example.", "What would break if this rule were removed?"]).slice(0, 4).forEach((q) => sugg.appendChild(h("button", { type: "button", class: "chip", onclick: () => this.ask(q) }, q)));
      panel.querySelector(".tutor-title").textContent = "Ask about: " + L.title;
    },
    context() {
      const text = (this.page ? this.page.innerText : "").replace(/\n{3,}/g, "\n\n").slice(0, 14000);
      return "You are the tutor inside an interactive course on Membrane, a draft protocol (contract 0.3, paper draft 0.2) for what an AI agent does with a message from an agent owned by someone else. "
        + "Answer the learner's question using the lesson below and the contract. Be concrete and short: at most 180 words unless asked for more. Use the contract's exact terms (dispositions, reason codes, tiers, fields). "
        + "Where the lesson or the contract does not settle something, say so plainly; Membrane is a draft and its pilot has not run. Do not invent spec fields. Plain text, no headings.\n\n"
        + "Lesson: " + this.lesson.title + "\nSummary: " + (this.lesson.summary || "") + "\n\nLesson text:\n" + text;
    },
    async ask(q) {
      if (!this.sample || !q || !q.trim()) return;
      const panel = document.getElementById("tutor");
      panel.hidden = false;
      const out = panel.querySelector(".tutor-out");
      const qEl = h("div", { class: "tq" }, q), aEl = h("div", { class: "ta" }, "Thinking…");
      out.appendChild(qEl); out.appendChild(aEl); aEl.scrollIntoView({ block: "nearest" });
      this.turns.push({ role: "user", content: q });
      if (this.ctl) this.ctl.abort();
      const ctl = this.ctl = new AbortController();
      try {
        const turns = [{ role: "user", content: this.context() }, { role: "assistant", content: "Ready. Ask about this lesson." }].concat(this.turns.slice(-8));
        const { text } = await this.sample(turns, { cache: false, signal: ctl.signal, onText: ({ text }) => { aEl.textContent = text; } });
        aEl.textContent = text;
        this.turns.push({ role: "assistant", content: text });
      } catch (e) {
        this.turns.pop();
        if (e && e.code === "cancelled") { aEl.textContent = e.text || "Stopped."; return; }
        if (e && ["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(e.code)) { aEl.textContent = "The tutor is not available in this view."; document.getElementById("tutor-btn").hidden = true; return; }
        aEl.textContent = (e && e.text ? e.text + "\n\n" : "") + (e && e.code === "rate_limited" ? "Too many questions at once. Try again in a minute." : "The tutor could not answer just now. Try again.");
      }
    }
  };
  function wireTutor() {
    const btn = document.getElementById("tutor-btn"), panel = document.getElementById("tutor");
    btn.addEventListener("click", () => { panel.hidden = !panel.hidden; if (!panel.hidden) panel.querySelector("textarea").focus(); });
    panel.querySelector(".tutor-close").addEventListener("click", () => { panel.hidden = true; });
    panel.querySelector("form").addEventListener("submit", (e) => { e.preventDefault(); const ta = panel.querySelector("textarea"); const q = ta.value; ta.value = ""; tutor.ask(q); });
    panel.querySelector(".tutor-stop").addEventListener("click", () => { if (tutor.ctl) tutor.ctl.abort(); });
  }

  /* ---------- router ---------- */
  function route() {
    K.closePop();
    const id = (location.hash || "#home").slice(1) || "home";
    const main = document.getElementById("main");
    main.textContent = "";
    document.body.classList.remove("nav-open");
    const L = lessonById(id);
    if (L) { main.appendChild(lessonPage(L)); document.title = L.title + " · Membrane Course"; renderDock(L); C.kit.markScrollers(main); }
    else { main.appendChild(home()); document.title = "Membrane Course"; renderDock(null); try { store.set("last", "home"); } catch (e) {} }
    if (L) store.set("last", L.id);
    nav(L ? L.id : "home");
    meter();
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }

  async function start() {
    await loadLessons();
    computeOrder();
    document.getElementById("menu").addEventListener("click", () => document.body.classList.toggle("nav-open"));
    wireTutor();
    window.addEventListener("hashchange", route);
    if (!location.hash) { const last = store.get("last"); if (last && lessonById(last)) history.replaceState(null, "", "#" + last); }
    route();
    tutor.init();
  }
  start();
})();
