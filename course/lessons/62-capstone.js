Course.lesson({
  id: "capstone", part: "ship", title: "Decisions and the capstone",
  kicker: "The finished envelope through the gate, and sixteen questions the playground cannot settle",
  minutes: 12,
  refs: ["P§A", "P§14", "P§15", "P§1.1", "P§1.3", "P§6.1", "P§5.3"],
  objectives: [
    "Produce each of the five outcomes from the running envelope by editing it.",
    "Walk the clean exchange, ask, accept, reply, verdict, and say what each message binds.",
    "Map the course's mechanisms back to the four conditions of the first lesson.",
    "Name the sixteen open decisions and their owners, and say what the draft does not yet know."
  ],
  stamps: ["membrane", "id", "from", "to", "act", "form", "at", "by", "effect", "contract", "context", "acceptance", "turn", "body"],
  summary: "The capstone sends the running envelope through the gate with every field taught, and the reader edits the wire until each outcome appears: admitted, held for the owner, held for a signal, refused, expired, and logged only. The clean exchange is four messages: Hermes' ask (request, T1, admitted as a proposal), brainboi's accept (commit, admitted as a commitment), brainboi's reply (assert with evidence record, admitted as fact once the pointer is opened), Hermes' verdict receipt (declare, met). No separate receipt is sent. A cumulative lab draws one case from every earlier part; a sort maps the course's mechanisms to the four conditions. Sixteen decisions remain open, each with an owner and a condition that settles it. The draft says what it does not know: lies are out of reach, defaults are unmeasured, the pair converges, standing waits for a longer run.",
  blocks: [
    { t: "p", text: "Fourteen lines. Every one has now been taught, and the dock beside this lesson shows them all lit. Below is the message Hermes wrote on 22 September at 09:00, then brainboi's gate with the pilot's receiver state. The first lab is yours to edit until you have produced every outcome the course began with. The second is one case from every part, in no order." },
    { t: "wire", mark: ["membrane", "id", "from", "to", "act", "form", "at", "by", "effect", "contract", "context", "acceptance", "turn", "body"], text: "membrane: 0\nid: hermes-20260922-a41d0e6b9c7f2358\nfrom: hermes\nto: [brainboi]\nact: request\nform: ask\nat: 2026-09-22T09:00:00Z\nby: 2026-09-23T09:00:00Z\neffect: disclose\ncontract: ee97a799df24438a\ncontext: cx-hermes-20260922-a41d0e6b9c7f2358\nacceptance: \"a whole number from 1 to 52\"\nturn: 1\nbody: d84392bf03943cab\n---\nRead pilot/shareable/week.md and tell me which week of the pilot we are in.\n", caption: "The running example, complete. Six fields were stamped by the envelope lesson, four by acts, three by contracts, one by effects." },
    { t: "gate", title: "Every outcome from one message", intro: "The finished ask is in the editor. Each goal is one outcome of the gate; each is reachable by editing the header, and one needs a knob. brainboi's clock is 10:00 on 22 September.",
      preset: {}, predict: false, expect: { disposition: "admitted", tier: "T1", admittedAs: "proposal" },
      goals: [
        { text: "Refused, with a receipt.", want: { disposition: "refused", receiptOwed: true }, solution: { header: { membrane: 1 } } },
        { text: "Held for Vlad.", want: { disposition: "held", reason: "awaiting-owner" }, solution: { unset: ["effect"] } },
        { text: "Held for a second signal.", want: { disposition: "held", reason: "awaiting-signal" }, solution: { header: { effect: "boundary" } } },
        { text: "Expired on brainboi's clock.", want: { disposition: "expired" }, solution: { header: { expires: "2026-09-22T09:30:00Z" } } },
        { text: "Logged only, with nothing sent back.", want: { disposition: null, receiptOwed: false }, solution: { unset: ["to"] } }
      ], knobs: ["cumulativeAck", "quarantinedAnswer", "expiryHours", "holdBudget", "sensorStrictness", "newcomerLevel"], showCtx: ["standing", "holdsToday", "shareable", "acceptedContracts"] },
    { t: "h", text: "The clean exchange" },
    { t: "steps", title: "Ask, accept, reply, verdict", frames: [
      { title: "The ask", actor: "Hermes → brainboi", text: "A request under the pilot contract, binding `id`, `question`, `acceptance` and `by`. brainboi's gate admits it at T1; a quarantined run reads pilot/shareable/week.md.", wire: "act: request\nform: ask\neffect: disclose\nacceptance: \"a whole number from 1 to 52\"\nturn: 1" },
      { title: "The accept", actor: "brainboi → Hermes", text: "A commit. brainboi binds `accepted`; its commitment's antecedent is this very message, so from here it is bound to reply or decline by `by`. The accept acknowledges the ask cumulatively.", wire: "act: commit\nform: accept\nre: hermes-20260922-a41d0e6b9c7f2358\nturn: 2" },
      { title: "The reply", actor: "brainboi → Hermes", text: "An assert with `evidence: record`, binding `answer`. Hermes' quarantined reader opens the pointer; if the file says week 2, the claim enters as fact. Because `reply` and `decline` both bind `answer`, no decline can follow.", wire: "act: assert\nform: reply\nevidence: record\nre: hermes-20260922-a41d0e6b9c7f2358\nturn: 3" },
      { title: "The verdict", actor: "Hermes → brainboi", text: "A declare, binding `verdict`, which only the asker may set. Judged against the acceptance line written before the work: a whole number from 1 to 52. `met`. The receipt echoes the reply's body hash and acknowledges everything before it. The contract's completion goal is reached.", wire: "act: declare\nform: receipt\nverdict: met\nre: brainboi-reply-id\necho: <hash of the reply body>\nturn: 4" }
    ] },
    { t: "p", text: "Four messages and no receipt form among them. The paper's Appendix A prints the same exchange with every hash computed from the bytes shown, in draft 0.2's names [[P§A]]; the course's wire uses the 0.3 names and the playground's short simulation hash." },
    { t: "gate", title: "One case from every part", intro: "Nine cases drawn from the whole course, in no order. Predict the disposition and the tier.",
      preset: {}, predict: ["disposition", "tier"], expect: { disposition: "admitted", tier: "T1", admittedAs: "proposal", answerScope: "shareable" },
      explain: "The clean ask, admitted at T1 as a proposal, answered by a quarantined run over shareable data.",
      variants: [
        { label: "From the time lesson: `at` thirty minutes ahead of brainboi's clock", change: { header: { at: "2026-09-22T10:30:00Z" } }, expect: { disposition: "refused", reason: "clock", tier: "T0" }, explain: "Step 8. More than ten minutes ahead, refused with `clock` and a receipt." },
        { label: "From the acts lesson: brainboi's accept", change: { base: "accept" }, expect: { disposition: "admitted", admittedAs: "commitment", tier: "T0" }, explain: "A commit under the accepted contract, admitted at step 21 as a commitment that binds brainboi to answer by `by`." },
        { label: "From the standing lesson: Iris's claim, unknown to the trust root", change: { base: "claim", header: { from: "iris", evidence: "record" }, msg: { signer: "iris", lane: "iris", recordOk: true } }, expect: { disposition: "held", reason: "awaiting-owner", standing: "S0", tier: "T0" }, explain: "Step 18 reads S0 and step 21 holds for the owner. A good record buys a stranger nothing." },
        { label: "From the effects lesson: `effect: reversible`", change: { header: { effect: "reversible" } }, expect: { disposition: "refused", reason: "effect-exceeds-tier", tier: "T2" }, explain: "T2 needs S2 and a capability; Hermes is at S1. Step 21 refuses with `effect-exceeds-tier`." },
        { label: "From the evidence lesson: brainboi's reply, record opened", change: { base: "reply" }, expect: { disposition: "admitted", admittedAs: "fact", evidence: "record", tier: "T0" }, explain: "The pointer was opened by the quarantined reader and matches. Step 21 admits the reply as fact." },
        { label: "From the dispositions lesson: an ask dated 1 August", change: { header: { at: "2026-08-01T09:00:00Z", by: "2026-08-02T09:00:00Z" } }, expect: { disposition: "refused", reason: "stale", tier: "T0" }, explain: "Older than the 30-day window. Step 7 refuses with `stale`." },
        { label: "From the attack lesson: a commit that adds `.claude/settings.json`", change: { msg: { touchedPaths: ["lanes/hermes/out/hermes-20260922-a41d0e6b9c7f2358.md", ".claude/settings.json"] } }, expect: { disposition: "refused", reason: "scope", tier: "T0" }, explain: "Step 3, the inert-transport rule, before the message is parsed." },
        { label: "From the envelope lesson: `crit` names grease-11", change: { header: { crit: ["grease-11"] } }, expect: { disposition: "admitted", tier: "T1" }, explain: "A GREASE name is a no-op in every implementation. Step 11 passes and step 21 admits." },
        { label: "From the gatekeeper lesson: Hermes' receipt about brainboi's ask", change: { base: "receipt" }, expect: { disposition: "admitted", admittedAs: "declaration", receiptOwed: false, tier: "T0" }, explain: "A disposition receipt with a matching echo. Step 21 admits it as a declaration, and it earns no receipt." },
        { label: "The alert about the rejected pushes", change: { base: "alert" }, expect: { disposition: "held", reason: "awaiting-signal", evidence: "measured", tier: "T0" }, explain: "Measured, from a probe brainboi's contract does not name: step 17 treats it as synthesis and step 21 holds for a signal. Whether it pages anyone is the ceiling's decision, made in the time lesson." }
      ], knobs: ["cumulativeAck", "quarantinedAnswer", "newcomerLevel"], showCtx: ["standing", "holdsToday", "acceptedContracts"] },
    { t: "h", text: "Back to the four conditions" },
    { t: "sort", prompt: "The first lesson promised to return to the four conditions as a checklist. Eight mechanisms from the course: which condition does each serve first?", buckets: [ { id: "kernel", label: "Kernel integrity" }, { id: "disposition", label: "Disposition visibility" }, { id: "provenance", label: "Provenance persistence" }, { id: "standing", label: "Recoverable standing" } ], items: [
      { text: "The sensor's typed label and the quarantined answering run", bucket: "kernel", why: "Hostile text is read by a component that holds no authority; the kernel is reachable from neither." },
      { text: "The trust root pinned beside the gate, outside the transport", bucket: "kernel", why: "The list of keys that judges a peer is not something the peer can write." },
      { text: "`echo` on every receipt, and cumulative acknowledgement", bucket: "disposition", why: "The sender learns what became of the message and which bytes were judged." },
      { text: "`held` with `awaiting-owner` or `awaiting-signal`", bucket: "disposition", why: "A hold tells the sender who must act, and nothing about how to get round it." },
      { text: "`origin` on a relayed claim, and the rule that a kind can only fall", bucket: "provenance", why: "A claim keeps its evidence kind as it travels." },
      { text: "A `measured` claim is admitted only if the receiver reruns the measurement", bucket: "provenance", why: "The label selects a check; the receiver does the check." },
      { text: "One contradicted receipt: one level down for thirty days", bucket: "standing", why: "Trust lost by a contradiction and earned back by a clean record." },
      { text: "Introductions by the owner only, to S1 at most", bucket: "standing", why: "The newcomer floor keeps a fresh identity from outranking a demoted one." }
    ] },
    { t: "h", text: "Sixteen decisions" },
    { t: "table", head: ["", "Decision", "Owner", "What settles it"], rows: [
      ["D1", "The necessary set: are ask, answer, disposition, liveness and withdraw the right waist?", "Vlad + Sal", "both owners sign a `PROTOCOL.md` that names the set"],
      ["D2", "An A2A extension profile, a separate spec with an A2A binding, or both?", "Vlad + Sal", "a packaging is picked and published"],
      ["D3", "Week-one transport: git lanes, a shared folder, or A2A from day one?", "Vlad + Sal", "Sal judges the setup cost on his machine; both create the transport"],
      ["D4", "Identity mechanism: SSH signing keys, KERI-style pre-rotation, or did:web?", "Vlad + Sal", "a key scheme is picked and the first signed card published"],
      ["D5", "Standing thresholds: where unknown peers start; how many clean receipts promote", "Vlad + Sal", "a pilot long enough for one promotion and one demotion to fire"],
      ["D6", "Budgets: holds per day, interrupts per week, owner minutes; a receiver-wide cap?", "each owner", "values written into each gate after a trial week"],
      ["D7", "Who confirms a boundary effect: the owner's word, or reconciliation with an independent source?", "Vlad + Sal", "each owner names the accepted anchors for T3 in the contract"],
      ["D8", "API key and billing for brainboi's `--bare` gate runs", "Vlad", "a key under the gate user; Claude Code upgraded past 2.1.77"],
      ["D9", "Does Hermes accept inbound A2A only on a separate profile?", "Sal", "a separate profile, or A2A kept off"],
      ["D10", "Graduated sanctions (warning, demotion, refusal) or one demotion clock?", "Sal", "Sal states his own view"],
      ["D11", "A third implementer", "Vlad + Sal", "an unaffiliated implementer passes the vectors against both agents"],
      ["D12", "Receipt privacy: hash-only, selectively disclosed, or plain?", "Vlad + Sal", "a research pass, then a choice"],
      ["D13", "Burn or recover: per-claim stakes, or standing that recovers?", "Vlad + Sal", "recovery confirmed after the pilot, or stakes registered as an extension"],
      ["D14", "The three conditions that would put a chain in the core", "Vlad + Sal", "accepted or amended"],
      ["D15", "Prior art to read: RFC 8098, RFC 3834, DIDComm v2, KERI receipts", "brainboi (research)", "the next sweep opens the four and records what to borrow"],
      ["D16", "Name, licence, venue", "Vlad + Sal", "agreed and submitted"]
    ], caption: "From the decisions board in `spec.js`. The playground can inform D5 and D6 with a scenario and a knob; the rest are the owners' values, infrastructure or research. Two of D15's four sources, RFC 3834 and RFC 8098, were opened for this course and are quoted in the dispositions lesson." },
    { t: "h", text: "What the draft does not know" },
    { t: "p", text: "The paper ends with its own limits [[P§14]]. Lies are out of reach: the membrane governs what a message may do, and truth is the work of evidence kinds, second signals and standing. The sensor reads hostile text, and typed output bounds the damage without removing it. Owner confirmation is an attack surface and a budget, and what a T4 confirmation screen should show is unsettled. The two implementations are not independent, and the pair converges as witnesses." },
    { t: "p", text: "Every default is a starting value: two interrupts a week, three holds a day, thirty-day windows, a turn cap of six, 48-hour expiry; the demotion rule they come from has never fired. Standing waits for a longer run. Receipts expose who worked with whom. Many 2026 sources were read through a fetch tool that returns a digest, and the Sal who argued for graduated sanctions in the paper's review was a model-written persona; Sal's own views are his to state." },
    { t: "p", text: "Nothing has run. The pilot is a design, and the first message between brainboi and Hermes, when it goes, will be the first measurement of anything in this course." },
    { t: "takeaways", items: [
      "Fourteen fields, six outcomes, one gate: the editor reaches every outcome from one message.",
      "The clean exchange is four messages and no receipt form; each message acknowledges the ones before it.",
      "Every mechanism in the course serves one of the four conditions from the first lesson.",
      "Sixteen decisions, each with an owner and a settling condition; the draft states its limits; nothing has run."
    ] },
    { t: "deeper", links: [ { ref: "P§A" }, { ref: "P§14" }, { ref: "P§15" }, { scenario: "happy" }, { playground: "", label: "The playground: contract, simulation, gatekeeper, decisions, sources" } ] },
    { t: "tutor", prompts: [ "Which of the sixteen decisions would you settle first, and what would you need to settle it?", "Write a verdict `unmet` for the reply that would count as a contradiction.", "What is the smallest change to the pilot contract that would let brainboi decline the ask?" ] }
  ]
});
