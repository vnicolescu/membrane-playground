Course.lesson({
  id: "gap", part: "parents", title: "The gap",
  kicker: "What two owners do to a one-owner protocol",
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
    { t: "p", text: "The two parents are on the table. Membrane keeps a record, in the contract itself, of where every idea came from and what happened to it on the way, in four words. Before you learn the words, try the sort below on features you have met in the last two lessons; the figure that follows it is the contract's own answer." },
    { t: "define", terms: [
      { term: "borrowed", def: "Taken from MCP or A2A as it is." },
      { term: "extended", def: "Same shape, with fields or rules added." },
      { term: "breaks", def: "Holds inside one owner and fails between two; replaced." },
      { term: "absent", def: "The parent has nothing here; Membrane adds a primitive." }
    ] },
    { t: "sort", prompt: "Twelve features of MCP and A2A, none of them named in the contract's lineage table. Sort each by what Membrane did with it.", buckets: [
      { id: "borrowed", label: "Borrowed" }, { id: "extended", label: "Extended" }, { id: "breaks", label: "Breaks" }, { id: "absent", label: "Absent" }
    ], items: [
      { text: "MCP: `notifications/cancelled` is cooperative and a late response is ignored", bucket: "borrowed", why: "Membrane's `cancel` is the same cooperative withdrawal; the original stays on record." },
      { text: "A2A: a server must set `contextId` on every message it sends", bucket: "borrowed", why: "Becomes `context`, carried on every message after the first." },
      { text: "MCP: a tool list may vary by authorization and must never vary per connection", bucket: "borrowed", why: "Statelessness: what a peer may do is rechecked on every message against its standing and contract, with nothing carried over from a session." },
      { text: "MCP: URL-mode elicitation sends the human to a browser page out of band", bucket: "borrowed", why: "An owner-to-owner channel outside both agents, for whatever must not pass through either; and `accept` there means consent, with the outcome still to be learned." },
      { text: "MCP: a resource's `cacheScope: private`", bucket: "extended", why: "The seed of a use scope: Membrane's shareable list in the contract says what may leave and to whom." },
      { text: "A2A: push notifications to a webhook, delivered at least once", bucket: "extended", why: "The `alert` form keeps the shape and adds an urgency claim, `expires`, and a ceiling the receiver owns." },
      { text: "MCP: `notifications/progress` with a monotone counter during a long call", bucket: "extended", why: "A `pulse` adds a lease term and a watermark, and silence past the lease is a signal." },
      { text: "A2A: a JWS signature over the Agent Card, optional", bucket: "extended", why: "The `card` form keeps the shape and makes the signature required." },
      { text: "MCP: `prompts/get` returns a template the server wrote for the user to pick", bucket: "breaks", why: "A peer's template is instruction text from another owner, so it is treated as quarantined data and kept out of the kernel." },
      { text: "A2A: agents never expose memory, reasoning or framework", bucket: "breaks", why: "Opacity leaves a peer no way to judge the interior or notice its absence; presentation and stated goals open a small, attested window." },
      { text: "A receiver tells the sender what became of its message: held, admitted, refused or expired", bucket: "absent", why: "A2A has `rejected` alone; MCP has nothing. Dispositions, `echo` and verdicts are new primitives." },
      { text: "A trust level that drops after a contradiction and returns after a clean month", bucket: "absent", why: "Neither parent has standing at all; revocation elsewhere is terminal." }
    ] },
    { t: "figure", name: "twoParents", caption: "The contract's lineage table, by relation. Opening a row shows the Membrane form the idea became." },
    { t: "p", text: "Where your sort disagreed with the figure, the lineage row says why." },
    { t: "compare", caption: "What each protocol fixes.", cols: [
      { title: "MCP", items: [ "agent to tool", "JSON-RPC, per-request version and capabilities", "tools, resources, prompts; three loci of control", "consent at the host, unenforced on the wire", "silent on receipts, on quarantine and on the evidence behind a claim" ] },
      { title: "A2A", items: [ "agent to agent, transport", "card, message, task; nine task states", "three bindings over one protobuf model", "REJECTED as the one boundary word", "agents opaque by design" ] },
      { title: "Membrane", items: [ "what the receiver does with a peer's message", "envelope, four acts, five dispositions, reason codes", "effect class from a contract; evidence kind on every claim", "a gate outside the agent, under its owner", "standing that recovers; receipts both sides sign" ] }
    ] },
    { t: "h", text: "What breaks, and why" },
    { t: "table", head: ["Assumption", "Why it holds with one owner", "What fails with two", "Membrane's replacement"], rows: [
      ["The host holds the context and the consent", "the same person installed every server and reads every result", "there is no shared host; nobody consents for both sides", "each receiver's gate, outside the agent, under its owner's tiers"],
      ["Servers never send requests", "the wire is asymmetric by rule; only clients initiate", "both agents initiate; one direction cannot be the server", "two one-way channels, one per direction: two lanes"],
      ["Server prompts are templates the user picks", "the server is a tool the user installed", "a peer's template is instruction text from another owner", "quarantined data, kept out of the kernel"],
      ["Agents are opaque", "a transport need not see inside", "nothing lets a peer judge the interior or notice its absence", "presentation (made and ingested) and stated boundary goals"],
      ["A stateful session groups turns", "the context belongs to one user", "the peer's text lands in the live session with memory and tools", "`context` kept; content sealed and answered in a quarantined run"]
    ], caption: "The first three rows are MCP's, the last two A2A's [[R11·§7]]. The session row is the session-smuggling fix." },
    { t: "h", text: "The five absences" },
    { t: "p", text: "Both parents lack five things, and Membrane adds a primitive for each. The waist part of the course covers two of them, the dispositions with their receipts and the sealed and held states that are quarantine ([[lesson:dispositions|the lesson on what becomes of a message]]); the gate part covers the effect class computed from a contract ([[lesson:effects|the tiers]]) and the evidence kind ([[lesson:evidence|the evidence paths]]); the time part covers standing that recovers on a clock ([[lesson:standing|identity and standing]]). The paper's gap table marks every one of them absent in MCP and A2A, and most of them absent in the six other protocols the sweep opened [[P§D]]." },
    { t: "p", text: "A new protocol survives by offering what the incumbents do not and dies competing head-on: in the evolutionary model that reproduces the internet's hourglass, a newcomer in an incumbent's niche needs about ninety percent of the incumbent's value to live (Akhshabi and Dovrolis 2011, [[R8·F4]]). Membrane's niche is asynchronous, file-native, owner-auditable messaging between agents of different owners, and it binds onto A2A and MCP as transports [[P§15]]." },
    { t: "callout", kind: "note", title: "Decision D2: extension profile or its own protocol", text: "Membrane could ship as an A2A extension, as a separate specification with an A2A binding, or both. The constraint the research found: A2A extensions may not add fields to core types or values to enums, so dispositions would live under `metadata[uri]` and could never be a TaskState [[R10·§10]]. The paper's position is that the core must also work where no server listens: over a shared folder, a git repository or a mailbox [[P§1.2]]. Both owners decide." },
    { t: "takeaways", items: [
      "Four relations: borrowed, extended, breaks, absent; what breaks is whatever assumed one owner.",
      "Five absences become five primitives: dispositions, quarantine, evidence kind, effect class, standing.",
      "D2: an A2A extension cannot add a TaskState, so dispositions would ride in metadata; the core must also work with no server listening."
    ] },
    { t: "deeper", links: [ { ref: "P§D" }, { ref: "P§3" }, { research: "R11", label: "R11 §7 · the extension map, row by row" }, { research: "R8", label: "R8 · F3 and F4, waists and niches" } ] },
    { t: "tutor", prompts: [ "Which single Membrane field would an A2A extension profile have the hardest time carrying, and why?", "Is `cancel` borrowed or extended? Argue both ways.", "What would make the host-holds-consent model work again between two owners?" ] }
  ]
});
