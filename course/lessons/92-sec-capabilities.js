Course.lesson({
  id: "sec-capabilities", part: "annex-security", title: "Capabilities and least privilege",
  kicker: "A 1975 checklist, and the rule that authority is handed on only when a contract says so",
  minutes: 10,
  refs: ["P§6.2", "P§6.4", "P§6.5", "P§9.2", "R3·F19", "R3·F20", "R11·§4"],
  objectives: [
    "Recite the eight design principles and find each in a Membrane rule.",
    "State the object-capability model's rule for where authority comes from.",
    "Explain attenuation and audience binding and why Membrane forwards no received authority.",
    "Say what a T2 capability is, how the gate checks it, and the gap brobber found."
  ],
  summary: "Saltzer and Schroeder's 1975 principles (economy of mechanism, fail-safe defaults, complete mediation, open design, separation of privilege, least privilege, least common mechanism, psychological acceptability) each name a Membrane rule. Object capabilities make authority come only from references held, so a confused deputy cannot arise. Attenuable credentials (macaroons, Biscuit, UCAN) let a holder narrow a grant; MCP's audience binding forbids passing a received token upstream. Membrane's no-passthrough rule says authority received is not forwarded and delegation beyond one hop happens only if the contract names it. A T2 capability is a grant bound to its grantee that the gate checks at the reversible tier for peers at S2; brobber's vectors show it is not consumed by use, and propose single-use grants.",
  blocks: [
    { t: "p", text: "Half a century before anyone wrote an agent, Saltzer and Schroeder wrote down eight principles for protecting information in a computer system. Every one of them names a rule in Membrane, and matching them is the fastest audit of the design this course can offer. The second half of the lesson is the capability model, which turns the confused deputy from the foundation into a solved problem." },
    { t: "h", text: "Eight principles, 1975" },
    { t: "table", head: ["Principle", "Saltzer and Schroeder", "In Membrane"], rows: [
      ["Economy of mechanism", "keep the design as simple and small as possible", "a waist the size of SMTP's core; seven invariants; a gate of 21 steps in one file"],
      ["Fail-safe defaults", "base access decisions on permission", "an absent `effect` means irreversible; an absent `evidence` means synthesis; an unknown peer starts at S0"],
      ["Complete mediation", "every access to every object must be checked for authority", "every message is judged by the full gate; a duplicate gets the original receipt and nothing is re-executed; standing and contract are rechecked each time"],
      ["Open design", "the design should not be secret", "the specification, the gate and the vectors are public; the pinned secret is the key list, and the mechanism is published"],
      ["Separation of privilege", "a mechanism that requires two keys is more robust than one that opens to a single key", "two-signal release: recognition plus a confirmation from an anchor that cannot produce the recognition [[P§6.5]]"],
      ["Least privilege", "every program and user should operate with the least set of privileges necessary", "the answering run: memory unloaded, tools limited to the contract's data, no outbound channel"],
      ["Least common mechanism", "minimise mechanism common to more than one user and depended on by all", "the gate as a separate operating-system user; quarantine outside the repository; each agent its own gate, with none shared"],
      ["Psychological acceptability", "the human interface must be designed so users routinely apply the mechanisms correctly", "owner attention budgeted and spent at T4 only; one digest per sender; confirmation fatigue named as an attack surface"]
    ], caption: "The middle column paraphrases the opening sentence of each principle in the 1975 paper's section on basic principles." },
    { t: "define", terms: [
      { term: "object capability", def: "An unforgeable reference that is both a name and the authority to use it.", ref: "R3·F19" },
      { term: "attenuation", def: "Narrowing a credential's authority as it is passed on.", ref: "R3·F20" },
      { term: "audience binding", def: "Tying a token to the one party meant to accept it.", ref: "R11·§4" },
      { term: "no passthrough", def: "Received authority is not forwarded; delegation only where the contract names it.", ref: "P§6.2" },
      { term: "T2 capability", def: "An owner's grant letting the gate release a reversible effect at S2." }
    ] },
    { t: "h", text: "Object capabilities" },
    { t: "p", text: "The confused deputy from [[lesson:injection|the injection foundation]] is what happens when a name travels without its authority and the deputy's own authority fills the gap. Capabilities bind the two together. In Miller's object-capability model, authority comes only from references you hold; only connectivity begets connectivity, so two disjoint parts of a system cannot reach each other unless something that holds both introduces them; the principle of least authority grants each component only what its job needs; and the caretaker pattern gives revocable, attenuated access through an intermediary that can be told to stop [[R3·F19]]. The model's cost is that every authority must be explicitly passed." },
    { t: "p", text: "Between two owners the model says something sharp: a message from a peer is a name with no authority attached, and the receiving agent must keep its own authority out of the gap. That is law {{L1}} as access control, and the contract is where authority is explicitly passed: it names what the answerer may disclose, and the gate releases nothing it does not name." },
    { t: "h", text: "Attenuation and audience" },
    { t: "p", text: "Three credential designs let a holder pass on less than it got. Macaroons chain HMACs so any holder can append caveats that narrow when, where, by whom and for what the credential works, and can require a third party to discharge a caveat. Biscuit does the same with public-key signatures, offline attenuation by appended blocks and Datalog checks. UCAN uses decentralised identifiers as principals; each delegation must restate or narrow its parent, invocations carry the whole proof chain, and revocation invalidates everything downstream [[R3·F20]]." },
    { t: "p", text: "The common property is monotone: a grant can only shrink along a chain." },
    { t: "p", text: "MCP enforces the other half. A client must send an RFC 8707 `resource` so the token it gets is bound to one server, the server must validate the audience, and a server must not accept or transit another server's token upstream [[R11·§4]]. Membrane takes both as one rule, {{tier.nopass}}: authority received is not forwarded, and delegation beyond one hop happens only if the contract names it. The delegation field {{ext.for}} lets an agent name its owner and raises neither tier, standing nor urgency [[P§9.2]]." },
    { t: "h", text: "The T2 capability" },
    { t: "p", text: "A reversible effect, a two-way door inside an authority already granted, is released by the gate without a human when two things hold: the sender stands at S2 or above, and the message presents a capability that is in the list the owner granted to this sender [[P§6.2]]. The gate looks the capability up under the sender's own entry, so another agent cannot present it; that is audience binding. brobber's vectors record the gap: the capability is not consumed by use, so the same grant releases a second request. The proposal is single-use, non-transferable grants, spent on admission by the caller that records the disposition, since the gate itself stays pure; two vectors cover the two halves, one holding today and one marked as a known gap." },
    { t: "gate", title: "Reversible, with and without a grant", intro: "The running ask with `effect: reversible`. Predict the disposition and the reason code at each standing level, with and without a capability, and with a capability granted to someone else.",
      preset: { header: { effect: "reversible" } }, predict: ["disposition", "reason"], expect: { disposition: "refused", reason: "effect-exceeds-tier", tier: "T2" },
      explain: "Hermes stands at S1 for the pilot. T2 needs S2, so step 21 refuses with `effect-exceeds-tier`; no capability could change that at S1.",
      variants: [
        { label: "Hermes at S2, holding `cap-1`, which Vlad granted to Hermes", change: { msg: { capability: "cap-1" }, ctx: { standing: { hermes: "S2" }, capabilities: { hermes: ["cap-1"] } } }, expect: { disposition: "admitted", tier: "T2" }, explain: "Standing and grant both hold. Step 21 releases a reversible effect with no human in the loop: least privilege, inside an authority the owner already gave." },
        { label: "Hermes at S2, presenting `cap-1`, which Vlad granted to Iris", change: { msg: { capability: "cap-1" }, ctx: { standing: { hermes: "S2" }, capabilities: { iris: ["cap-1"] } } }, expect: { disposition: "refused", reason: "effect-exceeds-tier", tier: "T2" }, explain: "The grant exists and belongs to someone else. Step 21 looks capabilities up under the sender's own entry, so a capability cannot be borrowed: audience binding." },
        { label: "Hermes at S2, no capability", change: { ctx: { standing: { hermes: "S2" } } }, expect: { disposition: "refused", reason: "effect-exceeds-tier", tier: "T2" }, explain: "Standing alone is not a grant. A longer clean record earns the level; the owner still has to say what the level may touch, and step 21 refuses without that." }
      ], showCtx: ["standing", "capabilities"] },
    { t: "sort", prompt: "Which principle does each Membrane rule serve first?", buckets: [ { id: "failsafe", label: "Fail-safe defaults" }, { id: "mediation", label: "Complete mediation" }, { id: "separation", label: "Separation of privilege" }, { id: "least", label: "Least privilege" }, { id: "common", label: "Least common mechanism" } ], items: [
      { text: "An absent `effect` on a request means irreversible", bucket: "failsafe", why: "The default is the most restrictive value." },
      { text: "Boundary effects need a second independent signal", bucket: "separation", why: "Two keys from sources that cannot produce each other." },
      { text: "The answering run has no memory loaded and no outbound channel", bucket: "least", why: "Only the authority the job needs." },
      { text: "The gate runs as a separate operating-system user", bucket: "common", why: "The agent and its gate share no mechanism the agent could subvert." },
      { text: "Every message, including a resend, goes through all 21 steps", bucket: "mediation", why: "No access is grandfathered by an earlier approval." },
      { text: "Unknown peers start at S0", bucket: "failsafe", why: "A stranger is given nothing by default; permission is earned or granted." }
    ] },
    { t: "takeaways", items: [
      "Saltzer and Schroeder's eight principles each name a Membrane rule; separation of privilege is the two-signal release.",
      "Object capabilities: authority only from references held; a peer's message is a name with no authority attached.",
      "Attenuation shrinks a grant along a chain; audience binding keeps a token where it was meant; Membrane forwards no received authority.",
      "A T2 capability is bound to its grantee and checked at S2; it is not yet consumed by use, which brobber's vectors record."
    ] },
    { t: "deeper", links: [ { href: "https://web.mit.edu/Saltzer/www/publications/protection/Basic.html", label: "Saltzer and Schroeder (1975) · Basic principles of information protection" }, { research: "R3", label: "R3 · F19 and F20, object capabilities and attenuable credentials" }, { research: "R11", label: "R11 §4 · MCP's audience binding" }, { ref: "P§6.2" } ] }
  ]
});
