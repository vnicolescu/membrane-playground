# Test vectors: summary

*Contract 0.3-draft, commit `2ca3d45`. Run in this repository on 3 Oct 2026 with `node test-vectors/run.js`: 54 of 54 steps run and 54 of 54 passed, after the four breaking rules were adopted. Before adoption, at `2ca3d45`, it was 51 of 54, the 3 failures being proposed vectors that waited for a change. The paragraphs below describe the set as written; the table shows it as it stands. Every vector was written as `"basis": "read"`: the expected outcome was derived by reading `gate.js`, `sim.js` and `spec.js` as text. **Written from reading the code. Later, 52 of the 54 steps were checked against `gate.js` in a sealed sandbox: 50 as written, and the 2 proposed ones show today's behaviour; the 2 engine steps weren't run.** Of the 54 steps, 52 are gate steps and 2 are engine steps; read against today's `gate.js`, 50 of the 52 gate steps match, and 2 match only with the proposed knobs (`lost-receipt.break.dedupReceipts` step 2, `authority-spoof.break.laneBound` step 1).*

**29 vectors** in 14 files: 13 `pass` vectors (one per scenario, default params), 9 `break` vectors (the existing `break` values in `spec.js`), 4 `proposed-break` vectors (the four rules in `docs/proposals/scenarios-breaking-rules.md`), and 3 `extra` vectors in `known-gaps.json` (`env.state`, and capability grants). 54 steps in total: 48 `evaluate`, 4 `pageDecision`, 2 `engine`.

**Categories** (field `category`), as the set stands: 8 `accept`, 11 `reject-code`, 8 `adversarial`, 2 `known-gap`. As written: 6, 10, 7 and 6. See the README for what each one asserts.

Outcome reads `disposition/reason` for `evaluate` steps, `page` / `no page` for `pageDecision` steps, and `engine` for sim-layer checks. Decisive is the expected `trace.decisiveStep` (`-` where not applicable). Break vectors that keep the same disposition differ in another expected field: `receiptOwed` (`happy`, `receipt-loop`), `originalReceipt` (`lost-receipt`) or `page` (`alarmist`); see the JSON `expect` blocks.

| # | Vector | Kind | Category | Layer | Status | Params | Steps | Expected outcome per step | Decisive step | Confirm |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `happy.pass` | pass | accept | gate | current | defaults | 4 | `admitted` → `admitted` → `admitted` → `admitted` | `release`, `release`, `release`, `release` |  |
| 2 | `happy.break.cumulativeAck` | break | accept | gate | adopted | `cumulativeAck` false | 4 | `admitted` → `admitted` → `admitted` → `admitted` | `release`, `release`, `release`, `release` | `confirm` |
| 3 | `receipt-loop.pass` | pass | accept | gate | current | defaults | 2 | `admitted` → `admitted` | `release`, `release` |  |
| 4 | `receipt-loop.break.cumulativeAck` | break | accept | gate | current | `cumulativeAck` false | 2 | `admitted` → `admitted` | `release`, `release` |  |
| 5 | `lost-receipt.pass` | pass | reject-code | gate | current | defaults | 2 | `held/awaiting-signal` → `held/duplicate` | `release`, `duplicate` |  |
| 6 | `lost-receipt.break.dedupReceipts` | break | reject-code | gate | adopted | `dedupReceipts` false | 2 | `held/awaiting-signal` → `held/awaiting-signal` | `release`, `release` | `confirm` |
| 7 | `clock-skew.pass` | pass | reject-code | gate | current | defaults | 1 | `refused/clock` | `clock` |  |
| 8 | `clock-skew.break.clockToleranceMin` | break | reject-code | gate | current | `clockToleranceMin` = 30 | 1 | `admitted` | `release` |  |
| 9 | `laundering.pass` | pass | reject-code | gate | current | defaults | 2 | `held/awaiting-owner` → `held/awaiting-owner` | `release`, `release` |  |
| 10 | `laundering.break.noUpgradeRelay` | break | reject-code | gate | current | `noUpgradeRelay` false | 2 | `held/awaiting-owner` → `admitted` | `release`, `release` |  |
| 11 | `trust-root.pass` | pass | adversarial | gate | current | defaults | 2 | `refused/scope` → `refused/contract-mismatch` | `scope`, `contract` |  |
| 12 | `trust-root.break.trustRootPinned` | break | adversarial | gate | current | `trustRootPinned` false | 2 | `admitted` → `admitted` | `release`, `release` |  |
| 13 | `hold-flood.pass` | pass | adversarial | gate | current | defaults | 2 | `held/policy` → `refused/hold-budget` | `release`, `budget` |  |
| 14 | `hold-flood.break.holdBudget` | break | adversarial | gate | current | `holdBudget` = 0 | 1 | `held/policy` | `release` |  |
| 15 | `exfiltration.pass` | pass | adversarial | gate | current | defaults | 2 | `admitted` → `refused/policy` | `release`, `release` |  |
| 16 | `exfiltration.break.quarantinedAnswer` | break | adversarial | gate | current | `quarantinedAnswer` false | 1 | `admitted` | `release` |  |
| 17 | `authority-spoof.pass` | pass | adversarial | gate | current | defaults | 2 | `refused/lane` → `refused/policy` | `lane`, `release` | `confirm` |
| 18 | `authority-spoof.break.laneBound` | break | adversarial | gate | adopted | `laneBound` false | 1 | `refused/contract-mismatch` | `contract` | `confirm` |
| 19 | `alarmist.pass` | pass | accept | gate | current | defaults | 3 | `admitted` → `page` → `no page` | `release`, `-`, `-` |  |
| 20 | `alarmist.break.ceilingEnforced` | break | accept | gate | current | `ceilingEnforced` false | 1 | `page` | `-` |  |
| 21 | `owner-away.pass` | pass | reject-code | gate | current | defaults | 3 | `held/awaiting-signal` → `expired` → `held/awaiting-signal` | `release`, `expiry`, `release` | `confirm` |
| 22 | `owner-away.break.resendPolicy` | break | reject-code | gate | current | `resendPolicy` = "none" | 1 | `refused/expired-before` | `expiry` |  |
| 23 | `newcomer.pass` | pass | reject-code | gate | current | defaults | 1 | `held/awaiting-owner` | `release` |  |
| 24 | `newcomer.break.newcomerLevel` | break | reject-code | gate | current | `newcomerLevel` = "S1" | 1 | `admitted` | `release` |  |
| 25 | `escalation.pass` | pass | accept | gate | current | defaults | 4 | `admitted` → `admitted` → `no page` → `engine` | `release`, `release`, `-`, `-` | `confirm` |
| 26 | `escalation.break.ladderStops` | break | accept | sim | adopted | `ladderStops` false | 1 | `engine` | `-` | `confirm` |
| 27 | `known-gaps.state-unchecked` | extra | known-gap | gate | current | defaults | 1 | `admitted` | `release` | `confirm` |
| 28 | `known-gaps.capability-reuse` | extra | known-gap | gate | current | defaults | 2 | `admitted` → `admitted` | `release`, `release` | `confirm` |
| 29 | `known-gaps.capability-transfer` | extra | reject-code | gate | current | defaults | 1 | `refused/effect-exceeds-tier` | `release` |  |

**Three of the four proposed vectors failed against `2ca3d45` by design, and pass now that the rules are in.** `lost-receipt.break.dedupReceipts` and `authority-spoof.break.laneBound` need the new params and the guards in `docs/proposals/scenarios-breaking-rules.md` (without them the gate ignores the unknown param and returns the pass outcome). `escalation.break.ladderStops` needs the R5 script change. `happy.break.cumulativeAck` uses an existing knob and should hold today. The two `known-gap` vectors in `known-gaps.json` describe today's behaviour and are expected to flip when the check is added.

**Rows marked `confirm`** carry a `confirm` list in the JSON:

- `happy.break.cumulativeAck`: whether `happy` keeps `break` set to null as the deliberate baseline.
- `lost-receipt.break.dedupReceipts`: knob name and guard placement in step 7.
- `authority-spoof.pass`: step 2 reads as refused `policy` (the T2 checkpoint is strictest); the sim text says the signed claim was held, then refused (`sim.js:380`).
- `authority-spoof.break.laneBound`: knob name and guard placement in step 2.
- `owner-away.pass`: step 2 (a late copy past `expires`) is an added illustration of the gate's `expired` path, not an event from the script.
- `escalation.pass`: whether engine-level steps belong in this set or in a separate sim suite.
- `escalation.break.ladderStops`: knob name; ladder timers in the script or in the engine.
- `known-gaps.state-unchecked`: which reason code a bad `state` token gets once it is checked.
- `known-gaps.capability-reuse`: whether to adopt single-use grants, and the code for a second use.
