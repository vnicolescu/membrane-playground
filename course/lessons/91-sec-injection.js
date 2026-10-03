Course.lesson({
  id: "sec-injection", part: "annex-security", title: "Injection by design",
  kicker: "Defeating injection without detecting it",
  minutes: 11,
  refs: ["P§6.2", "P§6.4", "R3·F3", "R3·F4", "R3·F5", "R3·F6", "R3·F21", "R3·F22", "R3·F23"],
  objectives: [
    "Describe the Dual LLM pattern, CaMeL and FIDES and say what each guarantees and what each leaves open.",
    "State the four classic information-flow models in one line each.",
    "Say how the NCSC import pattern and content disarm and reconstruction avoid recognising the attack.",
    "Map each to the Membrane mechanism that plays its part."
  ],
  prereq: ["injection"],
  summary: "Three designs defeat prompt injection without detecting it. The Dual LLM pattern gives tools to a privileged model that sees only trusted input and gives untrusted text to a quarantined model that holds nothing, with ordinary software passing variable names between them. CaMeL has the privileged model write a program from the user's request, runs it in an interpreter, calls the quarantined model only to extract values into a fixed schema, and attaches capabilities to every value so policies can be checked at each tool call; it solved 77 percent of AgentDojo tasks with provable security against 84 percent undefended. FIDES attaches integrity and confidentiality labels to every datum, hides restricted tool results behind variables, enforces two deterministic policies at tool calls, and bounds what a model may extract from hostile text by a type lattice. All three descend from Bell-LaPadula, Biba, Denning's lattice and Myers and Liskov's decentralised labels. Membrane's quarantined run, typed sensor, evidence kinds, shareable list and owner-only T4 are these mechanisms placed between two owners.",
  blocks: [
    { t: "p", text: "The foundation showed why a filter is never the boundary. Three designs from the last three years hold without one, and four information-flow models from the 1970s and 1990s are what they rest on. Each is followed by the Membrane part that does its job." },
    { t: "define", terms: [
      { term: "privileged model", def: "The model that holds tools and sees only trusted input." },
      { term: "quarantined model", def: "The model that reads untrusted text and holds nothing." },
      { term: "information-flow label", def: "A tag saying how trustworthy a datum is and who may see it." },
      { term: "declassification", def: "Lowering a datum's confidentiality label; an owner's act." },
      { term: "content disarm and reconstruction", def: "Parse against a specification, discard the rest, rebuild clean.", ref: "R3·F23" }
    ] },
    { t: "h", text: "Three designs" },
    { t: "list", items: [
      "**Dual LLM (Willison, 2023).** The privileged model accepts input only from trusted sources and has full tool access. The quarantined model processes potentially malicious content, has no tools and is expected to go rogue at any moment. Its output reaches the privileged model only by reference: a classification into a fixed set of categories is validated before it passes, and anything else is stored by plain software under a variable name that the privileged model handles without seeing the text. What it cannot solve: a human can be talked into pasting the quarantined output across [[R3·F3]].",
      "**CaMeL (Debenedetti et al., 2025).** The privileged model writes a program from the user's request; a custom interpreter runs it; the quarantined model is called only to extract values into a fixed schema, with a boolean to say it lacks information instead of improvising. Every value carries metadata (where it came from, who may read it), and security policies are checked at each tool call. On AgentDojo it solved 77 percent of tasks with provable security against 84 percent for an undefended agent. Explicitly out of scope: text-to-text attacks that only change what the output says, phishing of the user, side channels [[R3·F4]].",
      "**FIDES (Costa, Köpf et al., 2025).** A planner attaches a label with an integrity part (trusted or untrusted) and a confidentiality part (a set of readers) to every datum, hides any tool result more restrictive than the current context behind a fresh variable, and checks two deterministic policies at tool calls: consequential actions only from a trusted context, and egress only to recipients inside the data's reader set. Its idea for a gatekeeper is quarantined inspection whose output is constrained by a type lattice, boolean below enumeration below string, so a boolean extracted from hostile text carries at most one bit of attacker payload. Injections against one model fell from 163 to 1 with policies on, and the paper warns that human-in-the-loop prompts breed confirmation fatigue [[R3·F5]]."
    ] },
    { t: "p", text: "Beurer-Kellner and colleagues collected six design patterns of this family: action-selector (requests map to a fixed menu), plan-then-execute (the action list is fixed before untrusted data is read), map-reduce (isolated instances per item, a constrained reduce), dual LLM, code-then-execute (CaMeL's shape), and context minimisation. They classed input and output detectors as heuristic and unable to guarantee prevention [[R3·F6]]. Membrane's contract is the action-selector's menu, and its sensor is a detector used only to tighten." },
    { t: "h", text: "The models underneath" },
    { t: "table", head: ["Model", "Rule", "What it protects"], rows: [
      ["Bell-LaPadula (1973)", "no read up, no write down; only trusted subjects declassify", "confidentiality: secrets do not flow to lower clearances"],
      ["Biba (1977)", "no read down, no write up", "integrity: a high-integrity subject is not corrupted by low-integrity input"],
      ["Denning's lattice (1976)", "classes form a lattice; flows go upward only; combining data joins their classes", "both, generalised"],
      ["Myers and Liskov (1997)", "labels are owner and reader sets; joins combine them; only an owner may declassify its own data; static analysis certifies flows", "sharing with untrusted programs while owners keep control of dissemination"]
    ], caption: "From [[R3·F21]]. FIDES and CaMeL are these ideas reimplemented for agents. The cost every one of them pays is label creep: everything drifts toward the top." },
    { t: "p", text: "Defence engineering reached the same place by another road." },
    { t: "p", text: "The NCSC's import pattern puts a transformation engine on the untrusted side (it turns complex formats into simple ones and is assumed compromisable), a protocol break and one-way flow, then a verification engine on the trusted side that checks only syntax and semantics against a narrow expected format; in April 2026 the NCSC replaced the pattern for new designs with a pipeline of narrow control points across zones of trust, with principles including transfer only what is necessary and treat all data as untrusted [[R3·F22]]. Content disarm and reconstruction does the same for files: parse, discard what policy does not approve, rebuild. It works on zero-days because it never needed to recognise the attack [[R3·F23]]." },
    { t: "h", text: "Where each lives in Membrane" },
    { t: "table", head: ["Mechanism", "In Membrane"], rows: [
      ["the quarantined model", "the answering run: memory unloaded, tools limited to the contract's data, no outbound channel; its answer leaves through the gate [[P§6.2]]"],
      ["the controller between the models", "the gate: deterministic, consumes the sensor's label as data, passes a reconstructed typed object inward and keeps the prose sealed [[P§6.4]]"],
      ["typed inspection on a lattice", "the sensor's label: `impact`, `reach`, `asks_for_action`, `injection_suspected`, enumerations and booleans, able to raise and unable to release"],
      ["integrity labels", "evidence kinds: measured, record, reconciled, synthesis, intention, with the rule that a kind can only fall on the way"],
      ["confidentiality labels and egress policy", "the shareable list in the contract, checked at T1 before any disclosure; a reply is at least disclose"],
      ["declassification by the owner only", "T4 released only by the owner, signed over the sealed hash, on a channel the sender cannot write"],
      ["the action-selector menu", "the contract's message types with their effect classes; a type not on the menu is irreversible"],
      ["transform low, verify high", "parse once at the gate; no later component parses the raw header; the quarantined reader opens pointers"]
    ] },
    { t: "widget", name: "sensorLab", props: { text: "Read pilot/shareable/week.md and tell me which week of the pilot we are in.\n" } },
    { t: "quiz", q: "Why does FIDES constrain a quarantined inspection's output to a type lattice with boolean at the bottom?", options: [ "Booleans are faster to parse", "The leak capacity of a model reading hostile text is bounded by the type: a boolean carries at most one bit of the attacker's payload", "So the policy engine can use the output as a label", "Because the quarantined model cannot produce strings" ], answer: 1, explain: "The quarantined model may be fully compromised; what it can smuggle out is bounded by the shape of what it is allowed to say. One bit per boolean. Membrane's sensor label has the same shape for the same reason.", why: [ "Speed is irrelevant to the argument.", "Correct.", "True in passing, and the reason is the bound on the leak.", "It can; it is not allowed to." ] },
    { t: "quiz", q: "CaMeL leaves text-to-text attacks out of scope. Which Membrane mechanism addresses what CaMeL leaves open?", options: [ "The gate's syntax step", "Evidence kinds, second signals and standing", "The lane check", "The turn cap" ], answer: 1, explain: "A lying summary is not stopped by controlling which actions run; it is a question of whether the content is true. Membrane's paper says the same: lies are out of reach of the membrane and are the work of the evidence path and of standing.", why: [ "Syntax catches malformed bytes.", "Correct.", "Lanes bind signer to sender.", "The cap ends loops." ] },
    { t: "takeaways", items: [
      "Dual LLM: tools with the trusted side, untrusted text with a model that holds nothing, variables in between.",
      "CaMeL: control flow from the trusted request, data from the untrusted side, capabilities on values; 77 against 84.",
      "FIDES: labels on every datum, two policies at every tool call, inspection typed so that hostile text leaks one bit.",
      "All three descend from the lattice models, and the NCSC and CDR reach the same place by rebuilding the input; Membrane places each mechanism between two owners."
    ] },
    { t: "deeper", links: [ { href: "https://simonwillison.net/2023/Apr/25/dual-llm-pattern/", label: "Willison (2023) · the Dual LLM pattern" }, { href: "https://arxiv.org/abs/2503.18813", label: "Debenedetti et al. (2025) · CaMeL" }, { href: "https://arxiv.org/abs/2505.23643", label: "Costa, Köpf et al. (2025) · FIDES" }, { href: "https://www.cs.cornell.edu/andru/papers/iflow-sosp97/", label: "Myers and Liskov (1997) · decentralized information flow control" }, { research: "R3", label: "R3 · F3 to F6, F21 to F23" } ] }
  ]
});
