---
thread: R2 – classical agent communication and the theory of message types (seeds 6, 7)
date: 2026-09-14
sources_opened: 26
---
# Classical agent communication, message types and contract languages

**Answer in one paragraph.** Forty years of agent communication research teach one lesson: a message type is worth standardising only if its meaning is **public and checkable from the log**. Mentalist semantics (KQML, FIPA ACL) failed because nobody can verify a belief. Finite-state protocols (FIPA interaction protocols, session types) are verifiable but say nothing about what a message commits anyone to. The line from Singh (1998) through commitments, BSPL (2011) and Langshaw (2024), applied in June 2026 to Google's agentic commerce protocol (Strabo), yields a minimal core: **four illocutionary families defined by their effect on a public commitment store, carried in an information-causal envelope (key, in/out parameters, immutable bindings, no ordering assumption).** Seed 7 is right about dual readability and wrong about form: pseudocode is procedural, and procedural specs are what broke under asynchrony. The contract should be declarative (BSPL/Langshaw-shaped), carry a commitment layer, bind its prose to the formal layers by hash (Ricardian), and be enforced by an adapter outside the agent.

## 1. Findings

**F1. Searle's five classes.** Assertives (represent how things are), directives (get the hearer to act; a question is a directive for an assertion), commissives (commit the speaker), declarations (make a fact true by saying it, given standing), expressives (psychological state). Winograd adds that one utterance can be several acts depending on background. *Prevents:* unbounded verb proliferation. *Cost:* classification is interpretive. Searle 1975 via Winograd 1986 · https://www.lri.fr/~mbl/ENS/CSCW/2015/papers/Winograd-CSCW86.pdf · `opened` (Winograd) / `secondary` (Searle original returned 403).

**F2. KQML: extensible, explicitly non-minimal.** Content / message / communication layers; content opaque with `:language` and `:ontology`. Reserved performatives in groups: query (ask-if, ask-one, ask-all…), response (reply, sorry), informational (tell, untell, achieve, cancel), generator (next, rest, discard), capability (advertise, subscribe, monitor) and networking (register, forward, broadcast, route), with facilitators (recruit, broker). The authors say the reserved set is neither required nor minimal. *Cost:* 30+ verbs mixing speech acts with routing and flow control, a layering error by end-to-end standards. Finin et al. · https://www.aaai.org/Papers/Workshops/1994/WS-94-02/WS94-02-007.pdf (1994) · `opened`.

**F3. FIPA ACL: 22 acts, one mandatory.** accept-proposal, agree, cancel, cfp, confirm, disconfirm, failure, inform, inform-if, inform-ref, not-understood, propagate, propose, proxy, query-if, query-ref, refuse, reject-proposal, request, request-when, request-whenever, subscribe. Each has a feasibility precondition and rational effect in SL modal logic (belief, uncertainty, intention). The spec itself admits the sender cannot assume the rational effect follows, puts insincerity out of scope, and requires compliant agents to implement only **not-understood**. FIPA XC00037H (experimental, 2001; standard SC00037J 2002) · https://jmvidal.cse.sc.edu/library/XC00037H.pdf · `opened`. On 2026-09-14 the fipa.org spec URL served an unrelated gambling site · `opened`.

**F4. FIPA interaction protocols are sequence charts.** Request: request → refuse | agree → failure | inform-done | inform-result; agree may be skipped. Drawn as UML sequence diagrams. *Cost:* operational only; silent on what agreeing commits one to. Chopra & Singh slides · https://www.csc2.ncsu.edu/faculty/mpsingh/papers/mas/Agent-Communication-slides.pdf (2012) · `opened`.

**F5. Why mentalist semantics were unverifiable.** Singh's four criteria: formal, declarative, **verifiable** (one can tell whether an agent complies), meaningful (not arbitrary tokens). Prose fails formality; FSMs fail declarativity and meaning; mentalist semantics fail verifiability, since beliefs and intentions are private and not uniquely determinable even from the code. Alternative: messages create and manipulate **social commitments**, which are public. Three verifiability levels: claims about facts (challenge the fact), about mental states (only via later behaviour), about institutional facts (appeal to an external authority). The 2012 slides call FIPA's cognitive semantics misguided and never used, its architecture and protocols valuable. Singh · https://www.csc2.ncsu.edu/faculty/mpsingh/papers/mas/socacl-fipa.pdf (1999) · `opened`; Singh, *IEEE Computer* 31(12) (1998) · `secondary` (paywall).

**F6. Commitment lifecycle.** C(debtor, creditor, antecedent, consequent): debtor commits to bring about consequent if antecedent holds. Null → Conditional → Detached (both Active). Terminal: Satisfied, Expired (antecedent never holds), Violated (detached and consequent will never hold, or cancelled when detached), Terminated (cancelled while conditional, or released). Pending = suspended. Debtor may create, cancel, suspend, reactivate; **only the creditor may release**. *Prevents:* silent reneging. *Cost:* someone must judge whether antecedent and consequent hold. Telang, Singh, Yorke-Smith · https://www.csc2.ncsu.edu/faculty/mpsingh/papers/mas/AAMAS-ProMAS-11.pdf (2011) · `opened`.

**F7. BSPL: a protocol is its information.** Two constructs: message schema and composition. Parameters adorned `in` (known before sending), `out` (bound by this message), `nil` (not yet known); `key` identifies an enactment. No ordering is stated; order is derived from who needs what. Principles: explicit causality (no hidden flows), no global state, **integrity** (every public parameter bound = complete), **immutability** (bindings never change, so asynchrony is safe). Mutual exclusion falls out: accept and reject both `out` the same parameter, which binds once. Conventions ("pay first") become an extra token parameter. Singh · https://www.cs.huji.ac.il/~jeff/aamas11/papers/A4_B57.pdf (AAMAS 2011) · `opened`.

**F8. BSPL is decidable over unordered, lossy transport.** Safety (no parameter bound twice per key in any history) and liveness (no maximal, non-lossy history stays incomplete) are checked as SAT; no FIFO assumption. A protocol can be live and unsafe (a cancel racing a delivery). Singh · https://www.csc2.ncsu.edu/faculty/mpsingh/papers/mas/AAMAS-12-BSPL.pdf (AAMAS 2012) · `opened`.

**F9. Mandrake: fault tolerance in the protocol, not the pipe.** Over unreliable, unordered transport, keys plus immutability make duplicates harmless, so recovery is resending: remind, forward, checkpoint, gossip, and a policy language (remind a role of messages on a cron schedule until a reply). An adapter checks causality and integrity on every send and receive. Cites the end-to-end argument. Christie, Chopra, Singh · https://pmc.ncbi.nlm.nih.gov/articles/PMC8827306 (2022) · `opened`.

**F10. Langshaw and Strabo: the school meets 2026 agent protocols.** Langshaw declares `who`, `what` (key, completion goal), `do` (actions), **`sayso`** (which role may bind each attribute, with priorities), **`nono`** (mutual exclusion), **`nogo`** (once Cancel, no Complete); checks safety and liveness; compiles to BSPL. Strabo models Google's Universal Commerce Protocol checkout in Langshaw and interoperates with Google's reference agents. Findings: UCP and A2A are specified by JSON schema, prose and HTTP traces; UCP silently assumes synchronous operations (an Update racing a Complete can place an unintended order); A2A leaves open whether a cancelled task can resume. The Peach adapter computes `enabled()` actions; the developer, or an LLM, only chooses and binds values, so **compliance lives in the adapter, not the agent**. Langshaw https://arxiv.org/abs/2606.29601 (IJCAI 2024) · `opened` (abstract); Strabo https://arxiv.org/abs/2606.05043 (2026) · `opened` (full text).

**F11. Session types assume FIFO.** A comparison of Scribble, trace expressions, HAPN and BSPL on instances, integrity, meaning, concurrency, extensibility, asynchrony and unordered delivery: Scribble needs pairwise-FIFO channels; only the information-oriented language met the decentralisation criteria. Principles stated: no unitary (god's-eye) ordering, noninterference with agent reasoning, and an **end-to-end principle for protocols** (FIFO from infrastructure is neither sufficient nor necessary). Cost of immutability: updates need versioned keys. Chopra, Christie, Singh · https://arxiv.org/abs/1901.08441 (2020) · `opened`.

**F12. Multiparty session types.** A global type is projected to one local type per participant; local type-checking guarantees communication safety, protocol fidelity and progress. Coppo et al. · https://mrg.cs.ox.ac.uk/publications/a-gentle-introduction-to-multiparty-asynchronous-session-types/paper.pdf (2015) · `opened`; Honda, Yoshida, Carbone, POPL 2008 / JACM 2016 · `secondary` (403).

**F13. Session-style guarantees around LLMs already exist.** ZipperGen specifies coordination as message sequence charts, projects them to local programs, and treats each LLM call as a local decision inside the projected automaton, so deadlock freedom holds regardless of output; an extension lets an LLM author the workflow at runtime under the same guarantees. Bollig, Függer, Nowak · https://arxiv.org/abs/2604.17612 (2026) · `opened` (abstract).

**F14. Conversation for action: completion is two-sided.** A requests; B promises, declines or counter-offers; B asserts conditions of satisfaction are met (state 4); A declares satisfied (5) or unmet (back to 3); either may withdraw or renege (7, 9). The diagram is explicitly not a model of minds. **Completion does not guarantee satisfaction.** Winograd 1986/87 (above) · `opened`. The Coordinator (1986) labelled e-mail as requests and promises · `secondary` via https://www.dubberly.com/articles/language-action-model.html.

**F15. Suchman: categorising intent is control.** Speech-act design carries an agenda of discipline; The Coordinator is intention-accounting imposed on members. Dubberly answers that this indicts the implementation, not the model. https://research.lancaster-university.uk/en/publications/do-categories-have-politics-the-languageaction-perspective-recons/ (1994) · `opened` (abstract).

**F16. Contract Net.** Task announcement (eligibility, task abstraction, bid specification, **expiration time**), binding bids, award, directed award with refusal plus justification, interim and final reports, termination, node-available. Smith prices every choice: letting nodes refuse awards costs at least one extra acknowledgment per transaction; telling losing bidders multiplies traffic. Smith · https://www.reidgsmith.com/The_Contract_Net_Protocol_Dec-1980.pdf (1980) · `opened`.

**F17. Linda.** `out` puts a tuple into a shared space and returns; `in` withdraws a match (blocking); `read` copies. Tuples live independently of their creator: communication decoupled in space and time, addressed by content. *Cost:* no ownership or acknowledgment. Gelernter · https://www.cs.unc.edu/~stotts/COMP590-059-f21/slides/lindaGenerative.pdf (1985) · `opened`.

**F18. Actors, 1973: the intention is the contract.** Everything is message sending. Each actor's INTENTION checks an incoming message's prerequisites and context; the paper calls it the actor's contract with the outside world, fulfilment being the actor's own business. Actors also have monitors on incoming messages and a banker metering space and time. Hewitt, Bishop, Steiger · https://www.ijcai.org/Proceedings/73/Papers/027B.pdf · `opened`.

**F19. Erlang/OTP.** Links are bidirectional exit signals (trappable into messages); monitors are one-way `DOWN` messages; order is preserved per sender–receiver pair, distributed delivery is not guaranteed. Supervisors restart children; beyond **intensity restarts within period** the supervisor terminates and its parent decides. Escalation with a budget. https://www.erlang.org/doc/system/ref_man_processes.html, https://www.erlang.org/doc/system/sup_princ.html · `opened`.

**F20. Ricardian contract.** One document: human-readable like paper, parsable by programs, signed, with a unique digest that appears in every transaction record, so terms cannot drift unnoticed. Grigg · https://iang.org/papers/ricardian_contract.html (2004) · `opened`.

**F21. Design by contract.** Pre, post, invariant; an obligation for one side is a benefit for the other; assertions monitorable at runtime; precondition violation = client bug, postcondition violation = supplier bug. Meyer · https://se.inf.ethz.ch/~meyer/publications/computer/contract.pdf (1992) · `opened`.

**F22. End-to-end argument.** Acknowledgment, duplicate suppression and crash recovery are complete only at the endpoints; low-level versions are performance aids. The ack that matters comes from the target application: did it or did not. Saltzer, Reed, Clark · https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf (1984) · `opened`.

**F23. The 2026 diagnosis repeats 1998.** A survey of 18 agent protocols finds transport and schema served, clarification, context alignment and verification pushed into prompts. Yuan et al. · https://arxiv.org/abs/2604.02369 (2026) · `opened` (abstract).

**F24. Why ACLs were not adopted, and the prediction.** (a) Semantics untestable (F5), so conformance meant nothing; (b) broad fixed verbs, with real meaning added in undocumented layers (F4 slides); (c) a shared content language and ontology was required (KIF, SL); (d) only not-understood was mandatory (F3); (e) web services and JSON over HTTP won on simplicity (`secondary`, practitioner accounts). **Prediction:** LLMs dissolve (c): natural language is the content language. They worsen (a): an LLM's intentions are less inspectable than a BDI agent's, so public commitment semantics become more necessary, not less. (b) is already recurring as prompt-layer meaning (F23). Standardise the checkable structure; leave content to language.

## 2. Candidate primitives

Types are defined by **effect on the public commitment store**, never by mental state (F5).

| # | Primitive | Mechanism | Seeds | Verdict |
|---|---|---|---|---|
| P0 | Envelope | sender, receiver, enactment key, in/out parameters; bindings immutable; order derived, never assumed (F7–F9) | 5, 6, 7 | core |
| P1 | **ASSERT** | sender commits to truth of content, with refs; covers inform, report, pulse, health, receipt body | 3, 4, 6 | core |
| P2 | **REQUEST** | asks receiver to create a commitment; creates none; a query is a request whose consequent is an ASSERT | 6 | core |
| P3 | **COMMIT** | creates C(sender, receiver, antecedent, consequent, deadline); promise, offer, bid | 6, 8, 11 | core |
| P4 | **DECLARE** | changes a fact the sender has sayso over: accept, decline, release, cancel, satisfied/unmet, award, admitted | 1, 2, 6, 9 | core |
| P5 | NOT-UNDERSTOOD | reserved DECLARE for unparseable or unclassifiable input (FIPA's only mandatory act) | 2, 6 | core |
| P6 | Lifecycle ops | create, cancel, release (creditor only), discharge, violate; suspend, delegate, assign | 6, 8, 11 | core / last three optional |
| P7 | **Sayso** | per-attribute authority to bind; a DECLARE without sayso is void (F10) | 1, 2, 9, 11 | core |
| P8 | Nono / nogo | declared exclusion between outcomes | 6, 7 | core |
| P9 | Standing pulse | C(agent, peer, each cycle, ASSERT status); a missed pulse is a violation (F19) | 4, 5, 8 | core |
| P10 | Deadline | every commitment and announcement expires, so absence becomes an event (F16) | 5, 8 | core |
| P11 | Remind policy | resend until reply, safe because of P0 (F9) | 5, 8 | optional |
| P12 | Bounded escalation | retry budget (intensity/period), then the parent or anchor decides (F19) | 8 | optional |
| P13 | Announce / bid / award | task sharing over P2–P4 (F16) | 6 | optional |
| P14 | Contract digest | protocol file's hash in every message (F20) | 7, 10, 11 | core |
| – | Expressives | no effect on commitments | 6 | out (register) |
| – | Transport ack, FIFO, routing verbs | infrastructure (F22, F11) | 5 | out |
| – | Mentalist semantics | unverifiable (F5) | 7 | out |

**Seed-6 types as compositions.** *Check-in* = ASSERT discharging a standing pulse (P9). *Request for information* = REQUEST whose consequent is ASSERT. *Completion signal* = debtor's ASSERT(done, refs) **plus** creditor's DECLARE(satisfied | unmet): one without the other is CfA state 4, not 5. *Refuse* = DECLARE decline before commitment; *failure* = ASSERT(consequent will not hold) after, which violates unless the creditor releases. *Incident* = ASSERT with impact. *Quarantine clearance* = DECLARE by the role with sayso over `admitted`.

```
Commitment C(debtor, creditor, antecedent, consequent, deadline)        [F6]
  Null --create(debtor)--> Conditional --antecedent--> Detached
  Conditional --deadline, antecedent never held--> Expired     (end)
  Conditional --cancel(debtor)--> Terminated                   (end)
  Active --consequent holds--> Satisfied                       (end)
  Active --release(creditor)--> Terminated                     (end)
  Detached --cancel(debtor) | deadline--> Violated             (end)
  Active <--suspend/reactivate(debtor)--> Pending              [optional]

Conversation for action                                                 [F14, F4]
  A:REQUEST -> requested
  requested --B:COMMIT--> promised | --B:DECLARE decline--> closed-unsatisfied
  requested --B:COMMIT'(counter)--> countered --A:DECLARE accept--> promised
  promised  --B:ASSERT done(refs)--> reported
  reported  --A:DECLARE satisfied--> closed-satisfied
  reported  --A:DECLARE unmet--> promised
  open      --A:withdraw | B:renege--> closed-unsatisfied
  open      --deadline--> escalate (P12)

Pulse                                                                   [F19]
  healthy --ASSERT pulse--> healthy
  healthy --deadline missed--> suspect --remind x n--> suspect --pulse--> healthy
  suspect --budget exhausted--> DECLARE down; parent/anchor decides
```

## 3. Mapped to house primitives

- **Receipt = ASSERT + someone else's DECLARE.** The receipt's `task_verdict` is CfA's conditions of satisfaction, but today the debtor declares its own satisfaction. The classical split: the pass ASSERTs, the anchor DECLAREs. Demotion is what happens when the ASSERT is later falsified.
- **Anchor = the holder of sayso over "satisfied" and "admitted"**, and Singh's external authority for institutional facts.
- **Constructed layer / quarantine = an unbound `admitted` parameter.** No message may take inbound content `in` until the anchor binds it. Quarantine by causality, not by folder.
- **Proposal = COMMIT conditional on the operator's DECLARE accept.** **Kernel = attributes only the operator has sayso over.**
- **Hook = adapter.** The deployed incident (a refusal read as licence, then routed around) is exactly what Peach's `enabled()` prevents: the LLM chooses among permitted actions and never holds the compliance logic. Hewitt 1973 had the same shape.
- **Watermark = a bound key parameter** the next pass takes `in`.
- **Tension with threshold = commitment with deadline + bounded escalation**; ANNEAL after two weeklies is the supervisor exhausting its restart budget.
- **Authority / demotion = recoverable reputation over violated commitments.** Assertives committing the speaker to truth is what makes demotion legitimate.
- **Mirror = Ricardian digest.** P14 extends it from routines to protocols.
- **Deployed client channel:** "sent = read-back confirmed" is the end-to-end ack; "unacked after next cycle escalates" is P9 + P10 + P12; "actionable cold" is BSPL's `in` rule; `sanitization: confirmed` is a falsifiable ASSERT.
- **New primitive needed: `sayso`**, a per-field authority map for a protocol shared with a peer that has its own operator.

## 4. Cross-field overlaps

1. **Completion needs the counterparty's declaration.** Language/action (assert done, declare satisfied), networks (end-to-end ack from the application), MAS commitments (only the creditor releases), DAI (Contract Net reports), and the house receipt. Contract law's performance/acceptance is a likely sixth (`unverified` here).
2. **Absence as signal, bounded by a deadline.** Erlang monitors, Contract Net expiration, commitment expiry/violation, the deployed channel's unacked escalation. Immunology's missing-self detection is a candidate (`unverified`; hand to the immune thread).
3. **The contract is checked at the boundary; fulfilment is private.** Actors 1973 (intentions), Eiffel (pre/post and blame), BSPL/Peach adapters, and, inverted, Suchman's warning that checking intent becomes control.
4. **Immutability buys asynchrony.** BSPL bindings, Linda tuples, Ricardian digests, git objects.
5. **Standing to make a fact true by saying it.** Searle's declarations, Singh's institutional authority, Langshaw's sayso, the house kernel.
6. **Decoupling in space and time.** Linda, blackboards, the two-folder channel, cron passes; in every case the consequence is no ordering assumption, so meaning must be information-causal.

## 5. Disagreements and open questions

- **FIFO or not.** Session types need it; BSPL rejects it. One git repo is totally ordered; two repos on scheduled pulls are not. Assume unordered; use order only as a performance aid.
- **Immutability vs edited markdown.** Is a file revision a new binding under (key, version)?
- **Structure vs truth.** The protocol can verify who bound what with what authority; it cannot verify that tests passed. Each claim type needs an anchor. This is the seam with the gatekeeper and impact threads.
- **LLMs misclassify force.** A hedge gets labelled a commitment. Mitigation: type lives in the envelope, chosen from `enabled()`, never inferred from prose; NOT-UNDERSTOOD is mandatory.
- **Suchman applies to the operators.** Keep the typed layer small and the prose layer free.
- **Sanction.** Between two hobbyist agents the only sanction is reputation. Is thirty-day demotion enough, and who keeps the record when the two disagree?
- **Where the LLM sits.** Choosing among enabled actions (Peach, ZipperGen) or authoring the protocol at runtime (ZipperGen extension)? Open: a mid-enactment protocol change as a Proposal needing both operators' DECLARE.
- **Not verified:** Searle 1975 original (403); Singh 1998 full text (paywall); FIPA SC00037J final text (2001 experimental read); Kiko and Deserv only via search abstracts.

### Verdict on seed 7: pseudocode as contract language

| Candidate | LLM reads | Verifier reads | Survives unordered async | Carries meaning | Role |
|---|---|---|---|---|---|
| Prose (A2A, UCP) | yes | no | hidden assumptions (F10) | informally | insufficient |
| Procedural pseudocode | yes | only a formal subset | no, encodes one sequence | no | wrong form |
| Session types / MSCs | moderately | yes | needs FIFO | no | single-operator pipelines |
| BSPL / Langshaw | yes, already pseudocode-looking | yes (SAT) | yes | via commitments | **core** |
| Ricardian | yes | parameters only | n/a | binds prose to records | **wrapper** |
| Design by contract | yes | runtime assertions | n/a | per action | **per-action checks** |

Is LLM-readable pseudocode a session type in disguise? It can be, if restricted to send, receive, choice and recursion between named roles: then it is a global type and projects. But that guarantees fidelity to an *ordering*, the wrong invariant for agents on different clocks. Langshaw's `who / what / do / sayso / nono` block is the better disguise: it reads like pseudocode and it is decidable.

**Recommended shape: a Ricardian information protocol.** One hashed file, three layers:
1. **Information layer (verifier):** roles, key, message schemas with in/out/nil, sayso, nono/nogo, completion goal. Checked once for safety and liveness; enforced at run time by an adapter outside the agent.
2. **Meaning layer (both):** each message type as commitment operations with deadlines; pre/postconditions only where a script can decide them.
3. **Prose layer (LLM and operators):** purpose, acceptance criteria written to be actionable cold, examples; bound to layers 1–2 by the digest in every message.

Pseudocode survives as the surface syntax on one condition: no sequencing and no loops, only declarations of who may bind what, from what they must already know.

## 6. Sources

| # | Source | Year | Tag |
|---|---|---|---|
| 1 | Winograd, language/action perspective – https://www.lri.fr/~mbl/ENS/CSCW/2015/papers/Winograd-CSCW86.pdf | 1986/87 | opened |
| 2 | Searle, taxonomy of illocutionary acts – https://conservancy.umn.edu/handle/11299/185220 | 1975 | secondary |
| 3 | Finin et al., KQML – https://www.aaai.org/Papers/Workshops/1994/WS-94-02/WS94-02-007.pdf | 1994 | opened |
| 4 | FIPA CAL XC00037H – https://jmvidal.cse.sc.edu/library/XC00037H.pdf | 2001 | opened |
| 5 | FIPA SC00037J at fipa.org – http://www.fipa.org/specs/fipa00037/SC00037J.html | 2002 | opened (domain lapsed) |
| 6 | Chopra & Singh, Agent Communication slides – https://www.csc2.ncsu.edu/faculty/mpsingh/papers/mas/Agent-Communication-slides.pdf | 2012 | opened |
| 7 | Singh, social semantics for ACLs – https://www.csc2.ncsu.edu/faculty/mpsingh/papers/mas/socacl-fipa.pdf | 1999 | opened |
| 8 | Singh, ACLs: rethinking the principles – https://ieeexplore.ieee.org/document/735849/ | 1998 | secondary |
| 9 | Telang, Singh, Yorke-Smith, goals and commitments – https://www.csc2.ncsu.edu/faculty/mpsingh/papers/mas/AAMAS-ProMAS-11.pdf | 2011 | opened |
| 10 | Singh, BSPL – https://www.cs.huji.ac.il/~jeff/aamas11/papers/A4_B57.pdf | 2011 | opened |
| 11 | Singh, semantics and verification of BSPL – https://www.csc2.ncsu.edu/faculty/mpsingh/papers/mas/AAMAS-12-BSPL.pdf | 2012 | opened |
| 12 | Christie, Chopra, Singh, Mandrake – https://pmc.ncbi.nlm.nih.gov/articles/PMC8827306 | 2022 | opened |
| 13 | Singh, Christie, Chopra, Langshaw – https://arxiv.org/abs/2606.29601 | 2024 | opened (abstract) |
| 14 | Christie, Singh, Chopra, Strabo – https://arxiv.org/abs/2606.05043 | 2026 | opened |
| 15 | Chopra, Christie, Singh, evaluation of protocol languages – https://arxiv.org/abs/1901.08441 | 2020 | opened |
| 16 | Kiko – https://arxiv.org/abs/2606.26156 | 2023 | secondary |
| 17 | Deserv – https://www.csc2.ncsu.edu/faculty/mpsingh/papers/mas/ICWS-21-Deserv.pdf | 2021 | secondary |
| 18 | Coppo et al., gentle intro to MPST – https://mrg.cs.ox.ac.uk/publications/a-gentle-introduction-to-multiparty-asynchronous-session-types/paper.pdf | 2015 | opened |
| 19 | Honda, Yoshida, Carbone, MPST – https://dl.acm.org/doi/10.1145/2827695 | 2008/2016 | secondary |
| 20 | Bollig, Függer, Nowak, ZipperGen – https://arxiv.org/abs/2604.17612 | 2026 | opened (abstract) |
| 21 | Yuan et al., Beyond Message Passing – https://arxiv.org/abs/2604.02369 | 2026 | opened (abstract) |
| 22 | Suchman, Do categories have politics? – https://research.lancaster-university.uk/en/publications/do-categories-have-politics-the-languageaction-perspective-recons/ | 1994 | opened (abstract) |
| 23 | Dubberly, language/action model – https://www.dubberly.com/articles/language-action-model.html | 2010 | opened |
| 24 | Coevolving, conversations for action – http://coevolving.com/blogs/index.php/archive/conversations-for-action-commitment-management-protocol/ | n.d. | secondary |
| 25 | Smith, Contract Net – https://www.reidgsmith.com/The_Contract_Net_Protocol_Dec-1980.pdf | 1980 | opened |
| 26 | Gelernter, Linda – https://www.cs.unc.edu/~stotts/COMP590-059-f21/slides/lindaGenerative.pdf | 1985 | opened |
| 27 | Hewitt, Bishop, Steiger, actors – https://www.ijcai.org/Proceedings/73/Papers/027B.pdf | 1973 | opened |
| 28 | Erlang processes – https://www.erlang.org/doc/system/ref_man_processes.html | current | opened |
| 29 | Erlang supervision – https://www.erlang.org/doc/system/sup_princ.html | current | opened |
| 30 | Grigg, Ricardian contract – https://iang.org/papers/ricardian_contract.html | 2004 | opened |
| 31 | Meyer, Applying design by contract – https://se.inf.ethz.ch/~meyer/publications/computer/contract.pdf | 1992 | opened |
| 32 | Saltzer, Reed, Clark, end-to-end arguments – https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf | 1984 | opened |
| 33 | OBJS, comparing ACLs – http://www.objs.com/agility/tech-reports/9807-comparing-ACLs.html | 1998 | unverified (TLS failure) |
