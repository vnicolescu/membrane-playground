Course.lesson({
  id: "laws", part: "laws", title: "Nine laws",
  kicker: "Mechanisms several unrelated fields reached on their own, and the immune system as the longest-running one",
  minutes: 10,
  refs: ["P§2", "P§8.1", "P§8.2", "P§8.3", "P§8.4", "P§11", "R4·F4", "R5·F1", "R5·F3", "R5·F6", "R5·F7", "R5·F11", "R5·F12", "R5·F14"],
  objectives: [
    "State each law and name one field outside the paper that reached it first.",
    "Match the immune mechanisms (presentation, missing self, danger, two signals) to Membrane's.",
    "Name the five failure modes of an immune architecture and the counter for each.",
    "Recite the boundary agent's four goals in rank order."
  ],
  summary: "Each of the nine laws was reached in at least two fields outside the paper before it was written down; the convergence is the evidence and the protocol consequence is what Membrane takes. L1 messages trigger and never instruct; L2 the reader of hostile content holds no authority; L3 completion is declared by the other party; L4 the sender claims urgency and the receiver caps it; L5 absence is a signal; L6 consequential release needs two independent signals; L7 records are permanent and their weight forgets; L8 shape checks can be imitated; L9 format travels and meaning stays local. Immunology supplies presentation, missing self, danger over novelty, costimulation and named failure modes. The boundary agent's charter ranks four goals: protect the kernel, represent, probe, keep compatibility.",
  blocks: [
    { t: "p", text: "Every rule in the last eight lessons traces to one of nine laws. The paper's claim for them is specific: each was reached in at least two fields outside its own record, most in three or more, before it appeared here [[P§2]]. The convergence is the evidence. The paper's own precedents are listed last and never counted. The table is the paper's; what follows it is how to read the immune column, which runs through more rows than any other." },
    { t: "table", head: ["Law", "Fields that reached it", "Protocol consequence"], rows: [
      ["{{L1}}", "theoretical biology (structural determinism); sociology (Luhmann's irritation); cybernetics (Bateson's news of a difference); diplomacy (non-interference, Vienna Convention Art. 41); AI security (Dual LLM, CaMeL) and the confused deputy", "Inbound content carries no authority. A request is a proposal the receiver may re-issue inside its own boundary."],
      ["{{L2}}", "AI security (Dual LLM, CaMeL, FIDES); defence cross-domain engineering; formal integrity models (Biba); mail security (users may request, never self-release, quarantined malware)", "A model may raise a hold. Only a deterministic gate or a named anchor releases."],
      ["{{L3}}", "networking (the end-to-end acknowledgement); language/action theory; commitment semantics (only the creditor releases); aviation (read-back)", "A finished task takes two acts: the provider asserts, the requester declares."],
      ["{{L4}}", "military signals (ACP 121); mail (RFC 6710); public alerting (Wireless Emergency Alerts); cybernetics (Cybersyn's algedonic filter); operations (alert suppression)", "The right to interrupt is a per-sender ceiling the receiver owns. Lowering is always free."],
      ["{{L5}}", "immunology (missing self); distributed systems (Erlang monitors, SWIM suspicion); maritime distress (relay after five unacknowledged minutes)", "Expected messages carry deadlines, and silence past a deadline is a state with a name."],
      ["{{L6}}", "immunology (costimulation, with LISYS as its engineered descendant); payments (AP2 mandates)", "Release above the lowest tiers needs a second signal from a source that cannot produce the first."],
      ["{{L7}}", "Bayesian reputation (Jøsang's forgetting factor); consumer credit (seven-year horizon); community software (Discourse's 100-day window); for the newcomer floor, game theory of cheap pseudonyms and EigenTrust", "Standing is local, recoverable on a clock, and starts low for newcomers."],
      ["{{L8}}", "immunology (about 29% of foreign peptides indistinguishable from self); intrusion detection (mimicry attacks); production AI (EchoLeak evaded a shipped classifier; adaptive attacks broke twelve defenses)", "A gate never admits on form alone. Form is paired with declared effect and a second signal."],
      ["{{L9}}", "science studies (boundary objects); cybernetics (requisite variety); protocol engineering (may-ignore header fields; no global state in BSPL)", "The waist fixes fields and leaves prose free. No shared ontology is required."]
    ], caption: "From [[P§2]]. L6 rests on two outside fields; two-person integrity rules in the handling of weapons and keys would be a third and were not verified for the paper." },
    { t: "h", text: "The immune column" },
    { t: "p", text: "Immunology appears in five rows because it is the oldest running system that solves this problem: a body that must take in matter from outside, decide what to admit, and survive attackers that evolve to look like self. Four mechanisms carry over [[P§8]]." },
    { t: "list", items: [
      "**Presentation.** Every nucleated cell samples its own proteins and displays fragments on MHC class I molecules, so a passing T cell can judge the interior from outside; professional presenting cells display on class II what they ingested; neither class takes its peptides from the surrounding fluid [[R5·F1]]. Membrane's {{ext.present}} extension rides on a pulse with two slots never mixed: `made` (hashes of the agent's own sealed outputs) and `ingested` (digests of inbound messages, each with its disposition). A presentation is sampled verbatim from records and never composed for the occasion.",
      "**Missing self.** A cell that stops displaying MHC class I is killed by natural killer cells for that alone; viruses that suppress presentation are caught this way [[R5·F3]]. A peer that stops presenting past its lease is suspect for the same reason. Absence of presentation is evidence; its meaning is decided by the receiver.",
      "**Danger over novelty.** The immune response starts on signals of damage, and a healthy foreign body can be tolerated while a harmful self is attacked; abrupt change provokes where steady presence is tolerated [[R5·F6]] [[R5·F7]]. Membrane judges a message by declared and computed effect and by change in a peer's behaviour. A new peer asking to read is ordinary. An established peer that suddenly asks for an irreversible effect is an event.",
      "**Two signals.** Costimulation, already met in [[lesson:evidence]]: recognition and a confirmation from a cell that cannot produce the recognition. The anergy rule for expired messages comes from the same page."
    ] },
    { t: "h", text: "Five ways it fails" },
    { t: "table", head: ["Failure", "In biology", "In an agent membrane", "Counter"], rows: [
      ["Autoimmunity", "the defence attacks self", "the gate refuses its own owner or good peers", "audit by sample; refusal rates per peer in the presentation"],
      ["Mimicry", "pathogens resemble self", "text in the right register passes a lint", "L8: effect and a second signal always accompany form"],
      ["Storm", "runaway cytokine amplification", "escalation feeding on itself", "half-life and the brake held outside the loop"],
      ["Tolerance breakdown", "infection makes self look dangerous, or a trusted cell turns", "a trusted peer is compromised or reconfigured", "configuration-change and duplicity events lower standing"],
      ["Memory without costimulation", "fast effector memory attacks self", "shared attack signatures act without local confirmation", "shared signatures enter as held detectors and decay unless confirmed locally"]
    ], caption: "From [[P§8.4]]." },
    { t: "callout", kind: "field", title: "A warning from the artificial immune systems", text: "Forrest and colleagues defined a process's self as its normal sequences of system calls (1996); mimicry attacks padded malicious sequences with harmless calls until they looked normal [[R5·F12]]. The original authors' retrospective records that per-installation diversity was adopted while graduated response and adaptability stayed controversial [[R5·F14]]. The paper's reading, offered as its own synthesis, is that shape-defined self was the weak point and the principles outlived the algorithms. L8 is that reading in one line." },
    { t: "h", text: "The charter" },
    { t: "p", text: "The seed list asked what a boundary agent is for. Sociology, diplomacy and biology agree on a fourth goal the list lacked: represent, which is to put approved fragments of the inside on the outside in a form others can read [[P§11]]. In rank order: protect the kernel; represent; probe; keep compatibility. The charter lists seven authorities (check marks and return a disposition; refuse with a code and keep the reason text at home; hold until an anchor clears; raise a tier and never lower it; start the escalation timer; redact outbound content to approved fragments; write the receipts owed) and seven things the agent never does, the last of which is to live inside the agent it guards." },
    { t: "sort", prompt: "Match each mechanism or precedent to the law it supports.", buckets: [ { id: "L1", label: "L1 trigger, never instruct" }, { id: "L4", label: "L4 receiver caps urgency" }, { id: "L5", label: "L5 absence is a signal" }, { id: "L8", label: "L8 shape can be imitated" }, { id: "L9", label: "L9 format travels, meaning stays" } ], items: [
      { text: "Natural killer cells destroy a cell that stops displaying MHC class I", bucket: "L5", why: "Missing self: the absence of a presentation is itself the signal." },
      { text: "An SMTP server must not accept a raised priority from an unauthorized sender", bucket: "L4", why: "RFC 6710: the sender claims, the server caps, lowering is free." },
      { text: "A living system is changed by a perturbation only in the ways its own structure allows", bucket: "L1", why: "Structural determinism (Maturana and Varela): outside events trigger; they do not instruct." },
      { text: "Boundary objects: one artifact read differently by each community that shares it", bucket: "L9", why: "Star and Griesemer: the format is shared; the meaning stays with each side." },
      { text: "Padding a malicious system-call sequence with harmless calls until it looks normal", bucket: "L8", why: "Wagner and Soto's mimicry attack on shape-defined self." },
      { text: "A maritime station relays a distress call after five unacknowledged minutes", bucket: "L5", why: "Silence past a deadline is a state with a procedure attached." },
      { text: "A diplomat is bound not to interfere in the internal affairs of the receiving state", bucket: "L1", why: "Vienna Convention Art. 41: a mission may propose; it may not instruct." },
      { text: "A shipped email classifier was evaded by instructions phrased as if addressed to the human recipient", bucket: "L8", why: "EchoLeak: the right register passed the filter." }
    ] },
    { t: "takeaways", items: [
      "Nine laws; each reached by two or more outside fields; the convergence is the evidence.",
      "Immunology gives presentation, missing self, danger over novelty and two signals, and names five failure modes with counters.",
      "Shape-defined self was the weak point of the artificial immune systems; L8 pairs form with effect and a second signal.",
      "The boundary agent protects the kernel first, represents second, probes third, keeps compatibility fourth.",
      "It never lives inside the agent it guards."
    ] },
    { t: "deeper", links: [ { ref: "P§2" }, { ref: "P§8" }, { ref: "P§11" }, { research: "R4", label: "R4 · gatekeepers in sociology, diplomacy, cybernetics" }, { research: "R5", label: "R5 · immunology as a mechanism library" } ] },
    { t: "tutor", prompts: [ "Which law would you drop if you had to, and what breaks?", "Why does the paper refuse to count its own precedents as evidence for a law?", "What is the agent-protocol version of autoimmunity, and how would you measure it?" ] }
  ]
});
