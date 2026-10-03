Course.lesson({
  id: "layers", part: "foundations", title: "The narrow waist",
  kicker: "What Membrane pays for being shaped like the internet's hourglass",
  minutes: 7,
  refs: ["P§1.3", "P§3", "P§4.3", "R8·F3", "R8·F4", "R8·F8"],
  objectives: [
    "Say what a layer guarantees to the layer above and what it leaves to it.",
    "State the hourglass theorem and its design consequence.",
    "Place Membrane's waist, forms, extensions, edges and bindings on the hourglass."
  ],
  summary: "A protocol layer offers a small set of guarantees to the layer above and leaves everything else to it: IP delivers packets with no promise of order or arrival; TCP turns that into an ordered byte stream; HTTP turns that into requests and responses. The internet is an hourglass with IP at the waist: many applications above, many link technologies below, one thin layer everyone implements. Beck's hourglass theorem says a weaker waist supports fewer applications and more implementations, so the design decision that matters most is the set of applications the waist must serve. Membrane's waist is the vocabulary of the boundary; forms and extensions sit above, bindings below, and each agent keeps the edges.",
  blocks: [
    { t: "p", text: "Membrane calls itself a waist, says it is roughly the size of SMTP's core, and lists seven invariants that will never change. All three claims rest on one picture from networking." },
    { t: "figure", name: "stack", caption: "The internet stack beside the agent stack. Each row names what the layer guarantees upward; the arrow marks what it leaves to the row above." },
    { t: "h", text: "What a layer guarantees" },
    { t: "table", head: ["Layer", "Guarantees to the layer above", "Leaves to it"], rows: [
      ["IP", "a packet may reach the address it names", "order, arrival, integrity, meaning"],
      ["TCP", "an ordered, complete stream of bytes between two endpoints, or a reported failure", "what the bytes mean; whether the other end acted"],
      ["HTTP", "a request reaches a resource and a response with a status comes back", "what the resource did with it; whether to retry"],
      ["A2A, MCP", "a message or a call reaches an agent or a tool; a task or a result comes back", "what the receiver does with it; how far to trust it"],
      ["Membrane", "the receiver's disposition: sealed, held, admitted, refused or expired, with a code", "truth, policy, whether to act"]
    ], caption: "A layer that promised more would have fewer implementations. TCP's promise of order is the reason two agents on different schedules cannot use it as their ordering: there is no stream between runs." },
    { t: "define", terms: [
      { term: "layer", def: "A protocol offering fixed guarantees upward and relying on fixed ones below." },
      { term: "waist", def: "The thinnest layer, which everything above uses and everything below implements." },
      { term: "spanning layer", def: "Beck's name for the waist.", ref: "R8·F3" },
      { term: "invariant", def: "A property promised never to change across versions.", ref: "R8·F8" }
    ] },
    { t: "h", text: "The hourglass" },
    { t: "figure", name: "hourglass", caption: "Applications above, bindings below, the waist fixed. For the internet the waist is IP; for Membrane it is the vocabulary of the boundary." },
    { t: "p", text: "The internet has many applications on top and many link technologies underneath, and one thin layer, IP, that everyone implements." },
    { t: "p", text: "Beck formalised why the shape recurs [[R8·F3]]. Order protocol specifications by logical strength. A weaker spanning layer supports fewer possible applications, since less can be built on fewer promises, and more possible implementations, since more things can keep fewer promises. So there is a trade, and the design decision that matters most is choosing the set of applications the waist must serve, then picking the weakest layer sufficient for them. Beck calls that set the necessary set, and his example of a logically weak primitive that spread everywhere is Unix's `fork()`." },
    { t: "p", text: "The paper applies the theorem directly. Membrane's necessary set has five members, in short names: ask, answer, disposition, liveness, withdraw. The problem lesson spells each out; everything outside the five rides above the waist as a named form or extension or stays inside the agent [[P§1.3]]. Whether the five are the right set is decision D1." },
    { t: "h", text: "Waists ossify, and newcomers live in gaps" },
    { t: "p", text: "A waist, once it is everyone's dependency, stops changing: every obligation added to it shrinks the set of possible implementations, and the installed base will not follow. Akhshabi and Dovrolis built an evolutionary model in which protocols gain value from the layers above and die when a same-layer competitor overlaps their products; it reproduces the hourglass from generic starting conditions, and in it a newcomer survives only in a niche the incumbents leave empty [[R8·F4]]. Membrane's niche is asynchronous, file-native, owner-auditable messaging between agents of different owners; it binds onto A2A and MCP as transports." },
    { t: "p", text: "The other cost of a fixed waist is that observers freeze whatever they see, including accidents. QUIC's answer was to publish a short list of invariants and declare that everything else may change between versions [[R8·F8]]. Membrane does the same in [[P§4.3]]: the first line, the seven required fields, the byte rules, the four acts, the five dispositions, the unknown-handling rules, and the rule that inbound content carries no authority. An implementation may depend on those and on nothing else." },
    { t: "h", text: "Membrane on the hourglass" },
    { t: "table", head: ["Part", "Contents", "Who defines it"], rows: [
      ["Waist", "envelope and byte rules, four acts, five dispositions, evidence kind and effect class, deadline, expiry and turn, handling rules, invariants", "the specification; changed only by a version bump"],
      ["Registered forms", "card, ask, accept, reply, receipt, pulse, alert, quiet, cancel, exit, not-understood", "a registry file; a receiver that does not know a form still knows its act"],
      ["Extensions", "delegation, provenance, urgency and the page channel, presentation, capability tokens, countersigned receipts, public anchor, tear-line labels", "named registry entries; ignored unless listed in `crit`"],
      ["Edges", "gate implementation, sensor model, tier policy, standing computation, escalation timers, quarantine storage", "each agent, under its owner"],
      ["Bindings", "git lanes, shared folders, email, A2A, MCP", "binding notes; each states how it signs and how it proves delivery"]
    ], caption: "From [[P§3]]. Only the first row is the protocol; the others say where everything else goes." },
    { t: "quiz", q: "Which change to a waist increases the number of things that can implement it?", options: [ "Adding a required field that every message must carry", "Removing a guarantee the layer used to make", "Fixing the meaning of the body text", "Requiring ordered delivery" ], answer: 1, explain: "Weaker promises are easier to keep, so more implementations can keep them; the price is that fewer applications can be built on them. Each of the other options strengthens the waist and shrinks who can implement it.", why: [ "A new requirement is a stronger specification.", "Correct: weakening the spanning layer grows the implementation set.", "A fixed meaning is an ontology every implementer would have to share; L9 refuses it.", "Ordering is a promise two agents on different schedules cannot keep." ] },
    { t: "takeaways", items: [
      "A layer promises a little upward and hides how; what it does not promise belongs to the layer above.",
      "Weaker waist: fewer applications, more implementations. Choose the necessary set first.",
      "A waist stops changing once it is everyone's dependency, and newcomers live in the niches it leaves empty.",
      "Publish the invariants so observers freeze those and nothing else."
    ] },
    { t: "deeper", links: [ { ref: "P§1.3" }, { ref: "P§3" }, { ref: "P§4.3" }, { href: "https://arxiv.org/abs/1607.07183", label: "Beck · On the hourglass model" }, { href: "https://www.rfc-editor.org/rfc/rfc8999.html", label: "RFC 8999 · Version-independent properties of QUIC" }, { research: "R8", label: "R8 · minimal, lasting protocols" } ] }
  ]
});
