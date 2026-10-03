/* Course scenarios: builds the message, receiver state and params the real gate (gate.js) is judged against.
   No DOM. Loads after spec.js and gate.js, in the page and in node (course/dev/check.js).
   A lesson describes a case as a small descriptor; Scenario.run(descriptor) returns { msg, ctx, params, trace }.

   descriptor = {
     base:   "ask" | "accept" | "reply" | "claim" | "receipt" | "alert"   (default "ask"; see BASES)
     header: { field: value }   overrides merged into the base header; key order kept, new keys appended
     unset:  ["field"]          header fields to remove
     body:   "text\n"           body bytes; the header's body hash is recomputed unless keepHash is true
     keepHash: true             keep header.body as given (to show a hash that no longer matches)
     msg:    { signer, sigValid, lane, touchedPaths, reads, sources, origin, recordOk, secondSignal, capability }
     ctx:    { receiver, now, standing, acceptedContracts, contractEffects, holdsToday, rateToday, seenIds, sent,
               expiredBodies, ownerSigned, secondSignals, paused, shareable, measurements, capabilities, trustRoot,
               ceiling, interruptsThisWeek, extensions, claims, sensor: "heuristic" | "none" }
     params: { cumulativeAck: false, ... }   any id from MEMBRANE.params; merged over Gate.defaults()
     call:   "evaluate" (default) | "page"   page runs Gate.pageDecision
   }
   Strings "$body" and "$hash:<text>" are resolved as in the test vectors (test-vectors/README.md, rule 1). */
(function (root) {
  "use strict";
  const Gate = root.Gate;

  /* the pilot's question-and-answer contract, exactly as printed in paper §10.4 */
  const CONTRACT_TEXT = [
    "contract   pilot-ask v0",
    "roles      asker, answerer",
    "key        id",
    "",
    "message    ask      asker -> answerer   binds id, question, acceptance, by        effect disclose",
    "message    accept   answerer -> asker   needs id, question   binds accepted       effect none",
    "message    reply    answerer -> asker   needs id, accepted   binds answer         effect disclose",
    "message    decline  answerer -> asker   needs id             binds answer         effect none",
    "message    verdict  asker -> answerer   needs id, answer     binds verdict        effect none",
    "",
    "sayso      verdict: asker ; accepted, answer: answerer",
    "commit     answerer, on accept sent: reply or decline by `by`",
    "shareable  answerer: pilot/shareable/ and public sources",
    "complete   verdict",
    "limits     turn <= 6 ; header <= 4 KB ; body <= 8 KB",
    ""
  ].join("\n");
  const CONTRACT = Gate.simHash(CONTRACT_TEXT);

  const ASK_ID = "hermes-20260922-a41d0e6b9c7f2358";
  const BR_ASK_ID = "brainboi-20260922-3f9a1c7e5b2d8046";

  /* base headers; key order is the order on the wire (membrane first). Every base is sent before the receiver's clock (ctx.now 10:00) */
  const BASES = {
    ask: {
      header: { membrane: 0, id: ASK_ID, from: "hermes", to: ["brainboi"], act: "request", form: "ask", at: "2026-09-22T09:00:00Z",
        by: "2026-09-23T09:00:00Z", effect: "disclose", contract: CONTRACT, context: "cx-" + ASK_ID, acceptance: "a whole number from 1 to 52", turn: 1, body: "$body" },
      body: "Read pilot/shareable/week.md and tell me which week of the pilot we are in.\n",
      msg: { reads: ["pilot/shareable/week.md"] }
    },
    accept: {
      header: { membrane: 0, id: "hermes-20260922-5c28f7d1e0b93a64", from: "hermes", to: ["brainboi"], act: "commit", form: "accept", at: "2026-09-22T09:20:00Z",
        by: "2026-09-23T09:00:00Z", contract: CONTRACT, context: "cx-" + BR_ASK_ID, re: BR_ASK_ID, turn: 2, body: "$body" },
      body: "Will answer from the public release page.\n",
      msg: {}
    },
    reply: {
      header: { membrane: 0, id: "hermes-20260922-9e04b7c1d2a35f68", from: "hermes", to: ["brainboi"], act: "assert", form: "reply", at: "2026-09-22T09:40:00Z",
        evidence: "record", contract: CONTRACT, context: "cx-" + BR_ASK_ID, re: BR_ASK_ID, turn: 3, body: "$body" },
      body: "Running v0.21.2, released 2026-09-11. Release page: github.com/NousResearch/hermes-agent/releases\n",
      msg: { recordOk: true }
    },
    claim: {
      header: { membrane: 0, id: "hermes-20260922-77c3a90e1b2d4f56", from: "hermes", to: ["brainboi"], act: "assert", at: "2026-09-22T09:30:00Z",
        evidence: "synthesis", body: "$body" },
      body: "The pilot repository moved to a self-hosted remote last night.\n",
      msg: {}
    },
    receipt: {
      header: { membrane: 0, id: "hermes-20260922-0d6e5a4b3c2f1908", from: "hermes", to: ["brainboi"], act: "declare", form: "receipt", at: "2026-09-22T09:55:00Z",
        re: BR_ASK_ID, echo: "$hash:Which Hermes Agent release is this agent running, and where is it documented?\n", disposition: "held", reason: "awaiting-owner",
        contract: CONTRACT, context: "cx-" + BR_ASK_ID, body: "$body" },
      body: "Held for the owner.\n",
      msg: {},
      ctx: { sent: { [BR_ASK_ID]: "$hash:Which Hermes Agent release is this agent running, and where is it documented?\n" } }
    },
    alert: {
      header: { membrane: 0, id: "hermes-20260922-31f0c8e2a9b74d15", from: "hermes", to: ["brainboi"], act: "assert", form: "alert", at: "2026-09-22T09:50:00Z",
        expires: "2026-09-22T21:50:00Z", evidence: "measured", measurement: "push-probe", urgency: "immediate", severity: "severe", certainty: "observed", body: "$body" },
      body: "The shared pilot remote rejected two pushes in a row; lanes may be stale.\n",
      msg: {}
    }
  };

  const CTX = () => ({
    receiver: "brainboi",
    now: "2026-09-22T10:00:00Z",
    seenIds: {}, sent: undefined, expiredBodies: {},
    acceptedContracts: { hermes: CONTRACT },
    contractEffects: { ask: "disclose", accept: "none", reply: "disclose", decline: "none", verdict: "none", receipt: "none", pulse: "none", card: "none", alert: "none" },
    standing: { hermes: "S1" },
    holdsToday: {}, rateToday: {}, interruptsThisWeek: {}, ceiling: {},
    paused: false,
    trustRoot: { pinned: true, keys: { hermes: "key-hermes", brainboi: "key-brainboi" }, transportKeys: {} },
    shareable: ["pilot/shareable/"],
    measurements: ["lease-probe"],
    capabilities: {},
    ownerSigned: [], secondSignals: [],
    sensor: "heuristic"
  });

  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Map) && !(v instanceof Set);
  const clone = (v) => (v == null || typeof v !== "object" ? v : JSON.parse(JSON.stringify(v)));

  /* deep merge for descriptor patches: objects merge, arrays and scalars replace, undefined deletes */
  function merge(a, b) {
    if (!isObj(b)) return b === undefined ? a : clone(b);
    const out = isObj(a) ? clone(a) : {};
    for (const k of Object.keys(b)) {
      if (b[k] === undefined) delete out[k];
      else out[k] = isObj(b[k]) && isObj(out[k]) ? merge(out[k], b[k]) : clone(b[k]);
    }
    return out;
  }

  function resolve(v, bodyText) {
    if (typeof v === "string") return v === "$body" ? Gate.simHash(bodyText) : v.startsWith("$hash:") ? Gate.simHash(v.slice(6)) : v;
    if (Array.isArray(v)) return v.map((x) => resolve(x, bodyText));
    if (isObj(v)) { const o = {}; for (const k of Object.keys(v)) o[resolve(k, bodyText)] = resolve(v[k], bodyText); return o; }
    return v;
  }

  /* build { msg, ctx, params } from a descriptor */
  function build(d = {}) {
    const base = BASES[d.base || "ask"];
    if (!base) throw new Error("unknown base " + d.base);
    const bodyText = d.body != null ? d.body : base.body;
    // header: base order, overrides in place, new keys appended, unset removed
    const header = {};
    const over = d.header || {};
    for (const k of Object.keys(base.header)) header[k] = Object.prototype.hasOwnProperty.call(over, k) ? over[k] : base.header[k];
    for (const k of Object.keys(over)) if (!Object.prototype.hasOwnProperty.call(header, k)) header[k] = over[k];
    for (const k of d.unset || []) delete header[k];
    for (const k of Object.keys(header)) if (header[k] === undefined) delete header[k];
    if (!d.keepHash && !Object.prototype.hasOwnProperty.call(over, "body") && "body" in header) header.body = "$body";
    const h = resolve(header, bodyText);
    if (d.keepHash && header.body === "$body") h.body = Gate.simHash(base.body); // the hash of the bytes before the edit

    const m = merge(base.msg || {}, d.msg || {});
    const signer = m.signer !== undefined ? m.signer : h.from;
    const lane = m.lane !== undefined ? m.lane : signer;
    const msg = Object.assign({}, resolve(m, bodyText), { header: h, bodyText, signer, lane });
    if (!m.touchedPaths) msg.touchedPaths = ["lanes/" + lane + "/out/" + (h.id || "message") + ".md"];

    const rawCtx = resolve(merge(merge(CTX(), base.ctx || {}), d.ctx || {}), bodyText);
    const ctx = Object.assign({}, rawCtx);
    ctx.now = typeof ctx.now === "string" ? Date.parse(ctx.now) : ctx.now;
    ctx.seenIds = new Map(Object.entries(rawCtx.seenIds || {}));
    ctx.expiredBodies = new Map(Object.entries(rawCtx.expiredBodies || {}));
    ctx.sent = rawCtx.sent ? new Map(Object.entries(rawCtx.sent)) : undefined;
    ctx.ownerSigned = new Set(rawCtx.ownerSigned || []);
    ctx.secondSignals = new Set(rawCtx.secondSignals || []);
    if (rawCtx.sensor === "heuristic") ctx.sensor = (mm, s) => Gate.sensorHeuristic(mm, s);
    else if (typeof d.sensor === "function") ctx.sensor = d.sensor;
    else delete ctx.sensor;

    const params = Object.assign(Gate.defaults(), d.params || {});
    return { msg, ctx, params };
  }

  function run(d = {}) {
    const b = build(d);
    if (d.call === "page") return Object.assign(b, { page: Gate.pageDecision(b.msg, b.ctx, b.params) });
    return Object.assign(b, { trace: Gate.evaluate(b.msg, b.ctx, b.params) });
  }

  /* compare a result with an expectation: { disposition, reason, decisiveStep, tier, admittedAs, receiptOwed, awaiting, answerScope, page, level, flags: {...} } */
  function check(result, expect) {
    if (!expect) return [];
    const got = result.page || result.trace || {};
    const miss = [];
    for (const k of Object.keys(expect)) {
      if (k === "flags") { for (const f of Object.keys(expect.flags)) if (!!(got.flags && got.flags[f]) !== !!expect.flags[f]) miss.push({ key: "flags." + f, want: expect.flags[f], got: !!(got.flags && got.flags[f]) }); continue; }
      const w = expect[k], g = got[k] === undefined ? null : got[k];
      if (JSON.stringify(w) !== JSON.stringify(g)) miss.push({ key: k, want: w, got: g });
    }
    return miss;
  }

  /* wire text: header lines, ---, body (P§4.1) */
  function fmt(v) {
    if (Array.isArray(v)) return "[" + v.join(", ") + "]";
    const s = String(v);
    return /^[\w.@:+\-/]*$/.test(s) && s.length ? s : '"' + s.replace(/"/g, "'") + '"';
  }
  function toWire(msg) {
    const h = msg.header || {};
    return Object.keys(h).map((k) => k + ": " + fmt(h[k])).join("\n") + "\n---\n" + (msg.bodyText || "");
  }
  /* parse wire text back into { header, bodyText, error }; values are strings except membrane and turn, lists stay lists */
  function fromWire(text) {
    const s = String(text);
    const cut = s.indexOf("\n---\n");
    if (cut < 0) return { error: "no line that is exactly --- between header and body" };
    const header = {};
    const lines = s.slice(0, cut).split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      const i = line.indexOf(":");
      if (i < 1) return { error: "header line without key: value: " + line };
      const k = line.slice(0, i).trim();
      let v = line.slice(i + 1).trim();
      if (Object.prototype.hasOwnProperty.call(header, k)) return { error: "key appears twice: " + k };
      if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(",").map((x) => x.trim()).filter(Boolean);
      else if (/^".*"$/.test(v)) v = v.slice(1, -1);
      else if ((k === "membrane" || k === "turn") && /^\d+$/.test(v)) v = Number(v);
      header[k] = v;
    }
    return { header, bodyText: s.slice(cut + 5) };
  }

  // display order of a quiz's options, seeded by its block key: shared by the renderer and the checker so the checker counts the slots readers see.
  // Math.imul keeps the multiply inside 32 bits (a plain * overflows 2^53 and zeroes the low bits), and the pick reads the high bits, which a power-of-two LCG mixes best.
  function quizOrder(key, n) {
    const order = Array.from({ length: n }, (_, j) => j);
    let seed = 0; for (const ch of key) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) >>> 0;
    for (let j = n - 1; j > 0; j--) { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; const r = (seed >>> 16) % (j + 1); [order[j], order[r]] = [order[r], order[j]]; }
    return order;
  }
  root.Scenario = { CONTRACT, CONTRACT_TEXT, BASES, build, run, check, merge, toWire, fromWire, ASK_ID, BR_ASK_ID, quizOrder };
})(typeof window !== "undefined" ? window : globalThis);
