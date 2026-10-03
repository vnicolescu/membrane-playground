# The Membrane course: curriculum

*Written 2026-10-03 by the course's lead learning designer, against paper draft 0.2 (2026-09-14), contract v0.3-draft (`spec.js`), the gate (`gate.js`), the scenario builder (`course/scenario.js`), brobber's pack, R1 to R11, Rev02, and the web checks listed under "Web notes". Revised the same day against the round-0 panel (§8) and the round-1 panel (§9). Lessons are the files in `course/lessons/`; this file is the plan and the record.*

## 1. Widget requests (for the orchestrator; read first)

Four new interactives were requested, three widgets and one figure; all four are built and used by name. Everything else uses the format's existing table, with the props the lessons pass recorded in §3.2.

### 1.1 `preRotation` (widget) · used in `sec-keys`

What it shows: why a stolen signing key cannot take an identifier when the next key was committed in advance (paper §9.2, KERI).

- **State.** An identifier card: `id`, current public key `K1`, `next: digest(K2)`. A message pad. An attacker panel.
- **Controls.** `Sign a message with K1` (shows the signature verifying against the card). `Steal K1` (the attacker panel now holds K1; the attacker can sign messages that verify, and the card marks them "valid signature, same identifier"). `Attacker rotates to K3 using K1` (fails: a rotation must be signed with the key whose digest is on the card, and K1's digest is not). `Owner rotates to K2, commits digest(K3)` (succeeds: the card now shows `K2`, `next: digest(K3)`; messages signed with the stolen K1 stop verifying from here on, and what it signed before has to be found through the log). A toggle `no pre-rotation`: with it on, the attacker's rotation succeeds and the owner is locked out.
- **What the reader learns.** Two separate claims: the signature proves the key; the pre-rotation proves the controller. A thief holding the current key can forge messages until the owner rotates, and cannot move the identifier.
- **Calls.** `Gate.simHash` for the digests, labelled "simulation hash, not SHA-256". No gate evaluation.

### 1.2 `attentionFlow` (widget) · used in `tr-ack`, pointed to from `time` and `gatekeeper`

What it shows: flow control where the scarce resource is the owner's attention (paper §6.4 hold budget, §7.2 interrupt budget, decision D6).

- **Inputs.** Number of keyed peers (1 to 3). Messages per peer per day (1 to 10). Share of messages that trip the sensor (slider, 0 to 100%; exactly round(share × n) of each peer's non-alert messages trip). Share that are alerts claiming `immediate` (slider). Knobs: `holdBudget` (default 3), `interruptBudget` (default 2), `ownerMinutesPerDay` (default 15), and a toggle `receiver-wide cap` (off by default; when on, total holds per day across all peers are capped at `holdBudget`).
- **What moves.** A day strip per peer: each message is a tick coloured by disposition. A meter for the owner's minutes: a hold costs 3 minutes and a page 5, shown as editable assumptions. Refusals with `hold-budget` appear once the per-sender budget is spent. With the receiver-wide cap off and two or three peers, the meter overflows at the defaults: the point D6 makes.
- **What the reader learns.** A per-sender budget bounds one sender; the owner's day is bounded only by a receiver-wide cap. Budgets are flow control for attention.
- **Calls.** `Gate.evaluate` per message with `ctx.holdsToday[from]` and `ctx.rateToday[from]` carried forward within the day; `Gate.pageDecision` for alerts with `ctx.interruptsThisWeek` carried forward. Bodies: the clean ask from `course/scenario.js` for calm messages and the `claim` base with an injection phrase for sensor-tripping ones.

### 1.3 `mailQueue` (widget) · used in `tr-store-forward`

What it shows: a store-and-forward mailbox with a receiver that runs on a cycle, so expiry is judged on the receiver's clock (paper §6.1, §7.1 Mailbox; SMTP and DTN precedents).

- **Inputs.** The receiver's cycle in minutes (60 to 720; brainboi's is 360 in the design). A transport outage toggle with a duration (0 to 72 hours). Knobs: `expiryHours` (default 48), `resendPolicy` (`none`, `once`, `unlimited`). A `send` button that writes an ask into the sender's lane at the current simulated time, and a `resend` button that sends the same body under a new `id` with the expired message in `re`, one sender cycle later.
- **What moves.** A timeline: the sender's lane fills; the receiver's runs are ticks on a cycle; an outage greys the transport; each message is evaluated at the first receiver run after it becomes reachable, with `ctx.now` set to that run. Messages whose `expires` passed before the run show `expired`; the first resend is judged afresh; the third copy of the same body shows `refused · expired-before`. A side legend states SMTP's floor and horizon (retry at least 30 minutes apart, give up no sooner than 4 to 5 days; RFC 5321 §4.5.4.1, text inherited from RFC 1123 §5.3.1.1).
- **What the reader learns.** The receiver's fetch time is the clock that matters; a `by` shorter than the receiver's cycle binds nothing; one honest resend is allowed and repetition earns nothing.
- **Calls.** `Gate.evaluate` with `ctx.now` at each run and `ctx.expiredBodies[bodyHash]` incremented on each expiry.

### 1.4 `twoOwners` (figure) · used in `sec-threat`

What it shows: the threat surface of a two-owner exchange, with the gate step that covers each entry point.

- **Drawing.** Left: Vlad, brainboi (kernel, memory, tools), brainboi's gate as a separate operating-system user, a pinned trust root beside the gate and outside the transport. Right: the mirror for Sal and Hermes. Between: the transport as two one-way lanes (`lanes/hermes/out/`, `lanes/brainboi/out/`) plus `PROTOCOL.md`, `allowed_signers` and `owners/PAUSE`. One arrow per side from transport to gate to agent, so the admitted-digest path is visible. Numbered entry points with hover labels: 1 forged signer (`signature`; a valid signature from an unknown identifier is held at S0 with a receipt), 2 write into the other lane (`lane`), 3 harness or trust-root path in a commit (`scope`), 4 control characters in a header (`syntax`), 5 instruction text in the body (`sensor`), 6 an acceptance line that reaches memory (`release` at T1), 7 replay and flood (`duplicate`, `rate`), 8 a clock set ahead (`clock`), 9 contract swap (`contract`, `scope`), 10 hold flooding (`budget`).
- **Static**, two themes, hover reveals the step name and reason code. No gate calls.

## 2. Audience and outcomes

**Audience.** Engineers and designers who build or run agents and have used at least one LLM API. No prior reading of Membrane, MCP or A2A is assumed. Readers who know hashes, layering, delivery semantics, JSON-RPC or prompt injection skip the matching foundation.

**Outcomes.** After the core track the reader can:

1. Write a valid Membrane message by hand and say which byte rule each line obeys.
2. Predict what a receiver's gate does with a message (one of `admitted`, `held`, `refused`, `expired`, or no disposition) and name the deciding step and reason code.
3. Explain each of the nine laws with the mechanism behind it and one outside field that reached it first.
4. Place Membrane against MCP and A2A: what it borrows, what it extends, where their assumptions break between two owners, and what both leave absent; and answer a scenario question about either parent after the parents part is over.
5. Read the pilot contract, say which messages are enabled after any message, and compute the effect tier of a request.
6. Run the 29 conformance vectors and read a failure.
7. Attack the gate with the planted cases and say why each fails under the defaults, which switched-off rule would let it through, and which one the sensor misses.
8. Make the gate produce a named outcome by editing a message or a knob: every core lesson with a gate lab, from the envelope to the capstone, ends with a goal lab checked by the real gate. The two core lessons without a lab, laws and conformance, end on a sort and on quizzes.

**Status.** Membrane is a draft. Defaults are starting values, unmeasured. Nothing has run between brainboi and Hermes; every date in the course belongs to the pilot design, and the running message is constructed. Every lesson that touches a number says so.

## 3. The map

Three tracks. Foundations are optional and pointed to from the core lesson that needs them. The core is read in order. Annexes deepen named core lessons and each ties back to a Membrane mechanism.

### 3.1 Parts

| id | track | title |
|---|---|---|
| `foundations` | foundation | Foundations |
| `problem` | core | The problem |
| `parents` | core | The two parents |
| `waist` | core | The waist |
| `gate` | core | The gate |
| `time` | core | Time and standing |
| `laws` | core | Laws and attacks |
| `ship` | core | Shipping it |
| `annex-network` | annex | Annex · Network science |
| `annex-transport` | annex | Annex · Transport |
| `annex-security` | annex | Annex · Security |

### 3.2 Lessons

Minutes are counted by the engine from words and cases; the `minutes` field in the files is a hint it ignores. `Check` names the predict-and-run elements and what each lab asks the reader to predict. `Make` names the goals the reader reaches by editing the message or a knob, each proved reachable by the checker, plus the machine targets that tick when reached. `Props` are what a lesson passes to a shared widget. `Stamps` are the running envelope's fields the lesson lights up.

| file | id | title | part | prereq | check | make | widgets, figures, props | stamps |
|---|---|---|---|---|---|---|---|---|
| `01-hashes.js` | `hashes` | Hashes and signatures | foundations | | quiz; gate (disposition) | drop the hash line; break the `from` grammar | `hashLab` | |
| `02-layers.js` | `layers` | The narrow waist | foundations | | quiz | | `stack`, `hourglass` | |
| `03-delivery.js` | `delivery` | Delivery semantics | foundations | | sort; gate (disposition, reason) | | `lossyChannel` | |
| `04-jsonrpc.js` | `jsonrpc` | JSON-RPC and HTTP | foundations | | 2 quizzes | | | |
| `05-injection.js` | `injection` | Injection and the confused deputy | foundations | | 2 quizzes | | | |
| `10-problem.js` | `problem` | Two owners, one line | problem | `injection` | cold question; sort (6 failures, 2 gate behaviours) | | | |
| `11-mcp.js` | `mcp` | A host and its tools | parents | `jsonrpc` | cold question; 2 scenario quizzes | | `mcpArch` | |
| `12-a2a.js` | `a2a` | One agent's task to another | parents | `jsonrpc` | cold question; machine; scenario quiz | 2 machine targets (a terminal state with no work; COMPLETED) | `a2aArch` | |
| `13-gap.js` | `gap` | The gap | parents | `layers` | sort of 12 unseen features, figure after as the reveal | | `twoParents` | |
| `20-envelope.js` | `envelope` | The envelope | waist | `hashes` | cold open (a carriage return); gate (disposition, receiptOwed) | version; grammar; not-addressed; unsupported-extension | `hourglass` | `membrane`, `id`, `from`, `to`, `at`, `body` |
| `21-acts.js` | `acts` | Acts and commitments | waist | | cold open (Hermes' accept); machine; gate (disposition, admittedAs) with a from-earlier case; sort of 8 described messages | act mismatch; turn cap; cancel of itself; 2 machine targets (violated with no creditor act; expired) | | `act`, `form`, `context`, `turn` |
| `22-contracts.js` | `contracts` | Contracts | waist | | cold open (a bare request); gate (disposition, decisiveStep) with a from-earlier case | contract-mismatch; T4 hold by removing `form`; malformed by dropping `acceptance` | `bspl` | `contract`, `by`, `acceptance` |
| `23-dispositions.js` | `dispositions` | Dispositions and receipts | waist | `delivery` | cold open (a receipt for nothing); gate (disposition, receiptOwed) with a from-earlier case; scenario quiz | receipt owed via the cumulative-ack knob; expiry; stale | `dispositions`, `receiptLoop` | |
| `30-effects.js` | `effects` | Effects and tiers | gate | | cold open (no effect line); gate (disposition, tier) with a from-earlier case | hold for the owner; hold for a signal; effect-exceeds-tier | `tierCalc` (after the lab) | `effect` |
| `31-evidence.js` | `evidence` | Evidence and two signals | gate | | cold open (no evidence line); gate (disposition, reason) with a from-earlier case; quiz | admitted as fact via a named measurement; hold for the owner; malformed label | `relayChain` | |
| `32-gatekeeper.js` | `gatekeeper` | The gatekeeper | gate | `injection` | cold open (a direct order); gate (disposition, decisiveStep) with a from-earlier case; scenario quiz; "why held" table | `policy` via the strictness knob; a hold for a signal by making the body a claim | `sensorLab` | |
| `40-time.js` | `time` | Time | time | `delivery` | cold open (an alert that cannot wait); gate (page, level); gate (disposition, decisiveStep) with a from-earlier case | `prompt` via severity; `cycle` via urgency; `prompt` via the interrupt-budget knob | `pageCalc`, `ladder` | |
| `41-standing.js` | `standing` | Identity and standing | time | `hashes` | cold open (a stranger with a record); gate (disposition, standing) with a from-earlier case; scenario quiz | lane refusal by changing `from`; admit via the newcomer knob | `standingClock` | |
| `50-laws.js` | `laws` | Nine laws | laws | | cold question; sort of 9 Membrane mechanisms to laws | | | |
| `51-attack.js` | `attack` | Attacking the gate | laws | `injection` | cold open (an approval Vlad never gave); gate (disposition, reason) with the tenth case and a from-earlier case | admit the exfiltration via the quarantined-answer knob; `policy` via strictness; `lane` via `from` | `redteam` | |
| `60-bindings.js` | `bindings` | Bindings and the pilot | ship | `jsonrpc` | cold open (a file called AGENTS.md); gate (disposition, reason) with a from-earlier case; A2A scenario quiz | not-addressed; clock | `bindings` | |
| `61-conformance.js` | `conformance` | Conformance | ship | | 2 quizzes | | `vectors` | |
| `62-capstone.js` | `capstone` | Decisions and the capstone | ship | | goal lab; cumulative gate (disposition, tier) of ten unlabelled cases; sort of 9 mechanisms and 1 parent idea to the four conditions (3/3/2/2) | refused; held for the owner; held for a signal; expired; logged only | | all fourteen |
| `80-net-graphs.js` | `net-graphs` | Graphs and degree | annex-network | | 2 quizzes | | `graphLab` `{model: random}` | |
| `81-net-cascades.js` | `net-cascades` | Cascades and gossip | annex-network | `net-graphs` | 2 quizzes | | `graphLab` `{model: scale-free, mode: cascade, contagion: simple}` and `{model: small-world, mode: cascade, contagion: complex, threshold: 0.5, beta: 0, seeds: 2}` | |
| `82-net-sybil.js` | `net-sybil` | Sybils and trust flow | annex-network | `net-graphs` | gate (disposition, standing); quiz | lane refusal; admit via the newcomer knob | `graphLab` `{model: small-world, mode: sybil}` | |
| `85-tr-e2e.js` | `tr-e2e` | The end-to-end argument | annex-transport | `layers` | quiz | | | |
| `86-tr-store-forward.js` | `tr-store-forward` | Store and forward | annex-transport | `delivery` | gate (disposition, decisiveStep) | | `mailQueue` | |
| `87-tr-ack.js` | `tr-ack` | Acknowledgement and attention | annex-transport | `delivery` | gate (disposition, receiptOwed) | | `attentionFlow`, `receiptLoop` `{cumulativeAck: false, loop: true}` | |
| `88-tr-bindings.js` | `tr-bindings` | How the bindings carry bytes | annex-transport | `jsonrpc` | 2 quizzes | | `bindings` `{tab: mcp, proves: true}` | |
| `90-sec-threat.js` | `sec-threat` | Threat model for two owners | annex-security | `injection` | sort of 10 attacks to steps | | `twoOwners` | |
| `91-sec-injection.js` | `sec-injection` | Injection by design | annex-security | `injection` | 2 quizzes | | `sensorLab` | |
| `92-sec-capabilities.js` | `sec-capabilities` | Capabilities and least privilege | annex-security | | gate (disposition, reason); sort | | | |
| `93-sec-keys.js` | `sec-keys` | Keys, roots and logs | annex-security | `hashes` | gate (disposition, reason); quiz | let the key-list edit through with the root unpinned; stop the same edit at the grammar | `preRotation` | |
| `94-sec-abuse.js` | `sec-abuse` | Replay, backscatter, Sybil, flood | annex-security | `delivery` | gate (disposition, receiptOwed) with a Sybil-flood case; quiz | | | |
| `95-sec-guards.js` | `sec-guards` | Why guards fall | annex-security | | 2 quizzes | | | |

Totals: 36 lessons; 42 goals in 17 labs; 185 predicted cases; 4 machine targets. The engine prints the minutes.

### 3.3 Per-lesson plan lines

The plan lines of the first draft stand, with the round-0 and round-1 additions in §8 and §9. In short: each core lesson from the envelope on opens on an unscored cold open named after its case (the engine labels it and shows the reader's guess when the lab returns to it), every lab names the parts it asks the reader to predict, every lab from acts on carries one case labelled "from earlier", and every core lesson with a lab ends with a goal lab.

## 4. Design notes

- **Order.** The brief's core path is kept. "Time" (channels, urgency, escalation, liveness) is one lesson with taxonomy first; "identity and standing" follows it so the ceiling and the demotion clock are read together. Bindings precede conformance because the vectors assume the lane model.
- **Versions.** The course teaches contract 0.3 and says so once, in a collapsed note in `envelope`: `thread` became `context`, `hello` became `card`, `awaiting-owner` and `awaiting-signal` were added, `size` was split from `malformed`, `state` was borrowed from MCP. The paper's Appendix A uses 0.2 names and `from: brainboi@vlad`; the course's wire examples use the scenario builder's 0.3 form.
- **The running example.** Hermes asks brainboi which week of the pilot it is. Its header, in wire order: `membrane, id, from, to, act, form, at, by, effect, contract, context, acceptance, turn, body`. `envelope` stamps six, `acts` four, `contracts` three, `effects` one; `capstone` stamps all fourteen and sends the clean exchange through the gate. The message is constructed; the pilot has not run, and the course says so in `problem`, `capstone` and wherever a design detail could read as a deployment fact.
- **Direction of the bases.** The scenario builder's `accept`, `reply` and `receipt` bases are Hermes-sent messages judged at brainboi's gate: Hermes accepting and answering a question brainboi asked. The lessons label them as Hermes' messages and say once, in `acts` and `capstone`, that the protocol is symmetric so the gate's work is the same in either direction.
- **One disposition rule.** Five dispositions: sealed, held, admitted, refused, expired. A malformed or unsigned message gets none and is logged only. `problem`, `envelope`, `dispositions`, `gap` and `capstone` all say it the same way; the lab's prediction row sets "no disposition · logged only" apart.
- **`policy`.** The code names the cause and the disposition names the outcome: `policy` appears as a refusal when a raised tier refuses and as a hold when the sensor holds. `gatekeeper` states this under the why-held table, and `attack` and `gatekeeper` describe the sensor's hold as "held by the sensor, code `policy`; Vlad reviews it".
- **Gate cases.** Every `gate` block states `expect`, and `node course/dev/check.js` runs it; a case that stops before step 16 expects `tier: null`. Conventions found while probing the real gate: the `alert` base carries `measurement: push-probe`, which the lab's receiver state does not list, so a plain alert is held `awaiting-signal`; lesson `time` teaches that as the measured path falling to synthesis and says the list is the lab's. The authority spoof needs `msg.signer` and `msg.lane` set to `hermes`. A receipt about a message never sent is shown by changing `re`. A direct order inside a request at S1 is held `awaiting-signal` at T3 when the body is a plain order, and refused `policy` at T2 when it also carries an instruction phrase; the same order inside an assert is held `policy` for the owner. A paraphrased order inside a record-backed claim is admitted as fact with the sensor calm, and `attack` carries it as case 10.
- **brobber's material.** ARCH.md, the vectors, the proposals and the explorer appear as `brobber` callouts in `gatekeeper` and `conformance`; the provenance (commit `2ca3d45`, 51 of 54 then 54 of 54) is told once, in `conformance`. The seven generic findings from the client study live in one place, as a list in `attack`, each mapped to a Membrane rule and a runnable case, with a sentence saying they sit outside the published pack; `mcp` keeps one finding about consent in new words and points to `attack`; `injection` points to `attack` for the path-check case; no security annex lesson restates them. Attribution everywhere is "brobber's red team of an MCP hub design", with no firm, size, vendor, product or brief named.
- **Core and annex.** Where a core lesson and an annex both need a rule, the core carries the mechanism in full and the annex carries the theory, with one clause and a labelled link back. The span check in §9 is the test.
- **Honesty.** Each lesson that quotes a default says it is a starting value. The pilot is described as a design. The sensor is described as the component that reads hostile text, and its miss on a claim is shown, with the digest's next reader named.
- **Privacy.** No quotation from S1, S2 or Rev01. House anecdotes appear only in the generic form the paper uses, with no people beyond Vlad, Sal, brainboi, Hermes and brobber. The paper's second reviewer is defined once (`envelope`, as the critic whose findings are cited as Rev02) and cited by chip after that. The Sal who argued for graduated sanctions in the paper's review is named as a model-written persona wherever he is mentioned, and Hermes' card in `a2a` is captioned as illustrative.

## 5. Web notes

Today is 2026-10-03. Read-only; nothing was sent.

**Searched.** "Model Context Protocol specification revision after 2026-07-28 changelog" · "A2A protocol release v1.0.2 OR v1.1 a2aproject github releases 2026" · the RFC 5321 §4.5.4.1 retry sentences (to locate a quotable copy).

**Opened, parents.**
- modelcontextprotocol.io/specification/versioning: "The current protocol version is 2026-07-28." Revision states Draft, Current, Final; twelve-month deprecation floor; negotiation per request.
- modelcontextprotocol.io/specification/draft/changelog: "Changes since the most recent release will accumulate here." (empty).
- modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http: single POST endpoint; every client message its own POST; `Accept` lists both `application/json` and `text/event-stream`; servers MUST NOT send JSON-RPC requests on a stream; `subscriptions/listen` for long-lived notifications; `Last-Event-ID` resumability not supported; `MCP-Protocol-Version`, `Mcp-Method`, `Mcp-Name`, `Mcp-Param-{name}` headers; `HeaderMismatch` `-32020`; `Origin` validation against DNS rebinding. The MRTR page makes integrity protection of `requestState` a MUST where it influences authorization, and principal binding, lifetime and request digest a SHOULD (read by the round-1 panel; `mcp` says so).
- github.com/a2aproject/A2A/releases: newest tag v1.0.1 (28 May 2026); v1.0.0 (12 March 2026); nothing later. github.com/a2aproject/A2A/releases/tag/v1.0.0: "1.0.0 (2026-03-12)".
- a2a-protocol.org/latest/specification/: header "Latest Released Version 1.0.0"; three bindings (JSON-RPC, gRPC, HTTP+JSON/REST) as Layer 3 mappings of one abstract model; clients MUST send `A2A-Version` (0.3 assumed when empty); push notifications as server-initiated POST to a client webhook.
- A2A `docs/specification.md` and `a2a.proto` at tag v1.0.1 (read by the round-1 panel, 2026-10-03): §4.3.3 Server Guarantees promises one delivery attempt per webhook, with retries optional and duplicates possible; the TaskState comment allows REJECTED at creation or later; `Message.context_id` is optional and an agent that creates one must return it; §11.7 closes the HTTP+JSON stream on an interrupted state as well as a terminal one.

**What changed since 14 September 2026.** Nothing in MCP: 2026-07-28 is still Current and the draft changelog is empty. Nothing in A2A: v1.0.1 is still the newest release. Two corrections to the record: the paper (§1.2) and R1·F3 date A2A v1.0 to April 2026, and GitHub dates the v1.0.0 tag 12 March 2026 (lesson `a2a` carries this as a `web` callout); R10·§7 calls A2A push at-least-once, and the specification promises one attempt (lessons `a2a`, `gap`, `bindings` and `tr-bindings` say so; R10 is outside the course and is flagged for the orchestrator).

**Opened, foundations and annexes (primary pages unless marked).**
- jsonrpc.org/specification (Request, Notification, Response, Error, reserved codes, batch).
- Saltzer, Reed and Clark 1984, web.mit.edu PDF, pages 1 to 3 read (statement of the argument, quoted verbatim in `tr-e2e`; careful file transfer; "performance enhancement"; the MIT byte-pair example in §2).
- RFC 1123 §5.3.1.1 via freesoft.org (the retry sentences RFC 5321 §4.5.4.1 inherits: "at least 30 minutes", "at least 4-5 days"); RFC 5321 §2.1 and §4.4 at rfc-editor.org (responsibility handoff after the 250 reply; `Received:` lines). The RFC 5321 §4.5.4 text itself did not load in any fetch (page truncation); the course quotes RFC 1123 and names RFC 5321.
- RFC 3834 §2, §3.1.3 (no response to auto-submitted mail, as SHOULD NOT; one response per sender per period, scoped to responses about the recipient's inability to read or reply; one recipient per response). RFC 8098 §2.1, §3.2.6.2 (MDN never answers an MDN; the request may be ignored; disposition types). RFC 6410 §2.2 and RFC 2026 §4.1.1 (the Internet Standard bar; read by the round-1 panel).
- RFC 9413 (faults entrenched as de facto standard; fix one bug over many workarounds). RFC 8701 (GREASE; random reserved values; ignore unknown values). RFC 6710 (priority -9 to 9; no upgraded priority from unauthorized sources; "always requesting priority 9" as denial of service). RFC 7515 §4.1.11 (`crit`; "the JWS is invalid" if not understood; protected header only). RFC 9162 (append-only via Merkle trees; consistency proofs; monitors; a log showing different views must be treated as a trusted third party). RFC 9171 (store-carry-forward; lifetime; four status reports; custody transfer moved to BIBE). RFC 4838 §3.1, §3.10 (store-and-forward; custody transfer). RFC 8032 (Ed25519: 32-byte keys, 64-byte signatures, about 128-bit security).
- FIPS 180-4 PDF (SHA-224/256/384/512 family; SHA-256 digest 256 bits; infeasible to invert or to find collisions).
- git-scm.com/docs/git-config (`gpg.format = ssh`; `gpg.ssh.allowedSignersFile` with `valid-after`/`valid-before`, judged against the signature's creation time; `gpg.ssh.revocationFile`, trust level never).
- simonwillison.net Dual LLM (2023). arXiv abstracts: CaMeL 2503.18813 (77% of AgentDojo tasks with provable security against 84% undefended); FIDES 2505.23643 (type lattice; §5.2 warns that capacity bounds endorse untrusted values); Nasr et al. 2510.09023 (12 defenses, above 90% for most; the paper's own human competition); Greshake et al. 2302.12173.
- Saltzer and Schroeder 1975, Basic.html (the eight principles).
- Watts and Strogatz 1998 (PDF copy, page 1 read: definition of small-world, three examples, infectious disease spreads more easily). Barabási and Albert 1999 (arXiv abstract and PDF pages 1 to 2: growth and preferential attachment; P(k) ~ k^-γ). Pastor-Satorras and Vespignani 2001 (arXiv abstract: absence of an epidemic threshold) and 2002, cond-mat/0107066 (abstract: random immunisation fails on scale-free networks, targeted immunisation of the hubs works; read by the round-1 panel). Centola and Macy 2007 (complex contagions and the weakness of long ties; cited from the round-1 panel's reading, with the lab's own small-world runs as the demonstration). Watts 2002 (abstract via Europe PMC: threshold rule, two regimes, heterogeneity of thresholds versus degree). Cheng and Friedman 2005 (abstract via Semantic Scholar, and the definitions via Loiseau's NetEcon lecture slides as read by the round-1 panel: symmetric means relabelling-invariant; max-flow value-sybilproof; PathRank rank-sybilproof). Douceur 2002 (abstract page). SWIM 2002 (PDF: suspect before failed, refutation, infection-style dissemination; expected first-detection time constant, dissemination logarithmic). Myers and Liskov 1997 (abstract). Newman 2003 (arXiv abstract).

**Could not open (named in lessons without quotation, or cited through the research file that opened them).** Hardy 1988 (cap-lore.com certificate fault; two mirrors 404): the confused deputy is told from Miller 2006 as opened in R3·F19. Watts and Strogatz on nature.com (paywall redirect; PDF copy used instead). Watts 2002 on pnas.org (403; Europe PMC abstract used). Barabási's online textbook chapters (script-rendered; not used). Demers et al. 1987 (cited via R6·F11, which opened the PDF). Centola and Macy 2007 at the publisher (not fetched; the result is stated from the round-1 panel's summary and the lab's own runs). The Barabási–Albert exponent (γ about 3) is stated as the model's exponent from the paper's text, pages 1 to 2 read; the lesson says "near 3".

## 6. Open questions for Vlad

1. **Scenario bases.** The `alert` base carries `measurement: push-probe`, which the lab's receiver state (`ctx.measurements: ["lease-probe"]`) does not list, so a plain alert is held `awaiting-signal`. The course teaches that as the measured path falling to synthesis and attributes the list to the lab's state, since the pilot contract names no measurement. Should the base and the state agree, and should the pilot contract name one?
2. **Direct orders at S1.** The paper's red team (§13.4, case 1) expects a direct order to be held with kernel reach. The 0.3 gate holds the plain order (`awaiting-signal`, T3) and refuses the order with an instruction phrase as `policy`. The course teaches the gate's behaviour and notes the paper's expectation, and says the question is open and not yet one of the sixteen decisions. Is the refusal the intended reading, and does it want a decision number?
3. **Pulses.** A `pulse` with no `evidence` is held `awaiting-signal` (default `synthesis`). The course shows pulses with `evidence: record` and names the exemption as a question for Vlad and Sal. Should liveness messages carry a fixed evidence path, or be exempt?
4. **Dates.** A2A v1.0.0 is tagged 12 March 2026 on GitHub; the paper and R1 say April 2026. The course cites the tag. Amend the paper, or is April the Linux Foundation announcement?
5. **`state`.** The MRTR continuation token is in the contract and not checked by the gate. The course teaches it as "in the contract, not yet enforced" in `mcp`, `envelope` and `conformance`. Keep it on the wire in 0.3, or move it to the backlog until the check exists?
6. **Attribution wording.** brobber's generic MCP findings are attributed as "brobber's red team of an MCP hub design" and nothing else, in one list in `attack`, with a sentence that they sit outside the published pack. Confirm that wording.
7. **Appendix A and D.** The paper's worked exchange uses 0.2 names (`thread`, `hello`) and `from: brainboi@vlad`; the course's wire examples are the builder's 0.3 messages. The course now states what Appendix D marks (partials for A2A on acknowledgement and for both parents on reputation; no evidence-kind row), where the paper's §1.2 says the parents lack all five. Regenerate Appendix A for 0.3, and align §1.2 with Appendix D?
8. **The admitted claim.** The gate admits a record-backed claim whose words are a paraphrased order (case 10 in `attack`), and the course says the nightly pass that reads admitted digests must treat them as syntheses or receive only rebuilt typed fields. The rebuilt object is optional in the research and absent from the pilot gate. Is that the pilot's position, or does the gate owe a transform step?
9. **Malformed receipts.** The 0.3 contract's malformed row reads "no receipt if unverifiable" and the charter owes receipts for verified signatures; §4.2 rule 9 and the gate log every malformed message unanswered. The course follows the gate and says the owners have not settled it (Sal's reading). Which holds?
10. **The paper link.** Every `§` chip resolves to a claude.ai artifact URL. Confirm it opens for a logged-out reader, or link the repository's copy.
11. **Research note R10·§7** says A2A push is at-least-once; the specification promises one attempt. The course says so; the research file is outside the directories the author may write.

## 7. Status (2026-10-03, after the round-1 author pass; Opus repairers follow)

**Complete.** `00-parts.js` and all 36 lessons in §3.2: 5 foundations, 18 core, 3 network, 4 transport, 6 security. Checker at the author's commit: `lessons: 36 in 37 files · parts: 11 · widgets named: 24 · gate cases: 242 run, 242 matched their expect · schema and gate errors: 0`; quiz slots A 7 · B 7 · C 8 · D 8 over 30 quizzes, with the right answer the longest option in 1 of 30. The 242 cases include 42 goal solutions, proved one by one to reach their goal from a preset that does not already meet it.

**Measured with a re-implementation of Iris's method over the lesson data** (paragraph CV over `p` blocks; sentence-length σ/μ over `p` and `callout` sentences; contrastive "never" as `(,| and|;) never`; cross-lesson 8-gram runs extended to maximal length, code and wire excluded): course paragraph CV **0.50** (bar 0.50), no lesson below 0.30; sentence-length σ/μ **0.59** (Iris accepts 0.59 with the rest held); contrastive "never" **1** in all reader text; blocks over 150 words **0**; define cards over 15 words **0**; cross-lesson runs of 15 or more words **0** (was 20 at round 1); takeaway counts 3 in 10 lessons, 4 in 18, 5 in 8; tutor prompts 2 in 4 lessons, 3 in 8, 4 in 4, 5 in 2; kickers in the "A, and B" shape 6 of 36 (was 16); part blurbs as sentences 7 of 11. The orchestrator's rerun of Iris's own script on the pack is the number that counts; these are the author's aim.

**Repairers' commits, reviewed by the author.** Groups A and B landed in `1c3de00`, groups C, D and E in `3d61591`, both against `panel/round-1/PLAN.md`; the author reviewed both diffs for voice and fact and changed three things: the envelope's 70 KB case no longer gives "the signature was verified" as the reason size earns a receipt (the same reasoning would owe malformed messages one, Sal M2); the evidence lab's two measured cases now both speak of the receiver's list and say once that the gate's trace writes `not named by the contract`; the problem table's caption no longer claims that no reviewed protocol carries an evidence kind, which Appendix D does not say. Six places where the repairers departed from the plan (the envelope's receipt rule against P§6.1, the laws sort keying one answer and naming the other, standing's "nobody has yet proven", tr-ack's budgets sentence, net-cascades' SIS conditions, a trimmed sec-injection option) read right and stand.

**Widgets.** From the format's table: `hashLab`, `lossyChannel`, `graphLab`, `tierCalc`, `pageCalc`, `sensorLab`, `relayChain`, `receiptLoop`, `ladder`, `standingClock`, `bspl`, `bindings`, `vectors`, `redteam`; figures `hourglass`, `stack`, `dispositions`, `mcpArch`, `a2aArch`, `twoParents`. Requested in §1 and used by name: `preRotation`, `attentionFlow`, `mailQueue`, figure `twoOwners`. Props passed are in §3.2; `receiptLoop` and `bindings` props await the engine.

**Relative links.** `deeper` links inside the repository are written relative to `course/`: `../docs/explorer/membrane-gate-explorer.html` (`gatekeeper`), `../test-vectors/README.md` and `../test-vectors/vectors-summary.md` (`conformance`). The playground is linked through `{ playground: "" }` (`capstone`).

## 8. Round-0 changes applied (C1 to C18 and the local list)

| Item | What changed, and where |
|---|---|
| C1 one disposition rule | `problem` define and takeaways, `envelope` rule 1 ("Malformed is logged only"), `dispositions` figure caption and a paragraph on the two kinds of message that get no disposition, `gap` sort item: five words everywhere, and a malformed or unsigned message gets none. |
| C2 ask for what the intro asks | Every lab carries `predict`; goal labs set `predict: false`. |
| C3 the reader makes something | Goal labs in envelope, acts, contracts, effects, evidence, standing, bindings, capstone, hashes, net-sybil and sec-keys; a `make` column in §3.2. |
| C4 checks the page cannot answer | gap: twelve unseen features, figure moved below the sort; acts: eight described messages; laws: nine Membrane mechanisms; the recall quizzes in mcp, a2a, gatekeeper and standing rewritten as scenarios. |
| C5 predict before the rule | A cold case opens every core lesson from the envelope on; the lab returns to it. problem, mcp, a2a and laws open on a question the lesson's check answers. |
| C6 retrieval and spacing | One "From earlier (lesson)" case in every lab from acts on; the capstone's lab draws from across the course and its sort maps mechanisms to the four conditions. |
| C7 paragraph variety | Paragraphs re-sized in every lesson. |
| C8 maxims and reversals | Contrastive "never" reduced; gate explanations end on the step, the code or who acts. |
| C9 one copy of brobber's findings | The seven findings live as a numbered list in `attack`; `mcp` and `injection` point to it. |
| C10 counts | Count-announce sentences deleted; miscounts fixed. |
| C11 one mould | Takeaways by material; kickers rewritten; part blurbs as sentences; lessons open on a cold case, a question, a code block or a wire. |
| C12 glossaries | Every define card at 15 words or fewer, no 7-word run shared with its lesson's body. |
| C13 lesson links | Every `[[lesson:x|phrase]]` carries a noun phrase; no "This lesson" sentences. |
| C14 repeated lines | Principal-approval, no-passthrough, backscatter and the Hermes live-session line each stated in full once. |
| C15 small words | "the paper's second reviewer" defined once in `envelope`; "Read it once as text." dropped. |
| C16 walls | No block over 150 words. |
| C17 why held | A three-row table in `gatekeeper`. |
| C18 untaught words | `standing` and `second signal` defined in `effects`; `gateSteps` set on every core lesson with a lab. |

## 9. Round-1 changes applied by the author

| Item | What changed, and where |
|---|---|
| R1 pilot tense | `problem` opens on a constructed message and says the pilot has not run; `capstone` says "the message the pilot design has Hermes write"; `gatekeeper` "In the paper's design, brainboi's gate would run…; no such gate runs yet"; `time` attributes Hermes' hourly cycle to the playground and says Sal's install has no published schedule; `hashes`, `standing`, `sec-keys`, `tr-store-forward` say "the pilot design"; `attack` says none of it has run. |
| R2 capstone counts and tiers | `tier: null` on the clock, stale and scope cases; `T1` on the reply; "Ten cases", titled "One case from every lesson" with no lesson named on a label; "one needs a knob" dropped; "six endings" in objective, text and takeaway, with the five dispositions named once above the goals; the sort has ten items split 3/3/2/2 with one parent idea. |
| R3 A2A push | Six places say one delivery attempt is promised, retries are optional, duplicates are possible, and the client deduplicates and polls `GetTask`. |
| R4 REJECTED | Edges into REJECTED from WORKING and both waiting states, and into CANCELED from the waiting states; the state note, the quiz and the stream caption corrected; machine targets as data. |
| R5 sensor miss | `gatekeeper` and `sec-guards` carry the same claim in different words: a false negative leaves the message where the deterministic steps put it, and the reader of admitted digests must hold no authority or receive rebuilt typed fields; the rebuilt object is called optional and absent from the pilot; `attack` gains case 10, the paraphrased order admitted as fact, and names the nightly pass as the next reader. |
| R6 annex de-duplication | The span check finds no cross-lesson run of 15 or more words; annexes carry one clause plus a labelled link where they restated the core; `sec-abuse`, `tr-store-forward`, `sec-guards`, `sec-keys`, `net-sybil`, `sec-threat`, `capstone`, `layers`, `delivery` and `net-graphs` rewritten; `receiptLoop` and `bindings` given annex props; `graphLab` opens in cascade and Sybil modes. |
| R7 quiz length | Every quiz has the right option at or under the length of its longest distractor, with distractors built from the misconception each `why` names; one new quiz in `bindings` (R13). |
| R8 network facts | "symmetric" redefined as relabelling-invariant; EigenTrust asymmetric-global; `[R7·F12]` dropped from the net-graphs flow sentence; containment scoped to randomly mixed agents; Pastor-Satorras and Vespignani 2002 on targeted immunisation, relays as the hubs to immunise; a Centola–Macy paragraph and a second lab for complex contagion; quiz [17] stem and key fixed; quiz [11] at eighty peers; the Bulletin as pull anti-entropy; SWIM's borrowings named exactly. |
| R10 fixed phrases | Cold cases titled after their case; "Before the rule:" and "The lesson is about…" gone; goal labs titled after what the reader builds; tutor prompts 2 to 5; maxims out of takeaways and gate explanations; "buys nothing" kept once (standing). |
| R11 counts | Takeaways 3/4/5 by material; kickers rewritten (6 pairs left); five part blurbs rewritten as sentences; annexes open on a case; number-pair headings renamed; the capstone sort uneven. |
| R12 goal labs | dispositions (receipt via knob, expiry, stale), time (prompt via severity, cycle via urgency, prompt via budget knob), gatekeeper (policy via strictness, a hold for a signal by making the body a claim), attack (through via the quarantined-answer knob, policy via strictness, lane via `from`); outcome 8 reworded. |
| R13 the parents return | An A2A scenario quiz in `bindings`; a parent item in the capstone sort. |
| R14 gap | Two sort items re-keyed `extended`; the absent items prefixed "Neither parent:"; the five-absences paragraph states what Appendix D marks. |
| R18 security facts | `sec-abuse` says S0 protects admission and attention grows with keys, with a Sybil-flood case in the lab; `sec-injection` and `gatekeeper` say influence and the raise-only rule; the declassification row split from endorsement; `sec-keys` states the validity-window rule with pointers from `hashes` and `standing`; `sec-capabilities` says holder binding and names the receiver's half. |
| R20 quotations | The end-to-end statement set as a marked quotation with its citation; Cheng–Friedman and Douceur rewritten in the course's syntax. |
| R22 policy wording | One sentence under the why-held table; "held by the sensor, code `policy`; Vlad reviews it" in `gatekeeper` and `attack`. |
| Nits taken | The envelope cold case carries the full body with a CR; "open question in the curriculum" gone; Sal's provenance told once (conformance); the trusted-with-nothing host corrected; the human red-team sentence corrected in two lessons; the IETF bar left to the repairers; the laws lesson keeps no gate lab (decision for Vlad in PLAN.md). |
