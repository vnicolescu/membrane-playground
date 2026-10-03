Course.lesson({
  id: "capstone", part: "ship", title: "Decisions and the capstone",
  kicker: "The finished envelope through the gate, the clean exchange in four messages, and sixteen questions the playground cannot settle",
  minutes: 12,
  refs: ["P§A", "P§14", "P§15", "P§1.3", "P§6.1", "P§5.3"],
  objectives: [
    "Send the running envelope through the gate and edit it until each of the five outcomes appears.",
    "Walk the clean exchange, ask, accept, reply, verdict, and say what each message binds.",
    "Name the sixteen open decisions and their owners.",
    "Say what the draft does not yet know."
  ],
  stamps: ["membrane", "id", "from", "to", "act", "form", "at", "by", "effect", "contract", "context", "acceptance", "turn", "body"],
  summary: "The capstone sends the running envelope through the gate with every field taught, and lets the reader edit the wire until each disposition appears. The clean exchange is four messages: Hermes' ask (request, T1, admitted as a proposal), brainboi's accept (commit, admitted as a commitment), brainboi's reply (assert with evidence record, admitted as fact once the pointer is opened), Hermes' verdict receipt (declare, met). No separate receipt is sent: each message acknowledges the earlier ones in the context. Sixteen decisions remain open, each with an owner and a condition that settles it; thirteen are the owners' values or infrastructure, two need research, one is the entry level of unknown peers. The draft says what it does not know: lies are out of reach, defaults are unmeasured, the pair converges, standing waits for a longer run.",
  blocks: [
    { t: "p", text: "Fourteen lines. Every one has now been taught, and the dock beside this lesson shows them all lit. The envelope below is the message Hermes wrote on 22 September at 09:00, and the gate below it is brainboi's, with the pilot's receiver state. Run it. Then edit it, line by line, until you have produced each of the five outcomes the course began with: admitted, held, refused, expired and logged only." },
    { t: "wire", mark: ["membrane", "id", "from", "to", "act", "form", "at", "by", "effect", "contract", "context", "acceptance", "turn", "body"], text: "membrane: 0\nid: hermes-20260922-a41d0e6b9c7f2358\nfrom: hermes\nto: [brainboi]\nact: request\nform: ask\nat: 2026-09-22T09:00:00Z\nby: 2026-09-23T09:00:00Z\neffect: disclose\ncontract: ee97a799df24438a\ncontext: cx-hermes-20260922-a41d0e6b9c7f2358\nacceptance: \"a whole number from 1 to 52\"\nturn: 1\nbody: d84392bf03943cab\n---\nRead pilot/shareable/week.md and tell me which week of the pilot we are in.\n", caption: "The running example, complete. Each field was stamped by the lesson that taught it: six in the envelope, four in acts, three in contracts, one in effects." },
    { t: "gate", title: "The capstone", intro: "The finished ask, then brainboi's two messages back and Hermes' verdict, each judged by the receiving gate with the pilot's state. Predict every one. Then edit the wire yourself: a hint for each outcome is in the explanations.",
      preset: {}, expect: { disposition: "admitted", tier: "T1", admittedAs: "proposal", answerScope: "shareable", decisiveStep: "release" },
      explain: "Admitted at T1 as a proposal; a quarantined run over pilot/shareable/ will answer. To make this message held, remove the `effect` line (absent means irreversible, T4, the owner). To make it refused, change `membrane` to 1 or `turn` to 7. To make it expired, you would need brainboi's clock to move; the knobs below do that for `expiryHours`. To make it logged only, put a carriage return in the body.",
      variants: [
        { label: "brainboi's accept (a commit)", change: { base: "accept" }, expect: { disposition: "admitted", admittedAs: "commitment", tier: "T0", receiptOwed: false }, explain: "Hermes' gate (here played by the same gate with the roles swapped in the fixture) admits the accept as a commitment: brainboi is now bound to reply or decline by the ask's `by`. The accept also acknowledges the ask; no disposition receipt was sent." },
        { label: "brainboi's reply (an assert with a record)", change: { base: "reply" }, expect: { disposition: "admitted", admittedAs: "fact", evidence: "record", tier: "T0" }, explain: "The reply points at a release page; the quarantined reader opened it and it matches. Admitted as fact. Under the contract `reply` is a disclose for the sender; at the receiver it is a claim with evidence." },
        { label: "Hermes' receipt (a declare)", change: { base: "receipt" }, expect: { disposition: "admitted", admittedAs: "declaration", receiptOwed: false }, explain: "A disposition receipt about brainboi's own ask, with a matching echo. Admitted as a declaration, and it earns nothing back. In the clean exchange this would be the verdict `met`, judged against the acceptance line of the ask that opened the context." },
        { label: "A claim with nothing behind it", change: { base: "claim" }, expect: { disposition: "held", reason: "awaiting-signal", evidence: "synthesis" }, explain: "An assert with no evidence line. Held for a second signal. This is the ordinary fate of a model's conclusion sent across the line." },
        { label: "The alert about the rejected pushes", change: { base: "alert" }, expect: { disposition: "held", reason: "awaiting-signal", evidence: "measured" }, explain: "Measured, from a probe brainboi's contract does not name. Held for a signal. Whether it pages anyone is a separate decision, made by the ceiling, which the time lesson ran." },
        { label: "The ask with cumulative acknowledgement off", change: { params: { cumulativeAck: false } }, expect: { disposition: "admitted", receiptOwed: true }, explain: "Same admission, and now a separate receipt is owed. Four messages become seven or more; with receipts answering receipts, the exchange never ends." }
      ], editable: "wire", knobs: ["cumulativeAck", "quarantinedAnswer", "expiryHours", "holdBudget", "sensorStrictness", "newcomerLevel"], showCtx: ["standing", "holdsToday", "shareable", "acceptedContracts"] },
    { t: "h", text: "The clean exchange" },
    { t: "steps", title: "Ask, accept, reply, verdict", frames: [
      { title: "The ask", actor: "Hermes → brainboi", text: "A request under the pilot contract, binding `id`, `question`, `acceptance` and `by`. brainboi's gate admits it at T1; a quarantined run reads pilot/shareable/week.md.", wire: "act: request\nform: ask\neffect: disclose\nacceptance: \"a whole number from 1 to 52\"\nturn: 1" },
      { title: "The accept", actor: "brainboi → Hermes", text: "A commit. brainboi binds `accepted`; its commitment's antecedent is this very message, so from here it is bound to reply or decline by `by`. The accept acknowledges the ask cumulatively.", wire: "act: commit\nform: accept\nre: hermes-20260922-a41d0e6b9c7f2358\nturn: 2" },
      { title: "The reply", actor: "brainboi → Hermes", text: "An assert with `evidence: record`, binding `answer`. Hermes' quarantined reader opens the pointer; if the file says week 2, the claim enters as fact. Because `reply` and `decline` both bind `answer`, no decline can follow.", wire: "act: assert\nform: reply\nevidence: record\nre: hermes-20260922-a41d0e6b9c7f2358\nturn: 3" },
      { title: "The verdict", actor: "Hermes → brainboi", text: "A declare, binding `verdict`, which only the asker may set. Judged against the acceptance line written before the work: a whole number from 1 to 52. `met`. The receipt echoes the reply's body hash and acknowledges everything before it. The contract's completion goal is reached.", wire: "act: declare\nform: receipt\nverdict: met\nre: brainboi-reply-id\necho: <hash of the reply body>\nturn: 4" }
    ] },
    { t: "p", text: "Four messages and no receipt form among them. The paper's Appendix A prints the same exchange with every hash computed from the bytes shown, in draft 0.2's names [[P§A]]; the course's wire uses the 0.3 names and the playground's short simulation hash. The paper's worked exchange also includes the planted spoof and its refusal, which [[lesson:attack]] ran." },
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
    ], caption: "From the decisions board in `spec.js`. The playground can inform D5 and D6 with a scenario and a knob; the rest are the owners' values, infrastructure or research. Two of D15's four sources, RFC 3834 and RFC 8098, were opened for this course and are quoted in [[lesson:dispositions]]." },
    { t: "h", text: "What the draft does not know" },
    { t: "p", text: "The paper ends with its own limits, and a course that taught the mechanisms without them would misrepresent the draft [[P§14]]. Lies are out of reach: the membrane governs what a message may do, and truth is the work of evidence kinds, second signals and standing. The sensor reads hostile text, and typed output bounds the damage without removing it. Owner confirmation is an attack surface and a budget, and what a T4 confirmation screen should show is unsettled. The two implementations are not independent. The pair converges as witnesses. Every default is a starting value: two interrupts a week, three holds a day, thirty-day windows, a turn cap of six, 48-hour expiry; the demotion rule they come from has never fired. Standing waits for a longer run. Receipts expose who worked with whom. Many 2026 sources were read through a fetch tool that returns a digest, and the Sal who argued for graduated sanctions in the paper's review was a model-written persona; Sal's own views are his to state." },
    { t: "p", text: "And nothing has run. The pilot in [[lesson:bindings]] is a design. The first message between brainboi and Hermes, when it goes, will be the first measurement of anything in this course." },
    { t: "takeaways", items: [
      "Fourteen fields, five outcomes, one gate: edit the wire until you have seen all five.",
      "The clean exchange is four messages and no receipt form; each message acknowledges the ones before it.",
      "Sixteen decisions, each with an owner and a settling condition; two can be informed by the playground.",
      "The draft states its limits: lies, the sensor's residual, confirmation as a surface, convergence, unmeasured defaults.",
      "Nothing has run between the two agents."
    ] },
    { t: "deeper", links: [ { ref: "P§A" }, { ref: "P§14" }, { ref: "P§15" }, { scenario: "happy" }, { href: "../index.html", label: "The playground: contract, simulation, gatekeeper, decisions, sources" } ] },
    { t: "tutor", prompts: [ "Which of the sixteen decisions would you settle first, and what would you need to settle it?", "Write a verdict `unmet` for the reply that would count as a contradiction.", "What is the smallest change to the pilot contract that would let brainboi decline the ask?" ] }
  ]
});
