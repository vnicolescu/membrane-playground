---
thread: R8 – what makes a protocol minimal, universal and long-lived
date: 2026-09-14
sources_opened: 40
---
# R8 – Minimal, universal, long-lived: design laws for an agent protocol

Scope: architecture principles (end-to-end, hourglass), robustness and extensibility (RFC 9413, 9170, 8701, 6709), case studies of winners and losers, the folk laws, legibility for machine-and-human readers, and the standardization path. Deliverables (a)–(d) sit at the end of section 2; section 1 carries the evidence.

## 1. Findings

**F1. The end-to-end argument: the acknowledgement that matters is the one only the target can originate.** A function can be implemented completely and correctly only with the knowledge of the application at the endpoints; a lower layer's version of it is at best a performance enhancement. The paper's delivery example: a network can ack that a message arrived, but what the sender needs is the target application saying it did or did not do the thing, because anything can fail between delivery and action. Duplicate suppression is the same: the application retries on a lost ack and creates duplicates only it can detect, so the dedupe mechanism belongs at the end and must key on something inside the message. The authors call it a guideline, not an absolute, and say the hard part is identifying the endpoints. · Prevents: building reliability into the pipe that the ends must rebuild anyway, and trusting a delivery ack as a completion signal. · Cost: every endpoint must implement its own checks and ids. · Saltzer, Reed, Clark, ACM TOCS 2(4), 1984, https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf · `opened`

**F2. Trust-to-trust: a function belongs at a point the principals trust, and an intermediary is legitimate only if an end put it there.** Clark and Blumenthal (2011) restate the argument: the function can be done correctly only by an application at a point trusted by the principals to do its job; trust is decided by the principals, which forces the question "trusted by whom". Delegation (to a mail provider, a CDN) is compatible with this when the end chose it. Endorsing an earlier IAB analysis, they list two conditions: delegation is acceptable only if one end explicitly installed it (no injection by unrelated actors), and messages to the service element must be explicitly addressed to it, with encryption ensuring only expected elements participate. The 2001 paper had already named the loss of trust between users as the main change since the early Internet. · Prevents: silent middleboxes that inspect or rewrite traffic nobody asked them to touch. · Cost: explicit addressing and key management. · Clark & Blumenthal, Fed. Comm. L.J. 63(2), 2011, https://groups.csail.mit.edu/ana/The%20End-to-End%20Argument%20and%20Application%20Design_%20The%20Role%20of%20Trust.pdf · `opened`. Blumenthal & Clark, ACM TOIT 1(1), 2001 (DSpace preprint 2000), https://dspace.mit.edu/handle/1721.1/1519 · abstract `opened`, body `secondary` via RFC 3724 (IAB, 2004), https://datatracker.ietf.org/doc/html/rfc3724 · `opened`

**F3. The hourglass theorem: a weaker spanning layer has fewer possible applications but more possible implementations; choose the necessary applications first, then the weakest layer sufficient for them.** Beck formalizes "weaker" as logical entailment between specifications and proves that weakening the waist shrinks what can be built on it and grows what can implement it. He defines minimal sufficiency (sufficient for the necessary set N, with no strictly weaker sufficient spec) and states the Deployment Scalability Tradeoff: adoption breadth trades against simplicity, generality and resource limits. His key design consequence: the choice of N is the most consequential decision in defining a waist. Unix's fork() is his example of a logically weak primitive that spread. · Prevents: a waist so strong only one vendor can implement it. · Cost: every application above must do more work. · Beck, CACM 62(7) 2019 (arXiv 1607.07183, 2016), https://arxiv.org/abs/1607.07183 · `opened`

**F4. Waists ossify by competition, and a newcomer survives by not competing head-on.** EvoArch, an evolutionary model in which protocols gain value from the layers above and die when a same-layer competitor overlaps their products, reproduces the hourglass from generic starting conditions. Parameterized to the TCP/IP stack, a new protocol survives only if its value is close to the incumbent's (about 90% of it in their fit); the good strategy is mostly non-overlapping services. Their historical reading: TCP/IP grew in the 1970s–80s by carrying email, FTP and Telnet, which the phone network did not offer, and only later displaced it. · Prevents: launching a protocol straight into an incumbent's niche. · Cost: you must pick a niche the incumbents leave empty. · Akhshabi & Dovrolis, SIGCOMM 2011, https://faculty.cc.gatech.edu/~dovrolis/Papers/evoarch.pdf · `opened`

**F5. Postel reversed: tolerance of malformed input causes protocol decay.** RFC 9413 says silent acceptance of faulty input lets bugs become de facto spec, forces bug-for-bug compatibility on new implementations and narrows the niche for them. It recommends active maintenance and fatal, visible errors on malformed input, while distinguishing that from designed extensibility, where the rules for unknown things are written down in advance. · Prevents: the de facto spec drifting away from the written one. · Cost: early deployments break loudly. · Thomson & Schinazi, RFC 9413, IAB, June 2023, https://www.rfc-editor.org/rfc/rfc9413.html · `opened`

**F6. Use it or lose it: extension points that are not exercised rust shut.** RFC 9170 documents TLS servers breaking on unknown version numbers (so TLS 1.3 abandoned in-band version negotiation), DNS record types taking years to deploy (SPF overloaded TXT instead), and HTTP and TCP extension points blocked in practice. The remedies: design so extensions are needed for basic operation (SMTP headers are the positive example), GREASE, publish invariants, and prefer lower-layer selection to in-band version fields. · Prevents: the day-one extension mechanism being dead on the day it is needed. · Cost: senders must deliberately send junk and receivers must be tested against it. · Thomson & Pauly, RFC 9170, IAB, Dec 2021, https://www.rfc-editor.org/rfc/rfc9170.html · `opened`

**F7. GREASE: randomly advertise reserved meaningless values so intolerant receivers break now, not later.** TLS reserves code points (0x?A?A pattern); clients sprinkle them into offers; servers must treat them as unknown and ignore them; a server that selects one is a failure. · Prevents: ossification of negotiation fields. · Cost: a few bytes and a test discipline. · Benjamin, RFC 8701, Jan 2020, https://www.rfc-editor.org/rfc/rfc8701.html · `opened`

**F8. Declare invariants; everything else may change.** QUIC publishes a short list of version-independent properties (header forms, version field, connection ids, version negotiation) and says any other aspect may change between versions; an appendix lists seventeen wrong assumptions observers tend to draw from version 1. · Prevents: observers freezing incidental behavior. · Cost: the invariants really can never change. · Thomson, RFC 8999, May 2021, https://www.rfc-editor.org/rfc/rfc8999.html · `opened`

**F9. Must-understand vs may-ignore, done three ways.** (i) HTTP: recipients should ignore unrecognized header fields, but proxies must forward them, and new fields need no version bump if they are safely ignorable (RFC 9110 §5.1, §16.3, June 2022, https://www.rfc-editor.org/rfc/rfc9110.html · `opened`). (ii) IPv6: the top two bits of an option type encode what an unrecognizing node does (skip, discard, discard and report), and a third bit whether the option may change in transit (RFC 8200 §4.2, July 2017, https://www.rfc-editor.org/rfc/rfc8200.html · `opened`). (iii) JOSE: a `crit` list names the extensions a recipient must understand, or the whole object is invalid; the list must be integrity-protected (RFC 7515 §4.1.11, May 2015, https://www.rfc-editor.org/rfc/rfc7515.html · `opened`). RFC 6709 §4.7 warns that silent discard of a needed extension is a security blind spot and recommends mandatory bits or Require-style headers; §3.5 says a base spec that defines extension points without using them cannot be tested (Carpenter, Aboba, Cheshire, 2012, https://www.rfc-editor.org/rfc/rfc6709.html · `opened`). · Prevents: both silent loss of critical meaning and brittleness on harmless additions. · Cost: one extra field and a registry.

**F10. Experimental prefixes leak.** X- names became de facto standards, so implementations carry both `x-gzip` and `gzip` forever; RFC 6648 recommends meaningful unprefixed names and easy registration instead. · Prevents: permanent dual naming. · Cost: a registry to maintain. · Saint-Andre, Crocker, Nottingham, RFC 6648, June 2012, https://www.rfc-editor.org/rfc/rfc6648.html · `opened`. A2A's current practice is URIs as extension identifiers, declared in the Agent Card with a `required` flag, activated per request by header; agents should reject requests that do not honor a required extension. https://a2a-protocol.org/latest/topics/extensions/ (2025–26) · `opened`

**F11. What makes a protocol succeed: value to the first adopter, incremental deployability, free code, free spec.** The IAB's retrospective ranks technical elegance low; initial success comes from positive net value to whoever deploys, deployability without universal adoption, freely available implementations (IPv4 over IPX largely through BSD code) and an open spec; "wild success" needs extensibility, no hard scale bound, and threat mitigation once attackers arrive. It adds that many successful protocols would fail today's review. · Thaler & Aboba, RFC 5218, IAB, July 2008, https://www.rfc-editor.org/rfc/rfc5218.html · `opened`. RFC 8170 adds that transitions stall when benefits arrive only after critical mass, and that plans need measurable targets and a fallback. · Thaler (ed.), IAB, May 2017, https://www.rfc-editor.org/rfc/rfc8170.html · `opened`

**F12. Running code beat committee design.** OSI (from 1977) was the anointed architecture, mandated for US federal procurement via GOSIP by 1990; NIST abandoned GOSIP for TCP/IP in 1994. Russell locates the difference in process: IETF standards had to show multiple interoperable implementations before advancing, whereas ISO produced a theoretical model hard to implement fully; OSI participants sent their own mail over TCP/IP. Clark's 1992 IETF plenary slide is the source of "rough consensus and running code" (rejecting kings, presidents and voting). · Russell, IEEE Annals of the History of Computing, 2006, https://courses.cs.duke.edu/common/compsci092/papers/govern/consensus.pdf · `opened`; Clark, "A Cloudy Crystal Ball", IETF 24, July 1992, https://groups.csail.mit.edu/ana/People/DDC/future_ietf_92.pdf · `opened`. The formal bar: RFC 2026 required two interoperable implementations from different code bases; RFC 6410 (2011) requires two independent interoperating implementations with deployment, no interop-breaking errata, and no unused features that add complexity. https://www.rfc-editor.org/rfc/rfc6410.html · `opened`. RFC 7942 (2016) lets drafts carry an Implementation Status section (who, maturity, coverage, licence, interop results). https://www.rfc-editor.org/rfc/rfc7942.html · `opened`

**F13. The agent-language that lost: FIPA ACL defined meaning by mental states nobody can check.** FIPA's semantics define an act by preconditions and a "rational effect" on the receiver's beliefs and intentions. Wooldridge showed the core problem: a standard is only useful if an independent observer can decide whether an agent conforms, and semantics that reference private mental states are generally not verifiable. · Prevents (if heeded): a standard whose compliance cannot be tested. · Wooldridge, "Verifiable Semantics for Agent Communication Languages", ICMAS 1998, http://www.cs.ox.ac.uk/people/michael.wooldridge/pubs/icmas98.pdf · `opened`; FIPA's 22 performatives and the adoption decline · `secondary` (https://en.wikipedia.org/wiki/Agent_Communications_Language). Observation, 2026-09-14: the fipa.org specification URLs now serve an unrelated Norwegian casino-comparison site, so the standard's own primary pages are gone · `opened`.

**F14. Small cores that won.** SMTP (1982): a sender, a receiver that may be a relay, a handful of plain-text verbs (minimum HELO, MAIL, RCPT, DATA, RSET, NOOP, QUIT), three-digit replies whose first digit says good, transient or permanent, and a relay that takes responsibility for delivering or sending a failure notice back. RFC 821, https://www.rfc-editor.org/rfc/rfc821.html · `opened`. Message format: header fields, a blank line, a body; any field not defined is allowed and uninterpreted by the spec (RFC 5322 §3.6.8, 2008, https://www.rfc-editor.org/rfc/rfc5322.html · `opened`). REST: statelessness and self-descriptive messages buy visibility and intermediary-friendliness at the price of repeated per-message overhead; the uniform interface trades application-specific efficiency for independent evolvability (Fielding, 2000, https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm · `opened`). JSON: Crockford argues its stability comes from having no version number at all, and new fields can be added without breaking readers (https://www.json.org/fatfree.html · `opened`). ActivityPub (W3C Rec, Jan 2018): actors with inbox and outbox, JSON-LD vocabulary, and authentication explicitly left unspecified for lack of agreement (https://www.w3.org/TR/activitypub/ · `opened`); the practical consequence that the dominant server's choices became the de facto profile is `unverified` here.

**F15. Extension sprawl needs a profile.** XMPP's registry runs to about XEP-0518, across eleven status categories, and the community publishes yearly Compliance Suites to tell implementers which subset actually constitutes XMPP (e.g. XEP-0479, 2023). https://xmpp.org/extensions/ · `opened`. A small core plus a registry is not enough on its own; someone must periodically name the working set.

**F16. The folk laws.** Hyrum's law: with enough users, every observable behavior is depended on, whatever the contract says (Wright, named by Winters, https://www.hyrumslaw.com/ · `opened`). Worse is better: implementation simplicity first, accepting slight incorrectness, spreads like a virus and gets improved later; Unix and C delivered part of the right thing and ran everywhere (Gabriel, c. 1989–91, https://www.dreamsongs.com/RiseOfWorseIsBetter.html · `opened`). Gall's law: working complex systems evolve from working simple ones (Systemantics, 1975 · `secondary`). Conway: a design copies the communication structure of the group that made it (Datamation, April 1968, https://www.melconway.com/Home/Committees_Paper.html · `opened`). Metcalfe's n² overstates network value; Briscoe, Odlyzko and Tilly argue n log n because most possible links are worthless, which explains why networks resisted interconnection (IEEE Spectrum, July 2006, https://spectrum.ieee.org/metcalfes-law-is-wrong · `opened`).

**F17. Task pressure pushes agent codes away from human language.** The emergent-communication survey names language drift as the main challenge: multi-agent task pressure moves protocols away from human language; pretrained language models reduce syntactic and semantic drift but pragmatic drift remains (agents and humans read the same utterance differently). Agents can also develop anti-efficient codes absent effort pressure. · Lazaridou & Baroni, arXiv 2006.02419, 2020, https://arxiv.org/abs/2006.02419 · `opened`. Gibberlink (Feb 2025): two voice agents, once they identify each other as AI, switch from English to ggwave data-over-sound; a human can decode it only with a separate tool. https://github.com/PennyroyalTea/gibberlink · `opened`; the 80% efficiency figure is `secondary`. · Prevents (the lesson): a channel that stays legible keeps the operator as an anchor. · Cost: tokens.

**F18. Format sensitivity is real for smaller models.** Plain text vs Markdown vs JSON vs YAML templates changed GPT-3.5-turbo's score by up to 40% on a code-translation task; GPT-4 was more robust. · He et al., arXiv 2411.10541, 2024, https://arxiv.org/abs/2411.10541 · abstract `opened`. Relevant because Hermes-class open models may sit on the small side of that curve; the envelope format must be tested on both agents, not assumed.

**F19. How the 2025 agent protocols spread: one company, open spec, SDKs, then a neutral foundation.** The Linux Foundation formed the Agentic AI Foundation on 9 Dec 2025 with MCP (Anthropic), goose (Block) and AGENTS.md (OpenAI); the release cites more than 10,000 published MCP servers and AGENTS.md in more than 60,000 projects – a plain Markdown convention. https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation · `opened`. A2A went from Google (April 2025) to the Linux Foundation on 23 June 2025 with 100+ supporting companies. https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents · `opened`. MCP's current revision (2026-07-28) versions by the date of the last breaking change only, declares the version in every request's metadata, lets the server accept or reject each request independently, and offers a stateless discover call; older revisions negotiated at a handshake. https://modelcontextprotocol.io/specification/versioning · `opened`. Direction of travel: per-message self-description over session state.

## 2. Candidate primitives

| # | Name | Mechanism (one line) | Seed(s) | Verdict |
|---|---|---|---|---|
| P1 | **Envelope** | Flat header block + blank line/`---` + free Markdown body; the RFC 5322 shape | 6, 7 | core |
| P2 | **Message id** | Unique id per message, sender-generated; receiver dedupes on it (F1) | 6, 8 | core |
| P3 | **From / to** | Opaque addressable names; verification of who they are lives at the edges (F2) | 11 | core (field); identity proof optional |
| P4 | **Refs** | `re:` pointer(s) to prior message ids; threads, receipts and causality | 6 | core |
| P5 | **Type (closed, tiny)** | `request`, `receipt`, `notice`; nothing else in the waist (F3, F13) | 6 | core |
| P6 | **Receipt verdict** | End-to-end ack originated by the target: `accepted` / `done` / `failed` / `refused` + reason; SMTP-like class (F1, F14) | 3, 6, 8 | core |
| P7 | **By** | Optional respond-by time on a request; the obligation is observable, the escalation policy is the receiver's and sender's own | 5, 8 | core field, policy out |
| P8 | **Protocol major version** | One integer; bumped only when an invariant changes (F8, F19, Crockford) | – | core |
| P9 | **crit list** | Names extensions the receiver must understand, else `receipt: refused, unsupported-extension` (F9) | 7 | core |
| P10 | **Ignore-but-preserve** | Unknown non-critical fields are ignored by the reader and kept by any relay or gatekeeper (RFC 9110 §5.1) | 2 | core rule |
| P11 | **Strict envelope validator** | Malformed header = loud rejection by a script, not by the model (F5) | 4 | core rule (implementation is edge) |
| P12 | **GREASE field** | Reference impls randomly add reserved junk fields/extension names; receivers must survive (F7) | 4 | core rule for implementations |
| P13 | **Invariants page** | Published list of what never changes (F8) | 9 | core (spec artifact) |
| P14 | **Extension registry** | Plain Markdown table of names; URIs for private ones; no `x-` (F10) | 7 | core (spec artifact) |
| P15 | **Profile / working set** | Periodic statement of which extensions a conformant pair supports (F15) | – | optional, later |
| P16 | Signature / attestation slot | Integrity of header+body, and claims like `sanitization: confirmed` signed by the sender | 2, 11 | optional layer |
| P17 | Contract body | Pseudocode acceptance criteria inside a request body | 7 | optional layer (body convention) |
| P18 | Urgency / channel class | Sender's claim of interrupt-worthiness | 3, 5 | optional; the receiver's impact assessment is out |
| P19 | Quarantine, gatekeeper, immune check, impact assessment | Receiver-side handling of inbound | 1–4 | **out** of the waist (edge, per F1–F2); the protocol only guarantees the fields they need |
| P20 | Reputation score | Per-relationship judgment from receipt history | 11 | **out** (edge); the waist supplies the receipts it is computed from |
| P21 | Blockchain ledger | Global append-only anchor | 10 | **out** (transport or anchor choice by the principal; git already gives a hash-linked log per pair) |
| P22 | Delivery, ordering, speed, broadcast | Folder sync, git push, email, HTTP, A2A/MCP bindings | 5 | **out** (transport binding) |

### (a) Design laws the whitepaper should obey

1. **The receipt that counts comes from the target.** Delivery confirmation is a transport optimization; completion is a verdict the receiving agent originates (F1).
2. **Dedupe and ordering are end-to-end.** Put the id and refs in the message; never rely on the channel for exactly-once (F1).
3. **No uninvited middle.** A gatekeeper is legal only when a principal installed it on its own side and traffic to it is explicit; the protocol never mandates one (F2).
4. **Name the necessary set, then make the waist as weak as it can be.** The pilot's N is: ask for something, report something, say what happened to a request. Everything else rides above (F3).
5. **Occupy an empty niche.** Do not compete with MCP (agent-to-tool) or A2A (enterprise task RPC); take the asynchronous, file-native, human-auditable channel between agents of different principals, and bind to them as transports (F4, F19).
6. **Strict on form, designed tolerance on novelty.** Reject malformed envelopes loudly; ignore unknown optional fields by written rule; refuse unknown critical ones explicitly (F5, F9).
7. **Exercise every extension point from day one** (GREASE), or it will not work when needed (F6, F7).
8. **Publish invariants.** Everything not listed may change (F8).
9. **Semantics must be checkable by an outside observer from the record.** Define types by observable obligations (a request with `by` expects a receipt), never by beliefs or intentions (F13).
10. **Assume every observable behavior of the reference implementation becomes spec** (Hyrum); ship two implementations and randomize what is not promised (F16).
11. **Value to one pair on day one.** No network effect required; value is in the few links that matter (F11, F16 Metcalfe).
12. **Running code, two independent implementations, then the document** (F12).
13. **The channel stays in a human register.** No switch to an opaque code without a sealed legible record; the operator must remain able to read the wire (F17).
14. **Version rarely.** One major number, changed only with an invariant; features travel as named extensions (F6, F19, F14 JSON).
15. **Start from the simple system that already works** – the deployed two-folder channel – and specify what runs (Gall, Gabriel, F16).

### (b) Narrow waist vs edges vs transport

- **Waist (the protocol):** envelope shape; `v`, `id`, `from`, `to`, `type` ∈ {request, receipt, notice}, `re`, `at` (timestamp), optional `by`, optional `crit`; receipt verdict vocabulary; the three unknown-handling rules (malformed → reject, unknown optional → ignore and preserve, unknown critical → refuse with receipt); the invariants page; the registry. Roughly SMTP's size.
- **Edges (each agent, under its principal):** quarantine, gatekeeping, impact assessment, immune checks, escalation ladders, reputation, what a request means, whether to act, the contract language, identity verification policy, which anchor to trust. Justification: only the receiver can completely and correctly judge impact and trust (F1, F2); putting them in the waist would strengthen it and cut the number of implementations (F3).
- **Transport (bindings, pluggable):** how bytes move (shared folder, git remote, email, HTTP, an A2A or MCP binding), latency class (instant vs cron), fan-out (direct vs broadcast), encryption in transit, storage. Seed 5's time-and-spread axis is a property of the binding, and a message may carry an urgency claim as an optional extension.

### (c) Extension mechanism recommendation

1. **Header fields are may-ignore by default** (RFC 5322 §3.6.8, RFC 9110 §5.1). Any relay or gatekeeper must pass unknown fields through unchanged.
2. **A `crit:` list** (JOSE-style, textual rather than bit-coded) names the extension fields the receiver must understand; if any is unknown the receiver answers `receipt` with verdict `refused` and reason `unsupported-extension: <name>`. Never a silent drop (RFC 6709 §4.7). With the signature layer on, `crit` sits inside the signed part (RFC 7515).
3. **Names without prefixes.** Short names come from a Markdown registry file in the spec repo (first come, first served, one line of description and a link); anyone can use a URI for a private extension (RFC 6648, A2A practice).
4. **GREASE in both reference implementations**: in a random share of messages add a reserved-pattern field (for example a `grease-<hex>` name) that receivers must ignore; the test suite also contains a message with a GREASE name in `crit`, which must produce a refusal receipt, never a crash (RFC 8701).
5. **One integer version**, bumped only when an invariant changes; the rest evolves through extensions (RFC 9170 on version fields, MCP date-of-last-breaking-change, JSON's versionlessness).
6. **Graduation and pruning.** An extension that both implementations have used over a stated number of cycles can graduate into the core registry by a proposal; a core feature nobody uses is removed before a 1.0, per RFC 6410's unused-features criterion.
7. **A yearly profile** once a third implementation exists (XMPP Compliance Suites lesson).
8. **Body conventions are not the protocol.** Contract pseudocode, checklists and so on live in the body as named body profiles, declared by an extension field, so the waist never has to parse prose.

### (d) Publication and adoption strategy for two people

- **Frame:** not "the basis of all agentic communication" head-on (EvoArch says that loses against MCP and A2A, both foundation-backed by 2025); frame as the minimal envelope for agents that belong to different people, asynchronous and auditable, which binds onto MCP and A2A as transports. Claim the universality argument through the hourglass (weakest sufficient waist), not through market size.
- **Ship with the paper:** (1) the spec as one short Markdown document written in its own format, with an Invariants section and an Implementation Status section (RFC 7942); (2) two independent implementations – brainboi (Claude Code, hooks and scripts, git transport) and Hermes (Nous Research, a different code base, model and owner); (3) a dependency-free single-file validator and linter usable as a pre-commit or pre-send hook; (4) test vectors: valid, malformed, unknown optional field, unknown critical extension, GREASE, duplicate id, missing receipt past `by`, version mismatch; (5) a "bare" third implementation (a shell script of a few dozen lines, or a human with a text editor) to demonstrate weakness of the waist; (6) the sealed interop log – the real message folders from the pilot, in git, as evidence.
- **What the brainboi ↔ Hermes pilot must demonstrate** to be credible: request → receipt with a verdict in both directions; retry with the same id deduped; unknown optional field ignored and preserved through a gatekeeper; unknown critical extension refused with a receipt; malformed envelope rejected by the validator rather than interpreted by the model; missing receipt past `by` escalated by the sender's own policy; GREASE survived for the full run; an operator reconstructing the whole exchange from the folder alone; one guardrail enforced outside the agent (the deployed-channel incident); at least one extension graduated or dropped with a written reason. Collaborators building both sides weakens "independent"; say so, and make a third-party implementation the stated next bar.
- **Channels, cheapest first:** public repo (spec under CC-BY, code under a permissive licence) and the whitepaper (arXiv or equivalent); an MCP server exposing `inbox`/`outbox` tools so any MCP client can speak the protocol without new code (rides the incumbent's installed base instead of fighting it); an individual Internet-Draft (submission needs no membership · `unverified` for current IETF policy details) to get a dated, citable artifact with the Implementation Status section; approach the AAIF or a W3C Community Group only after an outside implementation exists. No organization, no board, no voting (Clark 1992).
- **Adoption hook:** the AGENTS.md precedent – a Markdown convention reached 60,000 projects because it is trivially implementable. Make "two folders and a lint" the whole install.

## 3. Mapped to house primitives

- **End-to-end ack (F1) → Receipt.** The receipt's `task_verdict` against a success criterion is exactly the target-originated "did it / didn't". "Sent means read-back confirmed" is the transport-level delivery check, useful but not the end-to-end one; the whitepaper should keep both and name the difference.
- **Dedupe by id, refs (F1) → Watermark.** "Covered through" plus message ids gives replay and dedupe at the edge.
- **Trust-to-trust (F2) → Anchor + Authority + Voice gate.** The principal chooses the anchor; a gatekeeper is the principal's own installed gate (the voice gate is the outbound instance). Clark's two conditions (installed by an end, explicitly addressed) are the rule that keeps a gatekeeper from becoming a middlebox.
- **Minimal sufficiency (F3) → Kernel.** The protocol's invariants are its kernel: changed only by a major version, as the house kernel changes only by the operator's word.
- **Strict parsing by script (F5) → Hook.** A rule a script can enforce is enforced by a script; the model reading the body is tolerant by nature, so strictness must live in the validator.
- **Unknown optional field kept but not acted on (F9) → Constructed layer.** Held, visible, not entered into knowledge until something reconciles it.
- **crit refusal (F9) → Proposal boundary.** A change the receiver cannot evaluate is refused, not applied.
- **Verifiable semantics (F13) → Anchor / measurement.** A message's claim is a constructed layer; its obligations (receipt due by a time) are measurements checkable on disk.
- **Extension graduation (§2c.6) → Graduation.** Same shape as the house's narrow automated graduation, gated by a clean record.
- **Hyrum's law (F16) → Mirror.** Each implementation writes the spec version and extension set it ran, so drift shows as a diff.
- **Language drift (F17) → Voice gate / register lint.** The register lint is the counter-pressure that keeps the wire human-legible.
- **Missing receipt past `by` → Tension.** Owner, threshold, escalation; the protocol supplies the observable, the house supplies the ladder.
- **Conway (F16) → two folders, two directions.** The deployed channel's structure mirrors two principals; a protocol for two people should look like that.
- **New primitive needed: Grease** (or "exercise"): a deliberate, harmless foreign signal sent on schedule to keep a receiver's unknown-handling path alive. The house has no equivalent; demotion punishes contradiction but nothing keeps tolerance paths exercised.

## 4. Cross-field overlaps

1. **Narrow waist between diverse layers.** IP and the Unix system call interface (Beck, F3; EvoArch's evolutionary kernels, F4); in biology the bow-tie architectures of metabolism and signaling (Csete & Doyle 2004 · `unverified`, not opened); in language the small closed class of function words carrying an open class of content words (`unverified`, reasoning). The agent version: a closed set of three message types carrying open prose.
2. **The target's acknowledgement.** Saltzer's "I did it" (F1); banking audit and airline agents who keep trying until confirmed or refused (same paper, opened); radio read-back in aviation and military procedure (`unverified`); the house receipt verdict. Three fields settled independently on completion signals originated at the far end.
3. **Default-ignore with a must-understand escape.** IPv6 option bits, HTTP fields, JOSE `crit` (F9); in cell signaling a ligand without a matching receptor has no effect, while some signals are obligatory by construction (`unverified` analogy); in contract practice, conditions whose failure permits refusal vs terms whose breach does not (`unverified`). The shared mechanism: a sender marks which parts the receiver may not skip.
4. **Use it or lose it.** GREASE and RFC 9170 in networking (F6, F7); immunological exposure keeping recognition calibrated, which fits Vlad's thymic-selection frame (`unverified` analogy); fire drills and red-team exercises in organizations (`unverified`). A tolerance path that is never exercised decays.
5. **Drift away from the shared register under local pressure.** Emergent agent codes (F17), Gibberlink, and professional jargon and argots in human groups (`unverified`). The counter in each case is an outside reader the group must stay legible to: the house anchor.
6. **Conformance judged by an outside observer.** Wooldridge's verifiable ACLs (F13), the IETF's interoperating-implementations rule (F12), scientific replication; the house's reconciliation of two sealed runs is the same mechanism.

## 5. Disagreements and open questions

- **Postel vs RFC 9413.** Tolerance helped early adoption (worse is better, F16), strictness prevents decay (F5). Proposed split: strict envelope, tolerant body. Open: an LLM reader is tolerant of the body by nature, so Hyrum's law will operate on phrasing. A "prose GREASE" (senders vary non-normative wording) is an untested idea worth a pilot measurement.
- **Versioning.** Crockford says no version; MCP uses dated breaking-change versions and in 2026 moved to per-request declaration; RFC 9170 says in-band version fields ossify. The single-integer-plus-extensions recommendation is a judgment, not a settled result.
- **Which N?** Beck's theorem makes the waist's size depend entirely on the necessary application set. If Vlad and Sal put contracts, escalation or reputation into N, the waist grows and implementations shrink. This is the first decision the whitepaper must make explicitly.
- **Is YAML frontmatter the right envelope?** It is the house format, LLM-native and human-legible, but YAML's implicit typing is a known parser hazard (`unverified` here); a strict flat subset (key: scalar or list) validated by script is the likely answer. F18 says format matters for smaller models, so measure on Hermes rather than assume.
- **Signatures: core or optional?** End-to-end says authenticity checks belong to the application (F1); trust-to-trust says intermediaries need integrity protection to be excluded (F2). For a two-party git transport, commit signing may suffice; for relayed or emailed messages, a signature layer becomes necessary. Left optional here.
- **Blockchain (seed 10).** Out of the waist by F2 and F3. Open whether any multi-party case needs a shared anchor that no pair's git provides.
- **Independence of the two implementations.** Both are built by collaborators who co-design the spec; RFC 2026/6410 independence is only partly met. Needs a stated plan for a third, unaffiliated implementer.
- **Blumenthal & Clark 2001 body** was not opened (MIT host refused the connection); its content is cited through RFC 3724 and the 2011 follow-up, which was opened.
- **Not researched in this thread:** Matrix's spec-proposal process and UUCP; both in the prompt, dropped for budget.

## 6. Sources

1. https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf – `opened` (1984)
2. https://groups.csail.mit.edu/ana/The%20End-to-End%20Argument%20and%20Application%20Design_%20The%20Role%20of%20Trust.pdf – `opened` (2011)
3. https://dspace.mit.edu/handle/1721.1/1519 – abstract `opened`, body `secondary` (2000)
4. https://datatracker.ietf.org/doc/html/rfc3724 – `opened` (2004)
5. https://arxiv.org/abs/1607.07183 – `opened` (2016)
6. https://faculty.cc.gatech.edu/~dovrolis/Papers/evoarch.pdf – `opened` (2011)
7. https://www.rfc-editor.org/rfc/rfc9413.html – `opened` (2023)
8. https://www.rfc-editor.org/rfc/rfc9170.html – `opened` (2021)
9. https://www.rfc-editor.org/rfc/rfc8701.html – `opened` (2020)
10. https://www.rfc-editor.org/rfc/rfc8999.html – `opened` (2021)
11. https://www.rfc-editor.org/rfc/rfc6709.html – `opened` (2012)
12. https://www.rfc-editor.org/rfc/rfc9110.html – `opened` (2022)
13. https://www.rfc-editor.org/rfc/rfc8200.html – `opened` (2017)
14. https://www.rfc-editor.org/rfc/rfc7515.html – `opened` (2015)
15. https://www.rfc-editor.org/rfc/rfc6648.html – `opened` (2012)
16. https://a2a-protocol.org/latest/topics/extensions/ – `opened` (2025)
17. https://www.rfc-editor.org/rfc/rfc5218.html – `opened` (2008)
18. https://www.rfc-editor.org/rfc/rfc8170.html – `opened` (2017)
19. https://courses.cs.duke.edu/common/compsci092/papers/govern/consensus.pdf – `opened` (2006)
20. https://groups.csail.mit.edu/ana/People/DDC/future_ietf_92.pdf – `opened` (1992)
21. https://www.rfc-editor.org/rfc/rfc6410.html – `opened` (2011)
22. https://www.rfc-editor.org/rfc/rfc7942.html – `opened` (2016)
23. http://www.cs.ox.ac.uk/people/michael.wooldridge/pubs/icmas98.pdf – `opened` (1998)
24. https://www.fipa.org/repository/aclspecs.html – `opened` (2026)
25. https://en.wikipedia.org/wiki/Agent_Communications_Language – `secondary`
26. https://www.rfc-editor.org/rfc/rfc821.html – `opened` (1982)
27. https://www.rfc-editor.org/rfc/rfc5322.html – `opened` (2008)
28. https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm – `opened` (2000)
29. https://www.json.org/fatfree.html – `opened`
30. https://www.w3.org/TR/activitypub/ – `opened` (2018)
31. https://xmpp.org/extensions/ – `opened`
32. https://www.hyrumslaw.com/ – `opened`
33. https://www.dreamsongs.com/RiseOfWorseIsBetter.html – `opened`
34. https://en.wikipedia.org/wiki/Systemantics – `secondary` (1975)
35. https://www.melconway.com/Home/Committees_Paper.html – `opened` (1968)
36. https://spectrum.ieee.org/metcalfes-law-is-wrong – `opened` (2006)
37. https://arxiv.org/abs/2006.02419 – `opened` (2020)
38. https://github.com/PennyroyalTea/gibberlink – `opened` (2025)
39. https://arxiv.org/abs/2411.10541 – abstract `opened` (2024)
40. https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation – `opened` (2025)
41. https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents – `opened` (2025)
42. https://modelcontextprotocol.io/specification/versioning – `opened` (2026)
43. Csete & Doyle, bow-tie architectures, 2004 – not opened – `unverified`
