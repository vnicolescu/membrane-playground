#!/usr/bin/env node
/* Runner for the gate test vectors (format membrane-test-vectors/0). No dependencies.
   Loads spec.js, gate.js and sim.js as the page does, converts each step as test-vectors/README.md
   sets out, calls the gate, and compares only the keys present in `expect`.

     node test-vectors/run.js            summary and every mismatch
     node test-vectors/run.js --jsonl    one JSON line per step on stdout (append it to a trail)

   Exit code 1 when a current vector fails. A proposed vector that fails is reported apart and does not fail the run. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const { execSync } = require("child_process");

const here = __dirname, rootDir = path.join(here, "..");
const jsonl = process.argv.includes("--jsonl");

/* the page's scripts, in a sandbox that stands in for the browser window */
const noop = () => {};
const sandbox = { console, Date, Math, JSON, Map, Set, RegExp, Number, String, Object, Array, CustomEvent: function () {},
  document: { addEventListener: noop, dispatchEvent: noop, createElement: () => ({}), hidden: true } };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(rootDir, f), "utf8"), sandbox, { filename: f });
load("spec.js"); load("gate.js");
let simError = null;
try { load("sim.js"); } catch (e) { simError = e; }
const Gate = sandbox.Gate, Sim = sandbox.SimEngine;

let commit = "unknown";
try { commit = execSync("git rev-parse --short HEAD", { cwd: rootDir, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch (e) {}

/* README conversion rules 1 to 7 */
const HASH = "$hash:";
function resolve(v, bodyText) {
  if (typeof v === "string") return v === "$body" ? Gate.simHash(bodyText) : v.startsWith(HASH) ? Gate.simHash(v.slice(HASH.length)) : v;
  if (Array.isArray(v)) return v.map((x) => resolve(x, bodyText));
  if (v && typeof v === "object") { const o = {}; for (const k of Object.keys(v)) o[resolve(k, bodyText)] = resolve(v[k], bodyText); return o; }
  return v;
}
function toCtx(raw) {
  const c = resolve(raw, "");
  if (typeof c.now === "string") c.now = Date.parse(c.now);
  c.seenIds = new Map(Object.entries(c.seenIds || {}));
  c.expiredBodies = new Map(Object.entries(c.expiredBodies || {}));
  c.ownerSigned = new Set(c.ownerSigned || []);
  c.secondSignals = new Set(c.secondSignals || []);
  if (c.sensor === "heuristic") c.sensor = (m, s) => Gate.sensorHeuristic(m, s);
  else delete c.sensor;
  return c;
}
const plain = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
const same = (a, b) => JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") { const o = {}; Object.keys(v).sort().forEach((k) => { o[k] = sortKeys(v[k]); }); return o; }
  return v;
}

/* compare: only the keys present in expect */
function compare(expect, got, call) {
  const miss = [];
  const want = (k, w, g) => { if (!same(w, g)) miss.push({ key: k, want: w, got: g }); };
  for (const k of Object.keys(expect)) {
    const w = expect[k];
    if (call === "engine") {
      if (k === "tension") want(k, w, !!got.tension);
      else if (k === "suspectAtSet") want(k, w, got.suspectAt != null);
      else if (k === "pagesAtMost") { if (!(got.pages <= w)) miss.push({ key: k, want: w, got: got.pages }); }
      else if (k === "pagesMoreThan") { if (!(got.pages > w)) miss.push({ key: k, want: w, got: got.pages }); }
      else miss.push({ key: k, want: w, got: "(key not understood by the runner)" });
    } else if (k === "flags") { for (const f of Object.keys(w)) want("flags." + f, w[f], !!(got.flags && got.flags[f])); }
    else if (k === "sensorIsNull") want(k, w, got.sensor == null);
    else want(k, w, plain(got[k]));
  }
  return miss;
}

function runStep(vec, step) {
  const params = Object.assign({}, vec.params || {}, step.params || {});
  if (step.call === "engine") {
    if (!Sim) throw new Error("sim.js did not load" + (simError ? ": " + simError.message : ""));
    const e = new Sim.Engine(step.scenario, params, 1);
    let n = 0; while (!e.done && n++ < 20000) e.step();
    return { tension: e.tension, suspectAt: e.flags.suspectAt, pages: e.metrics.pages, verdict: e.verdict };
  }
  const msg = resolve(step.msg, step.msg.bodyText), ctx = toCtx(step.ctx);
  if (step.call === "pageDecision") return Gate.pageDecision(msg, ctx, Object.assign(Gate.defaults(), params));
  return Gate.evaluate(msg, ctx, params);
}

const index = JSON.parse(fs.readFileSync(path.join(here, "index.json"), "utf8"));
const rows = [];
for (const file of index.files) {
  const set = JSON.parse(fs.readFileSync(path.join(here, file), "utf8"));
  for (const vec of set.vectors) {
    vec.steps.forEach((step, i) => {
      const row = { vector: vec.id, step: i + 1, label: step.label, category: vec.category, kind: vec.kind, proposed: vec.status === "proposed", basis: vec.basis, call: step.call, want: step.expect, commit };
      try { const got = runStep(vec, step); row.miss = compare(resolve(step.expect, step.msg ? step.msg.bodyText : ""), got, step.call); row.ok = row.miss.length === 0; }
      catch (e) { row.ok = false; row.error = String(e && e.message || e); row.miss = []; }
      rows.push(row);
    });
  }
}

if (jsonl) {
  for (const r of rows) console.log(JSON.stringify({ vector: r.vector, step: r.step, category: r.category, basis: r.basis, call: r.call, want: r.want, mismatches: r.miss, error: r.error || null, ok: r.ok, proposed: r.proposed, commit: r.commit }));
} else {
  const total = rows.length;
  const line = (label, set) => { const ok = set.filter((r) => r.ok).length; console.log(`${label}: ${set.length} of ${set.length} run, ${ok} of ${set.length} passed`); };
  console.log(`membrane test vectors · contract ${sandbox.MEMBRANE.version} · commit ${commit}`);
  line(`all steps (${total} in the set)`, rows);
  line("current vectors", rows.filter((r) => !r.proposed));
  line("proposed vectors (reported apart)", rows.filter((r) => r.proposed));
  for (const cat of Object.keys(index.categories)) line("  " + cat, rows.filter((r) => r.category === cat));
  const bad = rows.filter((r) => !r.ok);
  if (bad.length) console.log("\nmismatches:");
  for (const r of bad) {
    console.log(`  ${r.vector} step ${r.step} [${r.category}${r.proposed ? ", proposed" : ""}] ${r.label}`);
    if (r.error) console.log("    error: " + r.error);
    for (const m of r.miss) console.log(`    ${m.key}: want ${JSON.stringify(m.want)}, got ${JSON.stringify(m.got)}`);
  }
}
process.exitCode = rows.some((r) => !r.ok && !r.proposed) ? 1 : 0;
