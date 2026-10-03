Course.lesson({
  id: "acts", part: "waist", title: "Acts and commitments",
  kicker: "Four verbs defined by what they do to a public record, and eleven named forms",
  minutes: 10,
  refs: ["P§5.1", "P§5.2", "P§5.3", "P§5.4", "R2·F3", "R2·F5", "R2·F6", "R2·F14", "R8·F13", "R9·F2"],
  objectives: [
    "Say what each of the four acts does to the commitment store.",
    "Drive a commitment from null to satisfied, expired, violated or terminated.",
    "Name the act behind each registered form and explain why a receiver that does not know a form still knows what to do.",
    "Explain why completion takes two parties."
  ],
  stamps: ["act", "form", "context", "turn"],
  summary: "Membrane has four acts, taken from Searle's illocutionary classes with expressives dropped: assert stakes the truth of content with an evidence kind; request asks the receiver to create a commitment and creates none itself; commit creates a commitment C(sender, receiver, antecedent, consequent, by); declare changes a fact the sender has standing over. Acts are defined by their effect on a public store of commitments, which anyone can check from the record; FIPA's 22 acts were defined by private beliefs and could not be verified. Forms are named compositions of acts; a receiver that does not know a form still knows its act. Completion takes two parties: the provider asserts done, the requester declares the verdict. context groups a conversation; turn counts depth under a cap.",
  blocks: [
    { t: "p", text: "The ask is a `request`. If brainboi takes it on, it will answer with two messages: an `accept`, which is a `commit`, and a `reply`, which is an `assert`. Hermes will close the loop with a verdict, which is a `declare`. Four verbs carry the whole exchange, and each one is defined by something a third party can check from the record." },
    { t: "define", terms: [
      { term: "act", def: "What a message does to the public store of commitments: `assert`, `request`, `commit` or `declare`. One of the seven required fields.", ref: "P§5.1" },
      { term: "commitment", def: "C(debtor, creditor, antecedent, consequent, by): the debtor is bound to bring about the consequent if the antecedent holds, by the deadline.", ref: "R2·F6" },
      { term: "form", def: "A registered name for a composition of an act with required fields, such as `ask`, `accept`, `reply`, `receipt`. Optional on the wire.", ref: "P§5.2" },
      { term: "sayso", def: "Standing over a fact: which role in a contract may set which value. A `declare` from a party without sayso is void.", ref: "P§5.1" },
      { term: "context", def: "The identifier of the conversation a message belongs to, carried on every message after the first. The paper called it `thread`; 0.3 uses A2A's name." },
      { term: "turn", def: "Depth within a context, counting requests, commitments, replies and verdicts. Disposition receipts carry none. Capped (starting value 6)." }
    ] },
    { t: "h", text: "Four acts" },
    { t: "table", head: ["Act", "Effect on the commitment store", "Examples"], rows: [
      ["{{act.assert}}", "the sender stakes the truth of the content, with an evidence kind", "a report, an answer, a pulse, an alert"],
      ["{{act.request}}", "asks the receiver to create a commitment; creates none itself", "an ask, a question, a proposal"],
      ["{{act.commit}}", "creates C(sender, receiver, antecedent, consequent, `by`)", "a promise, an acceptance of work"],
      ["{{act.declare}}", "changes a fact the sender has standing over", "a disposition, a verdict, a cancel, a release"]
    ], caption: "From [[P§5.1]]. Searle's fifth class, expressives, is dropped because it commits no one." },
    { t: "p", text: "The agent communication languages of the 1990s defined message types by the sender's beliefs and intentions. FIPA ACL has 22 such acts, and its own specification makes only `not-understood` mandatory [[R2·F3]]. Beliefs are private, so compliance could not be tested, and adoption faded [[R2·F5]] [[R8·F13]]. The durable alternative, from Singh's work on social semantics, defines each act by its effect on a public store of commitments, which anyone can check from the record [[R2·F6]]. That is why Membrane can fix the four acts as an invariant: a checkable definition does not need to grow." },
    { t: "h", text: "The commitment lifecycle" },
    { t: "p", text: "Drive a commitment through its states. `active` in the paper's table means conditional or detached. Only the creditor may release the debtor; only the debtor may cancel; a deadline that passes does different things depending on whether the antecedent ever held [[P§5.1]]." },
    { t: "machine", title: "C(debtor, creditor, antecedent, consequent, by)", prompt: "Start as the debtor making a commit. Choose what happens next.", start: "null", states: [
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
    ], caption: "In the pilot contract the answerer's commitment has its own `accept` as antecedent: an answerer that never accepts is never bound; one that accepts and lets by pass has a violated commitment on record [[P§10.4]]." },
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
    { t: "p", text: "Two rules make forms safe to extend. A receiver that does not know a form handles the act alone, because the act is one of four fixed words. A receiver that does know a form treats the form's required fields as critical and refuses the message as `malformed` when one is missing [[P§4.2]]. A `cancel` never changes a binding already made: to change a request, cancel it and send a new one. Sent messages are immutable; a correction is a cancel followed by a new message." },
    { t: "h", text: "Completion takes two parties" },
    { t: "p", text: "In Winograd's conversation for action, the performer asserts that the conditions of satisfaction are met, and only the requester's declaration closes the loop [[R2·F14]]. Membrane keeps the two steps apart. The provider sends a `reply` asserting done. The requester sends a verdict `receipt` declaring `met`, `unmet` or `unverifiable`, judged only against the acceptance line written before the work. `unverifiable` is a first-class verdict [[P§5.3]]. This is law {{L3}}: completion is declared by the other party. A report of completion is a claim about an artifact; the receiver opens the artifact." },
    { t: "callout", kind: "history", title: "Why the rule is written down", text: "Two incidents in the paper's own record fixed it in place: background agents reported completion with nothing on disk, and later a set of agents reported work as not returned when it had returned [[P§5.3]]. The paper's own consolidation passes print the exit status (ran, crashed, timed out) separately from the verdict (met, not met, unverifiable), judged against a one-line criterion declared at the start." },
    { t: "h", text: "Context and turn" },
    { t: "p", text: "{{env.context}} names the conversation and is required on every message after the first; cumulative acknowledgement and turn caps work per context. {{env.turn}} counts depth. Every medium that carries agent-to-agent traffic ends up adding a loop cap: Telegram, Hermes' A2A plugin, Claude Code all did [[R9·F2]]. Membrane makes the cap a contract limit (the pilot sets `turn <= 6`) and a gate step, and keeps disposition receipts out of the count so a receipt can never push a thread over the edge." },
    { t: "gate", title: "Act and form", intro: "Six messages. Predict the disposition. Two of them are brainboi's own messages back to Hermes, judged by Hermes' gate in the same way.",
      preset: {}, expect: { disposition: "admitted", admittedAs: "proposal", tier: "T1" },
      explain: "A request is admitted as a proposal. It created no commitment; brainboi's `accept` will.",
      variants: [
        { label: "The ask marked `act: assert`", change: { header: { act: "assert" } }, expect: { disposition: null, reason: "malformed", decisiveStep: "syntax" }, explain: "The form `ask` is a request. A form whose act disagrees with the registry fails the schema, and a schema failure is malformed: logged only." },
        { label: "`act: inform`, a FIPA word", change: { header: { act: "inform" } }, expect: { disposition: null, reason: "malformed", decisiveStep: "syntax" }, explain: "Four acts are an invariant. Anything else is malformed. FIPA's twenty-two verbs do not exist here." },
        { label: "turn: 7", change: { header: { turn: 7 } }, expect: { disposition: "refused", reason: "turn", decisiveStep: "turn", receiptOwed: true }, explain: "The pilot contract caps a context at six turns. The seventh is refused with a receipt, which carries no turn and so cannot be refused in return." },
        { label: "brainboi's accept, judged at 10:05", change: { base: "accept", ctx: { now: "2026-09-22T10:05:00Z" } }, expect: { disposition: "admitted", admittedAs: "commitment", tier: "T0" }, explain: "A commit under the accepted contract. It enters the record as a commitment: the answerer is now bound to reply or decline by the ask's `by`. Effect none, tier T0." },
        { label: "The accept written as a request", change: { base: "accept", header: { act: "request" }, ctx: { now: "2026-09-22T10:05:00Z" } }, expect: { disposition: null, reason: "malformed", decisiveStep: "syntax" }, explain: "Form `accept` is a commit. Mismatch, malformed, logged only. The form table is part of the schema, so a known form cannot be smuggled in under another act." },
        { label: "A cancel of the ask", change: { base: "claim", header: { act: "declare", form: "cancel", re: "hermes-20260922-a41d0e6b9c7f2358" }, body: "withdrawn\n" }, expect: { disposition: "admitted", admittedAs: "declaration", tier: "T0" }, explain: "A declare over a fact Hermes has standing over: its own message. Admitted as a declaration. The ask stays on record; the cancel is a new message that points at it." }
      ] },
    { t: "sort", prompt: "Which act is behind each form?", buckets: [ { id: "assert", label: "assert" }, { id: "request", label: "request" }, { id: "commit", label: "commit" }, { id: "declare", label: "declare" } ], items: [
      { text: "ask", bucket: "request", why: "Asks for a commitment; creates none." },
      { text: "accept", bucket: "commit", why: "Creates the promise to answer by `by`." },
      { text: "reply", bucket: "assert", why: "Stakes the answer's truth, with an evidence kind." },
      { text: "receipt", bucket: "declare", why: "A disposition or a verdict: facts the receiver or requester has standing over." },
      { text: "pulse", bucket: "assert", why: "Stakes that the sender is alive and what it has taken in." },
      { text: "alert", bucket: "assert", why: "Stakes that a change happened; the urgency claim rides as an extension." },
      { text: "quiet", bucket: "declare", why: "Declares a silence by decision, with an `until`." },
      { text: "not-understood", bucket: "declare", why: "Declares that the receiver could not handle the message; the one form every implementation must have." }
    ] },
    { t: "takeaways", items: [
      "Four acts, each defined by what it does to a public commitment store. Checkable, so fixed.",
      "A commitment is conditional until its antecedent holds; only the creditor releases; a passed deadline is expiry or violation depending on whether the debtor was bound.",
      "Forms are compositions of acts; an unknown form falls back to its act, a known form's fields are critical.",
      "Completion takes two parties: assert done, declare met or unmet or unverifiable.",
      "Context groups; turn counts; receipts carry no turn."
    ] },
    { t: "deeper", links: [ { ref: "P§5" }, { research: "R2", label: "R2 · classical agent communication, commitments, BSPL" }, { scenario: "happy" } ] },
    { t: "tutor", prompts: [ "Why are expressives dropped?", "What is the antecedent of the answerer's commitment in the pilot contract, and why does that matter?", "Could a receipt ever be a commit?" ] }
  ]
});
