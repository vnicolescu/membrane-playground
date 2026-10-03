Course.lesson({
  id: "time", part: "time", title: "Time",
  kicker: "A ceiling the receiver owns, and a ladder whose clock runs outside the agent",
  minutes: 12,
  refs: ["P§7.1", "P§7.2", "P§7.3", "P§7.4", "R6·F1", "R6·F2", "R6·F3", "R6·F5", "R6·F6", "R6·F12", "R6·F13", "R6·F14", "R6·F17", "R6·F18", "R6·F19", "Rev02·#16", "Rev02·#18", "RFC 6710"],
  objectives: [
    "Describe a channel on the three axes and name the three classes the pilot uses.",
    "Compute whether an alert may page from urgency, severity, certainty, the ceiling and the budget.",
    "Walk the escalation ladder and say what each rung does and why its timers run outside the agent.",
    "Explain leases, suspicion and the `missed` row."
  ],
  prereq: ["delivery"],
  gateSteps: ["clock", "expiry"],
  summary: "A channel is described on three axes: when (pull, cycle, prompt, interrupt), who (one, set, scope, relay), proof (none, delivered, outcome). Three classes cover practice: Mailbox, Bulletin, Page. An alert carries urgency, severity and certainty as three separate claims; eligibility to interrupt is computed from all three against a ceiling the receiver keeps per sender, which starts at cycle and reaches interrupt only by the owner's grant. Interrupts are budgeted and the owner marks each warranted or unwarranted. An unanswered ask climbs a six-rung ladder whose timers run outside the agent and which never writes into the receiver. A pulse renews a lease; a missed term makes the peer suspect; a scheduled message that did not arrive is written down as missed.",
  blocks: [
    { t: "gate", title: "Cold case", intro: "Before the rule: Hermes alerts brainboi that the shared remote rejected two pushes in a row, urgency immediate, severity severe, certainty observed. Does Vlad get paged?", preset: { base: "alert", call: "page" }, predict: ["page", "level"], expect: { page: false, level: "cycle" }, explain: "No page. The claim is as urgent as a claim can be, and the alert waits for brainboi's next run. The lesson is about the one number that decided that." },
    { t: "p", text: "brainboi runs four times a day. Hermes runs every hour. The ask carries `by: 2026-09-23T09:00:00Z`, twenty-four hours after it was sent. If brainboi never answers, what does Hermes do, and when? And if Hermes notices something that cannot wait for brainboi's next run, what may it do about it? Hospitals, navies, mail servers and on-call rotations met both questions first." },
    { t: "h", text: "Axes and classes" },
    { t: "table", head: ["Axis", "Values"], rows: [
      ["When", "`pull` (no obligation) · `cycle` (next scheduled run) · `prompt` (next pause) · `interrupt` (drop current work)"],
      ["Who", "`one` · `set` · `scope` (everyone in a declared scope) · `relay` (listeners re-send until told to stop)"],
      ["Proof", "`none` · `delivered` · `outcome`"]
    ], caption: "{{ch.axes}}. Naming the axes keeps urgency, audience and proof from blurring into one priority number." },
    { t: "table", head: ["Class", "When", "Who", "Proof", "Carries", "Precedent"], rows: [
      ["{{ch.mailbox}}", "cycle or prompt", "one", "outcome", "ask, accept, reply, receipt, cancel", "email; delay-tolerant bundles"],
      ["{{ch.bulletin}}", "pull", "scope", "none; the reader keeps its own watermark", "pulse, presentation, published receipts", "MHC display; public alerts; SWIM gossip"],
      ["{{ch.page}}", "interrupt", "one, climbing a ladder", "outcome, repeated until acknowledged", "alert", "MAYDAY and FLASH precedence; maritime distress; on-call paging"]
    ], caption: "From [[P§7.1]]. Agents that live in scheduled runs have no native interrupt. In the first pilot, agent-to-agent traffic uses Mailbox and Bulletin only; each agent may page its own owner and nobody else's." },
    { t: "define", terms: [
      { term: "cycle", def: "An agent's longest gap between runs, in minutes." },
      { term: "ceiling", def: "The highest channel class one sender's claim can reach at this receiver.", ref: "P§7.2" },
      { term: "page", def: "An interrupt: an unscheduled run, or a notification to the owner." },
      { term: "lease", def: "A liveness term a pulse renews.", ref: "R6·F13" },
      { term: "missed", def: "A row for a scheduled message that did not arrive.", ref: "P§7.4" }
    ] },
    { t: "h", text: "Urgency, severity, certainty" },
    { t: "p", text: "An alert's urgency claim has three fields, taken from the OASIS Common Alerting Protocol, which keeps them apart: {{ext.urgency}} (how soon), {{ext.severity}} (how bad) and {{ext.certainty}} (how sure) [[R6·F3]]. Military signalling makes the same separation in words: importance does not imply urgency [[R6·F1]]. Eligibility to interrupt is computed from all three, with the thresholds of the US Wireless Emergency Alert system: urgency Immediate or Expected, severity Extreme or Severe, certainty Observed or Likely." },
    { t: "p", text: "The receiver keeps a {{ext.ceiling}} per sender. It starts at `cycle`, rises to `prompt` after a clean record, and reaches `interrupt` only by the owner's explicit grant; a sender may always lower its own claim. The SMTP priority extension forbids a server from accepting a raised priority from an unauthorized sender and names \"always ask for top priority\" as a denial-of-service attack (RFC 6710, [[R6·F2]]). Law {{L4}}: the sender claims urgency; the receiver caps it." },
    { t: "p", text: "The cold case was the ceiling at its starting value." },
    { t: "h", text: "Staked interrupts" },
    { t: "p", text: "Cheap urgency turns into noise. The Joint Commission estimated that 85 to 99 percent of hospital alarm signals need no clinical action and recorded 80 deaths among 98 alarm-related adverse events [[R6·F19]]; interrupted work resumed the same day took 25 minutes 26 seconds on average to resume [[R6·F14]]. So the right to interrupt is staked [[P§7.2]]:" },
    { t: "list", items: [
      "**Budget.** At most two interrupts per sender per seven days; the excess drops to `prompt`.",
      "**Verdict.** The receiving owner marks each interrupt warranted or unwarranted.",
      "**Demotion.** Two unwarranted interrupts in thirty days lower the ceiling one class for thirty days; a clean thirty days restores it.",
      "**Certainty weighting.** A wrong claim marked Possible or Unlikely is never counted; a false claim marked Observed counts double.",
      "**Safe harbor.** A sender that cancels its own alert within one cycle is not counted. The ITU Radio Regulations protect a mariner who reports and cancels a false distress alert [[R6·F6]].",
      "**Concern.** A {{ext.concern}} flag reaches `prompt` below the thresholds and is never counted, because rapid response teams accept worry as a trigger [[R6·F17]]."
    ] },
    { t: "p", text: "All of these are starting values, and the combination of penalty and safe harbor is the paper's own synthesis, untested on traffic." },
    { t: "widget", name: "pageCalc", props: {} },
    { t: "gate", title: "Page or not", intro: "The alert from the cold open, with the receiver's state and the claim changed. Predict whether Vlad is paged and at which level the alert lands.",
      preset: { base: "alert", call: "page" }, predict: ["page", "level"], expect: { page: false, level: "cycle" },
      explain: "From the cold open. The claim is eligible on all three axes and the ceiling for Hermes is `cycle`, the starting value. No page: the alert waits for the next run.",
      variants: [
        { label: "Vlad has granted Hermes an interrupt ceiling", change: { ctx: { ceiling: { hermes: "interrupt" } } }, expect: { page: true, level: "interrupt" }, explain: "Ceiling interrupt, all three thresholds met, budget untouched. Vlad is paged, and this is the first of two interrupts this week." },
        { label: "Interrupt ceiling, two interrupts already used this week", change: { ctx: { ceiling: { hermes: "interrupt" }, interruptsThisWeek: { hermes: 2 } } }, expect: { page: false, level: "prompt" }, explain: "The weekly budget is spent. The alert drops to `prompt`: brainboi reads it at its next pause." },
        { label: "Interrupt ceiling, severity moderate", change: { header: { severity: "moderate" }, ctx: { ceiling: { hermes: "interrupt" } } }, expect: { page: false, level: "prompt" }, explain: "Urgent and certain, and only moderately bad. Moderate is under the severity threshold, so the alert lands at `prompt`." },
        { label: "Interrupt ceiling, certainty possible", change: { header: { certainty: "possible" }, ctx: { ceiling: { hermes: "interrupt" } } }, expect: { page: false, level: "prompt" }, explain: "A hunch about something severe lands at `prompt`. If it later proves wrong it is never counted against Hermes either." },
        { label: "Interrupt ceiling, urgency future", change: { header: { urgency: "future" }, ctx: { ceiling: { hermes: "interrupt" } } }, expect: { page: false, level: "cycle" }, explain: "No urgent claim at all. The message is an ordinary alert for the next cycle, whatever the ceiling." },
        { label: "Ceiling prompt (a clean record, no grant)", change: { ctx: { ceiling: { hermes: "prompt" } } }, expect: { page: false, level: "prompt" }, explain: "A clean record raises the ceiling one class, to `prompt`. The third class is the owner's to grant." },
        { label: "The ceiling switched off", change: { params: { ceilingEnforced: false } }, expect: { page: true, level: "interrupt" }, explain: "The sender's claim becomes the urgency, and Vlad is paged by whoever says immediate. This is the alarmist scenario." }
      ], knobs: ["ceilingEnforced", "interruptBudget"], showCtx: ["ceiling", "interruptsThisWeek"] },
    { t: "h", text: "The ladder" },
    { t: "p", text: "An unanswered `ask` or `alert` climbs a ladder whose timers run outside the agent. An agent that can switch off its own escalation is not escalating. The ladder runs on the sender's side and never writes into the receiver: the receiver's ceiling alone decides whether its owner is disturbed [[P§7.3]]. Draft 0.1 let the sender page the receiver's owner and write into the receiver; the paper's second reviewer struck both [[Rev02·#16]]. The widget below has the six rungs." },
    { t: "widget", name: "ladder", props: {} },
    { t: "list", items: [
      "**Climb early** when the time left before `by` is shorter than the next rung's handling time, and by at most one rung per receiver cycle.",
      "**No obligation.** A `by` shorter than the receiver's declared `cycle` binds the receiver to nothing.",
      "**Stop** on any acknowledgement; **de-escalate** on cancel or all-clear.",
      "**Half-life.** Every escalation token expires unless it is re-bound to an open item. Complement, the blood's cascade of defensive proteins, stays on target because its activated fragments decay within moments unless bound on the spot; a cytokine storm is escalation with the brakes gone.",
      "**Brake.** The receiving owner's stand-down overrides every rung.",
      "**Suspect before dead.** Rung R2 marks a silent peer suspect and probes its lease, as SWIM does, and the peer can refute [[R6·F12]]; on-call systems climb rung by rung and stop on acknowledgement [[R6·F18]].",
      "**Gated on progress.** In the paper's own record one warning flag fired in 55 of 91 receipts without effect, so repeated sending earns nothing and the passes change the form of any signal left unacted three times."
    ] },
    { t: "h", text: "Liveness" },
    { t: "p", text: "A `pulse` renews a lease with a stated term (Gray and Cheriton 1989, [[R6·F13]]). One missed term makes the peer suspect; two hold its inbound traffic until it presents again. A declared `quiet` exempts the peer, and a quiet renewed indefinitely is itself a signal. Expiry caused while a peer was held this way does not count against its resends [[P§7.4]]. Law {{L5}}: absence is a signal. A scheduled message that did not arrive is written down as `missed`. In the paper's deployed channel, two nights on which a scheduled run never fired looked identical to two perfect nights until missing runs were recorded as rows, and the same channel showed that silence binds both sides: the stronger party imposed the acknowledgement rule and then broke it for 26 days. Membrane's obligations are symmetric, and each side keeps a per-peer count of days since the last inbound message." },
    { t: "gate", title: "Clocks, expiry, pulses", intro: "The alert evaluated as a message, then the ask with its clock moved, then a pulse and a quiet. Predict the disposition and the deciding step. One case recalls the dispositions lesson.",
      preset: { base: "alert" }, predict: ["disposition", "decisiveStep"], expect: { disposition: "held", reason: "awaiting-signal", evidence: "measured", decisiveStep: "release" },
      explain: "The alert claims a measured result from a probe named `push-probe`. brainboi's contract names only `lease-probe`, so step 17 treats the claim as synthesis and step 21 holds it for a second signal. The alert reached brainboi; its content is not yet a fact.",
      variants: [
        { label: "brainboi's contract also names `push-probe`", change: { ctx: { measurements: ["lease-probe", "push-probe"] } }, expect: { disposition: "admitted", admittedAs: "fact", evidence: "measured" }, explain: "Now brainboi can rerun the measurement itself, and step 21 admits the alert as a fact. Alerts are asserts and take the evidence path like any other claim." },
        { label: "The alert's `expires` already passed", change: { header: { expires: "2026-09-22T09:55:00Z" } }, expect: { disposition: "expired", decisiveStep: "expiry", receiptOwed: true }, explain: "Fetched at 10:00, expired at 09:55. Step 9 expires it on brainboi's clock, with a receipt." },
        { label: "The ask with `at` thirty minutes ahead of brainboi's clock", change: { base: "ask", header: { at: "2026-09-22T10:30:00Z" } }, expect: { disposition: "refused", reason: "clock", decisiveStep: "clock" }, explain: "More than ten minutes ahead. Step 8 refuses with `clock` [[Rev02·#18]]; Echo, the playground's relay, runs eighteen minutes fast and trips this constantly." },
        { label: "The same ask, with the tolerance raised to sixty minutes", change: { base: "ask", header: { at: "2026-09-22T10:30:00Z" }, params: { clockToleranceMin: 60 } }, expect: { disposition: "admitted" }, explain: "A knob. Wider tolerance admits skewed peers and lets a message claim more future than it should." },
        { label: "A pulse with no evidence line", change: { base: "claim", header: { form: "pulse", cycle: 60, lease: 120, covered_through: "hermes-20260922-a41d0e6b9c7f2358" }, body: "alive\n" }, expect: { disposition: "held", reason: "awaiting-signal" }, explain: "A pulse is an assert, and an assert with no evidence kind is a synthesis: step 17 holds it for a signal. Whether liveness should be exempt is an open question for the owners." },
        { label: "A pulse pointing at its record", change: { base: "claim", header: { form: "pulse", cycle: 60, lease: 120, covered_through: "hermes-20260922-a41d0e6b9c7f2358", evidence: "record" }, msg: { recordOk: true }, body: "alive\n" }, expect: { disposition: "admitted", admittedAs: "fact" }, explain: "The quarantined reader opened the record. Step 21 admits the pulse as fact: the lease is renewed and the watermark advances." },
        { label: "A pulse without a lease term", change: { base: "claim", header: { form: "pulse", cycle: 60, covered_through: "hermes-20260922-a41d0e6b9c7f2358", evidence: "record" }, msg: { recordOk: true }, body: "alive\n" }, expect: { disposition: null, reason: "malformed" }, explain: "The form `pulse` requires `cycle`, `lease` and `covered_through`. Step 4, logged only." },
        { label: "A quiet until tomorrow", change: { base: "claim", header: { act: "declare", form: "quiet", until: "2026-09-23T09:00:00Z" }, body: "away\n" }, expect: { disposition: "admitted", admittedAs: "declaration" }, explain: "Silence by decision, with a clock. Step 21 admits it as a declaration; Hermes is exempt from the lease until tomorrow and earns no receipt for saying so." },
        { label: "From earlier (dispositions): the first resend of an expired ask", change: { base: "ask", ctx: { expiredBodies: { "$body": 1 } } }, expect: { disposition: "admitted", decisiveStep: "release" }, explain: "One expiry on record for this body. Step 9 lets the resend through and step 21 admits it." }
      ], knobs: ["clockToleranceMin", "expiryHours"], showCtx: ["measurements"] },
    { t: "takeaways", items: [
      "When, who, proof; Mailbox, Bulletin, Page; the pilot uses the first two between agents.",
      "Urgency, severity and certainty are three claims; the receiver's ceiling caps them; lowering is always free.",
      "Interrupts are budgeted and judged afterwards; honest doubt and self-cancellation are never counted.",
      "The ladder's timers run outside the agent, it never writes into the receiver, and it stops on any acknowledgement.",
      "A pulse renews a lease; silence past it has a name; a night with no message is a row."
    ] },
    { t: "deeper", links: [ { ref: "P§7" }, { scenario: "alarmist" }, { scenario: "escalation" }, { research: "R6", label: "R6 · channels, urgency, escalation" }, { href: "https://www.rfc-editor.org/rfc/rfc6710.html", label: "RFC 6710 · SMTP message priority" } ] },
    { t: "tutor", prompts: [ "Why may a sender lower its own urgency claim, and why can it not raise it?", "What is the difference between R2 probing the lease and R1 resending the message?", "Why does a `by` shorter than the receiver's cycle bind the receiver to nothing?" ] }
  ]
});
