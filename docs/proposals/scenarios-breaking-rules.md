# Breaking rules for the four open scenarios: proposals

*For `spec.js` → `scenarios`, contract 0.3-draft, commit `2ca3d45`. The README says each scenario names "the single rule that, switched off, makes it fail". Four have `break: null`: `happy`, `lost-receipt`, `authority-spoof` and `escalation`. The view then shows "No single rule to switch off". Below is one proposal for each, in the repo's own format.*

*How these were checked: by reading `spec.js`, `gate.js` and `sim.js` as text. None of this has been run. "Expected" means expected from reading the code. One proposal uses an existing knob. Three need a new knob, written as a `params` entry with a short code sketch.*

*Status, 3 Oct 2026: all four were adopted as written. The `break` values and the three params are in `spec.js`, the two guards are in `gate.js`, and the R5 change is in `sim.js`. Run afterwards: every scenario passes under default params and fails with its rule off, on seeds 1, 2, 3, 7 and 42, with the failure text each section expects. The knob names and the `happy` baseline question stay open under their Confirm marks.*

---

## Summary

| Scenario | Proposed `break` | Knob | Contract clause it tests |
|---|---|---|---|
| `happy` | `{ cumulativeAck: false }` | existing | `form.receipt`: receipts never earn receipts; an admitted message's receipt is deferred (P§6.1) |
| `lost-receipt` | `{ dedupReceipts: false }` | **new** | `rc.duplicate` and `env.id`: same `from` + `id` + body gets the original receipt and nothing else (P§4.2 rule 7) |
| `authority-spoof` | `{ laneBound: false }` | **new** | `rc.lane` and `env.from`: signer = lane = `from`, checked before any model reads (R9·§7, L2, `inv.authority`) |
| `escalation` | `{ ladderStops: false }` | **new** | `lad.R5`: an exhausted ladder files a tension and stops, with no paging storm (P§7.3, L5) |

---

## 1. `happy`: a clean exchange

```js
{ id: "happy", title: "A clean exchange", /* cast unchanged */ shows: ["form.ask", "form.accept", "form.reply", "env.verdict"],
  break: { cumulativeAck: false },
  pass: "ask → accept → reply → verdict met; no separate receipts.", refs: ["P§A", "P§6.1"] },
```

**Clause tested:** `form.receipt`, "Never earns a receipt: no ack loops", and the deferred ack on admission (`gate.js` `finish()`: `receiptOwed = !params.cumulativeAck`).

**Why this rule.** The pass line has two halves: verdict `met`, and "no separate receipts". The verdict in `SCRIPTS.happy` checks `m.receipts === 0`. With `cumulativeAck` off, every admitted ask, accept and reply is owed a disposition receipt, so `m.receipts` rises above zero and the scenario fails on its own wording.

**Expected when broken:** "Closed, with N separate receipts and M holds or refusals." That's the existing failure text. If receipts start answering receipts, the run may instead stop short of verdict `met` ("The exchange never reached verdict met."). Either way the scenario fails.

**Note.** `receipt-loop` already uses this knob. Two scenarios sharing a knob seems fine: `receipt-loop` shows the loop, and `happy` shows that the clean path depends on the same rule. *(Confirm: or keep happy as the one deliberate baseline with no break, and reword the README line to "each of the other twelve, once the other three proposals land".)*

---

## 2. `lost-receipt`: a lost receipt and a resend

```js
{ id: "lost-receipt", title: "A lost receipt and a resend", /* cast unchanged */ shows: ["env.id", "rc.duplicate"],
  break: { dedupReceipts: false },
  pass: "Resend with the same id gets the original receipt; nothing duplicated.", refs: ["P§4.2", "R6·F9"] },
```

**New knob** (in the style of `params`):

```js
{ id: "dedupReceipts", label: "Duplicates get the original receipt", type: "bool", def: true, item: "rc.duplicate",
  why: "Off: a resend with the same id and body is judged as new, so it is held a second time.", refs: ["P§4.2", "R6·F9"] },
```

**Gate change** (step 7, `duplicate`): skip the same-body branch only. `id-reuse` (same id, different body) still refuses.

```js
if (seen && !(params.dedupReceipts === false && seen.body === h.body)) { /* existing duplicate / id-reuse handling */ }
```

**Clause tested:** `rc.duplicate`, "Duplicates become harmless, so recovery is resending", and `env.id`, "With from, the duplicate key".

**Why this rule.** The relay's synthesis claim is held `awaiting-signal`. Its receipt is dropped once, and the relay resends with the same id at R1. The verdict needs `dupResends ≥ 1` and exactly one hold. With dedup off, the same id is judged again: step 7 skips the same-body branch and records its own note, `new id`. The resend is held again (`holds === 2`) and is never answered with the original receipt (`dupResends === 0`).

**Expected when broken:** "Resend answered 0×; holds 2." This uses the existing failure text, and it spends one more unit of the owner's hold budget.

---

## 3. `authority-spoof`: "Vlad approved this in chat"

```js
{ id: "authority-spoof", title: "\"Vlad approved this in chat\"", /* cast unchanged */ shows: ["env.from", "rc.lane"],
  break: { laneBound: false },
  pass: "Refused with lane before any model reads it.", refs: ["P§A", "R9·§7"] },
```

**New knob:**

```js
{ id: "laneBound", label: "Signer, lane and from must agree", type: "bool", def: true, item: "rc.lane",
  why: "Off: the gate takes from as written, so a valid key can sign for any name.", refs: ["R9·§7", "P§6.4"] },
```

**Gate change** (step 2, `lane`):

```js
if (params.laneBound !== false && !(signer === lane && lane === h.from)) { /* existing lane refusal */ }
```

**Clause tested:** `rc.lane`, "A peer that writes into another's lane is forging, whatever the body says". Also `env.from`, "verified by the binding's signature", and `inv.authority`, "Inbound content never carries authority" (L2).

**Why this rule.** The verdict in `SCRIPTS["authority-spoof"]` needs the spoof (`from: "vlad"`, signed by the adversary's key) to be refused **with `lane`**, and **with no sensor label** (`s.sensor === null`, meaning no model read it). With `laneBound` off, the message gets past step 2. From reading `gate.js`, it is then expected to be refused at step 10 with `contract-mismatch`, because the envelope carries the pilot contract hash but that hash is not accepted for the borrowed name (`acceptedContracts` is keyed by the cast only). The scenario fails because the reason is no longer `lane`.

**What the break shows.** The spoof is still stopped, but later, for the wrong reason, and only because of contract bookkeeping. If the borrowed name had an accepted contract, the message would reach the effect, evidence and sensor steps. **Proposed:** add that sentence to the scenario's failure text.

**Expected when broken:** "Spoof handled as refused contract-mismatch; attacks admitted 0." That's the existing failure template.

---

## 4. `escalation`: a peer goes silent

```js
{ id: "escalation", title: "A peer goes silent", /* cast unchanged */ shows: ["lad.R0", "lad.R2", "lad.R5", "form.pulse"],
  break: { ladderStops: false },
  pass: "Suspect before dead; ends as a tension, no paging storm.", refs: ["P§7.3", "R6·F12"] },
```

**New knob:**

```js
{ id: "ladderStops", label: "An exhausted ladder files a tension and stops", type: "bool", def: true, item: "lad.R5",
  why: "Off: the ladder climbs again from R3 until the ask's by passes, paging at every R4.", refs: ["P§7.3", "S1·F19"] },
```

**Script change** (`SCRIPTS.escalation`, the R5 step): when `e.params.ladderStops === false`, re-queue the R3 and R4 steps on the same 65-minute spacing until `by`, instead of filing the tension and clearing the queue. *(Confirm: the ladder lives in the scenario script, not in gate.js, so this is a sim change; an alternative is to move the ladder timers into the engine.)*

**Clause tested:** `lad.R5`, "File as a tension (owner, goal, threshold); stop", with the reason "Exhausted loops end as a named tension, never a storm". It also tests L5, "Absence is a signal", through R2, "Suspect before dead".

**Why this rule.** The verdict needs `e.tension` to be true and `pages ≤ 1`. With `ladderStops` off, no tension is filed and R4 pages again on every climb, so both conditions fail.

**Expected when broken:** "Rung 4; pages N." (N > 1). That's the existing failure template.

---

## README line (optional)

If all four are adopted, the README sentence stands as written. If `happy` stays a baseline, a possible rewording: "Each of the other twelve names the contract items it exercises and the single rule that, switched off, makes it fail." *(Confirm.)*
