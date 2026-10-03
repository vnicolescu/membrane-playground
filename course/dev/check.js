#!/usr/bin/env node
/* Lesson checker. Loads spec.js, gate.js and course/scenario.js as the page does, then every course/lessons/*.js,
   and checks two things:
     1. every lesson object has the fields the renderer needs, and every block has a known type;
     2. every `gate` block (its preset and each variant) runs through the real Gate and matches its `expect`.

     node course/dev/check.js            summary and every mismatch
     node course/dev/check.js --verbose  also prints each gate case and its trace summary

   Exit code 1 on any mismatch or schema error. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const here = __dirname, courseDir = path.join(here, ".."), rootDir = path.join(courseDir, "..");
const verbose = process.argv.includes("--verbose");

const noop = () => {};
const sandbox = { console, Date, Math, JSON, Map, Set, RegExp, Number, String, Object, Array, CustomEvent: function () {},
  document: { addEventListener: noop, dispatchEvent: noop, createElement: () => ({}), hidden: true } };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
const lessons = [], parts = [], widgets = [];
sandbox.Course = { lesson: (o) => lessons.push(o), parts: (p) => parts.push(...p), widget: (name) => widgets.push(name) };
vm.createContext(sandbox);
const load = (f) => vm.runInContext(fs.readFileSync(f, "utf8"), sandbox, { filename: path.relative(rootDir, f) });
load(path.join(rootDir, "spec.js")); load(path.join(rootDir, "gate.js")); load(path.join(courseDir, "scenario.js"));
const files = fs.readdirSync(path.join(courseDir, "lessons")).filter((f) => f.endsWith(".js")).sort();
for (const f of files) {
  try { load(path.join(courseDir, "lessons", f)); }
  catch (e) { console.error("LOAD ERROR " + f + ": " + e.message); process.exitCode = 1; }
}
const S = sandbox.Scenario, M = sandbox.MEMBRANE;

const BLOCKS = new Set(["p", "h", "list", "callout", "wire", "code", "table", "quiz", "sort", "steps", "machine", "gate", "widget", "figure", "takeaways", "deeper", "tutor", "define", "compare"]);
const itemIds = new Set(); M.groups.forEach((g) => g.items.forEach((i) => itemIds.add(i.id)));
M.laws.forEach((l) => itemIds.add(l.id));
let errors = 0, cases = 0, ok = 0;
const err = (where, msg) => { errors++; console.log("  ✕ " + where + ": " + msg); };

const seen = new Set();
for (const L of lessons) {
  const where = "lesson " + (L.id || "?");
  for (const k of ["id", "part", "title", "blocks"]) if (L[k] == null) err(where, "missing " + k);
  if (seen.has(L.id)) err(where, "duplicate id"); seen.add(L.id);
  if (L.id && !/^[a-z0-9-]+$/.test(L.id)) err(where, "id must be lowercase letters, digits and dashes (it is the URL #anchor)");
  if (parts.length && !parts.some((p) => p.id === L.part)) err(where, "part " + L.part + " is not in Course.parts");
  (L.blocks || []).forEach((b, i) => {
    const w = where + " block " + i + " (" + b.t + ")";
    if (!BLOCKS.has(b.t)) return err(w, "unknown block type");
    if (b.t === "quiz" && !(Array.isArray(b.options) && Number.isInteger(b.answer) && b.answer >= 0 && b.answer < b.options.length)) err(w, "quiz needs options and an answer index inside them");
    if (b.t === "sort") (b.items || []).forEach((it) => { if (!(b.buckets || []).some((x) => x.id === it.bucket)) err(w, "item '" + it.text + "' names unknown bucket " + it.bucket); });
    if (b.t === "machine") (b.edges || []).forEach((e) => { if (!(b.states || []).some((s) => s.id === e.from) || !(b.states || []).some((s) => s.id === e.to)) err(w, "edge " + e.from + "→" + e.to + " names an unknown state"); });
    // inline {{item}} terms must exist in spec.js
    const text = JSON.stringify(b);
    for (const m of text.matchAll(/\{\{([^}|]+)(\|[^}]*)?\}\}/g)) if (!itemIds.has(m[1].trim())) err(w, "unknown spec item {{" + m[1] + "}}");
    if (b.t === "gate") {
      const runCase = (label, d, expect) => {
        cases++;
        let r;
        try { r = S.run(d); } catch (e) { return err(w + " · " + label, "run threw: " + e.message); }
        const got = r.page || r.trace;
        if (verbose) console.log("    · " + L.id + " · " + label + " → " + (r.page ? JSON.stringify(r.page) : (got.disposition || "logged only") + (got.reason ? " (" + got.reason + ")" : "") + " at " + got.decisiveStep + ", " + got.tier));
        if (!expect) return err(w + " · " + label, "no expect: every gate case states what the gate will do");
        if (r.trace && expect.tier && !r.trace.steps.some((st) => st.id === "effect")) err(w + " · " + label, "expects tier " + expect.tier + " but the message stops at " + r.trace.decisiveStep + ", before step 16 computes a tier; expect `tier: null` or drop it");
        const exp2 = Object.assign({}, expect); if (r.trace && exp2.tier === null) { delete exp2.tier; if (r.trace.steps.some((st) => st.id === "effect")) err(w + " · " + label, "expects no tier but step 16 ran"); }
        const miss = S.check(r, exp2);
        if (miss.length) err(w + " · " + label, miss.map((x) => x.key + " want " + JSON.stringify(x.want) + " got " + JSON.stringify(x.got)).join("; "));
        else ok++;
      };
      runCase("preset", b.preset || {}, b.expect);
      (b.variants || []).forEach((v) => runCase(v.label || "variant", S.merge(b.preset || {}, v.change || {}), v.expect));
      const DIMS = ["disposition", "tier", "reason", "decisiveStep", "receiptOwed", "admittedAs", "standing", "awaiting", "answerScope", "page", "level"];
      if (Array.isArray(b.predict)) b.predict.forEach((d) => { if (!DIMS.includes(d)) err(w, "predict names an unknown dimension " + d + " (allowed: " + DIMS.join(", ") + ")"); });
      (b.goals || []).forEach((g, gi) => {
        const gw = w + " · goal " + (gi + 1);
        if (!g.text || !g.want) return err(gw, "a goal needs text and want");
        if (!g.solution) return err(gw, "a goal needs a solution (a descriptor patch on the preset) that proves it can be reached");
        cases++;
        let r; try { r = S.run(S.merge(b.preset || {}, g.solution)); } catch (e) { return err(gw, "solution threw: " + e.message); }
        const miss = S.check(r, g.want);
        if (miss.length) err(gw, "the solution does not reach the goal: " + miss.map((x) => x.key + " want " + JSON.stringify(x.want) + " got " + JSON.stringify(x.got)).join("; "));
        else { ok++; const pre = S.check(S.run(b.preset || {}), g.want); if (!pre.length) err(gw, "the preset already meets this goal, so the reader has nothing to make"); }
      });
    }
  });
}
console.log(`lessons: ${lessons.length} in ${files.length} files · parts: ${parts.length} · widgets named: ${new Set(lessons.flatMap((L) => (L.blocks || []).filter((b) => b.t === "widget" || b.t === "figure").map((b) => b.name))).size}`);
console.log(`gate cases: ${cases} run, ${ok} matched their expect · schema and gate errors: ${errors}`);
if (errors) process.exitCode = 1;
