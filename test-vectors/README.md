# Membrane gate test vectors (contract 0.3-draft)

*For `vnicolescu/membrane-playground`, commit `2ca3d45`. A conformance set for `Gate.evaluate` and `Gate.pageDecision`: for each of the 13 scenarios, a `pass` vector under default params; for each existing `break` in `spec.js`, a `break` vector; for the four breaking rules proposed in `docs/proposals/scenarios-breaking-rules.md`, a `proposed-break` vector; and three `extra` vectors for checks the gate does not make yet. 29 vectors, 54 steps, in four categories. Table: `vectors-summary.md`.*

**Basis.** Every vector was written with `"basis": "read"`: the expected outcomes were derived by reading `gate.js`, `sim.js` and `spec.js` as text and tracing each envelope through the 21 steps by hand, against a hand-written step-order table. Of the 52 `gate`-layer steps, 50 match today's `gate.js` by that trace and 2 match only the proposed knobs (`lost-receipt.break.dedupReceipts` step 2, `authority-spoof.break.laneBound` step 1); the 2 `engine` steps cannot be traced from `gate.js`. The authors did not execute the repository's code when writing the set, so a vector that disagrees with the real gate is more likely a reading error than a gate bug until shown otherwise. The set has since been run here: see "Running the set". D11 ("An unaffiliated implementer passes the test vectors against both agents") is where a set like this would end up being used.

---

## Files

| File | Contents |
|---|---|
| `index.json` | format id, contract, commit, `T0`, token rules, `ctx` type rules, the list of scenario files |
| `<scenario>.json` (13) | `{ scenario, basis, vectors: [...] }`, one file per `spec.js` scenario id |
| `known-gaps.json` | `env.state` unchecked, a capability used twice, a capability presented by the wrong agent |
| `vectors-summary.md` | one row per vector: kind, layer, params, expected outcome and decisive step per step |

## A vector

```json
{
  "id": "lost-receipt.pass",
  "scenario": "lost-receipt",
  "kind": "pass | break | proposed-break | extra",
  "category": "accept | reject-code | adversarial | known-gap",
  "basis": "read",
  "layer": "gate | sim",
  "status": "proposed",            // only on vectors that need a change in the repo
  "title": "...", "clause": "spec items it tests",
  "params": { },                    // merged over Gate.defaults()
  "refs": ["P§4.2"],
  "steps": [ { "label", "call", "ctx", "msg", "expect", "params"? } ],
  "notes": "...", "confirm": ["..."]
}
```

## Categories

*Proposed:* the layout sorts every test into four kinds. Here they are mapped onto `Gate.evaluate`:

| Category | What the vector asserts | Count |
|---|---|---|
| `accept` | the envelope is admitted (or paged) as stated: the clean path still works | 6 |
| `reject-code` | the envelope is refused, held, expired or logged **with this exact reason code** and decisive step, not merely "not admitted" | 10 |
| `adversarial` | a hostile sender's attempt (`trust-root`, `hold-flood`, `exfiltration`, `authority-spoof`) is stopped with the exact code; the `break` vectors in this category show it getting through with the rule off | 7 |
| `known-gap` | something the gate does not do yet, written as today's behaviour so it flips visibly when fixed: `env.state` is not checked (`known-gaps.state-unchecked`), the four scenarios with `break` set to null (`happy`, `lost-receipt`, `authority-spoof`, `escalation`, as their `proposed-break` vectors), and capability reuse (`known-gaps.capability-reuse`, see "Grants" below) | 6 |

A `break` vector keeps the category of its scenario's `pass` vector; `kind` says the knob is off. *(Confirm: or give break vectors a category of their own.)*

**Release rule for the set** (after fovea's critical eval hard gate, below): an `adversarial` or `reject-code` failure blocks a gate change, whatever the other vectors score. A failing `known-gap` vector is news, not a block: it means the gap was closed and the vector should move to `reject-code`.

**Grants.** *Proposed:* every grant is single-use and non-transferable, which is Membrane's no-passthrough (`spec.js:254`) rule applied to capabilities. Read as text, `gate.js` already makes a T2 capability non-transferable (it is looked up under `ctx.capabilities[from]`; `known-gaps.capability-transfer` is the `reject-code` check), but does not consume it, so the same capability works twice (`known-gaps.capability-reuse`, a `known-gap`).

**Steps are independent.** The gate is pure, so each step states the full receiver `ctx` it is judged against. Where a step depends on an earlier one (a resend, a hold already charged, a swapped contract), the `ctx` already holds that state, written the way `sim.js` stores it (`seenIds` entry `{ body, disposition, receiptOwed, effect, receipt }`, `holdsToday`, `rateToday`, `expiredBodies`). A runner needs no engine for `gate`-layer steps.

**`call`:**

- `"evaluate"`: `Gate.evaluate(msg, ctx, params)` (`gate.js:201`), compare the trace.
- `"pageDecision"`: `Gate.pageDecision(msg, ctx, params)` (`gate.js:185`), compare `{ page, level }`.
- `"engine"`: a sim-layer check. Construct the playground's simulation engine (`SimEngine.Engine`, `sim.js:466`) with the scenario, the params and a seed, run it to the end, and compare the verdict fields named in `expect` (`tension`, `suspectAtSet`, meaning the engine's suspect-at flag has been set, `pagesAtMost` / `pagesMoreThan` against the engine's page count). Two steps use it, both in `escalation`, because the ladder lives in `SCRIPTS.escalation`, not in `gate.js`.

**JSON encoding: a runner must convert before calling the gate.** JSON has no `Map`, `Set`, function or millisecond clock, and the hashes depend on the gate's own hash function, so the vectors store some `ctx` and `msg` values in an encoded form. Passing a step's `ctx` or `msg` to `Gate.evaluate` unconverted gives wrong results: for example the duplicate lookup would find nothing, so every duplicate would read as new. Apply these rules, in this order, to every step:

1. **Tokens, everywhere, recursively, in keys and in values** (`msg`, `ctx`, `expect.originalReceipt`): the token `$body` stands for the gate's hash of the message's body text (only the header's `body` uses it), and any string that starts with `$hash:` stands for the gate's hash of the text after that prefix. The hash helper is `Gate.simHash` (`gate.js:519`). These tokens are used for contract hashes, `echo`, the stored body in `seenIds`, and as `expiredBodies` keys.
2. **`ctx.now`**: stored as an ISO 8601 UTC string; convert it to milliseconds since the epoch, because the gate subtracts header times from it in milliseconds. Header times (`at`, `by`, `expires`) stay strings, as on the wire.
3. **`ctx.seenIds`**: stored as a JSON object keyed by sender and id joined with a bar; convert it to a Map, because the gate looks entries up with Map access.
4. **`ctx.expiredBodies`**: stored as a JSON object keyed by the resolved body hash; convert it to a Map.
5. **`ctx.ownerSigned` and `ctx.secondSignals`**: stored as JSON arrays; convert each to a Set, because the gate tests membership.
6. **`ctx.sensor`**: the string `heuristic` means the receiver uses the gate's built-in heuristic sensor (`Gate.sensorHeuristic`, `gate.js:132`) as its sensor function. If the key is absent, leave it absent: there is no sensor function.
7. **Everything else stays a plain object or array** (`acceptedContracts`, `contractEffects`, `standing`, `holdsToday`, `rateToday`, `ceiling`, `interruptsThisWeek`, `capabilities`, `shareable`, `measurements`): the gate's lookup helper accepts plain objects and Maps alike. `trustRoot.keys` and `trustRoot.transportKeys` must be plain objects: the signature step copies them into a plain object without that helper (`gate.js:231–233`), so a Map there would read as empty.
8. **Params**: `Gate.evaluate` fills in the defaults itself, so pass the vector's params with the step's params laid over them. `Gate.pageDecision` (`gate.js:185`) does not fill in defaults, so pass the defaults (`Gate.defaults`, `gate.js:118`) with the vector's and then the step's params laid over them.

The runner described below applies rules 1 to 7. When `canonicalHash` becomes a real SHA-256, only rule 1's hash function changes; the vectors stay as they are.

**`expect`** is a subset of the trace. Compare only the keys present:

| Key | Compared with |
|---|---|
| `disposition`, `reason`, `decisiveStep`, `tier`, `awaiting`, `admittedAs`, `answerScope`, `evidence`, `standing`, `receiptOwed`, `duplicate` | the trace field of the same name (`null` means `null`) |
| `originalReceipt` | deep-equal after token resolution |
| `flags` | each named flag, absent read as `false` |
| `sensorIsNull` | whether the trace's sensor field is empty (no model or sensor read it) |
| `page`, `level` | the `pageDecision` result |

**Agent ids** are the scenario casts from `spec.js`, except that the second agent in `happy`, `receipt-loop`, `laundering`, `owner-away` and `escalation` is written `partner`. The gate only needs the ids to be consistent, so any id works. *(Confirm: substitute the cast id if you want the vectors to read like the scenarios.)*

Bodies are paraphrased from `SCRIPTS` where the script text names people or things outside the protocol; the paraphrase keeps the words the sensor heuristic reacts to (or doesn't), so the trace is the same. *(Confirm.)*

---

## Running the set

`run.js` is the runner the sketch below describes. It needs Node and nothing else.

```bash
node test-vectors/run.js
```

It loads `spec.js`, `gate.js` and `sim.js` the way the page does, applies conversion rules 1 to 7 above, calls the gate for every step, and compares only the keys in `expect`. Engine steps build the simulation engine with seed 1 and run it to the end. `--jsonl` prints one JSON line per step, for a trail. The exit code is 1 when a current vector fails. A failing proposed vector is listed apart and does not fail the run.

First run, 3 Oct 2026, against the gate at `2ca3d45`:

```
all steps: 54 of 54 run, 51 of 54 passed
current vectors: 46 of 46 run, 46 of 46 passed
proposed vectors: 8 of 8 run, 5 of 8 passed
```

The three failures are the ones this file predicts: `lost-receipt.break.dedupReceipts` step 2 and `authority-spoof.break.laneBound` step 1 return today's outcome because the knobs do not exist yet, and `escalation.break.ladderStops` needs the R5 script change. Every vector the run confirmed now carries `"basis": "run"`. The three that wait for a change keep `"basis": "read"`.

## Wiring it in (the original sketch)

`spec.js` is the single source of truth and holds no code paths, so the smallest change is to **name the set in `spec.js`** and keep the runner outside it.

**1. Register the set in `spec.js`.** As data only, next to `scenarios`: a small entry naming the vector format, the folder, the index file and the basis, with a reference to D11. Each scenario could also list the ids of its own vectors, so the drawer can show them.

**2. A runner** (a separate file loaded after `gate.js`, or under Node). In plain terms it does four things for each vector. It resolves the `$body` and `$hash:` tokens by hashing the given text with the gate's own hash helper. It turns the JSON `ctx` into the types the gate expects, as set out in the conversion rules above. For each step it calls `evaluate` or `pageDecision` with the vector's params merged over the step's; for `pageDecision` the runner merges the defaults itself, because that function does not. It then compares every key in `expect` against the trace, reading `flags` as booleans and `sensorIsNull` as whether the sensor label is empty, and records each mismatch with its step number. Comparing `originalReceipt` needs a deep-equal, not a string comparison. Engine steps are handled as described next.

**Engine steps:** construct the playground's simulation engine for the step's scenario with the merged params and seed 1, step it until it reports done, then read its tension flag, its suspect-at flag and its page count. *(Confirm: seed 1 is arbitrary; the escalation script draws nothing random that the verdict depends on, as far as the text shows.)*

**Result trail (JSONL).** *Proposed:* write one JSON line per step to an append-only trail, never rewritten, carrying the vector id, step number, category, basis, call, the wanted and the observed values, whether it passed, and the commit it ran against. A run can then be diffed against the last one, and nobody has to trust a summary.

**Counts carry their denominator.** After llm-autobench, which prints how many rows were actually judged beside every aggregate: report "n of N run, m of n passed", never a bare pass rate. Today that line reads: written from reading the code; later, 52 of the 54 steps were checked against `gate.js` in a sealed sandbox (50 as written, the 2 proposed ones show today's behaviour), and the 2 engine steps weren't run.

**3. Where to show it.** A line in the drawer or the decisions view (D11): "29 vectors: n of 29 run, m of n pass", with `status: "proposed"` vectors reported apart, because three of the four fail against `2ca3d45` until the knobs in `docs/proposals/scenarios-breaking-rules.md` (and the R5 script change) exist; `happy.break.cumulativeAck` uses an existing knob and passes today. Without the new params the gate ignores `dedupReceipts` and `laneBound` and returns the `pass` outcome, so a failing proposed vector is the expected state, not a regression.

## Keeping it honest

- When a vector disagrees with the gate, check the reading first: the `notes` say which branch of which step it expects.
- Each vector is a fixed case and `Gate.evaluate` is a pure function over it: the same shape as legal-ai-eval-lab's typed fixtures scored by pure functions, where precomputed inputs stop a live model changing the result between runs.
- When a vector is confirmed against the real gate, change its `basis` from `"read"` to `"run"` (and record the commit). *(Confirm: field name and value.)*
- Scenario bodies in `sim.js` can drift from the vectors. The vectors fix one draw of anything random (the clock-skew stamp is 20 min ahead; the sim draws 17 to 22).

## Related public work

These are public repositories of ours whose rules the layout above draws on. All four are public on GitHub (checked 2 Oct 2026).

- **[fovea](https://github.com/salahuddinuqaili/fovea)** (Apache-2.0): approvals bind an exact action hash and the requester cannot self-approve; policies intersect, never union; a critical security eval failure blocks the release ("You cannot average it away"). Here: the release rule for the set.
- **[llm-autobench](https://github.com/salahuddinuqaili/llm-autobench)** (MIT): a zero-cost harness that benches local Ollama models on a 12 GB card, for deciding whether a local model is worth keeping, "not to crown a winner"; it shows judged coverage `n/N` beside every aggregate. Here: "n of N run" beside every count.
- **[legal-ai-eval-lab](https://github.com/salahuddinuqaili/legal-ai-eval-lab)**: verdicts `Pass`, `Review required`, `Blocked`; scoring by testable pure functions over committed fixtures; a permission-boundary failure mode ("Was access eligibility enforced before evidence was retrieved?"). Here: fixed cases, pure scoring; `exfiltration` is the permission-boundary case.
- **[bar-loop](https://github.com/salahuddinuqaili/bar-loop)** (code MIT, docs CC BY 4.0): six pass/fail gates checked before any quality comparison, among them confidentiality and data boundary, privilege, and conflicts and matter clearance (information barriers). Here: hard gates are checked first and never averaged.
