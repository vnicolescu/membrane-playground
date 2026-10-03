Course.lesson({
  id: "contracts", part: "waist", title: "Contracts",
  kicker: "A hash-identified file says who may bind what, and what each message type costs",
  minutes: 10,
  refs: ["P§10.1", "P§10.2", "P§10.3", "P§10.4", "P§5.4", "P§4.2", "R2·F7", "R2·F8", "R2·F10", "R2·F11", "R2·F20", "R1·F6"],
  objectives: [
    "Read the pilot contract and say which messages are enabled after any given message.",
    "Explain why request and commit need an accepted contract and what the gate does without one.",
    "State the three layers of a Ricardian information contract and who reads each.",
    "Say why procedural pseudocode was rejected as the contract language."
  ],
  stamps: ["contract", "by", "acceptance"],
  gateSteps: ["contract"],
  summary: "A Membrane contract is one file in three layers, identified by its hash, and the hash travels in every request and commit. The information layer lists message types with what each needs to know already and what it newly binds (BSPL); order follows from those dependencies, bindings never change once set, and duplicates are harmless. The commitment layer says which acts create which commitments with deadlines. The prose layer carries purpose and acceptance lines. Each message type carries an effect class the receiver applies. A request under no accepted contract is refused contract-mismatch; a type the contract does not list is treated as irreversible. No agent edits its own contract; a change is a proposal both owners sign.",
  blocks: [
    { t: "gate", title: "A bare request", intro: "The running ask with its `form` line deleted, so it is a request of no named type. Say what brainboi's gate does and at which step it decides.", preset: { unset: ["form"] }, predict: ["disposition", "decisiveStep"], expect: { disposition: "held", reason: "awaiting-owner", tier: "T4", decisiveStep: "release" }, explain: "Held for Vlad at step 21, at the highest tier. One missing word moved the message from the gate's hands to the owner's; the contract is why." },
    { t: "p", text: "Line ten of the ask reads `contract: ee97a799df24438a`. brainboi's gate looks the hash up in the list of contracts Vlad has accepted with Hermes, pinned next to the gate and outside the repository. If it is there, the gate knows four things without reading a word of prose: what an `ask` may bind, what the `accept` needs, what effect class each message type carries, and how many turns the conversation may run. If it is absent, the request is refused. Here is the contract, exactly as the paper prints it [[P§10.4]]." },
    { t: "code", lang: "text", caption: "The pilot's question-and-answer contract. Its hash is the SHA-256 of this text with a final LF; the playground's gate uses its simulation hash of the same text.", text: "contract   pilot-ask v0\nroles      asker, answerer\nkey        id\n\nmessage    ask      asker -> answerer   binds id, question, acceptance, by        effect disclose\nmessage    accept   answerer -> asker   needs id, question   binds accepted       effect none\nmessage    reply    answerer -> asker   needs id, accepted   binds answer         effect disclose\nmessage    decline  answerer -> asker   needs id             binds answer         effect none\nmessage    verdict  asker -> answerer   needs id, answer     binds verdict        effect none\n\nsayso      verdict: asker ; accepted, answer: answerer\ncommit     answerer, on accept sent: reply or decline by `by`\nshareable  answerer: pilot/shareable/ and public sources\ncomplete   verdict\nlimits     turn <= 6 ; header <= 4 KB ; body <= 8 KB\n", mark: [5, 7, 8, 11, 12] },
    { t: "h", text: "Three layers" },
    { t: "list", ordered: true, items: [
      "**Information layer**, for the verifier: roles, key, message types with needs and binds, sayso, exclusions, the completion goal. Checked once for safety and liveness. At run time an adapter outside the agent computes which messages are enabled, and the model only chooses among them and fills in values (Langshaw and the Peach adapter, [[R2·F10]]).",
      "**Commitment layer**, for both parties: which acts create which commitments, with deadlines. The `commit` line above is the whole of it for the pilot.",
      "**Prose layer**, for models and owners: purpose, acceptance lines a reader with no context can act on, and examples."
    ] },
    { t: "p", text: "This is Grigg's Ricardian contract, a document at once legible to people and parseable by machines and named by its hash [[R2·F20]], joined to Agora's practice of identifying a protocol by the hash of a plain-text document [[R1·F6]]. The hash is what makes `contract-mismatch` a byte comparison." },
    { t: "define", terms: [
      { term: "contract", def: "One hash-named file both owners accepted.", ref: "P§10.2" },
      { term: "needs / binds", def: "Per message type: values known already, and values set here for the first time.", ref: "R2·F7" },
      { term: "sayso", def: "Which role may set which value.", ref: "R2·F10" },
      { term: "acceptance line", def: "One checkable line the asker writes before the work.", ref: "P§5.3" },
      { term: "by", def: "The deadline on a request or commit.", ref: "P§7.3" }
    ] },
    { t: "h", text: "Order follows from information" },
    { t: "p", text: "Nothing here is sequenced. Under a contract, Membrane assumes no message ordering. Each message type states what it needs to know already and what it newly binds, after the Blindingly Simple Protocol Language (BSPL, [[R2·F7]]). Order follows from the dependencies: a `reply` needs `accepted`, so it cannot be sent before an `accept`; `reply` and `decline` both bind `answer`, and a binding is set once, so they exclude each other without any ordering rule. Safety and liveness of such a protocol can be checked over unordered, lossy delivery, and duplicates become harmless, so recovery is resending [[R2·F8]]." },
    { t: "widget", name: "bspl", props: {} },
    { t: "p", text: "The seed list that started the paper asked for pseudocode as the contract language, and it was right about the readers: a contract must be legible to a model, to both owners and to a verifier. Procedural pseudocode, though, encodes one sequence of steps, and sequences are what break between agents running on different clocks [[P§10.1]]. Session types can verify a sequence and need ordered channels to do it, which two agents on different schedules do not have [[R2·F11]]. Strabo modelled a 2026 commerce protocol declaratively and found that its specification silently assumed synchronous operations, so an update racing a completion could place an unintended order [[R2·F10]]. Pseudocode survives as the surface syntax above on one condition: it declares who may bind what from what they already know, with no sequencing and no loops." },
    { t: "h", text: "Effect per message type" },
    { t: "p", text: "Every message type in the contract carries an effect class. The receiver reads the class from the contract and applies the higher of the contract's class and the sender's declaration [[P§6.2]]." },
    { t: "p", text: "A request under no accepted contract is refused with {{rc.contract-mismatch}}, because without the contract nothing can be computed; an assert without one is handled at the lowest tier [[P§4.2]]. A request whose type the contract does not list is treated as the most restrictive class, irreversible, which is what happened to the bare request in the cold case." },
    { t: "p", text: "No agent edits the contract its channel runs under." },
    { t: "p", text: "A change is a proposal both owners sign; each gate pins its own accepted copy next to itself, outside the transport, and applies a change only after its local owner confirms it [[P§10.3]]. An agent-signed commit that touches `PROTOCOL.md` or the key list is refused with `scope`. The paper's record gives the precedent: a machine-side agent found a one-line bug in its own routine file and refused to apply the fix for nine nights, because only its owner may change its rules, and the fix came back as an approved edit." },
    { t: "gate", title: "Under which contract", intro: "Predict the disposition and the deciding step. One case recalls the acts lesson.",
      preset: {}, predict: ["disposition", "decisiveStep"], expect: { disposition: "admitted", tier: "T1", decisiveStep: "release" },
      explain: "The hash matches the contract Vlad accepted with Hermes; `ask` is listed with effect disclose; admitted at step 21.",
      variants: [
        { label: "A contract hash brainboi never accepted", change: { header: { contract: "deadbeefdeadbeef" } }, expect: { disposition: "refused", reason: "contract-mismatch", decisiveStep: "contract", receiptOwed: true }, explain: "Step 10 compares bytes against the pinned list. Refused with `contract-mismatch` and a receipt." },
        { label: "No contract line at all", change: { unset: ["contract"] }, expect: { disposition: "refused", reason: "contract-mismatch", decisiveStep: "contract" }, explain: "A request needs a contract; the effect classes and the dependencies live there. Step 10, same code." },
        { label: "No acceptance line", change: { unset: ["acceptance"] }, expect: { disposition: null, reason: "malformed", decisiveStep: "syntax" }, explain: "The form `ask` requires `acceptance`; a known form's fields are critical. Step 4, logged only, and no verdict could ever have been judged." },
        { label: "No `by`", change: { unset: ["by"] }, expect: { disposition: null, reason: "malformed", decisiveStep: "syntax" }, explain: "Every request and commit carries a deadline. Step 4, logged only." },
        { label: "From the cold open: no `form` line", change: { unset: ["form"] }, expect: { disposition: "held", reason: "awaiting-owner", tier: "T4", decisiveStep: "release" }, explain: "Step 16 looks the message type up in the contract's menu; `request` is not a type the pilot lists, so the effect is irreversible, and step 21 holds a T4 effect for the owner." },
        { label: "From earlier (acts): turn 7", change: { header: { turn: 7 } }, expect: { disposition: "refused", reason: "turn", decisiveStep: "turn" }, explain: "The contract's `limits` line is where the cap of six comes from. Step 12 refuses with `turn`." },
        { label: "No contract, with the contract requirement switched off", change: { unset: ["contract"], params: { requireContract: false } }, expect: { disposition: "admitted", flags: { noContract: true } }, explain: "A policy a receiver could choose. Admitted on the declaration alone, with a flag in the trace that no contract bounded it." }
      ], knobs: ["requireContract"] },
    { t: "gate", title: "Three lines, three outcomes", intro: "The ask is in the editor. One line per goal.",
      preset: {}, predict: false, expect: { disposition: "admitted" },
      goals: [
        { text: "Refuse it with `contract-mismatch` by changing one line.", want: { disposition: "refused", reason: "contract-mismatch" }, solution: { header: { contract: "deadbeefdeadbeef" } } },
        { text: "Make brainboi hold it for Vlad by removing the one line that names the message type.", want: { disposition: "held", tier: "T4" }, solution: { unset: ["form"] } },
        { text: "Make it logged only by dropping a line the form `ask` requires.", want: { disposition: null, reason: "malformed" }, solution: { unset: ["acceptance"] } }
      ] },
    { t: "takeaways", items: [
      "One file, three layers, one hash; the hash travels on every request and commit.",
      "Needs and binds give order without sequencing; a binding is set once, so rival messages exclude each other.",
      "The effect class of a message type lives in the contract; unlisted types are irreversible; without an accepted contract a request is refused.",
      "Agents propose contract changes; owners sign them; gates pin their own copies."
    ] },
    { t: "deeper", links: [ { ref: "P§10" }, { ref: "P§5.4" }, { research: "R2", label: "R2 · F7, F8, F10, F11, F20" }, { scenario: "trust-root" } ] },
    { t: "tutor", prompts: [ "Why can `reply` and `decline` never both be sent under this contract?", "What would a session-type version of this contract assume that two agents on cron schedules cannot provide?", "Why is `verdict` the asker's to bind and `answer` the answerer's?", "What is the smallest change to the contract that lets a third role read the answer, and what else must change with it?" ] }
  ]
});
