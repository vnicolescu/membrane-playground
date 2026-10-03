/* Gate: the deterministic membrane gate (contract v0.3). Pure and synchronous; no DOM, no clock, no randomness.
   Gate.evaluate(msg, ctx, params) → trace. Every step names the spec item it enforces (ref = spec.js item id).
   Order follows ARCH.md "Gate contract", P§6.4 and the brainboi gate of P§13.3. */
(function (root) {
  "use strict";

  const EFFECTS = ["none", "read", "disclose", "reversible", "boundary", "irreversible"];
  const TIER_OF = { none: "T0", read: "T0", disclose: "T1", reversible: "T2", boundary: "T3", irreversible: "T4" };
  const TIER_EFFECT = { T0: "read", T1: "disclose", T2: "reversible", T3: "boundary", T4: "irreversible" };
  const REQUIRED = ["membrane", "id", "from", "to", "act", "at", "body"];
  const ACTS = ["assert", "request", "commit", "declare"];
  const NO_RECEIPT_FORMS = ["receipt", "quiet", "not-understood"];
  const EVIDENCE_RANK = { intention: 0, synthesis: 1, record: 2, reconciled: 3, measured: 4 };
  const STANDING_RANK = { S0: 0, S1: 1, S2: 2, S3: 3 };
  const IMPACT_RANK = { none: 0, low: 1, medium: 2, high: 3 };
  const KNOWN_EXT = new Set(["urgency", "for", "hand", "present"].concat(Array.from({ length: 16 }, (_, i) => "grease-" + i)));
  const DEDUP_WINDOW_MS = 30 * 24 * 3600e3; // P§4.2 rule 7, starting value 30 days
  const HEADER_MAX = 4000, BODY_MAX = 64000; // P§4.1: 4 KB and 64 KB, counted in UTF-8 bytes
  const RFC3339Z = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
  const FORMAT_CHARS = /[^\P{Cc}\n]|\p{Cf}/u; // P§4.1: Unicode control (Cc) and format (Cf) characters other than LF, astral tag characters included
  const HARNESS_PATH = /(^|\/)(\.claude|\.git|\.github|\.hermes|_kernel|_memory|_executive|hooks|gate|trust|trust-root|contracts)(\/|$)|(^|\/)(SKILL|AGENTS|CLAUDE|GEMINI|SOUL)\.md$|settings(\.local)?\.json$|(^|\/)keys?\.(json|pub)$|(^|\/)\.env$/i;
  const IDENT = /^[A-Za-z0-9._@-]{1,128}$/;
  const own = (o, k) => (o == null ? undefined : typeof o.get === "function" && typeof o.has === "function" ? o.get(k) : Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined);
  const utf8Bytes = (str) => { let n = 0; for (const ch of String(str)) { const c = ch.codePointAt(0); n += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4; } return n; };
  const count = (o, k) => { const v = own(o, k); if (v == null) return 0; const x = Number(v); return Number.isFinite(x) && x >= 0 ? x : Infinity; }; // a corrupted counter fails closed
  /* schema derived from spec.js (P§4.2 rules 1 and 5): form → act, form → required fields, field → allowed values */
  const ENUM_FIELDS = ["act", "effect", "evidence", "disposition", "verdict", "hand", "ceiling", "urgency", "severity", "certainty"];
  let schemaCache = null, schemaFor = null;
  function schema() {
    const M = root.MEMBRANE;
    if (!M || !M.groups) return null;
    if (schemaFor === M) return schemaCache;
    const items = []; M.groups.forEach((g) => (g.items || []).forEach((i) => items.push(Object.assign({ group: g.id }, i))));
    const forms = {}, actOf = {}, formReq = {}, actReq = {}, whenEvidence = {}, whenDisposition = {}, enums = {};
    items.filter((i) => i.kind === "form").forEach((i) => { const n = String(i.name).split(" ")[0]; forms[n] = true; actOf[n] = i.act; });
    const acts = ["assert", "request", "commit", "declare"];
    for (const i of items) {
      if ((i.kind === "field" || i.kind === "extension") && Array.isArray(i.enum) && ENUM_FIELDS.includes(i.name)) enums[i.name] = i.enum.map((e) => String(e.v));
      if (typeof i.required !== "string" || (i.kind !== "field" && i.group !== "extensions" && i.group !== "envelope")) continue;
      const field = String(i.name);
      if (/^\s*optional\b/.test(i.required)) continue; // "optional · on request": where it may appear, never required
      for (const seg0 of i.required.split("·")) {
        const seg = seg0.trim();
        let m;
        if ((m = /^on (?:form |every )?(.+)$/.exec(seg))) {
          const names = m[1].split(/,\s*|\s+and\s+/).map((x) => x.trim()).filter(Boolean);
          if (!names.every((n) => forms[n] || acts.includes(n))) continue; // descriptive ("on disposition receipt"): handled below
          for (const n of names) {
            if (forms[n]) (formReq[n] = formReq[n] || []).push(field);
            else if (field !== "contract") (actReq[n] = actReq[n] || []).push(field); // a missing contract is contract-mismatch (rule 8)
          }
        } else if ((m = /^with evidence (\S+)$/.exec(seg))) (whenEvidence[m[1]] = whenEvidence[m[1]] || []).push(field);
        else if ((m = /^with (\S+) or (\S+)$/.exec(seg))) [m[1], m[2]].forEach((d) => (whenDisposition[d] = whenDisposition[d] || []).push(field));
      }
    }
    const reasons = M.groups.find((g) => g.id === "reasons");
    if (reasons) enums.reason = reasons.items.map((i) => String(i.name));
    schemaFor = M; schemaCache = { forms, actOf, formReq, actReq, whenEvidence, whenDisposition, enums };
    return schemaCache;
  }
  function schemaError(h) {
    const sc = schema(); if (!sc) return null;
    const has = (k) => h[k] != null && h[k] !== "" && !(Array.isArray(h[k]) && !h[k].length);
    for (const f of Object.keys(sc.enums)) if (h[f] != null && !list(h[f]).every((v) => sc.enums[f].includes(String(v)))) return `${f} value outside its registry`;
    if (h.form != null && Object.prototype.hasOwnProperty.call(sc.forms, h.form)) {
      if (sc.actOf[h.form] && sc.actOf[h.form] !== h.act) return `form ${h.form} is a ${sc.actOf[h.form]}, not a ${h.act}`;
      const miss = (sc.formReq[h.form] || []).filter((k) => !has(k));
      if (miss.length) return `form ${h.form} needs ${miss.join(", ")}`;
    }
    const missAct = (Object.prototype.hasOwnProperty.call(sc.actReq, h.act) ? sc.actReq[h.act] : []).filter((k) => !has(k));
    if (missAct.length) return `${h.act} needs ${missAct.join(", ")}`;
    if (h.evidence != null && Object.prototype.hasOwnProperty.call(sc.whenEvidence, h.evidence)) { const mm = sc.whenEvidence[h.evidence].filter((k) => !has(k)); if (mm.length) return `evidence ${h.evidence} needs ${mm.join(", ")}`; }
    if (h.disposition != null && Object.prototype.hasOwnProperty.call(sc.whenDisposition, h.disposition)) { const mm = sc.whenDisposition[h.disposition].filter((k) => !has(k)); if (mm.length) return `disposition ${h.disposition} needs ${mm.join(", ")}`; }
    return null;
  }
  const realDate = (v) => { const t = Date.parse(v); if (!Number.isFinite(t)) return false; return new Date(t).toISOString().slice(0, 19) === String(v).slice(0, 19); };
  const escRe = (x) => String(x).replace(/[.*+?^${}()|[\]\\\/-]/g, "\\$&");
  const TRUST_PATH = /^(trust|trust-root|contracts)\//i;

  /* labels and refs for every step, shared with the views */
  const STEPS = {
    signature: { label: "signature", short: "sig", ref: "rc.unsigned" },
    lane: { label: "lane", short: "lane", ref: "rc.lane" },
    scope: { label: "scope", short: "scope", ref: "rc.scope" },
    syntax: { label: "bytes and header", short: "syntax", ref: "inv.bytes" },
    version: { label: "version", short: "ver", ref: "rc.version" },
    addressed: { label: "addressed", short: "to", ref: "rc.not-addressed" },
    duplicate: { label: "duplicate and reuse", short: "dup", ref: "rc.duplicate" },
    clock: { label: "clock", short: "clock", ref: "rc.clock" },
    expiry: { label: "expiry", short: "exp", ref: "disp.expired" },
    contract: { label: "contract", short: "contract", ref: "rc.contract-mismatch" },
    crit: { label: "critical extensions", short: "crit", ref: "env.crit" },
    turn: { label: "turn cap", short: "turn", ref: "env.turn" },
    rate: { label: "rate", short: "rate", ref: "rc.rate" },
    paused: { label: "pause", short: "pause", ref: "rc.paused" },
    seal: { label: "seal", short: "seal", ref: "disp.sealed" },
    effect: { label: "effect class", short: "effect", ref: "env.effect" },
    evidence: { label: "evidence path", short: "evid", ref: "env.evidence" },
    standing: { label: "standing", short: "stand", ref: "st.S0" },
    sensor: { label: "sensor", short: "sensor", ref: "disp.held" },
    budget: { label: "hold budget", short: "budget", ref: "rc.hold-budget" },
    release: { label: "release", short: "release", ref: "tier.T0" }
  };

  /* ---------- simHash: a small synchronous stand-in for SHA-256 (NOT cryptographic; simulation only) ---------- */
  function simHash(text) {
    const s = String(text == null ? "" : text);
    let h1 = 0x811c9dc5, h2 = 0x01000193 ^ 0x9e3779b9;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      h1 ^= c; h1 = Math.imul(h1, 0x01000193) >>> 0;
      h2 ^= c + i; h2 = Math.imul(h2 ^ (h2 >>> 15), 0x2c1b3c6d) >>> 0;
    }
    h1 = Math.imul(h1 ^ (h1 >>> 13), 0x5bd1e995) >>> 0;
    return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
  }

  function defaults() {
    const out = {};
    const ps = (root.MEMBRANE && root.MEMBRANE.params) || [];
    ps.forEach((p) => { out[p.id] = p.def; });
    return out;
  }

  const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const ms = (t) => (typeof t === "number" ? t : Date.parse(t));
  const maxEffect = (a, b) => (EFFECTS.indexOf(a) >= EFFECTS.indexOf(b) ? a : b);
  const validEffect = (e) => (EFFECTS.includes(e) ? e : null);
  const isReceiptish = (h) => NO_RECEIPT_FORMS.includes(h.form) || (h.act === "declare" && (h.disposition != null || h.verdict != null));

  /* ---------- sensor heuristic: offline keyword and pattern sensor (P§6.4: typed label, may raise or hold, never release) ---------- */
  function sensorHeuristic(msg, strictness = "medium") {
    const h = (msg && msg.header) || {};
    const free = ["acceptance", "reason", "note", "subject", "title", "origin", "context", "re"].map((k) => h[k]).concat(list(h.crit)).filter((v) => typeof v === "string");
    const text = [msg && msg.bodyText ? String(msg.bodyText) : ""].concat(free).join("\n");
    const lvl = { low: 0, medium: 1, high: 2 }[strictness] ?? 1;
    const signals = [];
    const hit = (name, re) => { if (re.test(text)) { signals.push(name); return true; } return false; };

    const hidden = hit("hidden control or format characters", FORMAT_CHARS);
    const comment = hit("HTML comment", /<!--[\s\S]*?-->/);
    const b64 = hit("base64 run", new RegExp("[A-Za-z0-9+/]{" + [60, 40, 24][lvl] + ",}={0,2}"));
    const instr = hit("instruction phrase", /\b(ignore|disregard|forget)\b[^.\n]{0,30}\b(previous|prior|above|earlier|all)\b[^.\n]{0,20}\b(instructions?|rules?|prompts?|messages?)\b|\byou are now\b|\bnew (system )?instructions?\b|\bsystem prompt\b|\bdeveloper mode\b|\bjailbreak\b|\bact as (the|an?|my)\b|\bpretend (to be|you)\b|\bdo not (tell|inform|mention)\b/i);
    const kernel = hit("kernel or memory path", /(_kernel|_memory|_executive|\.claude|\.ssh|trust-?root|hooks)\/|SKILL\.md|settings(\.local)?\.json|\bapi[-_ ]?keys?\b|\bcredentials?\b|\bprivate key\b/i);
    const approval = hit("owner-approval claim", /\b(vlad|sal|the owner|your owner|admin)\b[^.\n]{0,24}\b(approved|authori[sz]ed|signed off|okayed|agreed|confirmed|said (it'?s |it is )?(ok|fine))\b|\bapproved (this|it) in chat\b|\bon behalf of (vlad|sal|your owner|the owner)\b/i);
    const urgency = lvl >= 2 && hit("pressure words", /\b(urgent(ly)?|immediately|asap|right now|before (vlad|sal|the owner) (sees|notices))\b/i);
    const external = hit("external destination", /https?:\/\/|\b[\w.-]+@[\w-]+\.[a-z]{2,}\b/i);

    const irreversible = /\b(delete|remove|rm -rf|wipe|erase|drop|spend|pay|transfer|wire|rotate (the )?keys?|overwrite|force[- ]push)\b/i.test(text);
    const writey = /\b(write|commit|push|merge|install|run|execute|send|forward|email|post|publish|edit|append|update|modify|add)\b/i.test(text);
    const ready = /\b(read|list|show|summari[sz]e|what is|what's|tell me|share|quote|dump|export)\b/i.test(text);
    const asks_for_action = irreversible || writey || (h.act === "assert" && /\b(please|you (must|should)|make sure)\b/i.test(text));

    let impact = irreversible || (kernel && writey) ? "high" : writey ? "medium" : ready || kernel ? "low" : "none";
    if (lvl === 2 && impact === "low" && (kernel || approval)) impact = "medium";
    if (lvl === 0 && impact === "medium" && !kernel) impact = "low";

    const beyond = kernel || external || approval || (lvl === 2 && /(^|\s)(\.{0,2}\/)?[\w.-]+\/[\w./-]+/.test(text) && !/lanes\/|pilot\/shareable\//.test(text));
    const reach = beyond ? "beyond" : ready ? "receiver" : "contract";

    const score = (hidden ? 2 : 0) + (comment ? 2 : 0) + (b64 ? 1 : 0) + (instr ? 2 : 0) + (approval ? 2 : 0) + (kernel ? 1 : 0) + (urgency ? 1 : 0) + (external && writey ? 1 : 0);
    const injection_suspected = score >= [3, 2, 1][lvl];
    return { impact, reach, asks_for_action, injection_suspected, signals };
  }

  /* ---------- effectOf: declared effect vs the contract's, the higher wins (P§6.2) ---------- */
  function effectOf(msg, ctx = {}, params = {}) {
    const h = (msg && msg.header) || {};
    const isReq = h.act === "request";
    const declaredRaw = h.effect;
    let declared = declaredRaw == null ? (isReq ? "irreversible" : "none") : (validEffect(declaredRaw) || "irreversible");
    const type = h.form || h.act;
    const accepted = !!(h.contract && own(ctx.acceptedContracts, h.from) === h.contract);
    const table = ctx.contractEffects || {};
    let contract = null;
    if (accepted || !isReq) contract = validEffect(own(table, type));
    if (isReq && accepted && contract == null) contract = "irreversible"; // absent from the contract's menu = most restrictive
    let effect = contract ? maxEffect(declared, contract) : declared;
    let raisedRead = false;
    if (isReq && effect === "read" && params.quarantinedAnswer !== false) { effect = "disclose"; raisedRead = true; } // Rev02·#3: answering draws on what the receiver holds
    return { declared, contract, effect, tier: TIER_OF[effect], raisedRead };
  }

  /* ---------- the urgency ceiling (P§7.2): not a disposition, a page decision for alerts ---------- */
  function pageDecision(msg, ctx = {}, params = {}) {
    const h = (msg && msg.header) || {};
    const u = h.urgency, sev = h.severity, cert = h.certainty;
    const claims = ["immediate", "expected"].includes(u);
    if (!claims) return { page: false, level: "cycle", note: "no urgent claim" };
    if (params.ceilingEnforced === false) return { page: true, level: "interrupt", note: "sender's claim taken as the urgency", failure: true };
    const ceiling = own(ctx.ceiling, h.from) || "cycle";
    if (ceiling !== "interrupt") return { page: false, level: ceiling, note: "ceiling " + ceiling };
    const eligible = claims && ["extreme", "severe"].includes(sev) && ["observed", "likely"].includes(cert);
    if (!eligible) return { page: false, level: "prompt", note: "not eligible: urgency, severity and certainty all count" };
    const used = count(ctx.interruptsThisWeek, h.from);
    if (used >= (params.interruptBudget ?? 2)) return { page: false, level: "prompt", note: "interrupt budget spent this week" };
    return { page: true, level: "interrupt", note: "within budget " + (used + 1) + "/" + params.interruptBudget };
  }

  /* ---------- evaluate ---------- */
  function evaluate(msg, ctx = {}, paramsIn) {
    const params = Object.assign(defaults(), paramsIn || {});
    const h = (msg && msg.header) || {};
    const steps = [], notes = [];
    const flags = {};
    const trace = { steps, effect: "none", tier: "T0", disposition: null, reason: null, receiptOwed: false, sensor: null, notes, flags,
      standing: null, awaiting: null, releaseBy: null, admittedAs: null, answerScope: null, sealed: null, originalReceipt: null };
    const now = ctx.now != null ? ctx.now : 0;
    const step = (id, ok, note, code) => { const s = { id, label: STEPS[id].label, ok, note, ref: STEPS[id].ref }; if (code) s.code = code; steps.push(s); return s; };
    const settle = () => {
      const dec = steps.find((s) => s.code && s.code === trace.reason) || steps.find((s) => s.id === "release") || steps[steps.length - 1] || null;
      trace.decisiveStep = dec ? dec.id : null;
      steps.forEach((s) => { if (s.ok === false && s !== dec) s.ok = "flag"; }); // advisory: logged, did not decide the outcome
    };
    const finish = (disposition, reason) => {
      trace.disposition = disposition; trace.reason = reason || null;
      settle();
      if (disposition == null) trace.receiptOwed = false;
      else if (isReceiptish(h) && params.cumulativeAck) trace.receiptOwed = false; // P§6.1: receipts never earn receipts
      else if (disposition === "admitted") { trace.receiptOwed = !params.cumulativeAck; trace.ackDeferred = !!params.cumulativeAck; }
      else if (reason === "rate") trace.receiptOwed = count(ctx.rateToday, h.from) === params.ratePerDay; // one refusal receipt, then silence
      else trace.receiptOwed = true;
      return trace;
    };

    /* 1 · signature (P§4.2 rule 9): unsigned or invalid → logged only, no receipt */
    const pinned = params.trustRootPinned !== false && !(ctx.trustRoot && ctx.trustRoot.pinned === false);
    const signer = msg && msg.signer;
    if (!signer || msg.sigValid === false) { step("signature", false, "signature missing or invalid: logged, no receipt", "unsigned"); return finish(null, "unsigned"); }
    let knownSigner = true;
    if (ctx.trustRoot && ctx.trustRoot.keys) {
      const keys = Object.assign({}, ctx.trustRoot.keys, pinned ? {} : ctx.trustRoot.transportKeys || {});
      knownSigner = Object.prototype.hasOwnProperty.call(keys, signer);
    }
    flags.unknownSigner = !knownSigner;
    step("signature", true, knownSigner ? (pinned ? "key found in the pinned trust root" : "key found in the transport's key list") : "valid signature, unknown identifier");

    /* 2 · lane (R9·§7): signer == lane == from */
    const lane = msg.lane != null ? msg.lane : signer;
    if (params.laneBound !== false && !(signer === lane && lane === h.from)) { step("lane", false, `signer ${signer}, lane ${lane}, from ${h.from}`, "lane"); return finish("refused", "lane"); }
    if (!(signer === lane && lane === h.from)) { flags.laneUnbound = true; notes.push("FAILURE risk: lane binding off, from taken as written"); step("lane", true, "lane binding off: from taken as written"); } else step("lane", true, "signer, lane and from agree");

    /* 3 · scope (R9·F1): touched paths inside the lane; harness-control paths never */
    const prefix = `lanes/${lane}/out/`;
    const laneFile = new RegExp("^lanes/" + escRe(lane) + "/out/[^/]+\\.md$");
    const bad = []; let why = "outside the lane";
    for (const p0 of list(msg.touchedPaths)) {
      const p = String(p0);
      const structural = p.indexOf("..") !== -1 || p.indexOf("\\") !== -1 || p.startsWith("/") || p.split("/").some((seg) => seg === "") || FORMAT_CHARS.test(p);
      if (structural) { bad.push(p); why = "path traversal or malformed path"; continue; }
      if (!pinned && TRUST_PATH.test(p)) { flags.trustRootEdited = true; notes.push("trust root lives in the transport: edit to " + p + " accepted"); continue; }
      if (HARNESS_PATH.test(p)) { bad.push(p); if (why !== "path traversal or malformed path") why = "harness-control path"; continue; }
      if (!laneFile.test(p)) bad.push(p);
    }
    if (!list(msg.touchedPaths).length) { bad.push("(no paths)"); }
    if (bad.length) {
      step("scope", false, why + ": " + bad.join(", ") + " (only " + prefix + "*.md)", "scope");
      return finish("refused", "scope");
    }
    step("scope", true, flags.trustRootEdited ? "trust-root edit accepted (root not pinned)" : "all paths are " + prefix + "*.md");

    /* 4 · bytes and header syntax (P§4.1, P§4.2 rules 1 and 5): malformed → logged only */
    const malformed = (why) => { step("syntax", false, why, "malformed"); return finish(null, "malformed"); };
    const keys = Object.keys(h);
    if (keys[0] !== "membrane") return malformed("membrane is not the first line");
    for (const k of REQUIRED) if (h[k] == null || h[k] === "" || (Array.isArray(h[k]) && !h[k].length)) return malformed("missing required field " + k);
    if (typeof h.from !== "string" || !IDENT.test(h.from)) return malformed("from fails the identifier grammar");
    if (list(h.to).some((t) => typeof t !== "string" || !IDENT.test(t))) return malformed("to fails the identifier grammar");
    if (!ACTS.includes(h.act)) return malformed("unknown act " + h.act);
    for (const k of ["at", "by", "expires"]) if (h[k] != null && (typeof h[k] !== "string" || !RFC3339Z.test(h[k]) || !realDate(h[k]))) return malformed(k + " is not a real RFC 3339 UTC time");
    for (const k of keys) {
      if (k === "membrane") continue;
      for (const v of list(h[k])) if (typeof v === "string" && FORMAT_CHARS.test(v)) return malformed("format or control character in " + k);
    }
    if (typeof msg.bodyText !== "string") return malformed("no body bytes");
    if (msg.bodyText.indexOf("\r") !== -1) return malformed("CR in body");
    if (h.body !== simHash(msg.bodyText)) return malformed("body hash does not match the bytes");
    if (h.turn != null && !(Number.isInteger(Number(h.turn)) && Number(h.turn) >= 0)) return malformed("turn is not an integer");
    const schemaWhy = schemaError(h);
    if (schemaWhy) return malformed(schemaWhy);
    if (h.form === "ask" && (!h.acceptance || !h.by)) return malformed("form ask needs acceptance and by");
    if ((h.act === "request" || h.act === "commit") && !h.by) return malformed(h.act + " needs by");
    if (["reply", "receipt", "cancel"].includes(h.form) && !h.re) return malformed("form " + h.form + " needs re");
    if (h.form === "receipt" && (!h.echo || (h.disposition != null) === (h.verdict != null))) return malformed("receipt needs echo and exactly one of disposition or verdict");
    let headerBytes = 0; try { headerBytes = utf8Bytes(JSON.stringify(h)); } catch (e) { headerBytes = HEADER_MAX + 1; }
    if (headerBytes > HEADER_MAX || utf8Bytes(msg.bodyText) > (ctx.bodyLimit || BODY_MAX)) { step("syntax", false, "header over 4 KB or body over the byte limit (signature and lane verified: refused with a receipt)", "size"); return finish("refused", "size"); }
    step("syntax", true, "header parses; body hash matches");

    /* 5 · version (Rev02·#21) */
    if (String(h.membrane) !== "0") { step("version", false, "membrane " + h.membrane + " unknown", "version"); return finish("refused", "version"); }
    step("version", true, "membrane 0");

    /* 6 · addressed (P§4.2 rule 8) */
    if (!list(h.to).includes(ctx.receiver)) { step("addressed", false, "to does not name " + ctx.receiver, "not-addressed"); return finish("refused", "not-addressed"); }
    if (isReceiptish(h) && ctx.sent && typeof ctx.sent.get === "function") {
      const sent = ctx.sent.get(h.re);
      if (!sent || (h.echo && sent !== h.echo)) { step("addressed", false, "receipt about a message never sent, or echo mismatch: logged and ignored"); return finish(null, null); }
    }
    step("addressed", true, "to names " + ctx.receiver);

    /* 7 · duplicate, id-reuse, stale (P§4.2 rule 7) */
    const key = h.from + "|" + h.id;
    const seen = ctx.seenIds && typeof ctx.seenIds.get === "function" ? ctx.seenIds.get(key) : null;
    if (seen && !(params.dedupReceipts === false && seen.body === h.body)) { // dedupReceipts off: a same-body resend is judged as new; id-reuse still refuses
      if (seen.body === h.body) {
        step("duplicate", false, "seen before with the same body: original receipt resent, nothing else", "duplicate");
        trace.originalReceipt = seen.receipt || null; trace.duplicate = true;
        trace.disposition = seen.disposition != null ? seen.disposition : null; trace.reason = "duplicate";
        trace.receiptOwed = !!seen.receiptOwed; trace.effect = seen.effect || "none"; trace.tier = TIER_OF[trace.effect];
        settle();
        return trace;
      }
      step("duplicate", false, "same from and id, different body", "id-reuse");
      return finish("refused", "id-reuse");
    }
    const at = ms(h.at);
    if (now - at > DEDUP_WINDOW_MS) { step("duplicate", false, "older than the 30-day dedup window", "stale"); return finish("refused", "stale"); }
    step("duplicate", true, seen ? "seen before with the same body; dedup off: judged as new" : "new id");

    /* 8 · clock (Rev02·#18) */
    const ahead = (at - now) / 60000;
    if (ahead > params.clockToleranceMin) { step("clock", false, `at is ${Math.round(ahead)} min ahead (tolerance ${params.clockToleranceMin})`, "clock"); return finish("refused", "clock"); }
    step("clock", true, ahead > 0 ? `${Math.round(ahead)} min ahead, within tolerance` : "not ahead");

    /* 9 · expiry and resend rule (P§6.1) */
    const expiresAt = h.expires ? ms(h.expires) : at + params.expiryHours * 3600e3;
    trace.expiresAt = expiresAt;
    const expiredCount = count(ctx.expiredBodies, h.body);
    const resendCap = { none: 1, once: 2, unlimited: Infinity }[params.resendPolicy] ?? 2;
    if (expiredCount >= resendCap) { step("expiry", false, `this body expired ${expiredCount}× already (resend policy ${params.resendPolicy})`, "expired-before"); return finish("refused", "expired-before"); }
    if (now > expiresAt) { step("expiry", false, "arrived after expires"); return finish("expired", null); }
    step("expiry", true, expiredCount ? "honest resend of an expired body: judged afresh" : "within expires");

    /* 10 · contract (P§4.2 rule 8) */
    const needsContract = h.act === "request" || h.act === "commit";
    const accepted = !!(h.contract && own(ctx.acceptedContracts, h.from) === h.contract);
    if (needsContract && !accepted) {
      if (params.requireContract) { step("contract", false, h.contract ? "contract hash not accepted with " + h.from : "no contract on a " + h.act, "contract-mismatch"); return finish("refused", "contract-mismatch"); }
      notes.push("requireContract off: " + h.act + " handled without a contract"); flags.noContract = true;
      step("contract", true, "no accepted contract; allowed by policy");
    } else step("contract", true, accepted ? "runs under an accepted contract" : "no contract needed: lowest tier");

    /* 11 · crit (P§4.2 rule 3) */
    const known = new Set([...KNOWN_EXT, ...list(ctx.extensions)]);
    const unknownExt = list(h.crit).filter((u) => { const x = String(u); return !(known.has(x) || (x.startsWith("urn:membrane:ext:") && known.has(x.slice(17)))); }); // full registered names only
    if (unknownExt.length) { step("crit", false, "unknown critical: " + unknownExt.join(", "), "unsupported-extension"); return finish("refused", "unsupported-extension"); }
    step("crit", true, list(h.crit).length ? "all critical extensions known" : "none");

    /* 12 · turn cap (R9·F2); receipts carry no turn */
    if (h.turn != null && !(h.act === "declare" && h.disposition != null) && Number(h.turn) > params.turnCap) { step("turn", false, `turn ${h.turn} over cap ${params.turnCap}`, "turn"); return finish("refused", "turn"); }
    step("turn", true, h.turn != null ? `turn ${h.turn} of ${params.turnCap}` : "no turn");

    /* 13 · rate (R9·§7) */
    const rate = count(ctx.rateToday, h.from);
    if (rate >= params.ratePerDay) { step("rate", false, `${rate} today, cap ${params.ratePerDay}`, "rate"); return finish("refused", "rate"); }
    step("rate", true, `${rate + 1} of ${params.ratePerDay} today`);

    /* 14 · pause (R9·§7) */
    if (ctx.paused) { step("paused", false, "owner-signed pause in force", "paused"); return finish("refused", "paused"); }
    step("paused", true, "no pause");

    /* 15 · seal (P§6.1): stored verbatim with its hash before any model reads it */
    trace.sealed = h.body;
    step("seal", true, "sealed " + h.body);

    /* 16 · effect class (P§6.2) */
    const eff = effectOf(msg, ctx, params);
    let effect = eff.effect;
    if (eff.raisedRead) notes.push("read raised to disclose: the answer draws on what the receiver holds");
    step("effect", true, `declared ${eff.declared}` + (eff.contract ? `, contract ${eff.contract}` : "") + ` → ${effect} (${TIER_OF[effect]})`);

    /* 17 · evidence path (P§6.3); relays never upgrade (S1·F10) */
    let evidenceHold = null, evidenceFact = false;
    if (h.act === "assert") {
      let kind = EVIDENCE_RANK[h.evidence] != null ? h.evidence : "synthesis";
      const declaredKind = kind;
      if (h.origin) {
        const originKind = (msg.origin && msg.origin.evidence) || (ctx.claims && ctx.claims.get && ctx.claims.get(h.origin) && ctx.claims.get(h.origin).evidence) || null;
        if (params.noUpgradeRelay) {
          const cap = originKind || "synthesis";
          if (EVIDENCE_RANK[kind] > EVIDENCE_RANK[cap]) { kind = cap; notes.push(`relay claimed ${declaredKind}; origin is ${originKind || "unverified"}: kept as ${cap}`); }
        } else if (originKind && EVIDENCE_RANK[kind] > EVIDENCE_RANK[originKind]) {
          flags.upgradedRelay = true; notes.push(`FAILURE: relay upgraded ${originKind} to ${kind} and it was taken at face value`);
        }
      }
      trace.evidence = kind;
      if (flags.upgradedRelay && (kind === "measured" || kind === "record" || kind === "reconciled")) {
        evidenceFact = true; step("evidence", true, "relayed " + kind + " label taken at face value (relays may upgrade)");
      } else if (kind === "measured") {
        if (ctx.measurements && h.measurement && list(ctx.measurements).includes(h.measurement)) { evidenceFact = true; step("evidence", true, "measured: receiver reruns the named measurement"); }
        else { evidenceHold = "second-signal"; step("evidence", false, "measurement not named by the contract: counts as synthesis"); }
      } else if (kind === "record") {
        if (msg.recordOk === true) { evidenceFact = true; step("evidence", true, "record: pointer opened by the quarantined reader, matches"); }
        else { evidenceHold = "owner"; step("evidence", false, msg.recordOk === false ? "record does not match the claim" : "record not yet opened by the quarantined reader: held"); }
      } else if (kind === "reconciled") {
        const signers = new Set(list(msg.sources).filter((s) => s && s.signer && s.signer !== h.from && s.sigValid !== false).map((s) => s.signer));
        if (signers.size >= 2) { evidenceFact = true; step("evidence", true, "reconciled: two independent signers"); }
        else if (msg.secondSignal) { evidenceFact = true; step("evidence", true, "sources not independent; second signal present"); }
        else { evidenceHold = "second-signal"; step("evidence", false, "sources not independent: counts as synthesis"); }
      } else if (kind === "synthesis") {
        if (msg.secondSignal || (ctx.secondSignals && ctx.secondSignals.has && ctx.secondSignals.has(h.id))) { evidenceFact = true; step("evidence", true, "synthesis with a second signal"); }
        else { evidenceHold = "second-signal"; step("evidence", false, "synthesis: held until a second signal"); }
      } else {
        evidenceHold = "owner"; step("evidence", false, "intention: held, never enters a slot for facts");
      }
    } else step("evidence", true, "not an assert");

    /* 18 · standing vs tier (P§9.4) */
    let standing = own(ctx.standing, h.from);
    if (!Object.prototype.hasOwnProperty.call(STANDING_RANK, standing)) standing = null;
    if (!standing) standing = params.newcomerLevel || "S0";
    trace.standing = standing;
    const sRank = STANDING_RANK[standing];
    const s0 = sRank === 0 && !(ctx.ownerSigned && ctx.ownerSigned.has && ctx.ownerSigned.has(h.body));
    if (s0) step("standing", false, "S0: nothing released without the owner");
    else step("standing", true, standing + (flags.unknownSigner ? " (unknown identifier at " + standing + ")" : ""));

    /* 19 · sensor (P§6.4): may raise a tier or hold; never lowers, never releases */
    const preEffect = effect;
    const scan = sensorHeuristic(msg, params.sensorStrictness);
    let sensorHold = false;
    if (scan.injection_suspected) {
      flags.patternFlag = true;
      const raised = TIER_EFFECT["T" + Math.min(4, Number(TIER_OF[effect].slice(1)) + 1)];
      if (EFFECTS.indexOf(raised) > EFFECTS.indexOf(effect)) { notes.push(`pattern flag (${scan.signals.join(", ")}): tier raised to ${TIER_OF[raised]}`); effect = raised; }
    }
    const patternEffect = effect;
    if (typeof ctx.sensor === "function") {
      let label = null;
      try { label = ctx.sensor(msg, params.sensorStrictness); } catch (e) { label = null; notes.push("sensor failed: treated as flagged"); label = { impact: "medium", reach: "beyond", asks_for_action: true, injection_suspected: true }; }
      trace.sensor = label;
      if (label) {
        if (label.impact === "high" && EFFECTS.indexOf(effect) < EFFECTS.indexOf("boundary")) { effect = "boundary"; notes.push("sensor impact high: tier raised to T3"); }
        if ((label.injection_suspected || scan.injection_suspected) && label.reach === "beyond" && (IMPACT_RANK[label.impact] || 0) >= 2) sensorHold = true;
        step("sensor", !sensorHold, `impact ${label.impact}, reach ${label.reach}` + (label.injection_suspected ? ", injection suspected" : "") + (sensorHold ? ": hold" : ""));
      } else step("sensor", true, "no label");
    } else step("sensor", !scan.injection_suspected, scan.injection_suspected ? "pattern flag logged; no sensor to confirm reach" : "pattern scan clean");
    trace.effect = effect; trace.tier = TIER_OF[effect];

    /* 20 · release rule by tier (P§6.2), judged at every tier the message passed through: pre-sensor, pattern-raised, sensor-raised (final).
       The strictest outcome wins (refuse > hold for owner > hold for a signal > admit), so the sensor can only tighten (P§6.4). */
    const tier = trace.tier;
    const ownerSigned = !!(ctx.ownerSigned && ctx.ownerSigned.has && ctx.ownerSigned.has(h.body));
    const second = !!(msg.secondSignal || (ctx.secondSignals && ctx.secondSignals.has && ctx.secondSignals.has(h.id)));
    const releaseAt = (t) => {
      const r = { tier: t, hold: null, refuse: null, note: "", answerScope: null, privileged: false };
      if (s0) { r.hold = "owner"; r.note = "S0 sender: held for the owner"; }
      else if (t === "T0") r.note = "T0: the gate releases";
      else if (t === "T1") {
        if (h.act === "request") {
          const outside = list(msg.reads).filter((p) => !list(ctx.shareable).some((x) => String(p).startsWith(x)));
          if (params.quarantinedAnswer) {
            if (outside.length) { r.hold = "owner"; r.note = "T1 outside shareable data: the owner decides"; }
            else { r.answerScope = "shareable"; r.note = "T1: answered by a quarantined run over shareable data"; }
          } else { r.answerScope = "privileged"; r.privileged = true; r.note = "T1 released to the privileged agent, memory loaded"; }
        } else if (accepted || (h.contract == null && sRank >= 1)) r.note = "T1: released under contract";
        else { r.hold = "owner"; r.note = "T1 without a contract: the owner decides"; }
      } else if (t === "T2") {
        const cap = msg.capability && list(own(ctx.capabilities, h.from)).includes(msg.capability);
        if (sRank >= 2 && cap) r.note = "T2: valid capability";
        else { r.refuse = "effect-exceeds-tier"; r.note = sRank < 2 ? "T2 needs S2" : "T2 needs a valid capability"; }
      } else if (t === "T3") {
        if (second) r.note = "T3: second independent signal present";
        else { r.hold = "second-signal"; r.note = "T3: held for a second independent signal"; }
      } else if (t === "T4") {
        if (ownerSigned) r.note = "T4: owner signed over the sealed hash";
        else { r.hold = "owner"; r.note = "T4: owner only"; }
      }
      return r;
    };
    const severity = (r) => (r.refuse ? 3 : r.hold === "owner" ? 2 : r.hold ? 1 : 0);
    const preTier = TIER_OF[preEffect];
    const checkpoints = [preTier, TIER_OF[patternEffect], tier].filter((t, i, a) => a.indexOf(t) === i);
    const pre = releaseAt(preTier);
    let chosen = pre;
    for (const t of checkpoints.slice(1)) {
      const r = releaseAt(t);
      if (r.refuse && !pre.refuse) { r.refuse = "policy"; r.note += " (tier raised by the " + (t === TIER_OF[patternEffect] && t !== tier ? "pattern flag" : "sensor") + ")"; }
      if (severity(r) > severity(chosen)) chosen = r; // ties keep the earlier checkpoint and its reason
    }
    if (checkpoints.length > 1 && chosen.tier !== tier) notes.push(`judged at ${checkpoints.join(", ")}: the strictest outcome (at ${chosen.tier}) stands`);
    let hold = chosen.hold, refuse = chosen.refuse, releaseNote = chosen.note;
    if (chosen.answerScope) trace.answerScope = chosen.answerScope;
    if (chosen.privileged) { flags.privilegedAnswer = true; notes.push("FAILURE risk: answer drawn with memory in context"); }
    trace.effect = chosen.tier === tier ? effect : chosen.tier === TIER_OF[patternEffect] ? patternEffect : preEffect; trace.tier = chosen.tier;
    if (!refuse && evidenceHold && severity({ hold: evidenceHold }) > severity({ hold })) { hold = evidenceHold; releaseNote += "; evidence path holds"; }
    if (!refuse && sensorHold) { hold = "owner"; releaseNote += "; sensor hold"; }

    /* 21 · hold budget (Rev02·#17) */
    if (hold && !refuse) {
      const n = count(ctx.holdsToday, h.from);
      if (params.holdBudget > 0 && n >= params.holdBudget) {
        step("budget", false, `${n} holds today, budget ${params.holdBudget}`, "hold-budget");
        steps.push({ id: "release", label: STEPS.release.label, ok: false, code: "hold-budget", note: releaseNote, ref: "tier." + trace.tier });
        return finish("refused", "hold-budget");
      }
      step("budget", true, params.holdBudget > 0 ? `hold ${n + 1} of ${params.holdBudget}` : "budget off: unlimited holds");
    }

    const rs = { id: "release", label: STEPS.release.label, ok: !hold && !refuse, note: releaseNote, ref: "tier." + trace.tier };
    if (refuse) { rs.code = refuse; steps.push(rs); return finish("refused", refuse); }
    if (hold) {
      const code = sensorHold ? "policy" : hold === "second-signal" ? "awaiting-signal" : "awaiting-owner";
      rs.code = code; steps.push(rs);
      trace.awaiting = hold;
      return finish("held", code);
    }
    if (h.act === "request" && !trace.answerScope) {
      trace.answerScope = params.quarantinedAnswer ? "shareable" : "privileged";
      if (!params.quarantinedAnswer) { flags.privilegedAnswer = true; notes.push("FAILURE risk: answer drawn with memory in context"); }
    }
    steps.push(rs);
    trace.releaseBy = trace.tier === "T4" ? "owner" : trace.tier === "T3" ? "second-signal" : "gate";
    trace.admittedAs = h.act === "assert" ? (evidenceFact ? "fact" : "claim") : h.act === "request" ? "proposal" : h.act === "commit" ? "commitment" : "declaration";
    if (flags.upgradedRelay && evidenceFact) notes.push("FAILURE: a relayed intention entered memory as fact");
    return finish("admitted", null);
  }

  root.Gate = { evaluate, defaults, canonicalHash: simHash, simHash, sensorHeuristic, effectOf, pageDecision, STEPS, TIER_OF, EFFECTS };
})(typeof window !== "undefined" ? window : globalThis);
