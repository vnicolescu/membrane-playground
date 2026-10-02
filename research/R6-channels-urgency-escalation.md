---
thread: R6 – channels by time and spread, urgency, interruption, delivery guarantees, progressive escalation (seeds 5, 6, 8)
date: 2026-09-14
sources_opened: 37
---
# Channels, urgency and escalation: what high-stakes systems converged on

Military signals, aviation, maritime distress, hospital wards, on-call operations, public alerting and distributed systems all landed on the same five things:

- a few precedence levels, set by the sender and capped by the receiver;
- repeating a message until the right party acknowledges it;
- a "suspect" stage between healthy and failed;
- retraction as a message of its own;
- a penalty for false urgency, with a safe harbor for honest correction.

The spec below is those five plus a lease for liveness.

## 1. Findings

**F1. The sender sets precedence, and misusing it breaks the system.** ACP 121(F) has four levels, each with a target time from acceptance to delivery:

| Level | Target |
|---|---|
| FLASH | under 10 min |
| IMMEDIATE | 30 min–1 h |
| PRIORITY | 1–6 h |
| ROUTINE | 3 h to the next business morning |

- The originator must not set a level higher than the target needs.
- The manual says importance does not imply urgency.
- The level tells the addressee what order to read in. It does not set the reply's level.
- FLASH and IMMEDIATE interrupt lower traffic already on the circuit. Off-hours ROUTINE may be held until morning.

**Prevents:** a backlog of messages that all claim to come first. **Cost:** it depends on originator discipline, and the only enforcement the manual offers is telling people to behave. https://www.commsmuseum.co.uk/publications/ACP121/acp121f.pdf (1983) · opened. FLASH OVERRIDE is an authority to override FLASH, not a fifth level · secondary.

**F2. The receiver caps priority. An untrusted sender can only lower it.** In RFC 6710 (the SMTP priority extension), a server must not accept a raised priority from an unauthorized sender. An untrusted sender may lower its own, for example bulk mail sent below normal. The RFC names "always ask for top priority" as a denial-of-service attack. Military messaging (STANAG 4406) defines 32 levels, but only 6 are used in practice. **Prevents:** urgency inflation. **Cost:** a table of which senders may raise priority. https://www.rfc-editor.org/rfc/rfc6710 (2012) · opened.

**F3. Urgency, severity and certainty are three separate fields. Whether a message may interrupt is computed from them.** The emergency alerting standard OASIS CAP 1.2 splits the claim:

- **urgency:** Immediate / Expected (within the hour) / Future / Past / Unknown
- **severity:** Extreme / Severe / Moderate / Minor / Unknown
- **certainty:** Observed / Likely (above ~50%) / Possible / Unlikely / Unknown

It also has message types Alert / Update / Cancel / Ack / Error, a `references` field pointing to earlier messages, and an `expires` field.

US Wireless Emergency Alerts (WEA) compute eligibility from the three fields. An Imminent Threat alert needs urgency Immediate or Expected, severity Extreme or Severe, and certainty Observed or Likely. **Prevents:** one "priority" number that mixes how soon, how bad and how sure. **Cost:** the sender has to fill three fields honestly. https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html (2010) · opened; https://www.law.cornell.edu/cfr/text/47/10.400 · opened.

**F4. One class cannot be muted, and only one office may use it.** Phone users may opt out of Imminent Threat, AMBER and Public Safety alerts. National Alerts must always be shown, and only the President, a designee or the FEMA Administrator can send one. **Prevents:** the message that must land being filtered out. **Cost:** everything rides on one authority not misusing it. https://www.law.cornell.edu/cfr/text/47/10.280 · opened; https://docs.fcc.gov/public/attachments/FCC-21-77A1.pdf (2021) · opened. Apple's Critical notification level also bypasses mute, but needs a permission Apple grants · secondary.

**F5. Maritime distress calls repeat until acknowledged, the right station acknowledges, and bystanders relay after a timeout.** Under ITU Radio Regulations Art. 32, distress traffic has absolute priority.

- A digital distress alert (DSC) repeats automatically every few minutes, at random intervals, until a DSC acknowledgement cancels the repeats.
- A coast station or rescue centre normally acknowledges. Ships hold back so the authority answers first.
- A ship that hears a VHF distress call nobody has acknowledged waits 5 minutes, then acknowledges and relays it.
- A distant ship that hears an HF alert must not acknowledge. It relays to a coast station, and only after 5 minutes without a coast-station acknowledgement.

Art. 33 ranks urgency (PAN PAN) below distress and safety (SECURITE) below urgency. Aviation uses only two signals (FAA AIM 6-3-1). MAYDAY has absolute priority and imposes radio silence. PAN-PAN yields only to distress. If nobody answers, either may be broadcast. **Prevents:** lost alerts, and storms of duplicate relays. **Cost:** stations must keep a radio watch. ITU text: http://gg-kamratforening.se/roc/Manuals/ARTICLE%2032%20o%2033.pdf (WRC-07 revision) · opened; https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap6_section_3.html · opened.

**F6. A false alarm is an infringement, but cancelling your own is protected.** Under RR 32.10A, a false distress alert is reported if it was intentional, not cancelled, unverifiable because the ship kept no watch, repeated, or sent under a false identity. A mariner who reports and cancels a false alert should normally face no action. **Prevents:** abuse of the top class, without scaring senders into silence. **Cost:** someone has to judge. Same ITU source · opened.

**F7. Read the critical part back, and have the sender listen to the read-back.** Pilots read back altitudes, vectors and runways in the order given, with their callsign. The pilot accepts or refuses the clearance (AIM 4-4-7). https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap4_section_4.html · opened. ICAO makes the controller listen to the read-back and correct errors (Annex 11 3.7.3; phraseology in Doc 9432) · secondary. The hospital teamwork curriculum TeamSTEPPS uses the same loop: call-out, check-back, teach-back. Its handoff passes authority and responsibility along with the information. https://www.ahrq.gov/teamstepps-program/curriculum/communication/tools/loop.html (2023) · opened. **Prevents:** treating "sent" as "understood". **Cost:** a round trip, so it is used only for the critical fields.

**F8. The acknowledgement that matters is "I did it" or "I didn't".** Saltzer, Reed and Clark (the end-to-end argument) use the ARPANET's delivery acknowledgement as their example. It helped the network manage congestion but did little for applications. An application needs to know the other side acted, not that the bytes arrived. Acknowledgements from the transport layer can speed things up but never replace the end-to-end one. **Prevents:** reading a transport receipt as completion. https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf (1984) · opened.

**F9. The delivery guarantee depends on when state is committed. Duplicates are absorbed by idempotency.**

- **Kafka:** committing the read position before processing gives at-most-once; after processing, at-least-once. Exactly-once needs the position and the output in one transaction. https://docs.confluent.io/kafka/design/delivery-semantics.html · opened.
- **Transactional outbox:** the message is sent if and only if the local transaction commits. The relay can still send it twice, so consumers track which ids they have processed. https://microservices.io/patterns/data/transactional-outbox.html · opened.
- **Stripe:** stores the first response under a key the client generates. It prunes keys after 24 h and rejects a reused key sent with different parameters. https://docs.stripe.com/api/idempotent_requests · opened.
- **CloudEvents:** requires `id`, `source`, `specversion` and `type`. The pair `source`+`id` must be unique, which makes it the dedup key. https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md · opened.
- **Amazon SQS:** after `maxReceiveCount` failed deliveries, a message moves to a dead-letter queue, which must keep messages longer than the source queue does. https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html · opened.
- **Two generals problem:** no finite exchange over a lossy link reaches certainty on both sides · unverified, primary not opened.

**F10. Delay-tolerant networking kept expiry and status reports, and moved custody transfer out of the core.** Delay-tolerant networking is built for links that drop for long stretches. Its Bundle Protocol v7 (RFC 9171) carries messages as "bundles".

- Each bundle has a lifetime, an address for status reports, and optional reports (received / forwarded / delivered / deleted, with reasons such as lifetime expired).
- Reports are off by default, to avoid congestion.
- Appendix A says custody transfer, which was core in the previous version (RFC 5050), moved to a separate spec (bundle-in-bundle encapsulation).
- The class-of-service priority bits exist only in the old version 6.

**Prevents:** per-hop bookkeeping in a minimal core. **Cost:** custody, where needed, becomes an extension both sides must agree on. https://www.rfc-editor.org/rfc/rfc9171 (2022) · opened.

**F11. Gossip spreads fast, and a rumor stops once contacts turn up nothing new.** Demers et al. compare three ways to spread an update: direct mail (fast, unreliable), anti-entropy (reliable, slow) and rumor mongering. In rumor mongering, a site stops pushing an update after too many contacts that already had it. The trade-off is sites never reached against traffic.

Deletions spread as "death certificates". A few random sites keep a dormant copy, which wakes up if the deleted item reappears. The authors compare those copies to antibodies. **Prevents:** endless spread, and deleted data coming back. **Cost:** coverage is probabilistic. https://www.cis.upenn.edu/~bcpierce/courses/dd/papers/demers-epidemic.pdf (1987) · opened.

**F12. The SWIM failure detector suspects a peer before declaring it dead, and the peer can refute.** When a direct probe and k indirect probes fail, the peer is marked Suspected and the suspicion spreads by gossip. The peer clears it by answering, or by sending an Alive message with a higher incarnation number. Otherwise it is declared failed after a timeout. Detection time and per-member load do not grow with group size. **Prevents:** expelling a peer that is slow but healthy. **Cost:** slower detection. https://www.cs.cornell.edu/projects/Quicksilver/public_pdfs/SWIM.pdf (2002) · opened.

**F13. Leases make liveness a contract with an expiry.** A lease grants control for a fixed term. With leases, a crash costs performance but never correctness, and short terms keep that cost small. https://web.eecs.umich.edu/~mosharaf/Readings/Leases.pdf (Gray and Cheriton, 1989) · opened. In Kubernetes, each node heartbeat renews a Lease object. A stale renewal time marks the node unavailable, and the same object is used for leader election. https://kubernetes.io/docs/concepts/architecture/leases/ · opened. Lamport clocks guarantee that if a happened before b, a's timestamp is smaller. The reverse does not hold, so a timestamp alone cannot prove causality. https://lamport.azurewebsites.net/pubs/time-clocks.pdf (1978) · opened. For us, the `references` field plus git history already give causal links.

**F14. An interruption costs the receiver twice: time to resume, and stress.** Mark, Gonzalez and Harris observed 24 information workers.

- 57% of work segments were interrupted.
- Interrupted work resumed the same day took 25 min 26 s on average.
- About 2.26 other tasks came in between.
- The popular "23 minutes" figure is not in this paper.

https://ics.uci.edu/~gmark/CHI2005.pdf (2005) · opened. In a lab study, interrupted people kept their speed and quality but reported more stress, frustration and effort, measurable after 20 minutes. https://ics.uci.edu/~gmark/chi08-mark.pdf (2008) · opened.

**F15. Deliver at a natural pause. Whether to interrupt is a calculation, not a label.** Iqbal and Bailey found that delivering notifications at task breakpoints cut frustration and reaction time. How relevant the message is to the current task decides how long a pause to wait for. https://interruptions.net/literature/Iqbal-CHI08.pdf (2008) · opened. Horvitz, Jacobs and Hovel's Priorities system compares two expected costs: interrupting now, given what the user is doing, and delaying review. Each criticality class loses value at its own rate. The difference decides whether to alert now, wait or batch. https://arxiv.org/abs/1301.6707 (1999) · opened.

**F16. Charging for access to attention.** Dwork and Naor make the sender do a moderately hard computation before sending: enough to discourage frivolous mail without blocking it. A built-in shortcut lets the operator sell cheap bulk access. https://web.cs.dal.ca/~abrodsky/7301/readings/DwNa93.pdf (1992) · opened. Loder, Van Alstyne and Wash propose "attention bonds": the recipient sets a sum the sender puts at risk, and the recipient may keep it. This puts the work of screening on the sender, who knows the content · secondary.

**F17. Hospitals escalate in graded steps and also accept "worried" as a trigger.** NEWS2 (the UK early warning score) adds up six vital-sign scores and maps the total to response bands:

| Score | Response |
|---|---|
| 0 | observation at least every 12 h |
| 1–4 | every 4–6 h, plus a nurse assessment |
| 5–6, or any single parameter at 3 | hourly, plus urgent review |
| 7+ | continuous monitoring, plus emergency assessment by a critical-care team |

The score supplements clinical judgement and does not replace it. https://www.rcp.ac.uk/improving-care/resources/national-early-warning-score-news-2/ (2017) · opened; the band actions are secondary.

Rapid response teams accept "nurse worry" as a trigger below the vital-sign thresholds. Of 4,634 calls in 2021–22, 27% were worry-only, and worry calls led to fewer ICU transfers (37–40% against 50%). The study is observational. https://pmc.ncbi.nlm.nih.gov/articles/PMC11727266/ · opened.

Two more structures:
- **SBAR** (Situation, Background, Assessment, Recommendation) makes a request actionable by someone with no context. https://www.ihi.org/resources/tools/sbar-tool-situation-background-assessment-recommendation · opened.
- **START triage** sorts patients into four categories using a handful of cheap checks. https://chemm.hhs.gov/incident-primer/triage/start-triage · opened.

TeamSTEPPS also has a Two-Challenge Rule (raise a concern twice, then go up the chain) and CUS (Concerned / Uncomfortable / Safety issue: "stop the line") · secondary.

**F18. On-call paging climbs rung by rung, an acknowledgement stops it, and a repeat of the alert restarts it.** PagerDuty's escalation policies:

- up to 20 rungs
- 30 minutes per rung by default, minimum 1 minute (3 minutes with several targets)
- the whole policy repeats at most 9 times
- an acknowledgement stops notifications but does not resolve the incident
- if the alert fires again, escalation resumes

https://support.pagerduty.com/main/docs/escalation-policies · opened. Google SRE: every page must be actionable, need judgment and be new, and a person can respond urgently only a few times a day. https://sre.google/sre-book/monitoring-distributed-systems/ · opened. Prometheus Alertmanager groups duplicate alerts, suppresses dependent alerts while a root alert is firing, and supports silences. https://prometheus.io/docs/alerting/latest/alertmanager/ · opened.

**F19. Alarm fatigue is what cheap urgency looks like when measured.** The Joint Commission estimates that 85–99% of hospital alarm signals need no clinical action. Of 98 alarm-related adverse events reported from 2009 to mid-2012, 80 ended in death. https://www.kff.org/wp-content/uploads/sites/2/2013/04/sea_50_alarms_4_5_13_final1.pdf (2013) · opened.

## 2. Candidate primitives

| # | Name | Mechanism | Seeds | Verdict |
|---|---|---|---|---|
| P1 | Envelope `{id, source, type, time, subject?, references[], expires}` | CloudEvents minimum plus CAP's references and expires; `source`+`id` is the idempotency key | 6 | core |
| P2 | Three-field claim: urgency × severity × certainty | Interrupt eligibility is computed from these, not asserted (F3) | 3, 5, 8 | core |
| P3 | Interrupt ceiling | Set by the receiver for each sender; raising needs authorization, lowering is free (F2, F4) | 5, 8, 11 | core |
| P4 | Acknowledgement ladder: received → accepted \| refused → done \| failed | The end-to-end result is mandatory; "received" is optional (F8, F10) | 6 | core |
| P5 | Repeat until acknowledged, with a loop cap, then dead-letter | F5, F9, F18 | 8 | core |
| P6 | Lease / heartbeat | Silence past the term is itself the signal (F13) | 5, 6 | core |
| P7 | Suspect state | A missed lease makes the peer a suspect, not dead; the peer can refute (F12) | 4, 8 | core |
| P8 | Supersede | `update` or `cancel` referencing earlier ids; retractions are kept (F11) | 1, 4, 8 | core |
| P9 | Escalation ladder | Timeouts climb authority, driven by the time left before the deadline (deliverable c) | 8 | core; timings are set per pair |
| P10 | Urgency verdict + demotion + safe harbor | F6, F17 | 8, 11 | core |
| P11 | Read-back of the critical fields in `accepted` | F7 | 1, 6 | core for requests that change state |
| P12 | Deliver at a pause | F15 | 5 | optional (receiver's business) |
| P13 | Group, suppress, stop relaying | F11, F18 | 5, 8 | optional |
| P14 | Per-hop custody transfer | Removed from the DTN core (F10) | 5 | optional |
| P15 | Charged sending (proof-of-work, bonds) | F16 | 11 | optional; out for the pilot |
| P16 | Logical clocks | F13 | 6 | out: `references` + git DAG suffice (end-to-end argument) |
| P17 | Unmutable class | F4 | 5, 9 | optional; reserved to the operator's stop signal |

### Deliverable (a): minimal channel model

A channel has three independent axes. Urgency is a property of the message, not the channel.

- **When** (how soon the receiver must attend): `interrupt` (drops current work) / `prompt` (next pause) / `cycle` (next scheduled run) / `pull` (no obligation). These map to FLASH, PRIORITY, ROUTINE and the military "Deferred" level.
- **Who** (spread): `one` / `set` (named recipients, split into those who must act and those only informed) / `all-in-scope` (broadcast) / `relay` (listeners re-send until told to stop).
- **Proof**: `none` / `receipt` (a hop received it) / `outcome` (end-to-end accepted or done).

The **right to interrupt** is not a fourth axis. It is a ceiling on *When* that the receiver grants each sender (P3). This is where the stake sits.

| Class | When | Who | Proof | Carries | Precedent |
|---|---|---|---|---|---|
| **Mailbox** | cycle / prompt | one | outcome | request, report, ack, supersede | the deployed client channel; email; delay-tolerant bundles |
| **Bulletin** | pull | all-in-scope | none (the reader's watermark) | heartbeat, published receipts, displayed state | MHC display; CAP Public; SWIM gossip |
| **Page** | interrupt | one, climbing the ladder | outcome, repeated until acknowledged | alert | MAYDAY / FLASH; maritime distress alert; PagerDuty |

Agents that live in git have no native interrupt. For them a page means one of two things: start an unscheduled run, or notify the operator through another channel. The top rung is always a human.

### Deliverable (b): minimal message types

1. **request:** asks for action or information. Carries `acceptance` (a one-line success criterion), `deadline`, `cost_of_delay`, and an SBAR-shaped body. *Speech act: directive.*
2. **ack:** `received | accepted | refused(reason) | done | failed(reason)`. `accepted` transfers responsibility and reads back the request's critical fields. *Commissive / assertive.*
3. **report:** a completion or status report with a verdict against the acceptance line. This is the house receipt. *Assertive.*
4. **alert:** an unrequested change that needs attention. Carries the three-field claim and `expires`. *Assertive with an implied directive.*
5. **heartbeat:** renews a lease. Carries `term`, `incarnation` and `covered_through`. Silence past the term is the message. *Phatic.*
6. **supersede:** `update | cancel | all-clear`, referencing earlier ids. Retractions are kept. *Declarative.*

Folded into these rather than given their own type:
- **check-in** = a heartbeat carrying a watermark
- **completion** = a report, or `ack: done`
- **handoff** = a request answered with `ack: accepted`
- **escalation** = the same alert re-sent at a higher rung, with the original id in `references`

### Deliverable (c): escalation ladder spec

```
send(msg in {request, alert}):
  class = min(eligible(urgency, severity, certainty), ceiling[receiver][sender])  # F2, F3
  slack = (msg.deadline or msg.expires) - now

R0  deliver on class; expect ack(accepted|refused) within T0 = receiver.cycle
R1  no ack -> KNOWN_UNREAD; re-send and flag on receiver's boot surface; T1 = min(cycle, slack/2)
R2  no ack -> SUSPECT(receiver): probe its lease, not the message
      lease stale -> reason=liveness, go to R3 immediately;  T2 = lease.term
R3  page the RECEIVER's operator; repeat every Tp=30min, max 3 loops         # F18
R4  page the SENDER's operator; dependent actions enter safe hold
      (on silence, nothing irreversible)                                      # dead man's switch
R5  loops exhausted -> dead-letter as a tension {owner, goal, threshold}; stop paging

climb early  if slack < expected_handling_time(next rung)                     # ACP time targets
stop         any ack(accepted|refused|done)
resume       an alert whose references include the id resumes at the stopped rung
de-escalate  supersede(update with a lower claim | cancel | all-clear)

stake:
  ceiling starts at cycle; prompt after a clean record; interrupt only by operator grant
  budget    at most K=2 interrupts per sender per 7 days; the excess drops to prompt
  verdict   the receiver's operator marks each interrupt warranted or unwarranted
  demotion  2 unwarranted in 30 days -> ceiling drops one class for 30 days; 30 clean days restore it
  honesty   a wrong claim with certainty Possible or Unlikely is never counted;
            a false claim with certainty Observed counts double
  harbor    a sender who cancels its own alert within one cycle is not counted  # F6
  worry     a `concern` flag reaches prompt below the thresholds and is never counted  # F17
  suppress  while a parent alert is open, child alerts on the same subject group into it
```

Why these defaults. K=2 per week is generous, because an operator is not on call (SRE: a few urgent responses a day for someone who is). The 30-day demotion and restore copy the house authority rule. The 3-loop cap sits below PagerDuty's 9 because R4 brings in a second operator.

## 3. Mapped to house primitives

- **Receipt** = the `report`, with its verdict against `acceptance`.
- **Watermark** = the heartbeat's `covered_through`. A watermark may stand in for an acknowledgement only on `pull` traffic, never on requests (F8).
- The deployed client channel already runs R0–R1: "sent means read-back confirmed" is P4 plus P11, and an unacked report escalating after the next cycle is R1. **New:** R2–R5 and the stake.
- **Tension** = the R5 dead-letter. The house urgency formula (goal rank × days since progress) is a case of Horvitz's cost of delayed review. ANNEAL is a loop cap.
- **Authority + demotion** = the interrupt ceiling (P3, P10). This is seed 11's recoverable reputation, scoped to one resource: the right to interrupt.
- **Anchor** = R3/R4 always end at a human. The anchor's budget becomes the interrupt budget K.
- **Hook:** the ladder's timers must run outside the agent. The recorded incident showed that an agent with a shell treats in-agent rules as advisory, and escalation the escalated party can switch off is not escalation.
- **Constructed layer / quarantine** = CAP certainty. `Observed` enters as a measurement. `Likely` and `Possible` go to quarantine until reconciled.
- **Proposal** = a request that only the operator may accept.
- **Mirror** = the kept message log, retractions included.
- **New primitives needed:** lease, interrupt ceiling, supersede, idempotency key.

## 4. Cross-field overlaps

1. **Repeat until the right party acknowledges, then stop.** Maritime distress alerts cancelled by a coast station's acknowledgement; PagerDuty re-paging; SQS redelivery and dead-letter queues; the deployed channel's known-unread rule.
2. **Echo the critical part back.** Aviation read-back and hear-back; TeamSTEPPS check-back and handoff; Saltzer's "I did it"; Stripe replaying the stored response for a repeated key.
3. **Suspect before dead.** SWIM suspicion; the NEWS2 middle band (hourly watch before emergency review); a ship's 5-minute wait before relaying; Kubernetes lease expiry; a house tension moving from watch to act.
4. **The sender claims, the system caps, and lowering is free.** ACP 121; RFC 6710; WEA National Alerts; Apple's Critical level; Alertmanager suppression.
5. **Urgency, importance and certainty are kept apart.** ACP 121 ("importance is not urgency"); CAP's three fields; START's severity and survivability; Horvitz's criticality versus cost of attention.
6. **Retraction is a message, and it persists.** CAP Cancel / AllClear; cancelling a false distress alert; Demers' death certificates, which their authors compare to antibodies (relevant to seed 4); PagerDuty resolve.
7. **Practice settles on 3–6 levels.** STANAG 4406 defines 32 and uses 6; ACP 121 has 4; ITU distress/urgency/safety 3; aviation 2; NEWS2 and START 4 each; delay-tolerant networking dropped its priority bits.
8. **Cheap urgency turns into noise.** Hospital alarms (85–99% need no action); SRE's rule that pages must be new and actionable; Mark's stress findings; Dwork–Naor and attention bonds. The counterweight comes from hospitals too: rapid response teams do not punish an early worried call.

## 5. Disagreements and open questions

- **Who computes urgency?** ACP 121 and CAP have the sender set it. Horvitz and Iqbal–Bailey have the receiver infer it from its own state. The spec does both: the sender claims, the receiver caps and defers. Whether an agent can model its operator's attention well enough to wait for a pause is unknown, so the default is the cycle boundary.
- **Penalty versus speaking up.** P10 punishes false interrupts. The Two-Challenge Rule, CUS and the nurse-worry data say suppressed early warnings cost lives. The reconciliation (weighting verdicts by certainty, the safe harbor, an uncounted `concern` flag) is my own synthesis, not a standard I found. It needs testing on real traffic.
- **Custody transfer: core or extension?** Delay-tolerant networking moved it out of the core. The deployed channel's "sent means read-back confirmed" says the endpoint's `accepted` belongs in the core. Position: `accepted` from the endpoint is core; per-hop custody is optional.
- **Exactly-once delivery is out of reach; effectively-once is the target.** The risk is doing an action twice, not receiving a message twice. So idempotency keys go in the envelope and duplicate messages are tolerated.
- **Do agents need a Page class at all?** Both pilot agents run in cycles. Page may be operator-only, leaving Mailbox and Bulletin for agent-to-agent traffic.
- **Unmutable class.** The only candidate is the operator's stop signal to their own agent. Needs a decision.
- **Partition: deliver stale or hold?** `expires` decides per message. After expiry, drop it and report `failed(expired)`, as delay-tolerant networking does.
- **Not verified at the primary source.**
  - The ACP 121 time targets come from the 1983 edition F; later editions were not checked.
  - The NEWS2 band actions and the Two-Challenge Rule / CUS wording are secondary.
  - Not opened: the ESI triage scale, ICS/SEV incident levels, railway dead man's switch rules, DoD FLASH OVERRIDE, and the two generals problem.
- **K and the demotion thresholds** assume one operator per agent. A larger mesh needs a ceiling per relationship, which hands off to seed 11.
- The AsyncAPI document format (servers, channels, send/receive operations, messages) is a reference for seed 7's contract language, not for this thread. https://www.asyncapi.com/docs/concepts/asyncapi-document/structure · opened.

## 6. Sources

Opened:
1. https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html (2010)
2. https://www.commsmuseum.co.uk/publications/ACP121/acp121f.pdf (1983)
3. https://www.rfc-editor.org/rfc/rfc6710 (2012)
4. https://www.rfc-editor.org/rfc/rfc9171 (2022)
5. https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md
6. https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap6_section_3.html
7. https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap4_section_4.html
8. http://gg-kamratforening.se/roc/Manuals/ARTICLE%2032%20o%2033.pdf (a copy of the ITU RR Arts. 32–33 text, WRC-07)
9. https://www.law.cornell.edu/cfr/text/47/10.400
10. https://www.law.cornell.edu/cfr/text/47/10.280
11. https://docs.fcc.gov/public/attachments/FCC-21-77A1.pdf (2021)
12. https://support.pagerduty.com/main/docs/escalation-policies
13. https://sre.google/sre-book/monitoring-distributed-systems/ (2016)
14. https://prometheus.io/docs/alerting/latest/alertmanager/
15. https://www.kff.org/wp-content/uploads/sites/2/2013/04/sea_50_alarms_4_5_13_final1.pdf (Joint Commission SEA 50, 2013)
16. https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf (1984)
17. https://docs.confluent.io/kafka/design/delivery-semantics.html
18. https://microservices.io/patterns/data/transactional-outbox.html
19. https://docs.stripe.com/api/idempotent_requests
20. https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html
21. https://www.cis.upenn.edu/~bcpierce/courses/dd/papers/demers-epidemic.pdf (1987)
22. https://www.cs.cornell.edu/projects/Quicksilver/public_pdfs/SWIM.pdf (2002)
23. https://web.eecs.umich.edu/~mosharaf/Readings/Leases.pdf (1989)
24. https://kubernetes.io/docs/concepts/architecture/leases/
25. https://kubernetes.io/docs/concepts/architecture/nodes/ (heartbeat defaults from a fetch summary; treat numbers as secondary)
26. https://lamport.azurewebsites.net/pubs/time-clocks.pdf (1978)
27. https://www.asyncapi.com/docs/concepts/asyncapi-document/structure
28. https://ics.uci.edu/~gmark/CHI2005.pdf (2005)
29. https://ics.uci.edu/~gmark/chi08-mark.pdf (2008)
30. https://interruptions.net/literature/Iqbal-CHI08.pdf (2008)
31. https://arxiv.org/abs/1301.6707 (UAI 1999)
32. https://web.cs.dal.ca/~abrodsky/7301/readings/DwNa93.pdf (1992)
33. https://www.rcp.ac.uk/improving-care/resources/national-early-warning-score-news-2/ (2017)
34. https://www.ahrq.gov/teamstepps-program/curriculum/communication/tools/loop.html (2023)
35. https://www.ihi.org/resources/tools/sbar-tool-situation-background-assessment-recommendation
36. https://chemm.hhs.gov/incident-primer/triage/start-triage
37. https://pmc.ncbi.nlm.nih.gov/articles/PMC11727266/ (data 2021–22)

Secondary or unverified:
- NEWS2 band actions (reproductions of RCP Chart 4, found by search) · secondary
- ICAO Annex 11 3.7.3 and Doc 9432, via SKYbrary search snippets · secondary
- TeamSTEPPS Two-Challenge Rule and CUS, https://www.ahrq.gov/teamstepps-program/curriculum/mutual/tools/rule.html (returned 403) · secondary
- Loder, Van Alstyne, Wash, attention bonds, https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1762212 (2006, returned 403) · secondary
- Apple UNNotificationInterruptionLevel and the critical-alert permission · secondary
- FLASH OVERRIDE, https://military-history.fandom.com/wiki/Message_precedence · secondary
- The two generals problem · unverified
- ESI, ICS/SEV and railway alerter rules · not researched
