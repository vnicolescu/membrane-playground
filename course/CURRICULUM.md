# The Membrane course: curriculum

*Written 2026-10-03 by the course's lead learning designer, against paper draft 0.2 (2026-09-14), contract v0.3-draft (`spec.js`), the gate (`gate.js`), the scenario builder (`course/scenario.js`), brobber's pack, R1 to R11, Rev02, and the web checks listed under "Web notes". Revised the same day against the round-0 panel (§8). Lessons are the files in `course/lessons/`; this file is the plan and the record.*

## 1. Widget requests (for the orchestrator; read first)

Four new interactives were requested, three widgets and one figure; all four are built and used by name. Everything else uses the format's existing table.

### 1.1 `preRotation` (widget) · used in `sec-keys`

What it shows: why a stolen signing key cannot take an identifier when the next key was committed in advance (paper §9.2, KERI).

- **State.** An identifier card: `id`, current public key `K1`, `next: digest(K2)`. A message pad. An attacker panel.
- **Controls.** `Sign a message with K1` (shows the signature verifying against the card). `Steal K1` (the attacker panel now holds K1; the attacker can sign messages that verify, and the card marks them "valid signature, same identifier"). `Attacker rotates to K3 using K1` (fails: a rotation must be signed with the key whose digest is on the card, and K1's digest is not). `Owner rotates to K2, commits digest(K3)` (succeeds: the card now shows `K2`, `next: digest(K3)`; messages signed with the stolen K1 stop verifying). A toggle `no pre-rotation`: with it on, the attacker's rotation succeeds and the owner is locked out.
- **What the reader learns.** Two separate claims: the signature proves the key; the pre-rotation proves the controller. A thief holding the current key can forge messages until the owner rotates, and cannot move the identifier.
- **Calls.** `Gate.simHash` for the digests, labelled "simulation hash, not SHA-256". No gate evaluation.

### 1.2 `attentionFlow` (widget) · used in `tr-ack`, pointed to from `time` and `gatekeeper`

What it shows: flow control where the scarce resource is the owner's attention (paper §6.4 hold budget, §7.2 interrupt budget, decision D6).

- **Inputs.** Number of keyed peers (1 to 3). Messages per peer per day (1 to 10). Share of messages that trip the sensor (slider, 0 to 100%). Share that are alerts claiming `immediate` (slider). Knobs: `holdBudget` (default 3), `interruptBudget` (default 2), `ownerMinutesPerDay` (default 15), and a toggle `receiver-wide cap` (off by default; when on, total holds per day across all peers are capped at `holdBudget`).
- **What moves.** A day strip per peer: each message is a tick coloured by disposition. A meter for the owner's minutes: each hold costs 3 minutes, each page 5 (shown as assumptions, editable). Refusals with `hold-budget` appear once the per-sender budget is spent. With the receiver-wide cap off and two or three peers, the meter overflows at the defaults: the point D6 makes.
- **What the reader learns.** A per-sender budget bounds one sender; the owner's day is bounded only by a receiver-wide cap. Budgets are flow control for attention.
- **Calls.** `Gate.evaluate` per message with `ctx.holdsToday[from]` and `ctx.rateToday[from]` carried forward within the day; `Gate.pageDecision` for alerts with `ctx.interruptsThisWeek` carried forward. Bodies: the clean ask from `course/scenario.js` for calm messages and the `claim` base with an injection phrase for sensor-tripping ones.

### 1.3 `mailQueue` (widget) · used in `tr-store-forward`

What it shows: a store-and-forward mailbox with a receiver that runs on a cycle, so expiry is judged on the receiver's clock (paper §6.1, §7.1 Mailbox; SMTP and DTN precedents).

- **Inputs.** The receiver's cycle in minutes (60 to 720; brainboi's is 360). A transport outage toggle with a duration (0 to 72 hours). Knobs: `expiryHours` (default 48), `resendPolicy` (`none`, `once`, `unlimited`). A `send` button that writes an ask into the sender's lane at the current simulated time, and a `resend` button that sends the same body under a new `id` with the expired message in `re`.
- **What moves.** A timeline: the sender's lane fills; the receiver's runs are ticks on a cycle; an outage greys the transport; each message is evaluated at the first receiver run after it becomes reachable, with `ctx.now` set to that run. Messages whose `expires` passed before the run show `expired`; the first resend is judged afresh; the third copy of the same body shows `refused · expired-before`. A side legend states SMTP's floor and horizon (retry at least 30 minutes apart, give up after 4 to 5 days; RFC 5321 §4.5.4.1, text inherited from RFC 1123 §5.3.1.1).
- **What the reader learns.** The receiver's fetch time is the clock that matters; a `by` shorter than the receiver's cycle binds nothing; one honest resend is allowed and repetition earns nothing.
- **Calls.** `Gate.evaluate` with `ctx.now` at each run and `ctx.expiredBodies[bodyHash]` incremented on each expiry.

### 1.4 `twoOwners` (figure) · used in `sec-threat`

What it shows: the threat surface of a two-owner exchange, with the gate step that covers each entry point.

- **Drawing.** Left: Vlad, brainboi (kernel, memory, tools), brainboi's gate as a separate operating-system user, a pinned trust root beside the gate and outside the transport. Right: the mirror for Sal and Hermes. Between: the transport as two one-way lanes (`lanes/hermes/out/`, `lanes/brainboi/out/`) plus `PROTOCOL.md`, `allowed_signers` and `owners/PAUSE`. Numbered entry points with hover labels: 1 forged signer (`signature`), 2 write into the other lane (`lane`), 3 harness or trust-root path in a commit (`scope`), 4 control characters in a header (`syntax`), 5 instruction text in the body (`sensor`), 6 an acceptance line that reaches memory (`release` at T1), 7 replay and flood (`duplicate`, `rate`), 8 a clock set ahead (`clock`), 9 contract swap (`contract`, `scope`), 10 hold flooding (`budget`).
- **Static**, two themes, hover reveals the step name and reason code. No gate calls.

## 2. Audience and outcomes

**Audience.** Engineers and designers who build or run agents and have used at least one LLM API. No prior reading of Membrane, MCP or A2A is assumed. Readers who know hashes, layering, delivery semantics, JSON-RPC or prompt injection skip the matching foundation.

**Outcomes.** After the core track the reader can:

1. Write a valid Membrane message by hand and say which byte rule each line obeys.
2. Predict what a receiver's gate does with a message (one of `admitted`, `held`, `refused`, `expired`, or no disposition) and name the deciding step and reason code.
3. Explain each of the nine laws with the mechanism behind it and one outside field that reached it first.
4. Place Membrane against MCP and A2A: what it borrows, what it extends, where their assumptions break between two owners, and what both leave absent.
5. Read the pilot contract, say which messages are enabled after any message, and compute the effect tier of a request.
6. Run the 29 conformance vectors and read a failure.
7. Attack the gate with the six challenge shapes and say why each fails under the defaults and which switched-off rule would let it through.
8. Make the gate produce a named outcome by editing a message: every core lesson from the envelope on has a goal lab checked by the real gate.

**Status.** Membrane is a draft. Defaults are starting values, unmeasured. Nothing has run between brainboi and Hermes. Every lesson that touches a number says so.

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

Minutes are reading plus one pass through the checks. `Check` names the predict-and-run elements and what each lab asks the reader to predict. `Make` names the goals the reader reaches by editing the message or a knob, each proved reachable by the checker. `Stamps` are the running envelope's fields the lesson lights up.

| file | id | title | min | part | prereq | check | make | widgets and figures | stamps |
|---|---|---|---|---|---|---|---|---|---|
| `01-hashes.js` | `hashes` | Hashes and signatures | 8 | foundations | | quiz; gate (disposition) | drop the hash line; break the `from` grammar | `hashLab` | |
| `02-layers.js` | `layers` | The narrow waist | 7 | foundations | | quiz | | `stack`, `hourglass` | |
| `03-delivery.js` | `delivery` | Delivery semantics | 9 | foundations | | sort; gate (disposition, reason) | | `lossyChannel` | |
| `04-jsonrpc.js` | `jsonrpc` | JSON-RPC and HTTP | 8 | foundations | | 2 quizzes | | | |
| `05-injection.js` | `injection` | Injection and the confused deputy | 9 | foundations | | 2 quizzes | | | |
| `10-problem.js` | `problem` | Two owners, one line | 8 | problem | `injection` | cold question; sort (8 items, two close the question) | | | |
| `11-mcp.js` | `mcp` | MCP from first principles | 12 | parents | `jsonrpc` | cold question; 2 scenario quizzes | | `mcpArch` | |
| `12-a2a.js` | `a2a` | A2A from first principles | 12 | parents | `jsonrpc` | cold question; machine with two targets; scenario quiz | | `a2aArch` | |
| `13-gap.js` | `gap` | The gap | 9 | parents | `layers` | sort of 12 unseen features, figure after as the reveal | | `twoParents` | |
| `20-envelope.js` | `envelope` | The envelope | 11 | waist | `hashes` | cold case; gate (disposition, receiptOwed) | version; grammar; not-addressed; unsupported-extension | `hourglass` | `membrane`, `id`, `from`, `to`, `at`, `body` |
| `21-acts.js` | `acts` | Acts and commitments | 10 | waist | | cold case; machine with two targets; gate (disposition, admittedAs) with a from-earlier case; sort of 8 described messages | act mismatch; turn cap; cancel of itself | | `act`, `form`, `context`, `turn` |
| `22-contracts.js` | `contracts` | Contracts | 10 | waist | | cold case; gate (disposition, decisiveStep) with a from-earlier case | contract-mismatch; T4 hold by removing `form`; malformed by dropping `acceptance` | `bspl` | `contract`, `by`, `acceptance` |
| `23-dispositions.js` | `dispositions` | Dispositions and receipts | 11 | waist | `delivery` | cold case; gate (disposition, receiptOwed) with a from-earlier case; scenario quiz | | `dispositions`, `receiptLoop` | |
| `30-effects.js` | `effects` | Effects and tiers | 11 | gate | | cold case; gate (disposition, tier) with a from-earlier case | hold for the owner; hold for a signal; effect-exceeds-tier | `tierCalc` (after the lab) | `effect` |
| `31-evidence.js` | `evidence` | Evidence and two signals | 11 | gate | | cold case; gate (disposition, reason) with a from-earlier case; quiz | admitted as fact via a named measurement; hold for the owner; malformed label | `relayChain` | |
| `32-gatekeeper.js` | `gatekeeper` | The gatekeeper | 12 | gate | `injection` | cold case; gate (disposition, decisiveStep) with a from-earlier case; scenario quiz; "why held" table | | `sensorLab` | |
| `40-time.js` | `time` | Time | 12 | time | `delivery` | cold page case; gate (page, level); gate (disposition, decisiveStep) with a from-earlier case | | `pageCalc`, `ladder` | |
| `41-standing.js` | `standing` | Identity and standing | 11 | time | `hashes` | cold case; gate (disposition, standing) with a from-earlier case; scenario quiz | lane refusal by changing `from`; admit via the newcomer knob | `standingClock` | |
| `50-laws.js` | `laws` | Nine laws | 10 | laws | | cold question; sort of 9 Membrane mechanisms to laws | | | |
| `51-attack.js` | `attack` | Attacking the gate | 12 | laws | `injection` | cold case; gate (disposition, reason) with a from-earlier case | | `redteam` | |
| `60-bindings.js` | `bindings` | Bindings and the pilot | 11 | ship | `jsonrpc` | cold case; gate (disposition, reason) with a from-earlier case | not-addressed; clock | `bindings` | |
| `61-conformance.js` | `conformance` | Conformance | 9 | ship | | 2 quizzes | | `vectors` | |
| `62-capstone.js` | `capstone` | Decisions and the capstone | 12 | ship | | goal lab; cumulative gate (disposition, tier) of nine cases from every part; sort of mechanisms to the four conditions | refused; held for the owner; held for a signal; expired; logged only | | all fourteen |
| `80-net-graphs.js` | `net-graphs` | Graphs and degree | 10 | annex-network | | 2 quizzes | | `graphLab` | |
| `81-net-cascades.js` | `net-cascades` | Cascades and gossip | 10 | annex-network | `net-graphs` | 2 quizzes | | `graphLab` | |
| `82-net-sybil.js` | `net-sybil` | Sybils and trust flow | 10 | annex-network | `net-graphs` | gate (disposition, standing); quiz | lane refusal; admit via the newcomer knob | `graphLab` | |
| `85-tr-e2e.js` | `tr-e2e` | The end-to-end argument | 9 | annex-transport | `layers` | quiz | | | |
| `86-tr-store-forward.js` | `tr-store-forward` | Store and forward | 10 | annex-transport | `delivery` | gate (disposition, decisiveStep) | | `mailQueue` | |
| `87-tr-ack.js` | `tr-ack` | Acknowledgement and attention | 10 | annex-transport | `delivery` | gate (disposition, receiptOwed) | | `attentionFlow`, `receiptLoop` | |
| `88-tr-bindings.js` | `tr-bindings` | How the bindings carry bytes | 11 | annex-transport | `jsonrpc` | 2 quizzes | | `bindings` | |
| `90-sec-threat.js` | `sec-threat` | Threat model for two owners | 10 | annex-security | `injection` | sort of 10 attacks to steps | | `twoOwners` | |
| `91-sec-injection.js` | `sec-injection` | Injection by design | 11 | annex-security | `injection` | 2 quizzes | | `sensorLab` | |
| `92-sec-capabilities.js` | `sec-capabilities` | Capabilities and least privilege | 10 | annex-security | | gate (disposition, reason); sort | | | |
| `93-sec-keys.js` | `sec-keys` | Keys, roots and logs | 10 | annex-security | `hashes` | gate (disposition, reason); quiz | let the key-list edit through with the root unpinned; stop the same edit at the grammar | `preRotation` | |
| `94-sec-abuse.js` | `sec-abuse` | Replay, backscatter, Sybil, flood | 10 | annex-security | `delivery` | gate (disposition, receiptOwed); quiz | | | |
| `95-sec-guards.js` | `sec-guards` | Why guards fall | 8 | annex-security | | 2 quizzes | | | |

Totals: foundations 41 min; core 192 min; network annex 30 min; transport annex 40 min; security annex 59 min. 36 lessons, about six hours. 31 goals in 13 labs; 194 predicted cases.

### 3.3 Per-lesson plan lines

The plan lines of the first draft stand, with the round-0 additions in §8. In short: each core lesson from the envelope on opens on a cold case (a one-case gate block the reader predicts before the rule, returned to inside the lab), every lab names the parts it asks the reader to predict, every lab from contracts on carries one case labelled "from earlier", and the lessons named in the `make` column end with a goal lab.

## 4. Design notes

- **Order.** The brief's core path is kept. "Time" (channels, urgency, escalation, liveness) is one lesson of 12 minutes with taxonomy first; "identity and standing" follows it so the ceiling and the demotion clock are read together. Bindings precede conformance because the vectors assume the lane model.
- **Versions.** The course teaches contract 0.3 and says so once, in a collapsed note in `envelope`: `thread` became `context`, `hello` became `card`, `awaiting-owner` and `awaiting-signal` were added, `size` was split from `malformed`, `state` was borrowed from MCP. The paper's Appendix A uses 0.2 names and `from: brainboi@vlad`; the course's wire examples use the scenario builder's 0.3 form.
- **The running example.** Hermes asks brainboi which week of the pilot it is. Its header, in wire order: `membrane, id, from, to, act, form, at, by, effect, contract, context, acceptance, turn, body`. `envelope` stamps six, `acts` four, `contracts` three, `effects` one; `capstone` stamps all fourteen and sends the clean exchange through the gate.
- **One disposition rule.** Five dispositions: sealed, held, admitted, refused, expired. A malformed or unsigned message gets none and is logged only. `problem`, `envelope`, `dispositions` and `gap` all say it the same way; the lab's prediction row sets "no disposition · logged only" apart.
- **Gate cases.** Every `gate` block states `expect`, and `node course/dev/check.js` runs it. Conventions found while probing the real gate: the `accept`, `reply` and `receipt` bases were first timestamped after the receiver's default clock (10:00) and refused with `clock`; the orchestrator moved them to 09:20, 09:40 and 09:55 on 2026-10-03, and the lessons still set `ctx.now` explicitly wherever time is the point. The `alert` base carries `measurement: push-probe`, which brainboi's contract does not name, so a plain alert is held `awaiting-signal`; lesson `time` teaches that as the measured path falling to synthesis. The authority spoof needs `msg.signer` and `msg.lane` set to `hermes` (the builder otherwise makes the signer equal `from`). A receipt about a message never sent is shown by changing `re` (an empty `ctx.sent` merges over the base map). A direct order inside a request at S1 is held `awaiting-signal` at T3 when the body is a plain order, and refused `policy` at T2 when it also carries an instruction phrase (the pattern flag raises T1 to T2, and T2 needs S2 and a capability); the same order inside an assert is held `policy` for the owner, which is where the hold budget bites.
- **brobber's material.** ARCH.md, the vectors, the proposals and the explorer appear as `brobber` callouts in `gatekeeper` and `conformance`. The seven generic findings from the client study live in one place, as a list in `attack`, each mapped to a Membrane rule and a runnable case; `mcp` keeps one finding about consent in new words and points to `attack`; `injection` points to `attack` for the path-check case; no security annex lesson restates them. Attribution everywhere is "brobber's red team of an MCP hub design", with no firm, size, vendor, product or brief named.
- **Honesty.** Each lesson that quotes a default says it is a starting value. The pilot is described as a design. The sensor is described as the component that reads hostile text.
- **Privacy.** No quotation from S1, S2 or Rev01. House anecdotes appear only in the generic form the paper uses, with no people beyond Vlad, Sal, brainboi, Hermes and brobber. The paper's second reviewer is defined once (`envelope`, as the critic whose findings are cited as Rev02) and cited by chip after that.

## 5. Web notes

Today is 2026-10-03. Read-only; nothing was sent.

**Searched.** "Model Context Protocol specification revision after 2026-07-28 changelog" · "A2A protocol release v1.0.2 OR v1.1 a2aproject github releases 2026" · the RFC 5321 §4.5.4.1 retry sentences (to locate a quotable copy).

**Opened, parents.**
- modelcontextprotocol.io/specification/versioning: "The current protocol version is 2026-07-28." Revision states Draft, Current, Final; twelve-month deprecation floor; negotiation per request.
- modelcontextprotocol.io/specification/draft/changelog: "Changes since the most recent release will accumulate here." (empty).
- modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http: single POST endpoint; every client message its own POST; `Accept` lists both `application/json` and `text/event-stream`; servers MUST NOT send JSON-RPC requests on a stream; `subscriptions/listen` for long-lived notifications; `Last-Event-ID` resumability not supported; `MCP-Protocol-Version`, `Mcp-Method`, `Mcp-Name`, `Mcp-Param-{name}` headers; `HeaderMismatch` `-32020`; `Origin` validation against DNS rebinding.
- github.com/a2aproject/A2A/releases: newest tag v1.0.1 (28 May 2026); v1.0.0 (12 March 2026); nothing later. github.com/a2aproject/A2A/releases/tag/v1.0.0: "1.0.0 (2026-03-12)".
- a2a-protocol.org/latest/specification/: header "Latest Released Version 1.0.0"; three bindings (JSON-RPC, gRPC, HTTP+JSON/REST) as Layer 3 mappings of one abstract model; clients MUST send `A2A-Version` (0.3 assumed when empty); push notifications as server-initiated POST to a client webhook.

**What changed since 14 September 2026.** Nothing in MCP: 2026-07-28 is still Current and the draft changelog is empty. Nothing in A2A: v1.0.1 is still the newest release. One correction to the record: the paper (§1.2) and R1·F3 date A2A v1.0 to April 2026; GitHub dates the v1.0.0 tag 12 March 2026. Lesson `a2a` carries this as a `web` callout. R10's note that the site header says 1.0.0 while the tag is v1.0.1 still holds.

**Opened, foundations and annexes (primary pages unless marked).**
- jsonrpc.org/specification (Request, Notification, Response, Error, reserved codes, batch).
- Saltzer, Reed and Clark 1984, web.mit.edu PDF, pages 1 to 3 read (statement of the argument; careful file transfer; "performance enhancement").
- RFC 1123 §5.3.1.1 via freesoft.org (the retry sentences RFC 5321 §4.5.4.1 inherits: "at least 30 minutes", "at least 4-5 days"); RFC 5321 §2.1 and §3.7.2 opened at rfc-editor.org (responsibility handoff after the 250 reply; `Received:` lines). The RFC 5321 §4.5.4 text itself did not load in any fetch (page truncation); the course quotes RFC 1123 and names RFC 5321.
- RFC 3834 §2, §3.1.3 (no response to auto-submitted mail; one response per sender per period; one recipient per response). RFC 8098 §2.1, §3.2.6.2 (MDN never answers an MDN; the request may be ignored; disposition types).
- RFC 9413 (faults entrenched as de facto standard; fix one bug over many workarounds). RFC 8701 (GREASE; random reserved values; ignore unknown values). RFC 6710 (priority -9 to 9; no upgraded priority from unauthorized sources; "always requesting priority 9" as denial of service). RFC 7515 §4.1.11 (`crit`; "the JWS is invalid" if not understood; protected header only). RFC 9162 (append-only via Merkle trees; consistency proofs; monitors; a log showing different views must be treated as a trusted third party). RFC 9171 (store-carry-forward; lifetime; four status reports). RFC 4838 §3.1, §3.10 (store-and-forward; custody transfer). RFC 8032 (Ed25519: 32-byte keys, 64-byte signatures, about 128-bit security).
- FIPS 180-4 PDF (SHA-224/256/384/512 family; SHA-256 digest 256 bits; infeasible to invert or to find collisions).
- git-scm.com/docs/git-config (`gpg.format = ssh`; `gpg.ssh.allowedSignersFile` with `valid-after`/`valid-before`; `gpg.ssh.revocationFile`).
- simonwillison.net Dual LLM (2023). arXiv abstracts: CaMeL 2503.18813 (77% of AgentDojo tasks with provable security against 84% undefended); FIDES 2505.23643; Nasr et al. 2510.09023 (12 defenses, above 90% for most); Greshake et al. 2302.12173.
- Saltzer and Schroeder 1975, Basic.html (the eight principles).
- Watts and Strogatz 1998 (PDF copy, page 1 read: definition of small-world, three examples, infectious disease spreads more easily). Barabási and Albert 1999 (arXiv abstract and PDF pages 1 to 2: growth and preferential attachment; P(k) ~ k^-γ). Pastor-Satorras and Vespignani 2001 (arXiv abstract: absence of an epidemic threshold). Watts 2002 (abstract via Europe PMC: threshold rule, two regimes, heterogeneity of thresholds versus degree). Cheng and Friedman 2005 (abstract via Semantic Scholar: no symmetric sybilproof function; asymmetric flow-based one). Douceur 2002 (abstract page). SWIM 2002 (PDF: suspect before failed, refutation, infection-style dissemination). Myers and Liskov 1997 (abstract). Newman 2003 (arXiv abstract).

**Could not open (named in lessons without quotation, or cited through the research file that opened them).** Hardy 1988 (cap-lore.com certificate fault; two mirrors 404): the confused deputy is told from Miller 2006 as opened in R3·F19. Watts and Strogatz on nature.com (paywall redirect; PDF copy used instead). Watts 2002 on pnas.org (403; Europe PMC abstract used). Barabási's online textbook chapters (script-rendered; not used). Demers et al. 1987 (cited via R6·F11, which opened the PDF). The Barabási–Albert exponent (γ about 3) is stated as the model's exponent from the paper's text, pages 1 to 2 read; the lesson says "near 3".

## 6. Open questions for Vlad

1. **Scenario bases.** The `alert` base now carries `measurement: push-probe`, which brainboi's contract (`ctx.measurements: ["lease-probe"]`) does not name, so a plain alert is held `awaiting-signal` rather than admitted. The course teaches that as the measured path falling to synthesis, and lesson `time` has a case where the contract names the probe. Is the mismatch intended, or should the base and the contract agree?
2. **Direct orders at S1.** The paper's red team (§13.4, case 1) expects a direct order to be held with kernel reach. The 0.3 gate holds the plain order (`awaiting-signal`, T3) and refuses the order with an instruction phrase as `policy` (the pattern flag raises T1 to T2, and T2 needs S2 plus a capability). The course teaches the gate's behaviour and notes the paper's expectation. Is the refusal the intended reading for the phrase form, or should a pattern-raised T2 hold for the owner instead?
3. **Pulses.** A `pulse` with no `evidence` is held `awaiting-signal` (default `synthesis`). The course shows pulses with `evidence: record`. Should liveness messages carry a fixed evidence path, or be exempt?
4. **Dates.** A2A v1.0.0 is tagged 12 March 2026 on GitHub; the paper and R1 say April 2026. The course cites the tag. Amend the paper, or is April the Linux Foundation announcement?
5. **`state`.** The MRTR continuation token is in the contract and not checked by the gate. The course teaches it as "in the contract, not yet enforced" in `mcp`, `envelope` and `conformance`. Keep it on the wire in 0.3, or move it to the backlog until the check exists?
6. **Attribution wording.** brobber's generic MCP findings are attributed as "brobber's red team of an MCP hub design" and nothing else, in one list in `attack`. Confirm that wording.
7. **Appendix A.** The paper's worked exchange uses 0.2 names (`thread`, `hello`) and `from: brainboi@vlad`. The course's wire examples are the builder's 0.3 messages. Should Appendix A be regenerated for 0.3 so the two agree byte for byte?
8. **The editable wire and hashes.** The goal labs assume that a reader who edits the body in the editor must also update the `body:` hash line (or the gate reports malformed). If the renderer recomputes the hash on edit, the `hashes` lesson's "edited body" case stays as a fixed variant and the point is still made; if it does not, a goal "change the body and leave the hash" could be added there.

## 7. Status (final, 2026-10-03, after the round-0 revision)

**Complete.** `00-parts.js` and all 36 lessons in §3.2: 5 foundations, 18 core, 3 network, 4 transport, 6 security. Final checker run: `lessons: 36 in 37 files · parts: 11 · widgets named: 24 · gate cases: 225 run, 225 matched their expect · schema and gate errors: 0`. The 225 include 31 goal solutions, each proved to reach its goal from a preset that does not already meet it.

**Measured with a re-implementation of Iris's method over the lesson data** (paragraph CV over `p` blocks; sentence-length σ/μ over `p` and `callout` sentences; contrastive "never" as `(,| and|;) never`): course paragraph CV **0.520** (bar 0.50; was 0.365 at round 0), no lesson below 0.30 (lowest: conformance 0.31, net-cascades 0.38); sentence-length σ/μ **0.594** (bar 0.60; was 0.585); contrastive "never" **6** in all reader text across 36 lessons, at most one per lesson (was 44 in 16); define cards over 15 words **0** (was 106 across 36); blocks over 150 words **0** (was 7); bare `[[lesson:x]]` links **0**; "This lesson" **0**; kickers opening on a number **2 of 36**; takeaway counts 3 in 7 lessons, 4 in 26, 5 in 3; every lab names its `predict` parts; `goals` in 13 labs. The orchestrator's rerun of Iris's own script on the pack is the number that counts; these are the author's aim.

**Widgets.** From the format's table: `hashLab`, `lossyChannel`, `graphLab`, `tierCalc`, `pageCalc`, `sensorLab`, `relayChain`, `receiptLoop`, `ladder`, `standingClock`, `bspl`, `bindings`, `vectors`, `redteam`; figures `hourglass`, `stack`, `dispositions`, `mcpArch`, `a2aArch`, `twoParents`. Requested in §1 and now used by name: `preRotation`, `attentionFlow`, `mailQueue`, figure `twoOwners`. No further requests.

**Web.** Nothing opened since §5 was written. The one correction the web forced (A2A v1.0.0 dated 12 March 2026) is in lesson `a2a`; the MCP "nothing changed" check is in lesson `mcp`.

**Relative links.** `deeper` links inside the repository are written relative to `course/`: `../docs/explorer/membrane-gate-explorer.html` (`gatekeeper`), `../test-vectors/README.md` and `../test-vectors/vectors-summary.md` (`conformance`). The playground is linked through `{ playground: "" }` (`capstone`).

## 8. Round-0 changes applied (C1 to C18 and the local list)

| Item | What changed, and where |
|---|---|
| C1 one disposition rule | `problem` define and takeaways, `envelope` rule 1 ("Malformed is logged only", with the paper's wording explained), `dispositions` figure caption and a paragraph on the two kinds of message that get no disposition, `gap` sort item: five words everywhere, and a malformed or unsigned message gets none. |
| C2 ask for what the intro asks | Every lab carries `predict`: envelope (disposition, receiptOwed), acts (disposition, admittedAs), contracts (disposition, decisiveStep), dispositions (disposition, receiptOwed), effects (disposition, tier), evidence (disposition, reason), gatekeeper (disposition, decisiveStep), time (page, level; disposition, decisiveStep), standing (disposition, standing), attack and bindings (disposition, reason), capstone (disposition, tier); foundations and annexes likewise. Goal labs set `predict: false`. |
| C3 the reader makes something | Goal labs in envelope (4), acts (3), contracts (3), effects (3), evidence (3), standing (2), bindings (2), capstone (5), hashes (2), net-sybil (2), sec-keys (2): 31 goals. A `make` column in §3.2. |
| C4 checks the page cannot answer | gap: twelve unseen features, figure moved below the sort; acts: eight described messages; laws: nine Membrane mechanisms; the recall quizzes in mcp, a2a, gatekeeper and standing rewritten as scenarios; conformance's long correct options shortened. |
| C5 predict before the rule | A "Cold case" gate block opens envelope, acts, contracts, dispositions, effects, evidence, gatekeeper, time, standing, attack and bindings; the lab returns to it under "From the cold open". problem, mcp, a2a and laws open on a question the lesson's check answers. |
| C6 retrieval and spacing | One "From earlier (lesson)" case in every lab from acts on; the capstone's lab draws nine cases from every part and its sort maps mechanisms to the four conditions; problem now promises that capstone check by name. |
| C7 paragraph variety | Paragraphs re-sized in every lesson: one-sentence rules stand alone, precedents carry the long paragraphs, thin set-ups merged; course CV 0.52, every lesson at or above 0.31. |
| C8 maxims and reversals | Contrastive "never" reduced to at most one per lesson (6 in the course); the duplicate "Attention has a cap." removed; gate explanations end on the step, the code or who acts; paragraph-closing epigrams rewritten as mechanisms. |
| C9 one copy of brobber's findings | The seven findings live as a numbered list in `attack`, each mapped to a rule and a case; `mcp` keeps one consent finding in new words plus a pointer; `injection` points to `attack`; no annex restates them. |
| C10 counts | Count-announce sentences deleted before lists and tables; miscounts fixed (envelope's 0.3 note: two renames and three additions; time: the ladder rules as a list; attack: the cases placed by the table's last column; laws: the seven never-dos listed; envelope: `act` named as the next lesson's). Headings carry numbers only where the number is the content. |
| C11 one mould | Takeaways 3 to 5 by material; kickers rewritten (2 of 36 open on a number; lists cut to clauses); half the part blurbs are sentences; lessons open on a cold case, a question, a code block or a wire rather than always a paragraph; define blocks sit after the first idea. |
| C12 glossaries | Every define card at 15 words or fewer, no 7-word run shared with its lesson's body (second-reviewer, standing and second-signal cards added where first used). |
| C13 lesson links | Every `[[lesson:x|phrase]]` carries a noun phrase; annex pointers moved to `deeper`; no "This lesson" sentences remain. |
| C14 repeated lines | Principal-approval, no-passthrough, backscatter and the Hermes live-session line each stated in full once and shortened or varied elsewhere. |
| C15 small words | "the paper's second reviewer" defined once in `envelope` and cited by chip; "Read it once as text." dropped; "honest" kept only in "honest resend". |
| C16 walls | time's staking rules and the ladder's rules as lists; attack's seven findings as a list; gatekeeper's two-layers paragraph split; the 0.3 renames in a collapsed note; no block over 150 words. |
| C17 why held | A three-row table in `gatekeeper` ("Why a message is held": owner, signal, sensor; the budget beside it), referenced from the capstone's alert case. |
| C18 untaught words | `standing` and `second signal` defined in `effects`; `gateSteps` set on every core lesson with a lab. |
| Local | problem's table headed "Mechanism" with a condition column; gap's "five parts" line rewritten with distinct link phrases; a2a's dangling link fixed and the machine's terminal states routed below the WORKING row with a trimmed top; time's ladder printed once (widget plus a rule list); `hourglass` added to envelope; `tierCalc` moved after the effects lab; machines given two-target prompts; capstone links the playground through `{ playground: "" }`. |
