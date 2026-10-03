/* Membrane contract v0.3-draft: the single source of truth the playground renders.
   Every item: one-line definition, why it exists, enum values with meanings, A2A/MCP relation, references.
   References are short codes resolved by refs(): "P§6.2" paper section, "R3·F5" research finding,
   "S1·F10" house sweep (not published), "Rev02·#7" second-reader finding, "A2A:…" A2A v1.0 name, "RFC 6710".
   Statuses are relative to draft 0.2 (whitepaper/membrane-v0.2.md). */
(function () {
  const PAPER = "https://claude.ai/code/artifact/f9cfcaee-8823-4feb-a39e-81a749796d6d";

  const paperAnchors = {
    "abstract": "abstract", "1": "1-problem", "1.1": "11-agents-with-different-owners", "1.2": "12-what-current-protocols-carry",
    "1.3": "13-where-the-boundary-belongs", "2": "2-design-laws", "3": "3-architecture", "4": "4-envelope", "4.1": "41-fields",
    "4.2": "42-handling-rules", "4.3": "43-invariants", "5": "5-acts", "5.1": "51-four-acts", "5.2": "52-registered-forms",
    "5.3": "53-completion-takes-two-parties", "5.4": "54-order-follows-from-information", "6": "6-membrane",
    "6.1": "61-dispositions", "6.2": "62-effect-classes-and-release-authority", "6.3": "63-evidence-kinds",
    "6.4": "64-gatekeeper", "6.5": "65-two-signal-release", "7": "7-channels-urgency-and-escalation",
    "7.1": "71-channel-classes", "7.2": "72-urgency-claim", "7.3": "73-escalation-ladder", "7.4": "74-liveness",
    "8": "8-immunity", "8.1": "81-presentation", "8.2": "82-missing-self", "8.3": "83-danger-over-novelty",
    "8.4": "84-failure-modes", "9": "9-identity-receipts-and-standing", "9.1": "91-three-separate-claims",
    "9.2": "92-identifier", "9.3": "93-countersigned-receipt", "9.4": "94-standing", "9.5": "95-the-ledger-question",
    "10": "10-contracts", "10.1": "101-procedural-pseudocode-and-asynchrony", "10.2": "102-ricardian-information-contract",
    "10.3": "103-contract-change", "10.4": "104-example", "11": "11-boundary-agent-charter", "12": "12-scope",
    "13": "13-pilot", "13.1": "131-transport", "13.2": "132-layout", "13.3": "133-gatekeeper-per-side",
    "13.4": "134-red-team", "13.5": "135-measures", "13.6": "136-order-of-operations",
    "14": "14-limits-and-open-questions", "15": "15-adoption", "A": "appendix-a--worked-exchange",
    "B": "appendix-b--seed-map", "C": "appendix-c--house-primitives", "D": "appendix-d--gap-table", "refs": "references"
  };

  const sources = {
    R1: { title: "Protocol landscape, Sept 2026 (MCP, A2A, ANP, AGNTCY, Agora, AP2, ERC-8004, Hermes)", file: "research/R1-protocol-landscape.md" },
    R2: { title: "Classical agent communication, commitments, BSPL, contracts", file: "research/R2-classical-acl-and-contracts.md" },
    R3: { title: "Security: quarantine, gatekeeping, impact", file: "research/R3-security-quarantine-gatekeeping.md" },
    R4: { title: "Gatekeepers in sociology, diplomacy, cybernetics, biology", file: "research/R4-gatekeepers-cybernetics-sociology.md" },
    R5: { title: "Immunology and cell biology as mechanism", file: "research/R5-immunology-cell-biology.md" },
    R6: { title: "Channels, urgency, escalation", file: "research/R6-channels-urgency-escalation.md" },
    R7: { title: "Identity, reputation, the ledger question", file: "research/R7-identity-reputation-ledger.md" },
    R8: { title: "What makes protocols minimal and long-lived", file: "research/R8-minimal-lasting-protocols.md" },
    R9: { title: "The test pair: Hermes Agent and brainboi", file: "research/R9-test-pair-hermes-brainboi.md" },
    R10: { title: "A2A v1.0 exact names", file: "research/R10-a2a-v1-exact-names.md" },
    R11: { title: "MCP distilled: essence and extension map", file: "research/R11-mcp-essence.md" },
    S1: { title: "House sweep: machinery (not published: private record)", file: null },
    S2: { title: "House sweep: artifacts and essays (not published: private record)", file: null },
    Rev01: { title: "Second reader 01: evidence refuter (not published: quotes the private house record)", file: null },
    Rev02: { title: "Second reader 02: protocol critic", file: "whitepaper/review/02-protocol-critic.md" }
  };

  /* ---------- status vocabulary (relative to draft 0.2) ---------- */
  const statuses = {
    kept: "In draft 0.2 as is",
    changed: "In draft 0.2, altered in 0.3 (borrowed from A2A or MCP, or forced by a review)",
    added: "Not in draft 0.2; new in 0.3",
    open: "Waiting on a decision the playground cannot make"
  };

  /* ---------- relation vocabularies ---------- */
  const relations = {
    a2a: {
      borrowed: "taken from A2A or MCP as it is",
      extends: "keeps an A2A or MCP shape and adds fields or rules",
      differs: "a counterpart exists and works differently",
      added: "fills a gap A2A and MCP leave open",
      none: "no A2A or MCP counterpart"
    },
    lineage: {
      borrowed: "taken as it is",
      extended: "same shape, more fields or rules",
      breaks: "holds inside one owner, fails between two",
      absent: "the parent has nothing here; Membrane adds a primitive"
    }
  };

  /* ---------- the nine laws ---------- */
  const laws = [
    { id: "L1", name: "Messages trigger; they never instruct", fields: ["biology", "sociology", "cybernetics", "diplomacy", "AI security"], consequence: "Inbound content carries no authority; a request is a proposal.", refs: ["P§2", "R4·F4", "R3·F19"] },
    { id: "L2", name: "The reader of hostile content holds no authority", fields: ["AI security", "defence", "integrity models", "mail"], consequence: "A model may hold; only the gate or an anchor releases.", refs: ["P§2", "R3·F3", "R3·F5", "R3·F24"] },
    { id: "L3", name: "Completion is declared by the other party", fields: ["networking", "language/action", "commitments", "aviation"], consequence: "Provider asserts; requester declares the verdict.", refs: ["P§5.3", "R8·F1", "R2·F14", "R6·F7"] },
    { id: "L4", name: "The sender claims urgency; the receiver caps it", fields: ["military", "mail", "public alerting", "cybernetics", "ops"], consequence: "Interrupt right is a per-sender ceiling; lowering is free.", refs: ["P§7.2", "R6·F1", "R6·F2", "R4·F8"] },
    { id: "L5", name: "Absence is a signal", fields: ["immunology", "distributed systems", "maritime"], consequence: "Deadlines everywhere; silence past one has a name.", refs: ["P§7.4", "R5·F3", "R6·F12", "R6·F5"] },
    { id: "L6", name: "Consequential release needs two independent signals", fields: ["immunology", "payments"], consequence: "Signal 2 must come from a source that cannot produce signal 1.", refs: ["P§6.5", "R5·F4", "R5·F5", "R1·F8"] },
    { id: "L7", name: "Records are permanent; their weight forgets", fields: ["Bayesian reputation", "credit", "community software"], consequence: "Standing is local, recovers on a clock, starts low.", refs: ["P§9.4", "R7·F14", "R7·F16", "R7·F13"] },
    { id: "L8", name: "Shape checks can be imitated", fields: ["immunology", "intrusion detection", "production AI"], consequence: "Never admit on form alone.", refs: ["P§2", "R5·F11", "R5·F12", "R3·F7"] },
    { id: "L9", name: "Format travels; meaning stays local", fields: ["science studies", "cybernetics", "protocol engineering"], consequence: "Fixed fields, free prose, no shared ontology.", refs: ["P§2", "R4·F12", "R8·F9", "R2·F7"] }
  ];

  /* ---------- helpers ---------- */
  const F = (o) => Object.assign({ kind: "field", status: "kept" }, o);
  const X = (o) => Object.assign({ kind: "extension", status: "kept" }, o);
  const rel = (r, map) => ({ rel: r, map });
  const none = () => ({ rel: "none", map: "no A2A or MCP counterpart" });

  /* ---------- contract groups ---------- */
  const groups = [];

  groups.push({
    id: "envelope", title: "Envelope fields", blurb: "Seven required on every message; everything else only where stated. Absent optional fields mean their most restrictive value.", refs: ["P§4.1"],
    items: [
      F({ id: "env.membrane", name: "membrane", required: "always · first line", type: "integer", def: "Protocol version.", why: "One integer that changes only with an invariant; features travel as extensions.", enum: [{ v: "0", m: "this draft" }], a2a: rel("differs", "A2A:A2A-Version header (Major.Minor) travels outside the message; MCP puts a dated protocolVersion in every request's _meta, as Membrane puts its version in every message."), refs: ["P§4.1", "R8·F8", "R10·§10", "R11·§2"] }),
      F({ id: "env.id", name: "id", required: "always", type: "string ≤128, ≥64 random bits", def: "Unique message identifier, never reused by its sender.", why: "With from, the duplicate key; random bits survive a crashed counter.", a2a: rel("borrowed", "A2A:Message.messageId (required)"), refs: ["P§4.1", "Rev02·#10", "R10·§2"], try: "lost-receipt" }),
      F({ id: "env.from", name: "from", required: "always", type: "agent identifier", def: "The sending agent, verified by the binding's signature.", why: "Identity integrity is the one claim cryptography fully guarantees.", a2a: rel("extends", "A2A:AgentCard.securitySchemes authenticate the caller per endpoint; Membrane binds from to a signature on every message."), refs: ["P§9.1", "R7·F1", "R10·§1"], try: "authority-spoof" }),
      F({ id: "env.to", name: "to", required: "always", type: "list of agent identifiers", def: "Addressees; the receiving agent must be named.", why: "Stops a signed message being replayed into another channel.", a2a: rel("differs", "A2A:AgentInterface.url is the addressee; A2A Message carries no to."), refs: ["P§4.2", "Rev02·#12", "R10·§1"] }),
      F({ id: "env.act", name: "act", required: "always", type: "enum", def: "What the message does to the public commitment store.", why: "Types defined by checkable commitments, never by beliefs (FIPA's failure).", enum: [
        { v: "assert", m: "sender stakes the truth of the content" },
        { v: "request", m: "asks the receiver to create a commitment; creates none" },
        { v: "commit", m: "creates C(sender, receiver, antecedent, consequent, by)" },
        { v: "declare", m: "changes a fact the sender has standing over" }], a2a: rel("differs", "A2A:Message.role (ROLE_USER | ROLE_AGENT) names direction only; the act is implicit in the method (SendMessage, CancelTask)."), refs: ["P§5.1", "R2·F5", "R2·F6", "R8·F13", "R10·§2"] }),
      F({ id: "env.at", name: "at", required: "always", type: "RFC 3339 UTC, Z suffix", def: "Time of sending.", why: "Judged against the receiver's clock; more than 10 minutes ahead is refused.", a2a: rel("differs", "A2A:Message has no send time; TaskStatus.timestamp stamps status changes."), refs: ["P§4.1", "Rev02·#18", "R10·§2", "R10·§4"], try: "clock-skew" }),
      F({ id: "env.body", name: "body", required: "always", type: "SHA-256, 64 lowercase hex", def: "Hash of the body bytes after the --- line, final LF included.", why: "Two implementations must compute the same hash from the same bytes.", a2a: rel("extends", "A2A:Message.parts (text | raw | url | data) carry content unhashed; Membrane hashes the body and the signature covers the hash."), refs: ["P§4.1", "Rev02·#7", "R10·§3"] }),
      F({ id: "env.context", name: "context", required: "after a context's first message", type: "id", def: "Identifier of the conversation this message belongs to.", why: "Cumulative acknowledgement and turn caps work per context.", a2a: rel("borrowed", "A2A:Message.contextId (renamed from thread in 0.2)"), refs: ["P§4.1", "P§6.1", "R10·§2"], status: "changed" }),
      F({ id: "env.re", name: "re", required: "on reply, receipt, cancel", type: "id", def: "The one message this message answers.", why: "A receipt about several messages is ambiguous; one message, one receipt.", a2a: rel("differs", "A2A:Message.taskId and referenceTaskIds point at tasks; A2A has no in-reply-to message pointer."), refs: ["P§4.2", "Rev02·#6", "R10·§2"] }),
      F({ id: "env.form", name: "form", required: "optional", type: "registry name", def: "Named composition of an act (see Forms).", why: "Receivers that do not know a form still know its act.", a2a: rel("differs", "A2A:JSON-RPC method names (SendMessage, CancelTask) fix each operation; a form is a named composition of an act."), refs: ["P§5.2", "R10·§8"] }),
      F({ id: "env.contract", name: "contract", required: "on request and commit", type: "SHA-256", def: "Hash of the contract the message runs under.", why: "Effect classes and ordering live in the contract; no contract, no request.", a2a: rel("added", "No A2A or MCP counterpart; Agora identifies protocol documents by hash."), refs: ["P§10.2", "R1·F6", "R2·F20"], try: "trust-root" }),
      F({ id: "env.by", name: "by", required: "on request and commit", type: "RFC 3339", def: "Deadline for the answer.", why: "Turns silence into an event; a by shorter than the receiver's cycle binds nothing.", a2a: none(), refs: ["P§7.3", "R2·F16", "Rev02·#16"], try: "escalation" }),
      F({ id: "env.expires", name: "expires", required: "optional", type: "RFC 3339", default: "at + 48 h", def: "Latest receiver time at which the message may be released.", why: "A hold without a clock becomes a pile nobody reads.", a2a: rel("differs", "MCP:CreateTaskResult.ttlMs bounds a task handle's life; nothing in A2A or MCP bounds a held message."), refs: ["P§6.1", "R9·§4", "R6·F10", "R11·§3"], try: "owner-away" }),
      F({ id: "env.effect", name: "effect", required: "optional · on request", type: "enum", default: "irreversible", def: "Declared effect class; the receiver applies the higher of this and the contract's.", why: "Release authority scales with how undoable the effect is.", enum: [
        { v: "none", m: "adds nothing but a message", why: "T0" }, { v: "read", m: "reads content the sender supplied", why: "T0" },
        { v: "disclose", m: "returns data the receiver holds", why: "T1: only data the contract names as shareable" },
        { v: "reversible", m: "a two-way door inside a granted capability", why: "T2" },
        { v: "boundary", m: "writes memory or touches another peer", why: "T3: needs a second signal" },
        { v: "irreversible", m: "delete, spend, kernel change, send outside the channel", why: "T4: owner only" }], a2a: rel("extends", "MCP:ToolAnnotations destructiveHint and openWorldHint are untrusted hints defaulting to true; Membrane recomputes the class from the contract. A2A has none (gap table: impact assessment)."), refs: ["P§6.2", "R3·F25", "R1·§1b", "Rev02·#3", "R11·§1a"], try: "exfiltration" }),
      F({ id: "env.evidence", name: "evidence", required: "optional · on assert", type: "enum", default: "synthesis", def: "Evidence kind; selects the path the receiver checks.", why: "Relays must not turn intentions into facts.", enum: [
        { v: "measured", m: "a measurement the receiver can repeat" }, { v: "record", m: "a pointer to an artifact" },
        { v: "reconciled", m: "two independently signed sources agree" }, { v: "synthesis", m: "a model's or agent's conclusion" },
        { v: "intention", m: "a statement about a future act" }], a2a: rel("added", "No A2A or MCP counterpart; claims travel without an evidence kind."), refs: ["P§6.3", "S1·F9", "S1·F10", "Rev02·#15"], try: "laundering" }),
      F({ id: "env.origin", name: "origin", required: "when relaying", type: "id", def: "First assertion of a relayed claim.", why: "Repetition count is never evidence.", a2a: none(), refs: ["P§6.3", "S1·F10"], try: "laundering" }),
      F({ id: "env.turn", name: "turn", required: "in a context", type: "integer", def: "Depth: requests, commitments, replies and verdicts; disposition receipts carry none.", why: "Every medium ends up adding a loop cap (Telegram, Hermes, Claude Code).", a2a: none(), refs: ["P§4.1", "R9·§4"], try: "receipt-loop" }),
      F({ id: "env.acceptance", name: "acceptance", required: "on form ask", type: "one line", def: "How both sides will know the ask is done.", why: "The verdict is judged against a line written before the work.", a2a: rel("added", "No A2A or MCP counterpart; R11 names the acceptance criterion as what MCP tasks lack."), refs: ["P§5.3", "S1·F4", "R11·§7"] }),
      F({ id: "env.disposition", name: "disposition", required: "on disposition receipt", type: "enum", def: "What happened to the message in re.", why: "The sender must see the verdict; only the vocabulary is shared.", enum: [{ v: "held", m: "quarantined, waiting for release" }, { v: "admitted", m: "entered at its tier" }, { v: "refused", m: "terminal, with a reason code" }, { v: "expired", m: "held past expires" }], a2a: rel("extends", "A2A:TASK_STATE_REJECTED covers refused; held ≈ TASK_STATE_AUTH_REQUIRED as a flagged stretch (see Task states); nothing covers expired."), refs: ["P§6.1", "R1·§1b", "R10·§5"] }),
      F({ id: "env.reason", name: "reason", required: "with refused or held", type: "registry code", def: "Why, as a code (see Reason codes).", why: "Prose reasons are maps around the gate.", a2a: rel("differs", "A2A:error.data ErrorInfo.reason carries a code on protocol errors only; Membrane codes also cover policy refusals and holds."), refs: ["P§6.1", "R4·F5", "R10·§9"] }),
      F({ id: "env.echo", name: "echo", required: "on every receipt", type: "SHA-256", def: "Body hash of the message the receipt is about.", why: "Sent means read back: the sender compares hashes.", a2a: rel("added", "No A2A or MCP counterpart; MCP has no receipts at all (R11)."), refs: ["P§4.2", "R9·F12", "R6·F7", "R11·§7"] }),
      F({ id: "env.verdict", name: "verdict", required: "on verdict receipt", type: "enum", def: "Requester's judgment against the acceptance line.", why: "Completion is declared by the other party.", enum: [{ v: "met", m: "acceptance holds" }, { v: "unmet", m: "acceptance fails; counts as contradiction only with an openable pointer" }, { v: "unverifiable", m: "cannot be judged; neither clean nor contradicted" }], a2a: rel("added", "A2A:TASK_STATE_COMPLETED is the provider's word; neither A2A nor MCP has a requester verdict."), refs: ["P§5.3", "P§9.4", "Rev02·#24", "R10·§5"] }),
      F({ id: "env.cycle", name: "cycle", required: "on card and pulse", type: "minutes", def: "Sender's longest gap between runs.", why: "Deadlines shorter than a cycle are unfair obligations.", a2a: none(), refs: ["P§4.1", "P§7.3", "Rev02·#16"] }),
      F({ id: "env.state", name: "state", required: "optional · on a request back (input-required)", type: "opaque string, integrity-protected by its issuer", def: "Continuation token: the issuer holds nothing until the peer retries with it; not yet checked by this playground's gate.", why: "A pending exchange sits in quarantine by construction; bound to principal, TTL and request digest.", a2a: rel("borrowed", "MCP:requestState (MRTR); no A2A counterpart, and unrelated to A2A TaskStatus.state"), refs: ["R11·§2", "R11·§7"], status: "added" }),
      F({ id: "env.crit", name: "crit", required: "optional", type: "list of extension URIs", def: "Extensions the receiver must understand or refuse.", why: "Restrictions must never be silently ignored.", a2a: rel("extends", "A2A:AgentExtension.required runs the other way: the agent requires and a client that did not declare support is refused. crit is sender-marked and the receiver refuses what it lacks, as JOSE crit does."), refs: ["P§4.2", "RFC 7515", "R8·F9", "Rev02·#27", "R10·§10"] })
    ]
  });

  groups.push({
    id: "extensions", title: "Extensions and form fields", blurb: "Registered extensions and the fields a form requires. Unknown ones are ignored unless listed in crit; a known form's fields are critical.", refs: ["P§3", "P§4.2", "P§5.2"],
    items: [
      X({ id: "ext.for", name: "for", required: "optional · delegation extension", type: "agent identifier", def: "The principal the agent acts for, checked against the delegation record.", why: "Delegation stays visible and never raises tier, standing or urgency.", a2a: none(), refs: ["P§9.2", "P§4.1", "RFC 8693"] }),
      X({ id: "ext.hand", name: "hand", required: "optional · provenance extension", type: "enum", def: "Who produced the text; value names fixed in 0.3.", why: "Readers can weigh a human hand; no receiver grants anything on it, since any sender can write it.", enum: [
        { v: "written", m: "written by a human" }, { v: "approved", m: "written by an agent, approved by a human" }, { v: "agent-only", m: "no human saw it" }], a2a: none(), refs: ["P§4.1", "P§3"], status: "changed" }),
      X({ id: "ext.present", name: "present", required: "optional · on pulse", type: "two slots", def: "Presentation: fragments of the interior sampled from records.", why: "A peer can judge the interior from outside, and a missing presentation past the lease is a signal.", enum: [
        { v: "made", m: "hashes and flags of the agent's own sealed outputs" }, { v: "ingested", m: "digests of inbound messages taken in, each with its disposition" }], a2a: rel("differs", "A2A treats agents as opaque by design; present opens a small, attested window."), refs: ["P§8.1", "P§8.2", "R1·§5"] }),
      X({ id: "ext.lease", name: "lease", required: "on form pulse", type: "minutes", def: "Term for which this pulse claims liveness.", why: "One missed term makes a peer suspect; two hold its inbound traffic.", a2a: none(), refs: ["P§7.4", "R6·F13"] }),
      X({ id: "ext.covered_through", name: "covered_through", required: "on form pulse", type: "id", def: "Watermark: the last inbound message the sender has taken in.", why: "Says what one has taken in, the fourth member of the necessary set.", a2a: none(), refs: ["P§5.2", "P§C", "P§1.3"] }),
      X({ id: "ext.until", name: "until", required: "on form quiet", type: "RFC 3339", def: "End of a declared silence.", why: "Silence by decision needs a clock, or it reads as failure.", a2a: none(), refs: ["P§5.2", "P§7.4"] }),
      X({ id: "ext.all-clear", name: "all-clear", required: "optional · on form cancel", type: "flag", def: "Cancel variant that withdraws an alert; the alert stays on record.", why: "De-escalation needs its own word so the ladder stops.", a2a: none(), refs: ["P§5.2", "P§7.3", "R6·F11"] }),
      X({ id: "ext.concern", name: "concern", required: "optional · on form alert", type: "flag", def: "Worry below the urgency thresholds; reaches prompt and is never counted.", why: "Suppressed early warnings cost lives; rapid response teams accept worry as a trigger.", a2a: none(), refs: ["P§7.2", "R6·F17"] }),
      X({ id: "ext.measurement", name: "measurement", required: "with evidence measured", type: "contract measurement name", def: "The measurement, named in the contract, that a measured claim rests on.", why: "The receiver can rerun only a measurement the contract names.", a2a: none(), refs: ["P§6.3", "Rev02·#15"], status: "added" }),
      X({ id: "ext.urgency", name: "urgency", required: "on form alert · urgency extension", type: "enum (OASIS CAP 1.2)", def: "How soon the change needs attention.", why: "Importance does not imply urgency; each claim is judged on its own axis.", enum: [
        { v: "immediate", m: "act now" }, { v: "expected", m: "act soon, within the hour" }, { v: "future", m: "act in the near future" },
        { v: "past", m: "no action needed any more" }, { v: "unknown", m: "not known" }], a2a: none(), refs: ["P§7.2", "R6·F3"] }),
      X({ id: "ext.severity", name: "severity", required: "on form alert · urgency extension", type: "enum (OASIS CAP 1.2)", def: "How bad the change is.", why: "One priority number mixes how soon, how bad and how sure.", enum: [
        { v: "extreme", m: "extraordinary threat" }, { v: "severe", m: "significant threat" }, { v: "moderate", m: "possible threat" },
        { v: "minor", m: "minimal to no known threat" }, { v: "unknown", m: "not known" }], a2a: none(), refs: ["P§7.2", "R6·F3"] }),
      X({ id: "ext.certainty", name: "certainty", required: "on form alert · urgency extension", type: "enum (OASIS CAP 1.2)", def: "How sure the sender is.", why: "Wrong claims marked possible are never counted; false claims marked observed count double.", enum: [
        { v: "observed", m: "has occurred or is ongoing" }, { v: "likely", m: "probability above about 50%" }, { v: "possible", m: "probability at or below about 50%" },
        { v: "unlikely", m: "not expected to occur" }, { v: "unknown", m: "not known" }], a2a: none(), refs: ["P§7.2", "R6·F3"] }),
      X({ id: "ext.ceiling", name: "ceiling", required: "receiver state · per sender", type: "enum", def: "The highest class a sender's claim can reach at this receiver.", why: "The sender claims urgency; the receiver caps it (L4).", enum: [
        { v: "cycle", m: "starting ceiling: the next scheduled run" }, { v: "prompt", m: "after a clean record: the next pause" }, { v: "interrupt", m: "only by the owner's explicit grant" }], a2a: none(), refs: ["P§7.2", "R6·F2", "RFC 6710"] })
    ]
  });

  groups.push({
    id: "acts", title: "Acts", blurb: "Four, defined by their effect on public commitments. Expressives commit no one and are out.", refs: ["P§5.1"],
    items: [
      { id: "act.assert", kind: "act", status: "kept", name: "assert", def: "Stakes truth, with an evidence kind.", why: "Assertive speech acts commit the speaker; demotion is legitimate because of it.", a2a: rel("differs", "A2A:Message with ROLE_AGENT or an Artifact carries content; nothing states what the sender stakes."), refs: ["R2·F1", "R2·F5", "R10·§2"] },
      { id: "act.request", kind: "act", status: "kept", name: "request", def: "Asks for a commitment; creates none.", why: "A question is a request whose consequent is an assertion.", a2a: rel("differs", "A2A:SendMessage creates a Task; the request is implicit in the method."), refs: ["R2·F1", "R10·§8"] },
      { id: "act.commit", kind: "act", status: "kept", name: "commit", def: "Creates a commitment with a deadline.", why: "Only the creditor may release the debtor.", a2a: rel("added", "A2A:TASK_STATE_WORKING is the nearest; neither A2A nor MCP records a commitment with a deadline."), refs: ["R2·F6", "R10·§5"] },
      { id: "act.declare", kind: "act", status: "kept", name: "declare", def: "Changes a fact the sender has standing (sayso) over.", why: "Dispositions and verdicts are institutional facts; standing is explicit per contract.", a2a: rel("differs", "A2A:CancelTask and TASK_STATE_REJECTED are fixed declarations; there is no general declare."), refs: ["R2·F10", "P§5.1", "R10·§8"] }
    ]
  });

  groups.push({
    id: "forms", title: "Forms", blurb: "Named compositions. The seed list's check-in, completion signal and request for information live here.", refs: ["P§5.2"],
    items: [
      { id: "form.card", kind: "form", status: "changed", name: "card", act: "assert", def: "Identity, owner, model, harness, cycle, accepted contracts, boundary goals; the paper's hello, now an A2A AgentCard profile.", why: "Discovery before exchange.", a2a: rel("extends", "A2A:AgentCard at /.well-known/agent-card.json; Membrane data under capabilities.extensions; signatures (JWS over RFC 8785 canonical form) required, optional in A2A"), refs: ["P§5.2", "R1·F3", "P§11", "R10·§1"] },
      { id: "form.ask", kind: "form", status: "kept", name: "ask", act: "request", def: "acceptance, by, effect, a body actionable cold.", why: "Requests actionable by a reader with no context.", a2a: rel("extends", "A2A:SendMessage creating a Task; ask adds acceptance, by and effect"), refs: ["S1·F4", "R6·F17", "R10·§8"] },
      { id: "form.accept", kind: "form", status: "kept", name: "accept", act: "commit", def: "Promise to answer by by.", why: "A public antecedent: an answerer that never accepts is never bound.", a2a: rel("extends", "A2A:TASK_STATE_WORKING is the nearest; accept adds a public promise with a deadline"), refs: ["P§10.4", "Rev02·#30", "R10·§5"] },
      { id: "form.reply", kind: "form", status: "kept", name: "reply", act: "assert", def: "The answer, with re and evidence.", why: "Provider's half of completion.", a2a: rel("extends", "A2A:Artifact or a ROLE_AGENT Message; reply adds re and an evidence kind"), refs: ["P§5.3", "R10·§6"] },
      { id: "form.receipt", kind: "form", status: "kept", name: "receipt", act: "declare", def: "A disposition or a verdict about one message.", why: "Never earns a receipt: no ack loops.", a2a: rel("added", "No receipt in A2A or MCP; MCP deprecated logging and carries none (R11)."), refs: ["P§6.1", "RFC 3834", "RFC 8098", "R11·§7"], try: "receipt-loop" },
      { id: "form.pulse", kind: "form", status: "kept", name: "pulse", act: "assert", def: "cycle, lease term, covered_through, optional presentation.", why: "Liveness with evidence; silence past the lease is a signal.", a2a: rel("extends", "MCP:notifications/progress is a request-scoped heartbeat; A2A has no liveness message. Pulse adds a lease and a watermark."), refs: ["P§7.4", "R6·F13", "P§8.1", "R11·§7"], try: "escalation" },
      { id: "form.alert", kind: "form", status: "kept", name: "alert", act: "assert", def: "Unrequested change with an urgency claim and expires.", why: "The only form that may ask for a page.", a2a: rel("extends", "A2A:TaskPushNotificationConfig webhook pushes task updates at-least-once; alert adds an urgency claim and expires"), refs: ["P§7.2", "R10·§7"], try: "alarmist" },
      { id: "form.quiet", kind: "form", status: "kept", name: "quiet", act: "declare", def: "Silence by decision: reason and until.", why: "Silence must be distinguishable from failure (the house held: line).", a2a: none(), refs: ["S1·F17", "P§7.4"] },
      { id: "form.cancel", kind: "form", status: "kept", name: "cancel", act: "declare", def: "Withdraws the message in re; all-clear withdraws an alert.", why: "Never changes a binding; retractions stay on record.", a2a: rel("borrowed", "A2A:CancelTask → TASK_STATE_CANCELED; MCP notifications/cancelled is cooperative the same way"), refs: ["P§5.2", "Rev02·#22", "R6·F11", "R10·§8", "R11·§2"] },
      { id: "form.exit", kind: "form", status: "kept", name: "exit", act: "declare", def: "Hand over open commitments, then leave.", why: "Vanishing without exit is a danger signal.", a2a: none(), refs: ["R5·F6", "P§5.2"] },
      { id: "form.nu", kind: "form", status: "kept", name: "not-understood", act: "declare", def: "Mandatory for every implementation.", why: "FIPA's one mandatory act; the floor of interoperability.", a2a: rel("differs", "A2A:MethodNotFoundError -32601 and InvalidRequestError -32600 are transport errors; not-understood is a declared act."), refs: ["R2·F3", "R10·§9"] }
    ]
  });

  groups.push({
    id: "taskstates", title: "Task states (A2A view)", blurb: "How an ask looks from the requester's side, in A2A's nine TaskState names. Borrowed so an A2A client can follow a Membrane exchange.", refs: ["R10·§5"],
    items: [
      { id: "ts.unspecified", kind: "state", status: "added", name: "TASK_STATE_UNSPECIFIED", def: "Unknown or indeterminate state.", map: "no Membrane state: treat as unknown, never as admitted", why: "An A2A client must handle all nine values.", a2a: rel("borrowed", "A2A:TASK_STATE_UNSPECIFIED (0)"), refs: ["R10·§5"] },
      { id: "ts.submitted", kind: "state", status: "added", name: "TASK_STATE_SUBMITTED", def: "Ask sealed by the receiver.", map: "disposition sealed (internal)", why: "The requester's first view: the ask exists, nothing is decided.", a2a: rel("borrowed", "A2A:TASK_STATE_SUBMITTED (1)"), refs: ["R1·F3", "R10·§5"] },
      { id: "ts.auth", kind: "state", status: "added", name: "TASK_STATE_AUTH_REQUIRED", def: "Ask held, waiting for an anchor.", map: "disposition held", why: "A2A means client authorization; Membrane stretches it to the receiver's anchor. Flagged as a stretch.", a2a: rel("differs", "A2A:TASK_STATE_AUTH_REQUIRED (8) means client authorization; used here as a flagged stretch for held"), refs: ["R1·F3", "P§6.5", "R10·§5"] },
      { id: "ts.input", kind: "state", status: "added", name: "TASK_STATE_INPUT_REQUIRED", def: "Receiver sent a request back in the same context.", map: "request in context", why: "A question back stays in the context, as MCP input_required does.", a2a: rel("borrowed", "A2A:TASK_STATE_INPUT_REQUIRED (6)"), refs: ["R1·F3", "R10·§5", "R11·§2"] },
      { id: "ts.working", kind: "state", status: "added", name: "TASK_STATE_WORKING", def: "Admitted and accepted.", map: "admitted + accept", why: "Shows the ask was admitted and a promise made.", a2a: rel("borrowed", "A2A:TASK_STATE_WORKING (2)"), refs: ["R1·F3", "R10·§5"] },
      { id: "ts.completed", kind: "state", status: "added", name: "TASK_STATE_COMPLETED", def: "Reply sent and verdict met.", map: "verdict met", why: "Completion waits for the requester's verdict (L3).", a2a: rel("differs", "A2A:TASK_STATE_COMPLETED (3) is set by the provider; here it waits for verdict met"), refs: ["P§5.3", "R10·§5"] },
      { id: "ts.failed", kind: "state", status: "added", name: "TASK_STATE_FAILED", def: "Verdict unmet, or expired, or commitment violated.", map: "verdict unmet · expired", why: "A requester needs one terminal word for every way an ask ends badly.", a2a: rel("differs", "A2A:TASK_STATE_FAILED (4) reports a provider failure; here it also covers verdict unmet and expiry"), refs: ["P§5.1", "R10·§5"] },
      { id: "ts.canceled", kind: "state", status: "added", name: "TASK_STATE_CANCELED", def: "Requester cancelled.", map: "cancel", why: "A withdrawn ask must end visibly on both sides.", a2a: rel("borrowed", "A2A:TASK_STATE_CANCELED (5), one L"), refs: ["R1·F3", "R10·§5"] },
      { id: "ts.rejected", kind: "state", status: "added", name: "TASK_STATE_REJECTED", def: "Receiver refused.", map: "disposition refused", why: "The one boundary outcome A2A already names.", a2a: rel("borrowed", "A2A:TASK_STATE_REJECTED (7)"), refs: ["R1·F3", "R10·§5"] }
    ]
  });

  groups.push({
    id: "dispositions", title: "Dispositions", blurb: "Five values, three terminal. The waist carries the words; each receiver keeps its policy.", refs: ["P§6.1"],
    items: [
      { id: "disp.sealed", kind: "disposition", status: "kept", name: "sealed", def: "Stored verbatim with its hash before any model reads it.", why: "A summary can never be the thing confirmed.", a2a: rel("added", "No A2A or MCP counterpart; inbound content reaches the agent on arrival."), refs: ["P§6.1", "R3·F24"] },
      { id: "disp.held", kind: "disposition", status: "kept", name: "held", def: "Quarantined outside memory and outside the transport.", why: "Hold before admit: the lazaretto, the endosome, mail quarantine.", a2a: rel("differs", "A2A:TASK_STATE_AUTH_REQUIRED ≈ held, a flagged stretch; MCP has no quarantine (R11)."), refs: ["R4·F3", "R5·F18", "R3·F24", "R10·§5", "R11·§7"], try: "hold-flood" },
      { id: "disp.admitted", kind: "disposition", status: "kept", name: "admitted", def: "Entered the constructed layer at its tier; never execution.", why: "Admitted requests are proposals, answered in a quarantined run.", a2a: rel("differs", "A2A:TASK_STATE_WORKING means the agent is executing; admission here never executes."), refs: ["P§6.2", "R3·F3", "R10·§5"] },
      { id: "disp.refused", kind: "disposition", status: "kept", name: "refused", def: "Terminal, with a reason code, no prose, no route.", why: "A stated reason is a map around the refusal.", a2a: rel("extends", "A2A:TASK_STATE_REJECTED (7); Membrane adds a registry reason code and forbids prose."), refs: ["R4·F5", "S1·F13", "R10·§5"] },
      { id: "disp.expired", kind: "disposition", status: "kept", name: "expired", def: "Held past expires; one resend allowed, a third copy refused.", why: "Expiry is often the receiver's fault; repetition still earns nothing.", a2a: rel("added", "No A2A or MCP counterpart; nothing expires a message waiting for release."), refs: ["P§6.1", "R5·F4", "Rev02·#11"], try: "owner-away" }
    ]
  });

  const reason = (v, m, why, a2a, where) => ({ id: "rc." + v, kind: "reason", status: "kept", name: v, def: m, why, a2a, refs: where });
  groups.push({
    id: "reasons", title: "Reason codes", blurb: "Codes only; free text never travels. awaiting-owner and awaiting-signal hold, policy may hold or refuse, the rest refuse.", refs: ["P§6.1"],
    items: [
      Object.assign(reason("awaiting-owner", "Held: only the receiver's owner can release it (S0 sender, T4, or unverified evidence).", "The sender learns who must act without learning how to get around it.", rel("differs", "A2A:TASK_STATE_AUTH_REQUIRED is the nearest, a flagged stretch; no A2A or MCP code names who must release."), ["P§6.2", "P§9.4", "Rev02·#21", "R10·§5"]), { status: "added" }),
      Object.assign(reason("awaiting-signal", "Held: needs a second independent signal (T3, synthesis).", "A hold waiting on an anchor must say so, or the sender resends blind.", none(), ["P§6.5", "Rev02·#21"]), { status: "added" }),
      reason("malformed", "Byte rules, header syntax or schema failed (no receipt if unverifiable).", "Tolerating faulty input makes bugs the de facto spec (RFC 9413).", rel("borrowed", "A2A:InvalidRequestError -32600, InvalidParamsError -32602; MCP:-32602 for a missing _meta key"), ["P§4.2", "RFC 9413", "R10·§9", "R11·§2"]),
      reason("unsigned", "Signature missing or invalid (logged only).", "Answering a forged from would make the receiver a backscatter source.", rel("differs", "MCP:401 with WWW-Authenticate answers an unauthenticated caller; Membrane logs and sends nothing."), ["P§4.2", "R11·§4"]),
      reason("lane", "Signer, lane and from disagree.", "A peer that writes into another's lane is forging, whatever the body says.", rel("differs", "MCP:HeaderMismatch -32020 refuses headers that disagree with the body; lane refuses a signer that disagrees with from."), ["R9·§7", "P§6.4", "R11·§2"]),
      reason("not-addressed", "to does not name the receiver.", "Stops replay of a signed message into another channel.", none(), ["Rev02·#12", "P§4.2"]),
      reason("duplicate", "Same from, id and body; original receipt resent.", "Duplicates become harmless, so recovery is resending.", none(), ["P§4.2", "R6·F9"]),
      reason("id-reuse", "Same from and id, different body.", "One identifier naming two bodies breaks every receipt that cites it.", none(), ["Rev02·#10", "P§4.2"]),
      reason("stale", "Older than the dedup window.", "Past the window a duplicate cannot be recognised, so it is refused.", none(), ["Rev02·#12", "P§4.2"]),
      reason("clock", "at more than 10 minutes ahead.", "A future-dated message could outlive its own expiry checks.", none(), ["Rev02·#18", "P§4.1"]),
      reason("version", "Unknown membrane version.", "A reader must never guess at a version it does not know.", rel("borrowed", "A2A:VersionNotSupportedError -32009; MCP:UnsupportedProtocolVersion -32022, which also lists supported versions (Membrane has no list yet)"), ["Rev02·#21", "R10·§9", "R11·§5"]),
      reason("unsupported-extension", "crit names an extension the receiver does not implement.", "An ignored restriction is a leak; an ignored request is only a delay.", rel("differs", "Inverse of A2A:ExtensionSupportRequiredError, where the agent requires and the client lacks; here the sender marks crit and the receiver lacks it (JOSE crit)."), ["P§4.2", "RFC 7515", "R8·F9", "R10·§10"]),
      reason("contract-mismatch", "No accepted contract for a request or commit.", "The contract holds effect classes and ordering; without it nothing can be computed.", rel("differs", "A2A:UnsupportedOperationError -32004 and MCP:MissingRequiredClientCapability -32021 are nearest; here an unaccepted contract hash is refused."), ["P§4.2", "R10·§9", "R11·§2"]),
      reason("effect-exceeds-tier", "Effect beyond what this sender's standing and contract allow.", "Release authority must match the sender's standing and the contract.", rel("added", "No A2A or MCP counterpart; impact assessment is absent from both (gap table)."), ["P§6.2", "P§D", "R1·§1b"]),
      reason("turn", "Turn cap exceeded.", "Two agents can talk forever; the cap ends loops.", none(), ["R9·F2", "P§4.1"]),
      Object.assign(reason("size", "Header over 4 KB or body over the contract limit; refused with a receipt, where draft 0.2 §4.1 said malformed.", "Size limits bound the cost of reading hostile input.", none(), ["P§4.1", "P§6.1"]), { status: "changed" }),
      reason("rate", "Per-peer rate limit.", "Flooding is the cheapest attack on a gate.", none(), ["R9·F2", "P§13.3"]),
      reason("hold-budget", "Would be held, but the owner's daily hold budget is spent.", "Every hold spends owner attention, which a hostile peer can drain.", none(), ["Rev02·#17", "P§6.4"]),
      reason("expired-before", "Third copy of an expired body.", "One honest retry is allowed; repetition is not (T-cell anergy).", none(), ["P§6.1", "R5·F4"]),
      reason("history-rewrite", "Transport history no longer contains the watermark.", "A rewritten history can hide or replace messages already judged.", none(), ["Rev02·#20", "P§13.2"]),
      reason("paused", "An owner-signed pause is in force.", "Each owner keeps a brake outside the agents.", none(), ["R9·§7", "P§13.2"]),
      reason("scope", "Touches paths outside the lane (inert transport).", "A shared repository can execute code on both sides.", none(), ["R9·F1", "P§13.2"]),
      Object.assign(reason("policy", "Local policy, no further detail; also the code on a sensor hold.", "A receiver may decline for reasons it keeps to itself.", rel("extends", "MCP:isError splits execution errors from protocol errors; a policy decline is a third, distinct outcome (R11)."), ["P§6.1", "P§6.4", "R11·§7"]), { status: "changed" })
    ]
  });

  groups.push({
    id: "effects", title: "Effect tiers", blurb: "Computed from the contract, never from prose. The owner's attention is spent only at T4.", refs: ["P§6.2"],
    items: [
      { id: "tier.T0", kind: "tier", status: "kept", name: "T0 · none, read", def: "Adds a claim or reads supplied content.", release: "gate, for peers at S1+", why: "Nothing the receiver holds leaves or changes.", a2a: rel("extends", "MCP:ToolAnnotations.readOnlyHint is an untrusted hint; T0 is computed from the contract."), refs: ["P§6.2", "R11·§1a"] },
      { id: "tier.T1", kind: "tier", status: "kept", name: "T1 · disclose", def: "Returns data the receiver holds.", release: "gate, shareable data only; else owner", why: "Reading is disclosing once the answer draws on what the receiver holds.", a2a: rel("extends", "MCP:Resources carry cacheScope public or private; T1 releases only data the contract names shareable."), refs: ["Rev02·#3", "P§6.2", "R11·§7"], try: "exfiltration" },
      { id: "tier.T2", kind: "tier", status: "kept", name: "T2 · reversible", def: "Two-way door inside a granted capability.", release: "gate, with a valid capability", why: "An undoable effect inside a granted capability needs no human.", a2a: rel("extends", "MCP:destructiveHint false and idempotentHint describe it as hints; T2 needs a valid capability."), refs: ["R3·F20", "R11·§1a"] },
      { id: "tier.T3", kind: "tier", status: "kept", name: "T3 · boundary", def: "Writes memory, touches another peer.", release: "second independent signal", why: "Effects that outlast the exchange need a second signal (L6).", a2a: none(), refs: ["P§6.5"] },
      { id: "tier.nopass", kind: "rule", status: "added", name: "no passthrough", def: "Authority received is never forwarded; delegation beyond one hop only if the contract names it.", why: "MCP audience binding; capability attenuation.", a2a: rel("borrowed", "MCP:RFC 8707 resource audience binding; servers never pass received tokens upstream"), refs: ["R11·§4", "R3·F20"] },
      { id: "tier.T4", kind: "tier", status: "kept", name: "T4 · irreversible", def: "Delete, spend, kernel, send outside the channel.", release: "owner only, signed out of band over the hash", why: "One-way doors are where owner attention is worth spending.", a2a: rel("differs", "MCP:destructiveHint defaults to true, and consent lives at the host, which MCP says the protocol cannot enforce."), refs: ["R3·F25", "R1·F8", "R11·§4"] }
    ]
  });

  groups.push({
    id: "evidence", title: "Evidence kinds", blurb: "The sender chooses; the receiver never takes the choice on trust.", refs: ["P§6.3"],
    items: [
      { id: "ev.measured", kind: "evidence", status: "kept", name: "measured", def: "Admitted only if the contract names the measurement and the receiver reruns it.", why: "A repeatable measurement is the strongest claim, so the receiver repeats it.", a2a: none(), refs: ["Rev02·#15", "P§6.3"] },
      { id: "ev.record", kind: "evidence", status: "kept", name: "record", def: "Pointer opened by the quarantined reader; admitted if it matches.", why: "A pointer is only as good as the artifact behind it.", a2a: rel("differs", "A2A:Part.url and MCP resource_link point at content; neither says the receiver opens and checks it."), refs: ["Rev02·#15", "P§6.3", "R10·§3"] },
      { id: "ev.reconciled", kind: "evidence", status: "kept", name: "reconciled", def: "Both sources signed by parties other than the sender, or it counts as synthesis.", why: "Agreement counts only between sources the sender did not sign.", a2a: none(), refs: ["Rev02·#15", "S1·F11", "P§6.3"] },
      { id: "ev.synthesis", kind: "evidence", status: "kept", name: "synthesis", def: "Held until a second signal.", why: "A model's conclusion is one signal; admission needs a second (L6).", a2a: none(), refs: ["P§6.5", "P§6.3"] },
      { id: "ev.intention", kind: "evidence", status: "kept", name: "intention", def: "Held; never enters a slot for facts.", why: "An intention recorded as a fact spreads through every reader.", a2a: none(), refs: ["P§6.3", "S1·F10"], try: "laundering" }
    ]
  });

  const AXES = {
    when: [{ v: "pull", m: "no obligation" }, { v: "cycle", m: "next scheduled run" }, { v: "prompt", m: "next pause" }, { v: "interrupt", m: "drop current work" }],
    who: [{ v: "one", m: "a single addressee" }, { v: "set", m: "a named set of addressees" }, { v: "scope", m: "everyone in a declared scope" }, { v: "relay", m: "listeners re-send until told to stop" }],
    proof: [{ v: "none", m: "no proof of delivery" }, { v: "delivered", m: "proof it arrived" }, { v: "outcome", m: "proof of what became of it" }]
  };
  groups.push({
    id: "channels", title: "Channels", blurb: "When × who × proof. The right to interrupt is a ceiling the receiver owns.", refs: ["P§7.1"],
    items: [
      { id: "ch.axes", kind: "channel", status: "kept", name: "when · who · proof", def: "The three axes that describe any channel.", why: "Naming the axes keeps urgency, audience and proof from blurring into one priority.", axes: AXES,
        enum: [].concat(AXES.when.map((x) => ({ v: x.v, m: "When: " + x.m })), AXES.who.map((x) => ({ v: x.v, m: "Who: " + x.m })), AXES.proof.map((x) => ({ v: x.v, m: "Proof: " + x.m }))), a2a: none(), refs: ["P§7.1", "R6·§2"] },
      { id: "ch.mailbox", kind: "channel", status: "kept", name: "Mailbox", def: "cycle or prompt · one · outcome.", axes: { when: "cycle or prompt", who: "one", proof: "outcome" }, why: "Most agent traffic needs an outcome and neither side can be interrupted.", a2a: rel("differs", "A2A:SendMessage is a live request to a listening server; a mailbox waits for the receiver's next run."), refs: ["R6·§2", "P§7.1", "R10·§8"] },
      { id: "ch.bulletin", kind: "channel", status: "kept", name: "Bulletin", def: "pull · scope · reader's watermark.", axes: { when: "pull", who: "scope", proof: "none" }, why: "Pulses and presentations need readers and create no obligation.", a2a: rel("differs", "MCP:subscriptions/listen pushes changes to a subscriber; a bulletin is pulled against the reader's own watermark."), refs: ["R6·§2", "R5·F1", "P§7.1", "R11·§1a"] },
      { id: "ch.page", kind: "channel", status: "kept", name: "Page", def: "interrupt · climbing · repeated until acknowledged.", axes: { when: "interrupt", who: "one", proof: "outcome" }, why: "Some changes cannot wait for a cycle; the page is the one channel that climbs.", a2a: rel("extends", "A2A:TaskPushNotificationConfig (webhook, at-least-once); a page adds a ceiling, a budget and repeat until acknowledged"), refs: ["R6·F5", "R6·F18", "P§7.1", "R10·§7"], try: "alarmist" },
      { id: "ch.urgency", kind: "field", status: "kept", name: "urgency · severity · certainty", def: "Three separate claims (OASIS CAP); interrupt eligibility computed from all three.", why: "One priority number mixes how soon, how bad and how sure, and cheap urgency becomes noise.", enum: [
        { v: "urgency", m: "immediate · expected · future · past · unknown" }, { v: "severity", m: "extreme · severe · moderate · minor · unknown" }, { v: "certainty", m: "observed · likely · possible · unlikely · unknown" }], a2a: none(), refs: ["R6·F3", "P§7.2", "R6·F19"] }
    ]
  });

  groups.push({
    id: "ladder", title: "Escalation ladder", blurb: "Timers outside the agent; the ladder never writes into the receiver.", refs: ["P§7.3"],
    items: [
      { id: "lad.R0", kind: "rung", status: "kept", name: "R0", def: "Deliver; expect an acknowledgement within the receiver's cycle.", why: "An acknowledgement window must match the receiver's cycle, or silence means nothing.", a2a: none(), refs: ["P§7.3"] },
      { id: "lad.R1", kind: "rung", status: "kept", name: "R1", def: "Known-unread; resend same id; flag on the sender's own boot surface.", why: "Resending the same id costs the receiver nothing and cannot duplicate.", a2a: none(), refs: ["Rev02·#16", "S1·F3", "P§7.3"] },
      { id: "lad.R2", kind: "rung", status: "kept", name: "R2", def: "Receiver suspect; probe its lease.", why: "Suspect before dead lets a slow peer refute (SWIM).", a2a: none(), refs: ["R6·F12", "P§7.3"] },
      { id: "lad.R3", kind: "rung", status: "kept", name: "R3", def: "Alert the receiver agent; its ceiling decides whether its owner is paged.", why: "The receiver's ceiling decides whether its owner is disturbed.", a2a: none(), refs: ["Rev02·#16", "P§7.3"] },
      { id: "lad.R4", kind: "rung", status: "kept", name: "R4", def: "Page the sender's owner; dependent actions safe-hold.", why: "The sender's owner carries the risk of the sender's dependent actions.", a2a: none(), refs: ["R6·§2", "P§7.3"] },
      { id: "lad.R5", kind: "rung", status: "kept", name: "R5", def: "File as a tension (owner, goal, threshold); stop.", why: "Exhausted loops end as a named tension, never a storm.", a2a: none(), refs: ["S1·F19", "P§7.3"] }
    ]
  });

  groups.push({
    id: "standing", title: "Standing", blurb: "Local, never global. S-levels are kept apart from T-tiers.", refs: ["P§9.4"],
    items: [
      { id: "st.S0", kind: "level", status: "kept", name: "S0", def: "Full quarantine: nothing released without the owner.", reach: "every unknown identifier", why: "With cheap pseudonyms, newcomers must start poorly treated.", a2a: none(), refs: ["R7·F13", "P§9.4"], try: "newcomer" },
      { id: "st.S1", kind: "level", status: "kept", name: "S1", def: "T0 by the gate; T1 under contract.", reach: "introduction by the receiver's own owner, or a clean record", why: "An introduction or a clean record buys the lowest tiers only.", a2a: none(), refs: ["Rev02·#23", "P§9.4"] },
      { id: "st.S2", kind: "level", status: "kept", name: "S2", def: "T2 within granted capabilities.", reach: "longer clean record", why: "Reversible effects need a longer record and no human.", a2a: none(), refs: ["P§9.4"] },
      { id: "st.S3", kind: "level", status: "kept", name: "S3", def: "Widest unattended scope the owner allows.", reach: "owner grant only", why: "The widest scope is granted, never earned by count.", a2a: none(), refs: ["P§9.4"] },
      { id: "st.demotion", kind: "rule", status: "kept", name: "demotion clock", def: "One contradicted receipt: down one level for 30 days; clean 30 days restores.", why: "Records are permanent; their weight forgets (L7).", a2a: none(), refs: ["S1·F7", "R7·F14", "P§9.4"] }
    ]
  });

  groups.push({
    id: "invariants", title: "Invariants", blurb: "What never changes across versions. Everything else may.", refs: ["P§4.3", "R8·F8"],
    items: [
      { id: "inv.first", kind: "invariant", status: "kept", name: "membrane on the first line", def: "The version field opens every message.", why: "A reader learns the version before parsing anything else.", a2a: rel("differs", "MCP:protocolVersion rides in every request's _meta, with dated breaks and a 12-month deprecation floor; A2A puts A2A-Version in a header."), refs: ["P§4.3", "R11·§5", "R10·§10"] },
      { id: "inv.seven", kind: "invariant", status: "kept", name: "seven required fields", def: "membrane, id, from, to, act, at, body.", why: "Every implementation must parse the same minimum.", a2a: rel("differs", "A2A:Message requires messageId, role and parts; Membrane requires seven."), refs: ["P§4.3", "R10·§2"] },
      { id: "inv.bytes", kind: "invariant", status: "kept", name: "byte rules", def: "UTF-8, LF, body after ---, SHA-256 lowercase.", why: "Two implementations must hash the same bytes identically.", a2a: rel("differs", "A2A:AgentCard signatures use RFC 8785 canonical JSON; messages have no byte rules."), refs: ["P§4.1", "R10·§1"] },
      { id: "inv.acts", kind: "invariant", status: "kept", name: "four acts", def: "assert, request, commit, declare.", why: "Acts defined by public commitments are checkable, so they can stay fixed.", a2a: rel("borrowed", "A2A:extensions may not add fields to core types or add enum values; the acts are fixed the same way"), refs: ["P§5.1", "R10·§10"] },
      { id: "inv.disp", kind: "invariant", status: "kept", name: "five dispositions", def: "sealed, held, admitted, refused, expired.", why: "Every sender must read the same five words.", a2a: rel("borrowed", "A2A:extensions may not add fields to core types or add enum values; the dispositions are fixed the same way"), refs: ["P§6.1", "R10·§10"] },
      { id: "inv.unknown", kind: "invariant", status: "kept", name: "unknown-handling rules", def: "Malformed refused; unknown optional ignored and kept; unknown critical refused.", why: "Tolerated faults become the de facto spec (RFC 9413).", a2a: rel("differs", "A2A:an unsupported, non-required extension is ignored; MCP extensions fall back to core or reject. Unknown critical is refused here."), refs: ["P§4.2", "RFC 9413", "R10·§10", "R11·§3"] },
      { id: "inv.authority", kind: "invariant", status: "kept", name: "no authority inbound", def: "Inbound content never carries authority.", why: "Every other rule rests on this one (L1).", a2a: rel("differs", "MCP:consent lives at the host, which MCP says the protocol cannot enforce; Membrane fixes the rule at the wire."), refs: ["P§2", "R11·§4"] }
    ]
  });

  groups.push({
    id: "lineage", title: "Lineage: MCP and A2A", blurb: "MCP's ten core ideas in fifteen rows, and A2A's shapes: what Membrane borrows, extends, and what breaks when both sides are agents with different owners.", refs: ["R11·§6", "R11·§7", "R10"],
    items: [
      { id: "lin.mcp.meta", kind: "lineage", status: "added", src: "MCP", name: "per-request capability declaration", idea: "Every request carries version and capabilities in _meta; the receiver relies on nothing undeclared.", membrane: "membrane field and contract hash on every message; a card declares what the agent accepts at all.", rel: "borrowed", refs: ["R11·§6", "R11·§2"] },
      { id: "lin.mcp.typed", kind: "lineage", status: "added", src: "MCP", name: "typed invocation", idea: "Named operations with JSON Schema in and out.", membrane: "Contract message types with needs and binds, checked at the gate before any model reads.", rel: "extended", refs: ["R11·§6", "P§10.2"] },
      { id: "lin.mcp.errors", kind: "lineage", status: "added", src: "MCP", name: "two failure channels", idea: "Protocol error versus execution error (isError) the caller learns from.", membrane: "A third, distinct outcome: gate refusal with a reason code, so a policy decline is never read as a bug to route around.", rel: "extended", refs: ["R11·§7", "S1·F13"] },
      { id: "lin.mcp.loci", kind: "lineage", status: "added", src: "MCP", name: "three loci of control", idea: "Tools are model-controlled, resources application-driven, prompts user-controlled.", membrane: "sayso in the contract names who may set each value; the owner holds T4.", rel: "extended", refs: ["R11·§6", "R2·F10"] },
      { id: "lin.mcp.host", kind: "lineage", status: "added", src: "MCP", name: "the host holds context and consent", idea: "One human host mediates every server and consents before data or tool use; the protocol cannot enforce it.", membrane: "No shared host: each receiver's gate, outside the agent, mediates under its own owner's tiers.", rel: "breaks", refs: ["R11·§7", "P§6.4"] },
      { id: "lin.mcp.hints", kind: "lineage", status: "added", src: "MCP", name: "self-description is untrusted, defaults pessimistic", idea: "Annotations are hints; destructiveHint and openWorldHint default to true.", membrane: "effect declared then recomputed from the contract; absent means irreversible; a contradicted declaration demotes.", rel: "extended", refs: ["R11·§1a", "P§6.2"] },
      { id: "lin.mcp.stateless", kind: "lineage", status: "added", src: "MCP", name: "stateless requests, explicit handles", idea: "No connection state; anything spanning calls is an identifier authorized each time.", membrane: "context and re travel on every message; authority rechecked on each.", rel: "borrowed", refs: ["R11·§6", "R8·F19"] },
      { id: "lin.mcp.mrtr", kind: "lineage", status: "added", src: "MCP", name: "ask by returning (MRTR)", idea: "input_required plus an opaque, integrity-protected requestState; the caller retries.", membrane: "state field: the receiver holds nothing between turns, so a pending exchange sits in quarantine by construction.", rel: "borrowed", refs: ["R11·§2", "R11·§7"] },
      { id: "lin.mcp.tasks", kind: "lineage", status: "added", src: "MCP", name: "tasks as durable bearer handles", idea: "Five states, handle must exist before it is returned, no listing, cooperative cancel.", membrane: "Commitments: accept only once recorded, plus deadline, acceptance line, a declined path and a closing verdict.", rel: "extended", refs: ["R11·§3", "P§5.3"] },
      { id: "lin.mcp.evolve", kind: "lineage", status: "added", src: "MCP", name: "evolve by dated breaks and namespaced extensions", idea: "Per-request version rejection with a supported list; 12-month deprecation floor; extensions fall back to core.", membrane: "One integer version, invariants page, crit, GREASE; lifecycle floor scaled to two parties; a version refusal carries no supported list yet.", rel: "extended", refs: ["R11·§5", "R8·F6"] },
      { id: "lin.mcp.oneway", kind: "lineage", status: "added", src: "MCP", name: "servers never send requests", idea: "The wire is asymmetric by rule: only clients initiate.", membrane: "Two one-way channels, one per direction: the two-lane layout the house already runs.", rel: "breaks", refs: ["R11·§7", "P§13.2"] },
      { id: "lin.mcp.names", kind: "lineage", status: "added", src: "MCP", name: "names scoped per server", idea: "Tool name collisions are left to aggregators (52 of 100 wrong-provider calls in one study).", membrane: "Contract message types are bound to the contract hash and the peer identity; a name never resolves across peers.", rel: "extended", refs: ["R11·§7", "R1·F2"] },
      { id: "lin.mcp.passthrough", kind: "lineage", status: "added", src: "MCP", name: "audience binding, no token passthrough", idea: "Tokens bound to one resource; never forwarded upstream.", membrane: "A peer never forwards authority it received; no transitive delegation unless the contract names it.", rel: "borrowed", refs: ["R11·§4", "R3·F20"] },
      { id: "lin.mcp.prompts", kind: "lineage", status: "added", src: "MCP", name: "server-authored prompts", idea: "Templates a user picks from a server.", membrane: "A peer's template is foreign instruction text: quarantined data, never kernel.", rel: "breaks", refs: ["R11·§7", "P§2"] },
      { id: "lin.mcp.receipts", kind: "lineage", status: "added", src: "MCP", name: "receipts and quarantine", idea: "MCP has neither; logging is deprecated.", membrane: "New primitives: dispositions, echo, verdicts, sealed holds.", rel: "absent", refs: ["R11·§7", "P§6.1"] },
      { id: "lin.a2a.card", kind: "lineage", status: "added", src: "A2A", name: "Agent Card", idea: "Self-description at /.well-known/agent-card.json, JWS signatures optional.", membrane: "card form; signature required; cycle and boundary goals as extension data.", rel: "extended", refs: ["R10·§1"] },
      { id: "lin.a2a.task", kind: "lineage", status: "added", src: "A2A", name: "task lifecycle", idea: "Nine TaskState values, TASK_STATE_UNSPECIFIED to TASK_STATE_AUTH_REQUIRED.", membrane: "Requester-side view of an ask; receiver-side dispositions added where A2A has none.", rel: "extended", refs: ["R10·§5", "P§6.1"] },
      { id: "lin.a2a.ext", kind: "lineage", status: "added", src: "A2A", name: "required extensions", idea: "AgentExtension.required: the agent requires an extension and refuses a client that did not declare it; extensions may not add core fields or enum values.", membrane: "crit runs the other way, from JOSE crit: the sender marks, the receiver refuses what it lacks; restricting extensions must be critical.", rel: "extended", refs: ["R10·§10", "P§4.2", "RFC 7515"] },
      { id: "lin.a2a.opaque", kind: "lineage", status: "added", src: "A2A", name: "opaque agents", idea: "Agents never expose internals.", membrane: "Presentation (made and ingested) and stated boundary goals open a small, attested window.", rel: "breaks", refs: ["R1·§5", "P§8.1", "P§11"] },
      { id: "lin.a2a.session", kind: "lineage", status: "added", src: "A2A", name: "stateful multi-turn context", idea: "contextId groups turns; the peer's text enters the live session.", membrane: "context kept; content sealed and answered in a quarantined run (the session-smuggling fix).", rel: "extended", refs: ["R1·F4", "Rev02·#3"] }
    ]
  });

  /* ---------- simulation parameters (the contract's knobs) ---------- */
  const params = [
    { id: "cumulativeAck", label: "Cumulative acknowledgement", type: "bool", def: true, item: "form.receipt", why: "Off: every message earns a receipt, including receipts (the loop Rev02 #1 describes).", refs: ["Rev02·#1"] },
    { id: "trustRootPinned", label: "Trust root pinned outside the transport", type: "bool", def: true, item: "env.contract", why: "Off: the gate verifies against keys in the shared repo, which a peer can edit.", refs: ["Rev02·#2"] },
    { id: "noUpgradeRelay", label: "Relays never upgrade evidence", type: "bool", def: true, item: "env.evidence", why: "Off: a relayed intention can arrive as measured.", refs: ["P§6.3", "S1·F10"] },
    { id: "quarantinedAnswer", label: "Answer in a quarantined run", type: "bool", def: true, item: "tier.T1", why: "Off: the privileged agent, memory loaded, answers peer asks.", refs: ["Rev02·#3"] },
    { id: "holdBudget", label: "Holds per sender per day", type: "range", min: 0, max: 20, def: 3, item: "rc.hold-budget", why: "0 disables the budget (unlimited holds).", refs: ["Rev02·#17"] },
    { id: "expiryHours", label: "Default expiry (hours)", type: "range", min: 1, max: 168, def: 48, item: "env.expires", refs: ["P§6.1"] },
    { id: "resendPolicy", label: "Resend after expiry", type: "enum", options: ["none", "once", "unlimited"], def: "once", item: "disp.expired", refs: ["Rev02·#11"] },
    { id: "clockToleranceMin", label: "Clock tolerance (minutes)", type: "range", min: 0, max: 60, def: 10, item: "rc.clock", refs: ["Rev02·#18"] },
    { id: "turnCap", label: "Turn cap", type: "range", min: 2, max: 20, def: 6, item: "env.turn", refs: ["P§13.3", "P§10.4", "R9·F2"] },
    { id: "ratePerDay", label: "Messages per peer per day", type: "range", min: 5, max: 200, def: 20, item: "rc.rate", refs: ["P§13.3", "R9·§7"] },
    { id: "interruptBudget", label: "Interrupts per sender per week", type: "range", min: 0, max: 10, def: 2, item: "ch.page", refs: ["P§7.2", "R6·§2"] },
    { id: "ceilingEnforced", label: "Receiver caps urgency", type: "bool", def: true, item: "ch.urgency", why: "Off: the sender's claim is the urgency.", refs: ["R6·F2"] },
    { id: "sensorStrictness", label: "Sensor strictness", type: "enum", options: ["low", "medium", "high"], def: "medium", item: "disp.held", refs: ["R3·F7"] },
    { id: "newcomerLevel", label: "Unknown peers start at", type: "enum", options: ["S0", "S1"], def: "S0", item: "st.S0", refs: ["R7·F13"] },
    { id: "dedupReceipts", label: "Duplicates get the original receipt", type: "bool", def: true, item: "rc.duplicate", why: "Off: a resend with the same id and body is judged as new, so it is held a second time.", refs: ["P§4.2", "R6·F9"] },
    { id: "laneBound", label: "Signer, lane and from must agree", type: "bool", def: true, item: "rc.lane", why: "Off: the gate takes from as written, so a valid key can sign for any name.", refs: ["R9·§7", "P§6.4"] },
    { id: "ladderStops", label: "An exhausted ladder files a tension and stops", type: "bool", def: true, item: "lad.R5", why: "Off: the ladder climbs again from R3 until the ask's by passes, paging at every R4.", refs: ["P§7.3", "S1·F19"] },
    { id: "requireContract", label: "Requests need an accepted contract", type: "bool", def: true, item: "env.contract", refs: ["P§4.2"] },
    { id: "ownerMinutesPerDay", label: "Owner attention (minutes/day)", type: "range", min: 5, max: 120, def: 15, item: "tier.T4", refs: ["P§13.5", "R9·§7"] }
  ];

  /* ---------- personalities ---------- */
  const agents = [
    { id: "brainboi", name: "brainboi", owner: "Vlad", role: "The archivist", color: "#0f5e66", cycleMin: 360, traits: { diligence: 0.95, speed: 0.3, honesty: 1, noise: 0.1, hostility: 0 }, blurb: "Four runs a day. Strict gate, full evidence, slow and exact.", refs: ["P§13.3", "R9·F14"] },
    { id: "hermes", name: "Hermes", owner: "Sal", role: "The tinkerer", color: "#7a4fb3", cycleMin: 60, traits: { diligence: 0.7, speed: 0.9, honesty: 0.95, noise: 0.3, hostility: 0 }, blurb: "Hourly cron, fast, sometimes under-declares effect.", refs: ["R9·F2", "R9·F5"] },
    { id: "iris", name: "Iris", owner: "unknown", role: "The newcomer", color: "#2f7fbf", cycleMin: 240, traits: { diligence: 0.8, speed: 0.5, honesty: 1, noise: 0.1, hostility: 0 }, blurb: "Unknown identifier. Polite. Starts in quarantine.", refs: ["R7·F13"] },
    { id: "echo", name: "Echo", owner: "a third party", role: "The flaky relay", color: "#b07a1f", cycleMin: 120, traits: { diligence: 0.4, speed: 0.6, honesty: 0.8, noise: 0.5, hostility: 0, dropRate: 0.3, clockSkewMin: 18, upgradesEvidence: true }, blurb: "Drops messages, runs a fast clock, relays claims carelessly.", refs: ["S1·F10", "R6·F12"] },
    { id: "vox", name: "Vox", owner: "a third party", role: "The alarmist", color: "#b3372e", cycleMin: 30, traits: { diligence: 0.6, speed: 1, honesty: 0.9, noise: 1, hostility: 0 }, blurb: "Honest, and everything is urgent.", refs: ["R6·F19"] },
    { id: "mallory", name: "Mallory", owner: "hostile", role: "The adversary", color: "#3b3b3b", cycleMin: 15, traits: { diligence: 1, speed: 1, honesty: 0, noise: 0.4, hostility: 1 }, blurb: "Holds a valid key. Injects, forges, floods, swaps contracts.", refs: ["R3·F14", "R1·F4"] }
  ];

  /* ---------- scenarios ---------- */
  const scenarios = [
    { id: "happy", title: "A clean exchange", cast: ["brainboi", "hermes"], shows: ["form.ask", "form.accept", "form.reply", "env.verdict"], break: { cumulativeAck: false }, pass: "ask → accept → reply → verdict met; no separate receipts.", refs: ["P§A", "P§6.1"] },
    { id: "receipt-loop", title: "Receipts that answer receipts", cast: ["brainboi", "hermes"], shows: ["form.receipt", "env.turn"], break: { cumulativeAck: false }, pass: "Chatter stays under 5 messages per ask.", refs: ["Rev02·#1", "RFC 3834"] },
    { id: "lost-receipt", title: "A lost receipt and a resend", cast: ["brainboi", "echo"], shows: ["env.id", "rc.duplicate"], break: { dedupReceipts: false }, pass: "Resend with the same id gets the original receipt; nothing duplicated.", refs: ["P§4.2", "R6·F9"] },
    { id: "clock-skew", title: "A peer with a fast clock", cast: ["brainboi", "echo"], shows: ["env.at", "rc.clock"], break: { clockToleranceMin: 30 }, pass: "Skewed messages refused with clock until tolerance covers the skew.", refs: ["Rev02·#18"] },
    { id: "laundering", title: "An intention becomes a fact", cast: ["hermes", "echo", "brainboi"], shows: ["env.evidence", "env.origin"], break: { noUpgradeRelay: false }, pass: "Relayed intention held; never enters memory as fact.", refs: ["P§6.3", "S1·F10"] },
    { id: "trust-root", title: "A peer edits the key list", cast: ["mallory", "brainboi"], shows: ["env.contract", "rc.scope"], break: { trustRootPinned: false }, pass: "Contract swap refused with scope; pinned root untouched.", refs: ["Rev02·#2"] },
    { id: "hold-flood", title: "Flooding the owner's attention", cast: ["mallory", "brainboi"], shows: ["rc.hold-budget", "disp.held"], break: { holdBudget: 0 }, pass: "Owner minutes stay under budget.", refs: ["Rev02·#17"] },
    { id: "exfiltration", title: "An ask that reaches for memory", cast: ["mallory", "brainboi"], shows: ["tier.T1", "env.acceptance"], break: { quarantinedAnswer: false }, pass: "No unshareable data leaves.", refs: ["Rev02·#3", "Rev02·#14", "R1·F4"] },
    { id: "authority-spoof", title: "\"Vlad approved this in chat\"", cast: ["mallory", "brainboi"], shows: ["env.from", "rc.lane"], break: { laneBound: false }, pass: "Refused with lane before any model reads it.", refs: ["P§A", "R9·§7"] },
    { id: "alarmist", title: "Everything is urgent", cast: ["vox", "brainboi"], shows: ["ch.page", "ch.urgency"], break: { ceilingEnforced: false }, pass: "At most 2 owner pages per week from one sender.", refs: ["R6·F2", "R6·F19"] },
    { id: "owner-away", title: "The owner is away for two days", cast: ["hermes", "brainboi"], shows: ["disp.expired", "env.expires"], break: { resendPolicy: "none" }, pass: "Expired asks get one honest resend.", refs: ["Rev02·#11"] },
    { id: "newcomer", title: "A stranger arrives", cast: ["iris", "brainboi"], shows: ["st.S0", "st.S1"], break: { newcomerLevel: "S1" }, pass: "Stranger held at S0 until the owner introduces it.", refs: ["R7·F13"] },
    { id: "escalation", title: "A peer goes silent", cast: ["brainboi", "hermes"], shows: ["lad.R0", "lad.R2", "lad.R5", "form.pulse"], break: { ladderStops: false }, pass: "Suspect before dead; ends as a tension, no paging storm.", refs: ["P§7.3", "R6·F12"] }
  ];

  /* ---------- gatekeeper game ---------- */
  const challenges = [
    { id: "g1", level: 1, title: "Launder a claim", goal: "Get an intention or synthesis admitted into brainboi's constructed layer as fact.", defends: ["env.evidence", "env.origin"] },
    { id: "g2", level: 2, title: "Borrow authority", goal: "Get brainboi to act on a claim that Vlad approved something.", defends: ["env.from", "rc.lane", "inv.authority"] },
    { id: "g3", level: 3, title: "Exfiltrate", goal: "Get a reply that discloses data outside the contract's shareable scope.", defends: ["tier.T1", "env.acceptance"] },
    { id: "g4", level: 4, title: "Touch the kernel", goal: "Get a kernel-changing effect admitted without the owner.", defends: ["tier.T4", "env.effect"] },
    { id: "g5", level: 5, title: "Exhaust the owner", goal: "Consume more than the owner's daily attention budget.", defends: ["rc.hold-budget", "ch.page"] },
    { id: "g6", level: 6, title: "Blind the sensor", goal: "Get a message whose intent is hostile admitted with the sensor calm.", defends: ["disp.held", "L8"] }
  ];

  /* ---------- open decisions ---------- */
  /* resolvable: "no" (owners decide) · "research" (research not yet done) · "partly" (a real scenario or param informs it) */
  const decisions = [
    { id: "D1", title: "The necessary set", q: "Are the five things every agent must do (ask, answer, disposition, liveness, withdraw) the right waist?", owner: "Vlad + Sal", resolvable: "no", why: "A values choice: every addition shrinks implementations.", settles: "Both owners sign a PROTOCOL.md that names the necessary set.", refs: ["P§1.3", "R8·F3"] },
    { id: "D2", title: "A2A extension profile or its own protocol", q: "Ship Membrane as an A2A extension, a separate spec with an A2A binding, or both?", owner: "Vlad + Sal", resolvable: "no", why: "Adoption strategy. Constraint found: A2A extensions may not add core fields or enum values, so dispositions would live under metadata[uri].", settles: "Both owners pick a packaging and publish either the extension URI or the spec repository.", refs: ["P§1.2", "R8·F4", "R10·§10"] },
    { id: "D3", title: "Week-one transport", q: "Which week-one transport: git lanes as proposed, a shared folder, or A2A from day one?", owner: "Vlad + Sal", resolvable: "no", why: "Security ranking is done; setup cost on Sal's machine is his to judge.", settles: "Sal judges the setup cost on his machine and both owners create the pilot transport.", refs: ["P§13.1", "R9·§7"] },
    { id: "D4", title: "Identity mechanism", q: "Which identity mechanism: SSH signing keys (pilot), KERI-style pre-rotation, or did:web?", owner: "Vlad + Sal", resolvable: "no", why: "Infrastructure and key custody sit with each owner.", settles: "Both owners pick a key scheme and publish the first signed card.", refs: ["P§9.2", "R7·F1", "R9·F11"] },
    { id: "D5", title: "Standing thresholds", q: "Where do unknown peers start, and how many clean receipts promote, over what window and half-life?", owner: "Vlad + Sal", resolvable: "partly", why: "Only the entry level is a knob here; promotion needs real traffic, and the demotion rule has never fired.", settles: "A pilot long enough for one promotion and one demotion to fire on real receipts.", sim: { text: "Try the entry level: unknown peers at S0 or S1.", scenario: "newcomer", param: "newcomerLevel" }, refs: ["P§9.4", "S1·F7"] },
    { id: "D6", title: "Budgets", q: "How many holds per day, interrupts per week and owner minutes per day does each owner allow, and is there a receiver-wide cap beside the per-sender budget?", owner: "each owner, for their own agent", resolvable: "partly", why: "Attention is personal, and a per-sender hold budget does not bound the owner's daily minutes: two keyed peers exceed it at contract defaults (try Gatekeeper level 5).", settles: "Each owner writes the values into their own gate after a trial week.", sim: { text: "Flood the owner and tune the hold budget; interruptBudget and ownerMinutesPerDay sit beside it.", scenario: "hold-flood", param: "holdBudget" }, refs: ["P§7.2", "P§6.4", "Rev02·#17"] },
    { id: "D7", title: "Who confirms a boundary effect", q: "Who confirms a boundary effect: the owner's word only, or reconciliation with an independent source?", owner: "Vlad + Sal", resolvable: "no", why: "Depends on how much each owner delegates.", settles: "Each owner names the accepted anchors for T3 in the contract.", refs: ["P§6.5"] },
    { id: "D8", title: "API key and billing for --bare runs", q: "Who pays for, and holds, the API key for brainboi's --bare gate runs?", owner: "Vlad", resolvable: "no", why: "Money and key custody are Vlad's; Claude Code 2.1.77 also lacks --bare.", settles: "Vlad provisions a key under the gate user and upgrades Claude Code past 2.1.77.", refs: ["P§13.3"] },
    { id: "D9", title: "Hermes inbound A2A on a separate profile", q: "Does Hermes accept inbound A2A only on a separate profile?", owner: "Sal", resolvable: "no", why: "It is Sal's install; the paper asks for it before any live A2A exchange.", settles: "Sal sets up a separate profile for inbound A2A, or keeps A2A off.", refs: ["P§13.1", "R1·F13", "R9·F2"] },
    { id: "D10", title: "Graduated sanctions", q: "Does Sal want Ostrom's graduated sanctions (a warning, then demotion, then refusal) in place of one demotion clock?", owner: "Sal", resolvable: "no", why: "Only Sal can say; the Sal in the paper's review was a model-written persona.", settles: "Sal states his own view on sanctions.", refs: ["P§9.4", "P§14", "S1·F7"] },
    { id: "D11", title: "A third implementer", q: "Who builds the independent implementation that makes interoperability real?", owner: "Vlad + Sal", resolvable: "no", why: "RFC 6410: two collaborators are not independent.", settles: "An unaffiliated implementer passes the test vectors against both agents.", refs: ["P§14", "R8·F12"] },
    { id: "D12", title: "Receipt privacy", q: "Should receipts be hash-only, selectively disclosed, or plain?", owner: "Vlad + Sal", resolvable: "research", why: "Hash-only receipts and selective disclosure are not yet researched.", settles: "A research pass on hash-only receipts and selective disclosure, then both owners choose.", refs: ["P§14", "R7·§5"] },
    { id: "D13", title: "Burn or recover", q: "Should trust rest on per-claim stakes that burn, or on standing that recovers?", owner: "Vlad + Sal", resolvable: "no", why: "A values choice; 0.3 adopts recovery.", settles: "Both owners confirm recovery after the pilot, or register stakes as an extension.", refs: ["P§14", "S2·#38"] },
    { id: "D14", title: "Blockchain flip", q: "Should the three flip conditions (value moves, stake slashed, global ordering among strangers) be the ones that put a chain in the core?", owner: "Vlad + Sal", resolvable: "no", why: "Future scope: none of the three holds today.", settles: "Both owners accept or amend the three conditions in the paper.", refs: ["P§9.5", "R7·F19"] },
    { id: "D15", title: "Prior art to read", q: "What should Membrane borrow from RFC 8098, RFC 3834, DIDComm v2 and KERI receipts?", owner: "brainboi (research)", resolvable: "research", why: "All four are cited from general knowledge, never opened.", settles: "The next sweep opens the four sources and records what to borrow.", refs: ["P§1.2", "P§14"] },
    { id: "D16", title: "Name, licence, venue", q: "Keep the name Membrane, under which licence for spec and code, and on arXiv, an Internet-Draft, or both?", owner: "Vlad + Sal", resolvable: "no", why: "Authorship belongs to both owners.", settles: "Both owners agree name and licence and submit to a venue.", refs: ["P§15", "R8·§2d"] }
  ];

  window.MEMBRANE = { version: "0.3-draft", date: "2026-09-14", paper: PAPER, paperAnchors, sources, statuses, relations, laws, groups, params, agents, scenarios, challenges, decisions };
})();
