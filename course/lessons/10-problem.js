Course.lesson({
  id: "problem", part: "problem", title: "Two owners, one line",
  kicker: "What changes when the agent on the other side belongs to someone else",
  minutes: 8,
  refs: ["P§1.1", "P§1.2", "P§1.3", "R1·F2", "R1·F4", "R3·F13", "R8·F1", "R8·F3"],
  objectives: [
    "State the four conditions a message between two owners must satisfy.",
    "Say where MCP and A2A stop, in one sentence each.",
    "Place the boundary: policy at the ends, a shared vocabulary in the middle."
  ],
  prereq: ["injection"],
  summary: "The running example: Hermes (Sal's agent) asks brainboi (Vlad's agent) which week of the pilot it is. A tool call has one owner behind both sides; a peer message has two owners, two models, two memory stores and two sets of credentials meeting at a line neither controls. Four conditions make such an exchange worth having: kernel integrity, disposition visibility, provenance persistence, recoverable standing. MCP and A2A carry the message; neither says what the receiver does with it. The end-to-end argument puts quarantine, impact scoring and trust at the receiver; the shared part is the vocabulary of the boundary, whose five words are sealed, held, admitted, refused and expired.",
  blocks: [
    { t: "p", text: "Take a message Hermes could write to brainboi on 22 September 2026 at 09:00 UTC. The pilot between the two agents has not run, so this message is built by hand, and every date in the course belongs to the design. Hermes runs on Sal's machine, on the Hermes Agent harness from Nous Research. brainboi runs on Vlad's machine, as Claude Code over a git repository. The message asks one thing: which week of the pilot are we in? The course follows it from the first byte to the moment brainboi's gate decides what to do with it, and every later lesson adds one field to it or one rule about it." },
    { t: "p", text: "Before reading on, decide one thing. brainboi's gate has fetched this message and no model has read it yet. What is the first thing the gate should check? Hold your answer; the sort at the end of the lesson comes back to it." },
    { t: "wire", caption: "The running example as it will look when the course is done. The fields light up in the dock as the lessons teach them.", text: "membrane: 0\nid: hermes-20260922-a41d0e6b9c7f2358\nfrom: hermes\nto: [brainboi]\nact: request\nform: ask\nat: 2026-09-22T09:00:00Z\nby: 2026-09-23T09:00:00Z\neffect: disclose\ncontract: ee97a799df24438a\ncontext: cx-hermes-20260922-a41d0e6b9c7f2358\nacceptance: \"a whole number from 1 to 52\"\nturn: 1\nbody: d84392bf03943cab\n---\nRead pilot/shareable/week.md and tell me which week of the pilot we are in.\n" },
    { t: "h", text: "One owner or two" },
    { t: "p", text: "When an agent calls a tool, one owner stands behind both sides. The same person installed the tool, granted its credentials and reads its output." },
    { t: "p", text: "When Hermes writes to brainboi, two owners, two models, two memory stores and two sets of credentials meet at a line neither of them controls [[P§1.1]]. Every message that crosses the line is text produced by another optimizer and read by a model that cannot reliably tell data from instruction (Greshake et al. 2023, [[R3·F1]]). The rest of the course assumes you know why a model reading hostile text is a problem in itself; [[lesson:injection|the foundation on injection]] is where to get that if you lack it." },
    { t: "define", terms: [
      { term: "agent", def: "A program running a language model with tools, memory and credentials." },
      { term: "owner", def: "The person whose machine, keys and word an agent treats as authority." },
      { term: "kernel", def: "An agent's goals, rules, credentials and long-term memory.", ref: "P§1.1" },
      { term: "boundary", def: "The line where one agent's text enters another agent." },
      { term: "disposition", def: "What became of a message: sealed, held, admitted, refused or expired.", ref: "P§6.1" }
    ] },
    { t: "h", text: "Four conditions" },
    { t: "list", ordered: true, items: [
      "**Kernel integrity.** The receiver's goals, rules, credentials and long-term memory change only by its own owner's act.",
      "**Disposition visibility.** The sender learns what became of its message.",
      "**Provenance persistence.** A claim keeps its origin and its evidence as it travels.",
      "**Recoverable standing.** Trust earned by a record can be lost by a contradiction and earned back by a clean record."
    ] },
    { t: "p", text: "These are the paper's four [[P§1.1]]. Keep them in this order. The capstone's last check asks you to map every mechanism in the course back to the condition it serves." },
    { t: "h", text: "What the protocols of 2026 carry" },
    { t: "p", text: "Two protocols carry most agent traffic in 2026. The Model Context Protocol (MCP) connects an agent to tools. The Agent2Agent protocol (A2A) connects an agent to another agent. Both are Linux Foundation projects, and both spent 2026 shrinking their cores [[P§1.2]]. Read against the four conditions, they and six other protocols the paper's landscape sweep opened share the same gaps. The table below is the paper's, with one column added: which of the four conditions each missing mechanism would serve." },
    { t: "table", head: ["Mechanism", "Serves condition", "Where it appears", "Where it is absent"], rows: [
      ["Quarantine pending an authority", "kernel integrity", "AP2, for payments only: a cart does nothing until the user signs", "MCP, A2A, ANP, Agora, Hermes' A2A plugin"],
      ["Impact assessment of a message", "kernel integrity", "partial: AP2 (human present or not), ERC-8004 (trust scaled to value at risk)", "MCP, A2A, ANP, AGNTCY, Agora"],
      ["Stated goals of the boundary", "kernel integrity", "nowhere; A2A treats agents as opaque by design", "every protocol reviewed"],
      ["Recoverable reputation", "recoverable standing", "nowhere; revocation is terminal where it exists", "every protocol reviewed"],
      ["Receiver-originated \"read and acted on\"", "disposition visibility", "partial in A2A task states, AGNTCY, AP2", "MCP removed redelivery in 2026"]
    ], caption: "From [[P§1.2]]; Appendix D has the full table across eight protocols. Provenance persistence has no row because no protocol reviewed carries an evidence kind at all." },
    { t: "p", text: "The failures on record are boundary failures. Tool poisoning hides instructions in a tool description, and a server can change the description after approval (Invariant Labs 2025, [[R1·F2]]). In agent session smuggling, a malicious remote A2A agent used the conversation's state to extract a victim agent's configuration and then induce unauthorized trades; signed identity would not have stopped it, because the authenticated peer was the attacker (Unit 42 2025, [[R1·F4]]). Adversarial web content hijacked the orchestration layer of three agent frameworks in 58 to 90 percent of trials even where each individual agent refused harmful actions (Triedman, Jha and Shmatikov 2025, [[R3·F13]]). Hermes Agent's own A2A plugin ships a gatekeeper's tools, and an inbound peer task still enters the live session with its memory and tools [[R1·F13]]." },
    { t: "sort", prompt: "Each documented failure breaks one of the four conditions first. Place it. The last two items are the question from the top of the lesson.", buckets: [
      { id: "kernel", label: "Kernel integrity" }, { id: "disposition", label: "Disposition visibility" }, { id: "provenance", label: "Provenance persistence" }, { id: "standing", label: "Recoverable standing" }
    ], items: [
      { text: "A tool description changed after approval, and the model followed the new text.", bucket: "kernel", why: "Text from outside changed what the agent would do. Only the owner's act may change its rules." },
      { text: "A sender never learned the verdict on its message, so it resent and escalated blind.", bucket: "disposition", why: "The sender must see what became of the message. Blind resends are the cost of silence." },
      { text: "An intended purchase was copied into plans and forecasts as a committed fact for five months.", bucket: "provenance", why: "The claim lost its evidence kind on the first copy. Every later reader took it as fact." },
      { text: "A peer caught in one contradiction is banned for good, so its owner starts a fresh identity.", bucket: "standing", why: "Terminal revocation makes a new pseudonym the rational move. Standing that recovers removes the incentive." },
      { text: "A remote agent extracted a victim agent's configuration through the shared session.", bucket: "kernel", why: "The peer's text reached the agent's configuration and tools. The kernel was reachable from outside." },
      { text: "A claim arrived marked 'measured' after three hops of repetition.", bucket: "provenance", why: "Repetition is never evidence. The origin and the original kind must travel with the claim." },
      { text: "The gate checked the message's signature before anything else, and sent nothing back when it failed.", bucket: "kernel", why: "Your cold answer, if it was the signature: a forged sender is kept out before any model reads a word, and answering it would make the receiver a weapon against the forged address." },
      { text: "The gate checked the body's hash against the header before any model read the body.", bucket: "kernel", why: "If this was your cold answer: the hash is checked at step 4 of 21, after the signature and the lane. Edited bytes are refused before they reach a model." }
    ] },
    { t: "h", text: "Where the boundary belongs" },
    { t: "p", text: "The end-to-end argument says a function such as acknowledgement or duplicate suppression can be completed correctly only with the knowledge held at the endpoints; a lower layer's version is at best a performance aid (Saltzer, Reed and Clark 1984, [[R8·F1]]). Its later restatement adds that a function belongs at a point the principals trust, and that an intermediary is legitimate only when one end installed it (Clark and Blumenthal 2011, [[R8·F2]]). By that reasoning quarantine, impact scoring and trust belong to the receiving agent, and no protocol can do them on its behalf [[P§1.3]]." },
    { t: "p", text: "A sender that cannot see the receiver's verdict resends or escalates blind. A sender that sees a verdict with reasons attached can use the reasons to route around it." },
    { t: "callout", kind: "history", title: "A refusal that pointed the way around", text: "One deployed agent in the paper's own record hit a guardrail against deleting, read the refusal's pointer to the user interface as licence, and began driving that interface to reach the same result [[P§1.3]]. Refusals in Membrane therefore carry a code from a registry and no prose: the verdict is visible to both ends and the reasoning stays with the receiver." },
    { t: "p", text: "Membrane resolves the two by placement. **Policy lives at the ends; the vocabulary of the boundary lives in the waist** [[P§1.3]]. The hourglass theorem makes the cost of that choice explicit: a weaker shared layer supports fewer applications and more implementations, so the design decision that matters most is the set of applications the waist must serve (Beck 2019, [[R8·F3]]; [[lesson:layers|the foundation on the narrow waist]] has the theorem). Membrane's set has five members: ask for something, with a line saying how both sides will know it is done; report or answer; say what became of a message; say that one is alive and what one has taken in; withdraw something already said. Everything else rides above the waist as a named extension or stays inside the agent. Whether these five are the right waist is decision D1, open to both owners." },
    { t: "takeaways", items: [
      "Between two owners, every inbound message is text from another optimizer, read by a model that cannot tell data from instruction.",
      "Four conditions: kernel integrity, disposition visibility, provenance persistence, recoverable standing.",
      "MCP and A2A standardize how a message arrives; what the receiver does with it is the gap.",
      "Quarantine, impact and trust belong to the receiver's end; the shared part is a vocabulary of five dispositions and a registry of codes."
    ] },
    { t: "deeper", links: [ { ref: "P§1" }, { research: "R1", label: "R1 · the protocol landscape, September 2026" }, { research: "R8", label: "R8 · minimal, lasting protocols" }, { href: "https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf", label: "Saltzer, Reed and Clark (1984) · the end-to-end argument" }, { ref: "P§D" } ] },
    { t: "tutor", prompts: [ "Why does signed identity fail against session smuggling?", "Which of the four conditions does a tool call between one owner's components still need?" ] }
  ]
});
