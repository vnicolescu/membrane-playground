Course.lesson({
  id: "acts", part: "waist", title: "Acts and commitments",
  kicker: "Verbs defined by what they do to a record anyone can check",
  minutes: 10,
  refs: ["P§5.1", "P§5.2", "P§5.3", "P§5.4", "R2·F3", "R2·F5", "R2·F6", "R2·F14", "R8·F13", "R9·F2"],
  objectives: [
    "Say what each of the four acts does to the commitment store.",
    "Drive a commitment from null to satisfied, expired, violated or terminated.",
    "Name the act behind a message from its content, and explain why a receiver that does not know a form still knows what to do.",
    "Explain why completion takes two parties."
  ],
  stamps: ["act", "form", "context", "turn"],
  gateSteps: ["turn"],
  summary: "Membrane has four acts, taken from Searle's illocutionary classes with expressives dropped: assert stakes the truth of content with an evidence kind; request asks the receiver to create a commitment and creates none itself; commit creates a commitment C(sender, receiver, antecedent, consequent, by); declare changes a fact the sender has standing over. Acts are defined by their effect on a public store of commitments, which anyone can check from the record; FIPA's 22 acts were defined by private beliefs and could not be verified. Forms are named compositions of acts; a receiver that does not know a form still knows its act. Completion takes two parties: the provider asserts done, the requester declares the verdict. context groups a conversation; turn counts depth under a cap.",
  blocks: [
    { t: "gate", title: "Hermes' accept", intro: "The protocol is symmetric, so this case runs the other way: brainboi has asked Hermes which release it is running, and Hermes' accept arrives at brainboi's gate. Say what the gate does with it and what it enters the record as.", preset: { base: "accept" }, predict: ["disposition", "admittedAs"], expect: { disposition: "admitted", admittedAs: "commitment", tier: "T0" }, explain: "Admitted as a commitment at step 21, and from this moment Hermes is bound to answer brainboi's question by `by`." },
    { t: "p", text: "The ask is a `request`. If brainboi takes it on, it answers with two messages: an `accept`, which is a `commit`, and a `reply`, which is an `assert`. Hermes closes the loop with a verdict, which is a `declare`." },
    { t: "p", text: "Four verbs carry the exchange, and each is defined by something a third party can check from the record." },
    { t: "h", text: "Four acts" },
    { t: "table", head: ["Act", "Effect on the commitment store", "Examples"], rows: [
      ["{{act.assert}}", "the sender stakes the truth of the content, with an evidence kind", "a report, an answer, a pulse, an alert"],
      ["{{act.request}}", "asks the receiver to create a commitment; creates none itself", "an ask, a question, a proposal"],
      ["{{act.commit}}", "creates C(sender, receiver, antecedent, consequent, `by`)", "a promise, an acceptance of work"],
      ["{{act.declare}}", "changes a fact the sender has standing over", "a disposition, a verdict, a cancel, a release"]
    ], caption: "From [[P§5.1]]. Searle's fifth class, expressives, is dropped because it commits no one." },
    { t: "p", text: "The agent communication languages of the 1990s defined message types by the sender's beliefs and intentions. FIPA ACL has 22 such acts, and its own specification makes only `not-understood` mandatory [[R2·F3]]. Beliefs are private, so compliance could not be tested, and adoption faded [[R2·F5]] [[R8·F13]]. The durable alternative, from Singh's social semantics, defines each act by its effect on a public store of commitments, which anyone can check from the record [[R2·F6]]. A checkable definition does not need to grow, which is why the four acts can be an invariant." },
    { t: "define", terms: [
      { term: "commitment", def: "C(debtor, creditor, antecedent, consequent, by): a conditional promise with a deadline.", ref: "R2·F6" },
      { term: "form", def: "A registered name for an act plus required fields: `ask`, `accept`, `reply`, `receipt`.", ref: "P§5.2" },
      { term: "sayso", def: "Which role in a contract may set which value.", ref: "P§5.1" },
      { term: "context", def: "The conversation identifier; the paper's `thread`." },
      { term: "turn", def: "Depth within a context, capped; disposition receipts carry none." }
    ] },
    { t: "h", text: "The commitment lifecycle" },
    { t: "machine", title: "C(debtor, creditor, antecedent, consequent, by)", prompt: "Two targets. Reach violated without the creditor ever acting. Then find the one ending where the deadline passes and nobody is at fault.", start: "null", targets: [
      { text: "violated, with the creditor never acting", state: "violated", avoid: ["terminated"] },
      { text: "The ending where the deadline passes and nobody is at fault", state: "expired" }
    ], states: [
      { id: "null", label: "null", kind: "start", x: 8, y: 50, note: "No commitment yet." },
      { id: "conditional", label: "conditional", kind: "active", x: 32, y: 50, note: "Created by a commit. Binding only once the antecedent holds." },
      { id: "detached", label: "detached", kind: "active", x: 58, y: 50, note: "The antecedent holds. The debtor is bound." },
      { id: "satisfied", label: "satisfied", kind: "terminal", x: 85, y: 15, note: "The consequent holds." },
      { id: "violated", label: "violated", kind: "terminal", x: 85, y: 50, note: "Bound, and then by passed or the debtor cancelled." },
      { id: "expired", label: "expired", kind: "terminal", x: 32, y: 10, note: "by passed and the antecedent never held. Nobody is at fault." },
      { id: "terminated", label: "terminated", kind: "terminal", x: 58, y: 90, note: "The debtor cancelled while conditional, or the creditor released." }
    ], edges: [
      { from: "null", to: "conditional", label: "commit (debtor)" },
      { from: "conditional", to: "detached", label: "antecedent holds" },
      { from: "conditional", to: "expired", label: "by passes, antecedent never held" },
      { from: "conditional", to: "terminated", label: "cancel (debtor)" },
      { from: "conditional", to: "satisfied", label: "consequent holds" },
      { from: "conditional", to: "terminated", label: "release (creditor)" },
      { from: "detached", to: "satisfied", label: "consequent holds" },
      { from: "detached", to: "terminated", label: "release (creditor)" },
      { from: "detached", to: "violated", label: "cancel (debtor)" },
      { from: "detached", to: "violated", label: "by passes" }
    ], caption: "`active` in the paper's table means conditional or detached. In the pilot contract the answerer's commitment has its own `accept` as antecedent: an answerer that never accepts is never bound; one that accepts and lets by pass has a violated commitment on record [[P§10.4]]." },
    { t: "h", text: "Eleven forms" },
    { t: "table", head: ["Form", "Act", "Carries"], rows: [
      ["{{form.card}}", "assert", "identity, owner, model and harness, accepted contract hashes, `cycle`, stated boundary goals; the paper's `hello`, now an A2A Agent Card profile"],
      ["{{form.ask}}", "request", "`acceptance`, `by`, `effect`, a body a reader with no context can act on"],
      ["{{form.accept}}", "commit", "the promise to answer an ask by its `by`"],
      ["{{form.reply}}", "assert", "the answer, with `re` naming the ask and an evidence kind"],
      ["{{form.receipt}}", "declare", "a disposition, or a verdict against an acceptance line, about the one message in `re`"],
      ["{{form.pulse}}", "assert", "`cycle`, a `lease` term, `covered_through`, optionally a presentation"],
      ["{{form.alert}}", "assert", "an unrequested change needing attention, with an urgency claim and `expires`"],
      ["{{form.quiet}}", "declare", "silence by decision: a reason code and an `until`"],
      ["{{form.cancel}}", "declare", "withdraws the message in `re`; `all-clear` withdraws an alert; the original stays on record"],
      ["{{form.exit}}", "declare", "handover of open commitments, then departure"],
      ["{{form.nu}}", "declare", "mandatory for every implementation"]
    ], caption: "From [[P§5.2]]. A check-in is a pulse. A request for information is an ask whose acceptance is an assertion. An escalation is the same alert sent again one rung higher, in the same context." },
    { t: "p", text: "A receiver that does not know a form handles the act alone, because the act is one of four fixed words; a receiver that does know a form treats the form's required fields as critical and the message as malformed when one is missing [[P§4.2]]. A `cancel` never changes a binding already made: to change a request, cancel it and send a new one. Sent messages are immutable." },
    { t: "h", text: "Completion takes two parties" },
    { t: "p", text: "In Winograd's conversation for action, the performer asserts that the conditions of satisfaction are met, and only the requester's declaration closes the loop [[R2·F14]]. Membrane keeps the two steps apart. The provider sends a `reply` asserting done. The requester sends a verdict `receipt` declaring `met`, `unmet` or `unverifiable`, judged only against the acceptance line written before the work, and `unverifiable` is a first-class verdict [[P§5.3]]. That is law {{L3}}. The paper's own record fixed it in place twice: background agents reported completion with nothing on disk, and later a set of agents reported work as not returned when it had returned, so brainboi's consolidation passes now print the exit status (ran, crashed, timed out) apart from the verdict (met, not met, unverifiable), judged against a one-line criterion declared at the start. A report of completion is a claim about an artifact, and the receiver opens the artifact." },
    { t: "h", text: "Context and turn" },
    { t: "p", text: "{{env.context}} names the conversation and is required on every message after the first; cumulative acknowledgement and turn caps work per context. {{env.turn}} counts depth. Every medium that carries agent-to-agent traffic ends up adding a loop cap, and Telegram, Hermes' A2A plugin and Claude Code all did [[R9·F2]]; Membrane makes the cap a contract limit (the pilot sets `turn <= 6`) and a gate step, and keeps disposition receipts out of the count so a receipt can never push a thread over the edge." },
    { t: "gate", title: "Act and form", intro: "Predict the disposition and what the message enters the record as. Two cases run the other way, Hermes answering a question brainboi asked, judged by brainboi's gate the same way; one is from the envelope lesson.",
      preset: {}, predict: ["disposition", "admittedAs"], expect: { disposition: "admitted", admittedAs: "proposal", tier: "T1" },
      explain: "A request is admitted as a proposal at step 21. It created no commitment; brainboi's `accept` will.",
      variants: [
        { label: "From the cold open: Hermes' accept of brainboi's question", change: { base: "accept" }, expect: { disposition: "admitted", admittedAs: "commitment", tier: "T0" }, explain: "A commit under the accepted contract, admitted at step 21 as a commitment. From here Hermes is bound to reply or decline by the question's `by`; its own accept is the antecedent." },
        { label: "The ask marked `act: assert`", change: { header: { act: "assert" } }, expect: { disposition: null, reason: "malformed", decisiveStep: "syntax" }, explain: "The form `ask` is a request. A form whose act disagrees with the registry fails the schema at step 4: logged only." },
        { label: "`act: inform`, a FIPA word", change: { header: { act: "inform" } }, expect: { disposition: null, reason: "malformed", decisiveStep: "syntax" }, explain: "Four acts are an invariant; step 4 stops anything else. Logged only." },
        { label: "turn: 7", change: { header: { turn: 7 } }, expect: { disposition: "refused", reason: "turn", decisiveStep: "turn", receiptOwed: true }, explain: "The pilot contract caps a context at six turns. Step 12 refuses the seventh with a receipt, which carries no turn and so cannot be refused in return." },
        { label: "Hermes' accept written as a request", change: { base: "accept", header: { act: "request" } }, expect: { disposition: null, reason: "malformed", decisiveStep: "syntax" }, explain: "Form `accept` is a commit. The form table is part of the schema, so step 4 catches a known form under another act. Logged only." },
        { label: "A cancel of the ask", change: { base: "claim", header: { act: "declare", form: "cancel", re: "hermes-20260922-a41d0e6b9c7f2358" }, body: "withdrawn\n" }, expect: { disposition: "admitted", admittedAs: "declaration", tier: "T0" }, explain: "A declare over a fact Hermes has standing over, its own message. Admitted at step 21 as a declaration; the ask stays on record and the cancel points at it." },
        { label: "From earlier (envelope): a carriage return in the body", change: { body: "Read pilot/shareable/week.md\r\n" }, expect: { disposition: null, reason: "malformed", decisiveStep: "syntax" }, explain: "Step 4 again, before the act is read: the byte rules run on every message first." }
      ] },
    { t: "gate", title: "Three edits to the act line", intro: "The running ask is in the editor. Each goal is reached in the header.",
      preset: {}, predict: false, expect: { disposition: "admitted" },
      goals: [
        { text: "Make it malformed by giving the form `ask` an act the registry does not allow.", want: { disposition: null, reason: "malformed", decisiveStep: "syntax" }, solution: { header: { act: "assert" } } },
        { text: "Push the context over the turn cap.", want: { disposition: "refused", reason: "turn" }, solution: { header: { turn: 7 } } },
        { text: "Turn it into a cancel of itself, admitted as a declaration (change the act and the form, and add a `re` line naming its own id).", want: { disposition: "admitted", admittedAs: "declaration" }, solution: { header: { act: "declare", form: "cancel", re: "hermes-20260922-a41d0e6b9c7f2358" } } }
      ] },
    { t: "sort", prompt: "Eight messages described in plain words, none of them in the tables above. Name the act behind each.", buckets: [ { id: "assert", label: "assert" }, { id: "request", label: "request" }, { id: "commit", label: "commit" }, { id: "declare", label: "declare" } ], items: [
      { text: "Hermes writes: I will have the answer by Friday noon.", bucket: "commit", why: "A promise with a deadline creates a commitment; this is an `accept`." },
      { text: "brainboi writes: the shared remote rejected two pushes last night.", bucket: "assert", why: "A claim about the world, with an evidence kind; an `alert` or a plain assert." },
      { text: "Hermes writes: your reply met the acceptance line.", bucket: "declare", why: "A verdict is a fact the asker has standing over; a `receipt`." },
      { text: "brainboi writes: which release are you running?", bucket: "request", why: "Asks for a commitment to answer and creates none; an `ask`." },
      { text: "Hermes writes: I withdraw this morning's question.", bucket: "declare", why: "A `cancel`: Hermes has standing over its own message." },
      { text: "brainboi writes: I am alive and my longest gap between runs is six hours.", bucket: "assert", why: "A `pulse` stakes a claim about liveness." },
      { text: "Hermes writes: I could not make sense of your last message.", bucket: "declare", why: "`not-understood`, the one form every implementation must have." },
      { text: "brainboi writes: please send the day's log by tomorrow.", bucket: "request", why: "A request with a deadline; it binds brainboi to nothing." }
    ] },
    { t: "takeaways", items: [
      "An act is defined by its effect on a public commitment store, so the four can stay fixed.",
      "A commitment is conditional until its antecedent holds; only the creditor releases; a passed deadline is expiry or violation depending on whether the debtor was bound.",
      "An unknown form falls back to its act; a known form's fields are critical.",
      "Completion takes two parties: the provider asserts done, the requester declares met, unmet or unverifiable."
    ] },
    { t: "deeper", links: [ { ref: "P§5" }, { research: "R2", label: "R2 · classical agent communication, commitments, BSPL" }, { scenario: "happy" } ] },
    { t: "tutor", prompts: [ "Why are expressives dropped?", "What is the antecedent of the answerer's commitment in the pilot contract, and why does that matter?", "Could a receipt ever be a commit?" ] }
  ]
});
