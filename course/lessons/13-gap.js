Course.lesson({
  id: "gap", part: "parents", title: "The gap",
  kicker: "Borrowed, extended, breaks, absent: what two owners do to a one-owner protocol",
  minutes: 9,
  refs: ["R11·§7", "R10", "P§1.2", "P§3", "P§D", "R8·F3", "R8·F4"],
  objectives: [
    "Sort an idea from MCP or A2A into borrowed, extended, breaks or absent.",
    "Name the five primitives Membrane adds because both parents lack them.",
    "State decision D2 and the constraint A2A's extension rules put on it."
  ],
  prereq: ["layers"],
  summary: "For each idea in MCP and A2A the contract records one of four relations: borrowed as is, extended with fields or rules, breaks (holds inside one owner and fails between two), or absent (the parent has nothing and Membrane adds a primitive). Borrowed: per-request declaration, stateless handles, the MRTR state token, audience binding, messageId, cancel. Extended: typed invocation, untrusted hints, tasks, the Agent Card, the task lifecycle, required extensions. Breaks: the host holding consent, the one-way wire, server prompts as trusted templates, opaque agents, peer text in the live session. Absent: receipts, quarantine, evidence kind, effect class, standing.",
  blocks: [
    { t: "p", text: "The two parents are now on the table. This lesson draws one line through them. Membrane keeps a record, in the contract itself, of where every idea came from and what happened to it on the way: the lineage group in `spec.js`, rendered by the figure below. The record uses four words." },
    { t: "define", terms: [
      { term: "borrowed", def: "Taken from MCP or A2A as it is." },
      { term: "extended", def: "Same shape, with more fields or rules added." },
      { term: "breaks", def: "The idea holds inside one owner and fails between two. Membrane replaces it." },
      { term: "absent", def: "The parent has nothing here. Membrane adds a primitive." }
    ] },
    { t: "figure", name: "twoParents", caption: "Every lineage row in the contract, by relation. Opening a row shows the Membrane form the idea became." },
    { t: "compare", caption: "What each protocol fixes, in one column each.", cols: [
      { title: "MCP", items: [ "agent to tool", "JSON-RPC, per-request version and capabilities", "tools, resources, prompts; three loci of control", "consent at the host, unenforced on the wire", "no receipts, no quarantine, no evidence kind" ] },
      { title: "A2A", items: [ "agent to agent, transport", "card, message, task; nine task states", "three bindings over one protobuf model", "REJECTED as the one boundary word", "agents opaque by design" ] },
      { title: "Membrane", items: [ "what the receiver does with a peer's message", "envelope, four acts, five dispositions, reason codes", "effect class from a contract; evidence kind on every claim", "a gate outside the agent, under its owner", "standing that recovers; receipts both sides sign" ] }
    ] },
    { t: "h", text: "What breaks, and why" },
    { t: "p", text: "Five MCP and A2A assumptions hold because one owner stands behind both sides. Remove that owner and each one fails in a specific way [[R11·§7]]." },
    { t: "table", head: ["Assumption", "Why it holds with one owner", "What fails with two", "Membrane's replacement"], rows: [
      ["The host holds the context and the consent", "the same person installed every server and reads every result", "there is no shared host; nobody consents for both sides", "each receiver's gate, outside the agent, under its owner's tiers"],
      ["Servers never send requests", "the wire is asymmetric by rule; only clients initiate", "both agents initiate; one direction cannot be the server", "two one-way channels, one per direction: two lanes"],
      ["Server prompts are templates the user picks", "the server is a tool the user installed", "a peer's template is instruction text from another owner", "quarantined data, never kernel"],
      ["Agents are opaque", "a transport need not see inside", "nothing lets a peer judge the interior or notice its absence", "presentation (made and ingested) and stated boundary goals"],
      ["A stateful session groups turns", "the context belongs to one user", "the peer's text lands in the live session with memory and tools", "`context` kept; content sealed and answered in a quarantined run"]
    ], caption: "The fourth and fifth rows are A2A's; the first three are MCP's. The session row is the session-smuggling fix." },
    { t: "sort", prompt: "Sort each idea by what Membrane did with it.", buckets: [
      { id: "borrowed", label: "Borrowed" }, { id: "extended", label: "Extended" }, { id: "breaks", label: "Breaks" }, { id: "absent", label: "Absent" }
    ], items: [
      { text: "Every request carries its version and capabilities (MCP `_meta`)", bucket: "borrowed", why: "The `membrane` field and the contract hash ride on every message; the card declares what the agent accepts at all." },
      { text: "The opaque `requestState` a caller echoes on retry (MCP MRTR)", bucket: "borrowed", why: "Taken whole as the `state` field: the receiver holds nothing between turns. The gate does not check it yet." },
      { text: "Tokens bound to one audience and never forwarded upstream (MCP, RFC 8707)", bucket: "borrowed", why: "The no-passthrough rule: authority received is never forwarded; delegation beyond one hop only if the contract names it." },
      { text: "`messageId`, required and unique (A2A Message)", bucket: "borrowed", why: "Becomes `id`, with the added rule that a sender never reuses one." },
      { text: "Tool annotations as untrusted hints with pessimistic defaults (MCP)", bucket: "extended", why: "A declared effect is recomputed from the contract; absent means irreversible; a contradicted declaration demotes." },
      { text: "Tasks as durable handles with five states (MCP extension)", bucket: "extended", why: "Commitments add a deadline, an acceptance line, a decline path and a closing verdict by the other party." },
      { text: "The Agent Card at a well-known path, signatures optional (A2A)", bucket: "extended", why: "The `card` form keeps the shape, carries Membrane data under extensions, and makes the signature required." },
      { text: "An extension the agent requires, refusing a client that lacks it (A2A `required`)", bucket: "extended", why: "`crit` runs the other way, as JOSE's crit does: the sender marks, the receiver refuses what it lacks; restrictions must be critical." },
      { text: "One host consents for every server (MCP)", bucket: "breaks", why: "No shared human between two owners. Consent moves to each receiver's gate." },
      { text: "The peer's text enters the live session with memory and tools (A2A)", bucket: "breaks", why: "That is the session-smuggling surface. Content is sealed and answered in a quarantined run." },
      { text: "A word for what became of a message: held, admitted, refused, expired", bucket: "absent", why: "A2A has `rejected`; MCP has nothing. Dispositions, `echo` and verdicts are new primitives." },
      { text: "An evidence kind on every claim, kept across relays", bucket: "absent", why: "Neither parent says what a sender stakes or how a receiver checks it." }
    ] },
    { t: "h", text: "The five absences" },
    { t: "p", text: "Five primitives are added because both parents lack them, and they are the course's next five parts in order: dispositions and receipts ([[lesson:dispositions]]), quarantine as the `sealed` and `held` states ([[lesson:dispositions]]), the evidence kind ([[lesson:evidence]]), the effect class computed from a contract ([[lesson:effects]]), and standing that recovers on a clock ([[lesson:standing]]). The paper's gap table (Appendix D, [[P§D]]) marks every one of them absent in MCP and A2A, and most of them absent in the six other protocols the sweep opened." },
    { t: "callout", kind: "note", title: "Decision D2: extension profile or its own protocol", text: "Membrane could ship as an A2A extension, as a separate specification with an A2A binding, or both. The constraint the research found: A2A extensions may not add fields to core types or values to enums, so dispositions would live under `metadata[uri]` and could never be a TaskState [[R10·§10]]. The paper's position is that the core must also work where no server listens: over a shared folder, a git repository or a mailbox [[P§1.2]]. Both owners decide." },
    { t: "p", text: "One last reason the gap is shaped this way. A new protocol survives by offering what the incumbents do not and dies competing head-on; in the evolutionary model that reproduces the internet's hourglass, a newcomer with the incumbent's niche needs about ninety percent of its value to live (Akhshabi and Dovrolis 2011, [[R8·F4]]). Membrane's niche is asynchronous, file-native, owner-auditable messaging between agents of different owners [[P§15]]. It binds onto A2A and MCP as transports and competes with neither." },
    { t: "takeaways", items: [
      "Four relations: borrowed, extended, breaks, absent. The contract records one for every idea it touched.",
      "What breaks is whatever assumed one owner: host consent, the one-way wire, trusted server templates, opacity, the live session.",
      "Five absences become five primitives: dispositions, quarantine, evidence kind, effect class, standing.",
      "D2: an A2A extension cannot add a TaskState, so dispositions would ride in metadata; the core must also work with no server listening.",
      "A newcomer protocol lives in the niche the incumbents leave empty."
    ] },
    { t: "deeper", links: [ { ref: "P§D" }, { ref: "P§3" }, { research: "R11", label: "R11 §7 · the extension map, row by row" }, { research: "R8", label: "R8 · F3 and F4, waists and niches" } ] },
    { t: "tutor", prompts: [ "Which single Membrane field would an A2A extension profile have the hardest time carrying, and why?", "Is `cancel` borrowed or extended? Argue both ways.", "What would make the host-holds-consent model work again between two owners?" ] }
  ]
});
