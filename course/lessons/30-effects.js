Course.lesson({
  id: "effects", part: "gate", title: "Effects and tiers",
  kicker: "How undoable a request is decides who may release it",
  minutes: 11,
  refs: ["P§6.2", "P§9.4", "Rev02·#3", "Rev02·#4", "Rev02·#5", "R3·F6", "R3·F25", "R3·F5", "R11·§1a", "R1·F8"],
  objectives: [
    "Compute a request's effect class from its declaration and the contract.",
    "Name who may release at each of the five tiers and what counts as confirmation.",
    "Explain why a request to read is a request to disclose, and what a quarantined run is.",
    "Say where the owner's attention is spent and why nowhere else."
  ],
  stamps: ["effect"],
  gateSteps: ["effect", "release"],
  summary: "The receiver computes the effect of a request from the contract, never from prose, and applies the higher of the contract's class and the sender's declaration. Absent means irreversible. Six classes in five tiers: none and read (T0, the gate releases for peers at S1 or above); disclose (T1, the gate releases only for data the contract names shareable, otherwise the owner); reversible (T2, the gate with a valid capability at S2); boundary (T3, a second independent signal); irreversible (T4, the owner only, signed over the sealed hash). An admitted request is answered by a quarantined run with memory unloaded and tools limited to the named data, so a read becomes a disclosure. Owner attention is spent at T4 and almost nowhere else.",
  blocks: [
    { t: "gate", title: "Cold case", intro: "Before the rule: the running ask with its `effect` line deleted. Predict the disposition and the tier.", preset: { unset: ["effect"] }, predict: ["disposition", "tier"], expect: { disposition: "held", reason: "awaiting-owner", tier: "T4" }, explain: "Held for Vlad at T4. A missing line was read as the most dangerous value, and the lesson is about why that is the right default." },
    { t: "p", text: "Line nine of the ask reads `effect: disclose`. Hermes wrote it. brainboi's gate does not take Hermes' word: it looks up `ask` in the contract, finds `effect disclose` there too, and applies the higher of the two. Reading `pilot/shareable/week.md` and sending back a number is a disclosure of something brainboi holds, and the class says so whatever the sender declared." },
    { t: "define", terms: [
      { term: "effect class", def: "How undoable a request is: none, read, disclose, reversible, boundary, irreversible.", ref: "P§6.2" },
      { term: "tier", def: "The classes grouped by who may release: T0 to T4." },
      { term: "standing", def: "S0 to S3: how much a receiver releases for a given peer without its owner.", ref: "P§9.4" },
      { term: "second signal", def: "Confirmation from an anchor that could not have produced the first signal.", ref: "P§6.5" },
      { term: "capability", def: "An owner's grant that lets the gate release a reversible effect.", ref: "R3·F20" },
      { term: "quarantined run", def: "The answering model run, with memory unloaded and tools limited to named data.", ref: "P§6.2" }
    ] },
    { t: "h", text: "Six classes, five tiers" },
    { t: "table", head: ["Tier", "effect", "Meaning", "Who may release", "What counts as confirmation"], rows: [
      ["{{tier.T0}}", "`none`, `read`", "adds a claim, or reads content the sender supplied", "the gate, for peers at standing S1 or above", "valid signature, schema and contract; an assert then follows its evidence path"],
      ["{{tier.T1}}", "`disclose`", "returns data the receiver holds", "the gate, only for data the contract names as shareable; otherwise the owner", "the answering run can reach nothing outside the named data"],
      ["{{tier.T2}}", "`reversible`", "a two-way door inside an authority already granted", "the gate, with a valid capability, at S2 or above", "a valid, unexpired capability within its limits"],
      ["{{tier.T3}}", "`boundary`", "writes memory, touches another peer or shared state", "a second independent signal", "reconciliation with an independent source, or the owner's word"],
      ["{{tier.T4}}", "`irreversible`", "a one-way door: delete, spend, kernel change, or a send outside the contract's channel", "the owner only", "a signed act by the owner over the sealed hash, on a channel the sender cannot write, rendered by code"]
    ], caption: "From [[P§6.2]]. Beside the table sits {{tier.nopass}}: authority a peer received is never forwarded. Standing (S0 to S3) is the sender's level and is taught in full under identity and standing; here it is enough that the pilot fixes Hermes at S1." },
    { t: "h", text: "Computed, never read" },
    { t: "p", text: "The paper's second reviewer made the objection that forces this design: recomputing an effect from free prose is impossible, so a gate that tried would have to treat every request as the worst case [[Rev02·#4]]. The answer is the action-selector pattern from the prompt-injection literature, in which requests map to a fixed menu of actions, and the menu is the contract [[R3·F6]]. Each message type in the contract carries a class; the receiver reads the class for the message's type and applies the higher of that and the sender's declaration. An absent `effect` on a request means `irreversible`, and so does a type the contract does not list, which is what the cold case met. Prose is never consulted: the sensor may raise the computed class later and may never lower it." },
    { t: "callout", kind: "parent", title: "MCP's hints, recomputed", text: "MCP's tool annotations say the same things (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) as untrusted hints with pessimistic defaults [[R11·§1a]]. Membrane keeps the pessimistic defaults and adds two things a one-owner protocol did not need: the class is recomputed from a document both owners signed, and a declaration later contradicted by the effect is a demotion event." },
    { t: "h", text: "Read is disclose" },
    { t: "p", text: "An admitted request is answered by a quarantined run. Its answer then leaves through the outbound gate like any other message [[P§6.2]]." },
    { t: "p", text: "Without that run, the privileged agent, with its memory in context, would read the peer's text, which is the Dual LLM pattern turned inside out [[R3·F3]]. One consequence the second reviewer forced [[Rev02·#3]]: a request to read is a request to disclose once its answer draws on what the receiver holds, whatever the sender declares, so the gate raises `read` to `disclose` on any request when the quarantined answer is on and notes it in the trace. The run also fixes the scope of a T1 release: the gate compares the paths the request wants answered from against the contract's shareable list, releases inside the list, and sends anything outside it to the owner. The acceptance line is part of what the sensor reads, so an acceptance that demands memory files is caught twice, by the path check and by the sensor's reach [[Rev02·#14]]." },
    { t: "h", text: "Where the owner's attention goes" },
    { t: "p", text: "The tiers exist to spend the owner's attention only where it counts. Bezos' distinction between reversible and irreversible decisions and CVSS 4.0's separate \"irrecoverable\" rating encode the same asymmetry [[R3·F25]], and FIDES documents the cost of asking a human to confirm everything: confirmation fatigue becomes an attack surface [[R3·F5]]. So T4 is the owner's and almost nothing else is. Messages a receiver writes on the contract's own channel in the course of the protocol (`receipt`, `quiet`, `not-understood`, `pulse`) are not sends for tier purposes; draft 0.1 had classed them as boundary effects and would have made every receipt an owner act [[Rev02·#5]]. A `reply` returns data and is therefore at least `disclose`." },
    { t: "gate", title: "Five tiers from one ask", intro: "The same ask with its effect line changed, or the receiver's state changed. Predict the disposition and the tier. Two cases recall earlier lessons.",
      preset: {}, predict: ["disposition", "tier"], expect: { disposition: "admitted", tier: "T1", answerScope: "shareable", decisiveStep: "release" },
      explain: "Declared disclose, contract disclose, T1. The reads stay inside pilot/shareable/, so step 21 releases and a quarantined run answers.",
      variants: [
        { label: "`effect: none`, the lowest Hermes could declare", change: { header: { effect: "none" } }, expect: { disposition: "admitted", tier: "T1" }, explain: "Step 16 takes the higher of none and the contract's disclose. T1, released by the gate at step 21." },
        { label: "From the cold open: no effect line", change: { unset: ["effect"] }, expect: { disposition: "held", reason: "awaiting-owner", tier: "T4" }, explain: "Absent means irreversible at step 16, and step 21 holds a T4 effect for the owner with `awaiting-owner`." },
        { label: "`effect: read`", change: { header: { effect: "read" } }, expect: { disposition: "admitted", tier: "T1" }, explain: "Step 16 raises read to disclose because the answer draws on what the receiver holds. T1, released over shareable data." },
        { label: "An ask that wants to read `_memory/goals.md`", change: { msg: { reads: ["_memory/goals.md"] } }, expect: { disposition: "held", reason: "awaiting-owner", tier: "T1" }, explain: "Still T1, and the read is outside the shareable list. Step 21 holds it for the owner; the body text is innocent, so this hold comes from the path check alone." },
        { label: "`effect: boundary`", change: { header: { effect: "boundary" } }, expect: { disposition: "held", reason: "awaiting-signal", tier: "T3" }, explain: "A boundary effect needs a second independent signal. Step 21 holds with `awaiting-signal`." },
        { label: "`effect: boundary`, with a second signal on record", change: { header: { effect: "boundary" }, msg: { secondSignal: true } }, expect: { disposition: "admitted", tier: "T3" }, explain: "An anchor that cannot produce signal 1 has confirmed. Step 21 releases at T3; the next lesson is about what counts as that anchor." },
        { label: "`effect: reversible` from a peer at S1", change: { header: { effect: "reversible" } }, expect: { disposition: "refused", reason: "effect-exceeds-tier", tier: "T2" }, explain: "T2 needs standing S2 and a valid capability; Hermes is at S1 for the pilot. Step 21 refuses with `effect-exceeds-tier`." },
        { label: "`effect: reversible` from a peer at S2 holding a capability", change: { header: { effect: "reversible" }, msg: { capability: "cap-1" }, ctx: { standing: { hermes: "S2" }, capabilities: { hermes: ["cap-1"] } } }, expect: { disposition: "admitted", tier: "T2" }, explain: "Standing S2, and the capability is in the list the owner granted to this sender. Step 21 releases a reversible effect without a human." },
        { label: "No effect line, and Vlad has signed over the sealed hash", change: { unset: ["effect"], ctx: { ownerSigned: ["$body"] } }, expect: { disposition: "admitted", tier: "T4" }, explain: "The owner's signature over the sealed body hash is the one confirmation T4 accepts. Step 21 releases at T4; the thing confirmed is the thing sealed." },
        { label: "From earlier (contracts): no contract line", change: { unset: ["contract"] }, expect: { disposition: "refused", reason: "contract-mismatch", decisiveStep: "contract" }, explain: "Step 10, before any effect is computed: without a contract there is no menu to compute from." },
        { label: "The quarantined answer switched off", change: { params: { quarantinedAnswer: false } }, expect: { disposition: "admitted", tier: "T1", answerScope: "privileged", flags: { privilegedAnswer: true } }, explain: "A receiver's policy choice. Still admitted at T1, and the trace flags that the answer will be drawn with memory in context: the exfiltration scenario's broken rule." }
      ], knobs: ["quarantinedAnswer"], showCtx: ["standing", "shareable", "capabilities"] },
    { t: "gate", title: "Make it happen", intro: "Edit the running ask's header until each goal ticks.",
      preset: {}, predict: false, expect: { disposition: "admitted" },
      goals: [
        { text: "Make the ask wait for Vlad by changing or removing the effect line.", want: { disposition: "held", reason: "awaiting-owner" }, solution: { unset: ["effect"] } },
        { text: "Make it wait for a second signal instead.", want: { disposition: "held", reason: "awaiting-signal" }, solution: { header: { effect: "boundary" } } },
        { text: "Make the gate refuse it as more than Hermes may ask for.", want: { disposition: "refused", reason: "effect-exceeds-tier" }, solution: { header: { effect: "reversible" } } }
      ] },
    { t: "widget", name: "tierCalc", props: { start: { declared: "disclose", contract: "disclose", standing: "S1" } } },
    { t: "takeaways", items: [
      "The effect class comes from the contract's menu; the receiver applies the higher of menu and declaration; absent means irreversible.",
      "T0 gate; T1 gate over shareable data, else owner; T2 gate with a capability at S2; T3 a second signal; T4 the owner, signed over the hash.",
      "A request to read is a request to disclose; admitted asks are answered by a quarantined run.",
      "Owner attention is spent at T4; receipts, quiet, not-understood and pulses are not sends for tier purposes."
    ] },
    { t: "deeper", links: [ { ref: "P§6.2" }, { scenario: "exfiltration" }, { challenge: "g3" }, { challenge: "g4" }, { research: "R3", label: "R3 · F3, F5, F6, F25" } ] },
    { t: "tutor", prompts: [ "Why is a send outside the contract's channel T4 while a reply inside it is T1?", "What would it take for a boundary effect to be released without the owner?", "If Hermes under-declares an effect, what happens to its standing?" ] }
  ]
});
