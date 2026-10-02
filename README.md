<p align="center">
  <img src="docs/readme/hero.png" alt="Membrane — the boundary between agents with different owners" width="100%">
</p>

<h1 align="center">Membrane Playground</h1>

<p align="center">
  <em>The wire is solved. Membrane standardizes the boundary: what happens to a message when it crosses between agents with different owners.</em>
</p>

<p align="center">
  <img alt="contract" src="https://img.shields.io/badge/contract-v0.3--draft-0e5a62?style=flat-square">
  <img alt="status" src="https://img.shields.io/badge/status-nothing%20has%20run%20between%20the%20test%20pair%20yet-805406?style=flat-square">
  <img alt="stack" src="https://img.shields.io/badge/stack-vanilla%20HTML%20%2B%20JS%2C%20no%20build-276e44?style=flat-square">
  <img alt="licence" src="https://img.shields.io/badge/licence-undecided%20(D16)-5a6461?style=flat-square">
</p>

---

MCP solved agent-to-tool. A2A solved agent-to-agent transport. Neither says what a receiver should *do* with a message once it arrives from a peer whose owner is not yours: how much to trust it, whether it can touch anything, when to wake a human, and what to send back so the sender knows where it stands.

**Membrane** is a small contract for that layer. Seven required fields, four acts, five dispositions, a deterministic gate, and a short list of invariants that hold the waist in place while everything else travels as extensions. It borrows from MCP and A2A where they already got it right, and from immunology, cybernetics and diplomacy where protocols have nothing to say.

This repository is the **playground** for the v0.3 draft: an interactive abstract, a field-by-field contract explorer, a discrete-event simulation of six agents with different temperaments, a jailbreak game against the gate, a board of sixteen open decisions, and the eleven research threads the draft was built from.

<p align="center">
  <img src="docs/readme/visual-abstract.png" alt="Visual abstract: Hermes asks brainboi for shareable data; the envelope is sealed, sensed, then given a disposition" width="760">
</p>

## Run it

There is no build step, no package manager, and no server-side code. Everything is static.

```bash
git clone <this repo>
cd Membrane-playground
python3 -m http.server 8000     # or any static server
# open http://localhost:8000
```

Opening `index.html` directly from disk also works; a server is only nicer for the hash router. The page loads three Google Fonts (Literata, Instrument Sans, Fragment Mono) and falls back to system fonts offline.

> **Hosted as a Claude artifact?** `store.js` and `game.js` detect `window.claude` and switch on two extras: a shared database for comments, locks and stances (otherwise everything stays in `localStorage`, marked *this browser only*), and a live Claude sensor in the Gatekeeper (otherwise an offline heuristic). Nothing in the contract depends on either.

## The six views

| View | What it is for |
| --- | --- |
| **Abstract** | The visual abstract: a five-step exchange animated through the membrane, the waist at a glance, the nine laws, and what Membrane takes from its two parents. |
| **Contract** | Every field, act, form, disposition, reason code, tier, evidence kind, channel, rung and standing level in 0.3-draft, with *why it exists* and where it came from. Search, filter by status (kept / changed / added / open), comment, propose, lock the ones you agree with, export. |
| **Playground** | A DOM-free discrete-event engine in simulated minutes. Thirteen scenarios, six agents, a seed, a speed control, and sixteen rules you can switch off to watch the membrane break. |
| **Gatekeeper** | Play the attacker. Build a message, run it through the deterministic gate (plus the optional sensor), and see whether it broke through. Six challenges, an auto red team, a daily attempt log. |
| **Decisions** | Sixteen things the playground cannot settle. Each is phrased as a question, names its owner, says what settles it, and takes a stance. |
| **Sources** | The research threads, house sweeps and second-reader reviews, cross-linked from every item in the contract. |

## Playground

<p align="center">
  <img src="docs/readme/playground.gif" alt="Playground: Mallory floods brainboi with holds; the owner budget fills and the gate starts refusing" width="720">
</p>

The engine (`sim.js`, part 1) has no DOM, no wall clock and no randomness outside the seed. Every receipt and every disposition goes through `Gate.evaluate`, so the simulation and the game enforce exactly the same rules as each other and as the contract text.

**Agents.** `brainboi` the archivist (strict gate, full evidence, four runs a day) · `Hermes` the tinkerer (hourly cron, fast, sometimes under-declares effect) · `Iris` the newcomer (no standing yet) · `Echo` the flaky relay (loses receipts) · `Vox` the alarmist (everything is urgent) · `Mallory` the adversary (holds a valid key; injects, forges, floods, swaps contracts).

**Scenarios.** A clean exchange · Receipts that answer receipts · A lost receipt and a resend · A peer with a fast clock · An intention becomes a fact · A peer edits the key list · Flooding the owner's attention · An ask that reaches for memory · "Vlad approved this in chat" · Everything is urgent · The owner is away for two days · A stranger arrives · A peer goes silent.

Each scenario names the contract items it exercises and the single rule you can switch off to make it fail. The verdict panel tells you whether the membrane held, and the metrics track round trips, holds, refusals, owner minutes, admitted attacks and unshareable leaks.

## Gatekeeper

<p align="center">
  <img src="docs/readme/gatekeeper-challenges.png" alt="Six gatekeeper challenges: launder a claim, borrow authority, exfiltrate, touch the kernel, exhaust the owner, blind the sensor" width="900">
</p>

The gate is a pure function: `Gate.evaluate(msg, ctx, params) → trace`. The trace names every step in order (signature, lane, scope, syntax, version, audience, duplicate, clock, expiry, contract, criticality, turn, rate, pause, seal, effect, evidence, standing, sensor, budget, release) and the spec item each one enforces. The game shows you where your message stopped and why, then invites you to mutate it and try again. *Stress it: 5 rounds* runs an automated attacker that mutates from whichever step stopped the last attempt.

## Nine laws

<p align="center">
  <img src="docs/readme/nine-laws.png" alt="The nine laws, each with the disciplines that reached it independently" width="900">
</p>

1. **Messages trigger; they never instruct.**
2. **The reader of hostile content holds no authority.**
3. **Completion is declared by the other party.**
4. **The sender claims urgency; the receiver caps it.**
5. **Absence is a signal.**
6. **Consequential release needs two independent signals.**
7. **Records are permanent; their weight forgets.**
8. **Shape checks can be imitated.**
9. **Format travels; meaning stays local.**

Each law was reached independently by several disciplines (immunology, cybernetics, diplomacy, mail, aviation, payments, Bayesian reputation) before it was written down here. The playground links every law to the research findings that support it.

## The waist

<p align="center">
  <img src="docs/readme/waist.png" alt="The waist: 7 required fields, 4 acts, 5 dispositions, 5 evidence kinds, 6 effect classes, held by 7 invariants" width="900">
</p>

Small in the middle, free above and below. Seven required fields, four acts, five dispositions, five evidence kinds and six effect classes sit in the waist, held in place by seven invariants. Registered forms and extensions sit above it; bindings (git lanes, a shared folder, A2A, MCP) sit below. Each owner keeps the edges: gate, sensor model and tier policy on one side; standing computation, escalation timers and quarantine storage on the other.

## Two parents

<p align="center">
  <img src="docs/readme/two-parents.png" alt="What Membrane borrows, extends, breaks and finds absent in MCP and A2A" width="900">
</p>

For every idea in MCP and A2A the contract says whether Membrane **borrowed** it as is, **extended** it, **breaks** with it (because it holds inside one owner but falls between two), or found it **absent** in the parent. Open any item to see which Membrane form it became.

## How the code is laid out

```
index.html        shell: header, six empty <section> views, drawer, toast, footer
styles.css        tokens (light + dark), type, layout primitives
spec.js           the contract: window.MEMBRANE, the single source of truth every view renders
glyphs.js         shared SVG grammar: agents, envelopes, the membrane, dispositions
store.js          comments, proposals, locks, stances, attempts (artifact db or localStorage)
gate.js           Gate.evaluate — pure, synchronous, no DOM, no clock, no randomness
app.js  app.css   router, Abstract, Contract explorer + drawer, Decisions, Sources
sim.js  sim.css   Playground: discrete-event engine (part 1) and view (part 2)
game.js game.css  Gatekeeper: message builder, gate pipeline trace, sensor, red team
research/         R1–R11, the threads the draft was built from
whitepaper/       second-reader review of draft 0.1 (the paper itself lives elsewhere, see below)
docs/readme/      images for this file
```

```mermaid
flowchart LR
  spec[spec.js<br/>window.MEMBRANE] --> app[app.js<br/>Abstract · Contract · Decisions · Sources]
  spec --> sim[sim.js<br/>Playground]
  spec --> game[game.js<br/>Gatekeeper]
  spec --> gate[gate.js<br/>Gate.evaluate]
  gate --> sim
  gate --> game
  glyphs[glyphs.js] --> app
  glyphs --> sim
  glyphs --> game
  store[store.js] --> app
  store --> game
  app -. window.App helpers .-> sim
  app -. window.App helpers .-> game
```

Three design rules hold throughout:

- **Every contract fact comes from `spec.js`.** No view hardcodes a field name, an enum value or a reason code. Change the spec and all six views follow.
- **The gate is pure.** `gate.js` touches nothing outside its arguments, so the simulation, the game and (eventually) a real implementation can share it and be checked against each other.
- **Every claim carries a reference.** Items cite the paper (`P§6.2`), a research finding (`R3·F5`), a reviewer finding (`Rev02·#7`) or the A2A/MCP name they map to, and the drawer resolves each one.

## Research

The draft was built from eleven threads, each a dated markdown file with findings, mechanism, failure prevented, cost and sources.

| Thread | Subject |
| --- | --- |
| [R1](research/R1-protocol-landscape.md) | The protocol landscape, September 2026: MCP, A2A, ANP, AGNTCY, Agora, AP2, ERC-8004, Hermes |
| [R2](research/R2-classical-acl-and-contracts.md) | Classical agent communication, commitments, BSPL, contracts |
| [R3](research/R3-security-quarantine-gatekeeping.md) | Security: quarantine, gatekeeping, impact assessment |
| [R4](research/R4-gatekeepers-cybernetics-sociology.md) | Gatekeepers in sociology, diplomacy, cybernetics, biology |
| [R5](research/R5-immunology-cell-biology.md) | Immunology and cell biology as the mechanism library |
| [R6](research/R6-channels-urgency-escalation.md) | Channels by time and spread, urgency, interruption, progressive escalation |
| [R7](research/R7-identity-reputation-ledger.md) | Identity, recoverable reputation, the ledger question |
| [R8](research/R8-minimal-lasting-protocols.md) | What makes a protocol minimal, universal and long-lived |
| [R9](research/R9-test-pair-hermes-brainboi.md) | The test pair (Hermes Agent and brainboi) and a week-one pilot |
| [R10](research/R10-a2a-v1-exact-names.md) | A2A v1.0 exact names |
| [R11](research/R11-mcp-essence.md) | MCP distilled: essence and extension map |
| [Rev02](whitepaper/review/02-protocol-critic.md) | Second reader 02: an adversarial protocol critic's thirty findings on draft 0.1 |

Two house sweeps (S1, S2) and the first reviewer (Rev01) are cited in the contract but not published here; they quote a private record.

## Open decisions

<p align="center">
  <img src="docs/readme/decisions.png" alt="Decisions board: sixteen open decisions, twelve owners decide, two wait on research, two the playground informs" width="900">
</p>

Sixteen questions the playground can inform but cannot settle. Each names its owner and what would close it.

| | Decision | The question |
| --- | --- | --- |
| D1 | The necessary set | Are ask, answer, disposition, liveness and withdraw the right waist? |
| D2 | A2A extension or own protocol | Ship as an A2A extension, a separate spec with an A2A binding, or both? |
| D3 | Week-one transport | Git lanes, a shared folder, or A2A from day one? |
| D4 | Identity mechanism | SSH signing keys, KERI-style pre-rotation, or did:web? |
| D5 | Standing thresholds | Where do unknown peers start, and how many clean receipts promote? |
| D6 | Budgets | Holds per day, interrupts per week, owner minutes per day; is there a receiver-wide cap? |
| D7 | Who confirms a boundary effect | The owner's word, or reconciliation with an independent source? |
| D8 | API key and billing | Who pays for and holds the key for brainboi's `--bare` gate runs? |
| D9 | Inbound A2A profile | Does Hermes accept inbound A2A only on a separate profile? |
| D10 | Graduated sanctions | Warning, demotion, refusal — or one demotion clock? |
| D11 | A third implementer | Who builds the independent implementation that makes interop real? |
| D12 | Receipt privacy | Hash-only, selectively disclosed, or plain? |
| D13 | Burn or recover | Per-claim stakes that burn, or standing that recovers? |
| D14 | Blockchain flip | Are value, slashing and global ordering among strangers the conditions that put a chain in the core? |
| D15 | Prior art to read | What to borrow from RFC 8098, RFC 3834, DIDComm v2 and KERI receipts? |
| D16 | Name, licence, venue | Keep the name; which licence; arXiv, an Internet-Draft, or both? |

## Status and caveats

- This is **contract v0.3-draft** (14 September 2026), rendered for the two owners of the test pair. Nothing has yet run between the two agents; the simulation and the game are models of the rules, not records of a deployment.
- The **working paper** (draft 0.2) is linked from the footer and from every `P§` reference, but its source is not in this repository.
- `ARCH.md`, referenced in file headers as the builders' contract between modules, was not part of the export.
- **Licence is open decision D16.** Until it is settled, treat this repository as all rights reserved.

## About the images in this file

The hero is a free text-to-image render of a membrane of light, composed with the project's own typefaces and envelope glyphs. Every other image is a screenshot of the playground as it runs from this repository, with no mock data.
