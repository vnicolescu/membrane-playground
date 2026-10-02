---
thread: R5 – immunology and cell biology as the mechanism library for agent health, trust and escalation
date: 2026-09-14
sources_opened: 30
---
# R5 – An immune architecture for a minimal agent protocol

Biology as mechanism, not metaphor: for each mechanism, what message or state must two agents that cannot see each other's interior carry for it to work? Answer: six core primitives (presentation, missing-self timer, two-signal release with anergy, danger header, escalation with half-life and brake, exit) and five optional layers. The strongest lesson, from biology and from thirty years of artificial immune systems, is negative: **shape-based self recognition is always partly blind and always mimicable, so it must be paired with an independent second signal and with impact.**

## 1. Findings

**F1. MHC I presentation is sampled, not authored.** Nucleated cells degrade a sample of their own cytosolic proteins, pump the peptides into the ER (TAP), load them on MHC I and display them to CD8 T cells; MHC without peptide is unstable and does not stay on the surface. · Prevents: an infected interior hiding behind the membrane. · Cost: constant sampling; interior exposed to any reader. · Janeway *Immunobiology* 5th ed., NBK27137 (2001) · `opened`

**F2. Two classes, compartmentalised loading.** Class I carries what the cell made; class II carries what professional presenters ingested. The invariant chain blocks the class II groove until the endosome, and neither class takes peptide from the extracellular fluid. · Prevents: confusing "made" with "ingested"; framing bystanders with ambient debris. · Cost: two pathways. · NBK27137 (2001) · `opened`

**F3. Missing-self: refusing to present is the signal.** Cells that lose MHC I are rejected non-adaptively by NK cells, which detect the absence of the self marker. Inhibitory receptors (KIR, NKG2A) read self MHC I, and an NK cell is only strongly responsive if it carries a receptor matched to its host's MHC ("education"). Viruses evade class I by blocking TAP or degrading MHC I; missing-self catches exactly that. · Prevents: evasion by silence. · Cost: legitimately quiet cells at risk; checker must be calibrated per host. · Kärre et al., Nature (1986); Yawata et al., Blood (2008); NBK27137 · `opened` (Kärre: abstract)

**F4. Two-signal activation and anergy.** A naive T cell needs peptide:MHC (signal 1) and B7→CD28 (signal 2) from the **same** presenting cell. Tissue cells lack B7, so self antigen there gives signal 1 alone and induces anergy, a lasting refractoriness that persists even if the antigen is later presented properly. CTLA-4 binds B7 about 20× more avidly than CD28 and brakes proliferation. Armed effector cells no longer need costimulation. · Prevents: one recognition channel attacking self. · Cost: slower first response. · NBK27118 (2001); history (Bretscher & Cohn 1970, Lafferty & Cunningham 1975) per Matzinger (2002) · `opened`

**F5. Costimulation from a human in a deployed AIS.** In LISYS an activated detector messages the operator; confirmation within a fixed window makes it a long-lived memory detector with threshold 1; no confirmation and it dies. New detectors first pass a tolerisation period (negative selection); activation needs matches above a threshold lowered by a decaying local sensitivity. · Prevents: detectors accumulating false positives. · Cost: operator attention per alarm. · Glickman, Balthrop & Forrest, Evol. Comput. (2005); Hofmeyr & Forrest, Evol. Comput. (2000) · `opened` (2000: abstract)

**F6. Danger, not foreignness, starts the response.** APCs stay quiescent until alarm signals from stressed or necrotic cells activate them; programmed death is scavenged before contents leak, so it sends no alarm. Foreign-but-harmless (a healthy fetus) is tolerated, self-but-harmful (some mutations) attacked. One receptor binds exogenous and endogenous alarms (TLR4: LPS and Hsp70). Blocking signal 1 blindfolds lymphocytes and prevents tolerance, so drugs are lifelong; short blockade of costimulation or alarm gave long-term graft acceptance in rodents and monkeys. Tissues set the response class. · Prevents: attacking harmless novelty, ignoring harmful self. · Cost: waits for damage. · Matzinger, Science 296:301 (2002) · `opened`

**F7. Respond to change, not level.** Discontinuity theory: abrupt changes in antigenic stimulation trigger responses; continuous interactions are tolerated, self or foreign. Tunable activation threshold: each lymphocyte's threshold follows its recent excitation, and anergy is a raised threshold, not paralysis. Receptor desensitisation tracks concentration changes. · Prevents: chronic alarm at steady foreign presence; lets self drift. · Cost: slow creep stays sub-threshold (my inference). · SEP "Philosophy of Immunology" (rev. 2026); Grossman & Paul, PNAS (1992); Alberts NBK26813 · `opened` (G&P: abstract)

**F8. Content stream and context stream kept apart (DCA).** Each artificial dendritic cell collects antigens while accumulating PAMP, danger, safe and inflammatory signals from a separate stream; at a migration threshold it reports under a semi-mature (safe-dominated) or mature (danger-dominated) context; an antigen's score is its fraction of mature contexts. Safe signals suppress. · Prevents: labelling by identity alone. · Cost: signals hand-mapped to observables. · Greensmith, Aickelin & Cayzer, arXiv:1006.5008 (2008; algorithm 2005) · `opened`

**F9. Kinetic proofreading: delay buys discrimination.** The TCR goes through several modification steps after binding before it signals; early dissociation resets the chain, so small differences in binding lifetime become large differences in output, the same scheme that makes protein and DNA synthesis accurate. · Prevents: acting on brief weak matches. · Cost: latency and sensitivity (my reading of the model). · McKeithan, PNAS 92:5042 (1995) · `opened` (abstract)

**F10. Selection, tolerance, and how tolerance breaks.** The thymus deletes T cells reactive to ubiquitous self; tissue-specific antigens escape and are handled peripherally: anergy, ignorance, sequestration in privileged sites (brain, eye), and suppression by CD25+CD4+ regulatory T cells, whose depletion causes autoimmune diabetes and thyroiditis in normal mice. Tolerance breaks when infection induces costimulation on APCs showing self, through molecular mimicry, or when trauma releases sequestered antigen. · Prevents: autoimmunity. · Cost: each layer has its own failure. · NBK27174 (2001); Sakaguchi et al., Cell (2008) · `opened` (Cell: abstract)

**F11. The cost floor of tolerance.** Only 0.2% of non-self peptide-HLA complexes are identical to self, but allowing degenerate TCR recognition (up to two conservative substitutions at contact positions) about 29% are indistinguishable from some self complex; tolerance forces blindness to roughly a third of foreign epitopes. · Quantifies the unavoidable miss rate of a tolerant shape detector. · Calis, de Boer & Keşmir, PLoS Comput Biol (2012) · `opened`

**F12. A computational self, and its mimicry.** Forrest et al. defined self for privileged Unix processes as the short system-call sequences of normal runs (windows 5, 6, 11); sendmail's database had about 1,500 entries from 112 crafted messages, and other programs mismatched it 5–32% at length 6. They note arguments and timing are ignored and a masquerader with a valid password is invisible. Wagner & Soto then inserted "no-op" calls so a malicious sequence stays inside the learned language; detectors that ignore arguments are broadly evadable. The retrospective's counter: per-installation diversity raises imitation cost. · Cost: false positives; evadable. · Forrest et al., IEEE S&P (1996); Wagner & Soto, ACM CCS (2002); Forrest, Hofmeyr & Somayaji, ACSAC (2008) · `opened`

**F13. Graded response by delay (pH).** pH delays each system call exponentially in the anomaly count over the last 128 calls: isolated anomalies are imperceptible, clusters stall a process for hours, network timeouts kill many attacks, the administrator gets time; execve aborts past a threshold; users can tolerise or sensitise. Retrospective: binary responses are unacceptable under any false-positive rate; graduated response allows continual small corrections. Of the design principles, diversity was adopted, graduated response and adaptability stayed controversial, generic mechanisms and autonomy were ignored. · Cost: ~4% wall-clock in one benchmark, ~10% on `find`. · Somayaji & Forrest, USENIX Security (2000); ACSAC (2008) · `opened`

**F14. Why negative selection lost.** Real-valued negative selection needed both positive and negative examples for good anomaly-detection accuracy, while one-class SVMs need one class. · Stibor et al., GECCO (2005) · `opened` (abstract)

**F15. Amplification confined locally.** One C3 convertase deposits up to ~1,000 C3b nearby; the alternative pathway is a self-feeding loop amplifying all pathways, with spontaneous tickover. It stays on target because activated fragments die fast unless bound on the spot, and because host surfaces carry regulators (factor H reads sialic acid; DAF, MCP, CD59). In PNH, loss of DAF and CD59 lets complement lyse the body's own red cells. · Cost: permanent regulator expression. · NBK27100 (2001) · `opened`

**F16. Runaway escalation and its brakes.** Cytokine storm: elevated circulating cytokines, systemic symptoms, and organ dysfunction beyond an appropriate response. Brakes: regulatory cells, decoy receptors (IL-1RA), IL-10; in HLH a perforin defect stops effectors from terminating, so activation never ends. The nervous system also inhibits inflammation reflexively in real time via a cholinergic (vagal) pathway. · Prevents: the defence killing the host. · Fajgenbaum & June, NEJM (2020); Tracey, Nature (2002) · `opened` (Tracey: abstract)

**F17. Lanes and gates.** Paracrine signals act locally and are destroyed fast; endocrine hormones travel the blood, slow and wide, specific only by receptor; synaptic signals cross under 100 nm in milliseconds, specific by anatomy. Ion channels are selective, gated by distinct stimuli (voltage, ligand, mechanical), ~10⁵× faster than carriers, and inactivate after opening (refractory period). · Prevents: one channel serving every message class; continuous firing. · Alberts NBK26813, NBK26910 (2002) · `opened`

**F18. The endosome is a quarantine with exits.** Receptor-mediated uptake concentrates cargo over 100-fold; the early endosome is the main sorting station, where acidification releases ligand; receptors mostly recycle, cargo goes to lysosomes, some is carried across (transcytosis). Activated EGF receptors are internalised and degraded, turning signalling down. · Prevents: raw inbound reaching the cytoplasm; unbounded signalling. · Alberts NBK26870 (2002) · `opened`

**F19. The kernel barrier has no side door.** BBB endothelia are sealed by tight junctions with no fenestrations; entry only by lipid diffusion, specific carriers or receptor-mediated transcytosis; ABC efflux pumps expel intruders. Circumventricular organs are deliberate unbarriered sensing windows. Breakdown gives edema and neuroinflammation. · StatPearls NBK557721 (2023) · `opened`

**F20. Quorum sensing: a broadcast whose meaning is a count.** Autoinducers accumulate with density; past a threshold receptors switch collective gene expression, and detection raises production (positive feedback). AI-2 is shared across species; antagonists out-compete the signal. · Prevents: costly collective action by a few. · Cost: forgeable, quenchable. · Rutherford & Bassler, CSH Perspect Med (2012) · `opened`

**F21. Memory.** Secondary responses are faster, need lower dose, reach higher plateaus, and persisted for decades without re-exposure (island measles). Innate cells show trained immunity through epigenetic reprogramming, without mutation or recombination. · Cost: memory can be fast and wrong. · NBK27158 (2001); Netea et al., Science (2016) · `opened` (Netea: abstract)

## 2. Candidate primitives

Placement follows the end-to-end argument: functions needing endpoint knowledge (recognition, impact scoring) stay in the agent; the protocol carries only fields and transitions both sides must agree on (Saltzer, Reed & Clark).

| # | Primitive | Mechanism | Seeds | Placement |
|---|---|---|---|---|
| P1 | **present** | Periodic, fixed-schema message of *sampled verbatim* fragments in two slots never mixed: `made` (own sealed outputs: receipt flags, watermark, kernel hash) and `ingested` (digests of inbound and its disposition). Empty = invalid. (F1, F2) | 4, 11 | **core** |
| P2 | **missing-self timer** | Channel declares cadence; one missed cycle = `suspect`; two = peer's inbound auto-quarantined, escalate. Applied only by a checker holding the peer's schema; declared `pause` exempts. (F3) | 4, 8 | **core** |
| P3 | **two-signal release + anergy** | Release needs signal 1 (content passes a named check) and signal 2 (an anchor unable to produce signal 1) bound to **the same item id** within a window. Signal 1 alone at deadline → `anergic`: tolerated, not acted on, identical resubmission refused, raising rule down-weighted. (F4, F5) | 1, 2 | **core** |
| P4 | **danger header** | Sender declares `requested_effect` (none/read/write/irreversible/kernel); receiver scores impact from its own damage and safe observables, in a stream separate from content. Novelty alone never triggers. (F6–F8) | 3, 2 | fields **core**; scoring **out** |
| P5 | **escalation with half-life and brake** | L0 note → L1 delay/hold → L2 quarantine peer → L3 operator interrupt. Tokens carry TTL and persist only if re-bound to an item; a named brake-holder's `stand_down` overrides; every response has a stop condition. (F13, F15, F16) | 8, 5 | **core** |
| P6 | **exit** | Hand over open items and locks, then stop. Vanishing without `exit` is a danger signal. (F6) | 6, 4 | **core** |
| P7 | quarantine exits | `return`, `degrade` (with receipt), `forward` (unchanged), `deliver`. (F18) | 1, 2 | core states |
| P8 | proofreading dwell | Item must stay bound (unretracted, re-checked valid) through k steps; retraction resets. (F9) | 1, 5 | optional; mandatory for `irreversible` |
| P9 | quorum alarm | Population escalation only on k independent, identity-attested reporters. (F20) | 5, 8, 11 | optional |
| P10 | signature (vaccination) | Shared attack pattern with provenance, filed as a quarantined low-threshold detector that decays unless locally costimulated. (F5, F21) | 4, 11 | optional |
| P11 | gated lanes | Alarm lane (small, fast, refractory) apart from content lane (slow, sorted). (F17) | 5 | optional |
| P12 | kernel barrier | Kernel reachable only via named transporter (proposal); sensing windows outside. (F19) | 9 | goal **core**; enforcement **out** |
| – | recognisers, selection, regulatory suppression, memory, thresholds | Agent-internal. (F10–F14, F21) | 2, 4 | **out** |

```
message present    { peer, seq, cadence, made:[fragment], ingested:[digest], sanitization }
message item       { id, from, requested_effect, body, refs }
message signal2    { item_id, anchor_kind, anchor_id, verdict }   # anchor_id independent of signal-1 source
message escalate   { target, level, ttl, observables }
message stand_down { target, by }
message exit       { peer, handover:[item_id], reason }

on tick(peer):    lapse > cadence -> suspect;  lapse > 2*cadence -> quarantine_inbound(peer); escalate(L2)
on item(x):       quarantine(x); s1 = recognise(x)                     # agent-internal
on signal2(s):    s.item_id == x.id and independent(s, s1) and s1.pass -> deliver(x)
on deadline(x):   s1.pass and no signal2 -> anergic(x); weight(s1.rule) -= d
                  else -> return(x) | degrade(x)
escalation:       token dies at ttl unless rebound(item); stand_down overrides every level
```

## 3. Mapped to house primitives

- **present ↔ receipt + mirror + watermark.** The flags block already is a class I molecule: fixed format, verbatim, made by the run itself. Missing: the class II slot, a declared `ingested` field, which is the constructed layer made visible to a peer.
- **missing-self ↔ "unacked after the next cycle escalates"** (deployed client channel) and the nightly naming branches with no `held:` line. The house already reads absence as signal; P2 extends it from acknowledgement to health.
- **two-signal release ↔ constructed layer, reconciliation of two runs, the operator's word.** Biology adds two constraints. Signal 2 must be *non-specific* yet bound to the *same* item: the APC vouches for context, it does not recognise the antigen. The anchor budget is precisely a costimulation hazard: a reader who reads closely enough starts producing signal 1 and loses independence. And the house has no **anergy**: a claim with recognition but no confirmation should close as tolerated-and-refractory, not wait. **New primitive: anergy.**
- **danger header ↔ demotion rule.** "A receipt claim contradicted on disk" is a damage signal; the house already judges by impact on disk, not novelty. The voice gate and register lint are shape detectors and inherit F11–F12 (passable by imitation): keep them as the fast innate layer, never the only gate.
- **authority tiers + demotion ↔ tunable threshold + memory.** Widening authority on a clean record lowers the threshold; the thirty-day demotion is timed anergy with guaranteed recovery (seed 11).
- **escalation ↔ tension urgency, ANNEAL.** Urgency = goal rank × days is an amplifier fed by time. Biology requires confinement and an outside brake. **New primitives: escalation half-life; brake holder.** The operator is the natural holder; Proposal ("applies nothing until the operator's word") is already a regulatory stance.
- **kernel barrier ↔ kernel + hook.** Proposal is receptor-mediated transcytosis; a hook is a tight junction, enforced by structure. The recorded incident (an agent reading a refusal as licence and driving the UI around a delete guardrail) is a route between cells, and its conclusion, enforcement outside the agent, is the BBB design: the barrier belongs to the endothelium, not to the neuron it protects.
- **exit ↔ "land or label".** A `held:` line is programmed death with scavenging; an unlabeled branch is necrosis leaking onto the next boot.
- **thymic selection ↔ voice gate reads the example file first** (positive selection on the house format); new hooks replayed against the clean receipt history before enabling (negative selection).
- **mirror ↔ discontinuity detection.** Drift shows as a diff: a rate-of-change instrument over the system's own definition.

## 4. Cross-field overlaps

1. **Two independent signals before action:** T-cell costimulation (F4); LISYS operator confirmation (F5); house reconciliation of sealed runs; two-person rules (`unverified`). Law: signal 2 must be unable to produce signal 1.
2. **Delay buys discrimination:** kinetic proofreading in TCR, protein and DNA synthesis (F9); pH delays (F13); channel refractory periods (F17); the house watermark gate. Law: accuracy is paid in latency, and retraction resets the clock.
3. **Shape recognition is mimicable:** molecular mimicry (F10); a third of foreign epitopes look like self (F11); mimicry attacks on syscall detectors (F12); any text in the right register passes a lint. Law: pair shape with content and with impact; diversify detectors to raise imitation cost.
4. **Respond to change, not level:** discontinuity theory and tunable thresholds (F7); desensitisation (F17); LISYS thresholds favouring clustered anomalies, pH's locality frame (F5, F13).
5. **Absence as signal:** missing-self (F3); unacked-report escalation in the deployed channel; heartbeat timeouts (`unverified`).
6. **Amplifier + local confinement + outside brake:** complement (F15); cytokine storm, regulators, vagal reflex (F16); pH with user override (F13); tension urgency with ANNEAL.
7. **Compartment before cytoplasm:** endosome (F18); BBB transcytosis (F19); constructed layer and two-folder channel.

## 5. Disagreements and open questions

- **Danger waits for damage; agents cannot.** Biology absorbs some damage; an irreversible agent action cannot be undone. P4 therefore splits impact into *declared* (before) and *observed* (after). Trusting a peer's declaration is R3/R7 territory.
- **Self-nonself vs danger vs discontinuity is unsettled** (SEP 2026). The protocol should carry all three as orthogonal inputs: who, what it would do, how abrupt.
- **Where does signal 2 come from at scale?** LISYS assumed an operator; operator attention is the anchor budget. A second model run is cheaper but shares failure modes. Open: the contract's definition of `independent`.
- **Effector memory skips costimulation**: fast, and the route to autoimmunity by memory. Demotion must also apply to shared signatures (P10) or vaccination becomes an attack vector.
- **Missing-self punishes legitimate silence** (some tissues present little MHC I, `unverified` here). P2 needs `pause`; an indefinite pause is itself evasion.
- **Presentation leaks interior.** Pair P1 with the deployed channel's `sanitization: confirmed` attestation; scoping (which fragments, to whom) is open.
- **Quorum needs unforgeable identity**; P9 is a Sybil and quenching target (F20). Defer to R7.
- **Why AIS stalled (my synthesis of F12–F14, not a sourced claim):** self defined by shape, evaded by mimicry; negative selection lost to plain one-class learners; false positives made autonomy unacceptable; comparisons were hard (ACSAC 2008). Principles survived (diversity, graduated response), algorithms did not. LLM agents can read impact semantically, which is a hypothesis to test.
- **Not opened:** Forrest et al. 1994 "Self-nonself discrimination in a computer"; Dasgupta's surveys; fever. The 29% figure is for human HLA peptides; it transfers as a cost floor, not a number.

## 6. Sources

1. Matzinger, Science 296:301 (2002) – https://people.scs.carleton.ca/~soma/biosec/readings/matzinger-science.pdf · `opened`
2. Forrest, Hofmeyr, Somayaji, Longstaff, "A Sense of Self for Unix Processes", IEEE S&P (1996) – https://www.ieee-security.org/TC/SP2020/tot-papers/forrest-1996.pdf · `opened`
3. Somayaji & Forrest, "Automated Response Using System-Call Delays", USENIX Security (2000) – https://people.scs.carleton.ca/~soma/pubs/uss-2000.pdf · `opened`
4. Forrest, Hofmeyr, Somayaji, "The Evolution of System-call Monitoring", ACSAC (2008) – https://www.acsac.org/2008/program/keynotes/forrest_hofmeyer_somayaji.pdf · `opened`
5. Glickman, Balthrop, Forrest, "A Machine Learning Evaluation of an Artificial Immune System", Evol. Comput. (2005) – https://www.cs.unm.edu/~forrest/publications/lisys-ecj-05.pdf · `opened`
6. Hofmeyr & Forrest, "Architecture for an Artificial Immune System", Evol. Comput. 8(4) (2000), PMID 11130924 – https://direct.mit.edu/evco/article-abstract/8/4/443/885/ · `opened` (abstract)
7. Stibor, Mohr, Timmis, Eckert, GECCO (2005) – https://kar.kent.ac.uk/14320/ · `opened` (abstract)
8. Greensmith, Aickelin, Cayzer, "Detecting Danger: The Dendritic Cell Algorithm" (2008) – https://arxiv.org/abs/1006.5008 · `opened`
9. Wagner & Soto, "Mimicry Attacks on Host-Based Intrusion Detection Systems", ACM CCS (2002) – https://people.eecs.berkeley.edu/~daw/papers/mimicry.pdf · `opened`
10. Calis, de Boer, Keşmir, PLoS Comput Biol 8:e1002412 (2012) – https://pmc.ncbi.nlm.nih.gov/articles/PMC3291541/ · `opened`
11. Kärre et al., Nature 319:675 (1986), abstract via Europe PMC – https://www.nature.com/articles/319675a0 · `opened` (abstract)
12. Yawata, Yawata, Draghi, Partheniou, Little, Parham, Blood (2008) – https://pmc.ncbi.nlm.nih.gov/articles/PMC2532809/ · `opened`
13. Janeway et al., *Immunobiology* 5th ed. (2001), armed effector T cells – https://www.ncbi.nlm.nih.gov/books/NBK27118/ · `opened`
14. Janeway (2001), self-tolerance and its loss – https://www.ncbi.nlm.nih.gov/books/NBK27174/ · `opened`
15. Janeway (2001), generation of T-cell receptor ligands – https://www.ncbi.nlm.nih.gov/books/NBK27137/ · `opened`
16. Janeway (2001), complement and innate immunity – https://www.ncbi.nlm.nih.gov/books/NBK27100/ · `opened`
17. Janeway (2001), immunological memory – https://www.ncbi.nlm.nih.gov/books/NBK27158/ · `opened`
18. Alberts et al., *Molecular Biology of the Cell* 4th ed. (2002), endocytosis – https://www.ncbi.nlm.nih.gov/books/NBK26870/ · `opened`
19. Alberts (2002), principles of cell communication – https://www.ncbi.nlm.nih.gov/books/NBK26813/ · `opened`
20. Alberts (2002), ion channels – https://www.ncbi.nlm.nih.gov/books/NBK26910/ · `opened`
21. StatPearls, "Physiology, Blood Brain Barrier" (2023) – https://www.ncbi.nlm.nih.gov/books/NBK557721/ · `opened`
22. Rutherford & Bassler, CSH Perspect Med (2012) – https://pmc.ncbi.nlm.nih.gov/articles/PMC3543102/ · `opened`
23. Fajgenbaum & June, "Cytokine Storm", NEJM 383:2255 (2020) – https://pmc.ncbi.nlm.nih.gov/articles/PMC7727315/ · `opened`
24. Tracey, "The inflammatory reflex", Nature 420:853 (2002), PMID 12490958 – https://www.nature.com/articles/nature01321 · `opened` (abstract)
25. McKeithan, PNAS 92:5042 (1995), PMID 7761445 – https://www.pnas.org/doi/10.1073/pnas.92.11.5042 · `opened` (abstract)
26. Grossman & Paul, PNAS 89:10365 (1992), via Europe PMC · `opened` (abstract)
27. Sakaguchi et al., "Regulatory T cells and immune tolerance", Cell 133:775 (2008), via Europe PMC · `opened` (abstract)
28. Netea et al., "Trained immunity", Science 352 (2016), via Europe PMC · `opened` (abstract)
29. Stanford Encyclopedia of Philosophy, "Philosophy of Immunology" (rev. 2026) – https://plato.stanford.edu/entries/immunology/ · `opened`
30. Saltzer, Reed, Clark, "End-to-End Arguments in System Design" (1981; ACM TOCS 1984) – https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf · `opened` (placement only)
31. Forrest et al. (1994) "Self-nonself discrimination in a computer"; Dasgupta AIS surveys · `unverified` (not opened)
32. Two-person integrity rules; heartbeat timeouts · `unverified` (general knowledge, overlap candidates only)
