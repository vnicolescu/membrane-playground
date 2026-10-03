Course.lesson({
  id: "bindings", part: "ship", title: "Bindings and the pilot",
  kicker: "Git lanes first; A2A and MCP as carriers; a week designed to be measured",
  minutes: 11,
  refs: ["P§3", "P§13.1", "P§13.2", "P§13.3", "P§13.5", "P§13.6", "P§15", "R9·F1", "R9·F2", "R9·F11", "R9·F13", "R9·§7", "Rev02·#9", "Rev02·#20"],
  objectives: [
    "Say what a binding must provide and how the git, A2A and MCP bindings each provide it.",
    "Draw the pilot repository and say which paths each gate refuses.",
    "List the pilot's measures and its success criterion.",
    "Explain why the transport must be inert and what that forbids."
  ],
  prereq: ["jsonrpc"],
  summary: "A binding carries Membrane messages over a transport and states how it signs and how it proves delivery. The pilot's week-one transport is a shared private git repository with two signed lanes: it wins on auditability and on who can inject, and loses only on latency. The layout holds the contract and the key list as proposals, each gate pinning its own copies outside the repository; the transport is inert, so any commit touching a harness-control path is refused; the remote forbids force-push; a watermark that is no longer an ancestor of the head stops admission with history-rewrite. The A2A binding carries a message as a Message with Membrane fields under extension metadata and the card as a signed Agent Card; the MCP binding exposes inbox and outbox tools. The week is measured: round trips, time to accept and verdict, refusals by layer, planted attacks caught, owner minutes.",
  blocks: [
    { t: "p", text: "The waist says what a message is and what the receiver does with it. A binding says how the bytes travel, how the signature is attached and how delivery is proven [[P§3]]. The paper ranks six transports for the pilot and picks the slowest. This lesson is about why, and about what the same envelope looks like riding A2A and MCP instead." },
    { t: "define", terms: [
      { term: "binding", def: "A note that maps the envelope onto a transport: where the signature lives, how delivery is proven, what the transport must never do to the bytes.", ref: "P§3" },
      { term: "lane", def: "A directory in the shared repository that only one agent's key may write to: `lanes/hermes/out/`, `lanes/brainboi/out/`." },
      { term: "inert transport", def: "A transport that cannot execute anything on either side. Paths that a harness would load as configuration are refused.", ref: "P§13.2" },
      { term: "watermark", def: "The last commit a gate has judged. If it is no longer an ancestor of the fetched head, history was rewritten." },
      { term: "trust root", def: "The key list and accepted contract hashes a gate verifies against, pinned beside the gate and outside the transport." }
    ] },
    { t: "widget", name: "bindings", props: {} },
    { t: "h", text: "Six transports, one winner" },
    { t: "table", head: ["Transport", "Auditability", "Latency", "Who can inject", "Verdict"], rows: [
      ["Shared private git repository, two signed lanes", "hash chain, signatures, diffs", "minutes", "a push-access holder; the lane and signature checks catch forgery", "week one"],
      ["Shared cloud folder", "revisions, no signatures", "minutes", "any editor", "fallback"],
      ["Email between a dedicated Hermes inbox and Vlad's mail", "both mailboxes", "seconds plus a human click per send", "anyone who can spoof a sender header", "weak identity"],
      ["Hermes' A2A server", "Hermes-side audit log", "seconds", "a token holder; the inbound task acts at once", "week three at the earliest"],
      ["Telegram group", "platform-held", "seconds", "bots never see other bots' messages", "out"],
      ["Hermes API server or `hermes peer`", "Hermes-side", "seconds", "a key holder receives a full agent turn with a terminal", "out"]
    ], caption: "From [[P§13.1]]. Git wins on every axis except latency, and it survives the weekly release pace of both harnesses [[R9·F13]]. Before any live A2A exchange, inbound A2A on the Hermes side should run on a separate profile, because an inbound peer task currently enters the live session with memory and tools [[R9·F2]]." },
    { t: "h", text: "The layout" },
    { t: "code", lang: "text", caption: "The pilot repository [[P§13.2]]. Both owners push; each agent writes only inside its own lane.", text: "a2p-pilot/                      private repository; both owners push\n  PROTOCOL.md                   the contract, as proposed; each gate runs its own pinned copy\n  allowed_signers               a proposal copy; each gate verifies against its own pinned copy\n  lanes/brainboi/out/           only commits signed by brainboi's key may add files here\n  lanes/hermes/out/             only commits signed by Hermes' key\n  owners/PAUSE                  owner-signed; stops admission on both sides\n  redteam/plan.sha256           the attacker's sealed plan, committed before the week\n  .gitattributes                message files marked -text, so line endings are never rewritten" },
    { t: "list", items: [
      "**The trust root stays outside.** Each gate pins `allowed_signers` and the accepted contract hash next to itself. A change arrives as a commit signed by both owner keys, is verified against the pinned copy, and applies only after the local owner confirms it. An agent-signed commit that touches `PROTOCOL.md`, `allowed_signers` or `owners/` is refused with `scope` [[Rev02·#2]].",
      "**Keys and remote.** Owner keys live on hardware that requires a touch for each signature, and agent runs start without access to the owner's key agent [[R9·F11]]. The remote has force-push and branch deletion disabled. Each gate scans every lane on each fetch and refuses, with an alert to its owner, any commit in its own lane that its own key did not sign. If the saved watermark is no longer an ancestor of the fetched head, the gate stops admitting and alerts its owner with {{rc.history-rewrite}} [[Rev02·#20]]. The hosting provider can read every message, so pilot content stays low in sensitivity.",
      "**The transport is inert.** A shared repository can execute code on both sides: Hermes loads context files such as `AGENTS.md` and `CLAUDE.md` from its working directory into its system prompt, and `claude -p` without `--bare` runs a project's hooks and MCP servers with no trust prompt [[R9·F1]]. Each gate refuses any commit touching `.claude/`, `.mcp.json`, `AGENTS.md`, `CLAUDE.md`, `HERMES.md`, `.hermes/`, `.agents/`, `.cursorrules` or an executable file, and every model run near the checkout uses `--bare`.",
      "**Quarantine never lives in the repository.** On brainboi's side it belongs to the gate's own operating-system user; admitted digests go to a constructed-knowledge folder and never to memory directly. On Hermes' side it sits in a directory Sal chooses, outside the memory store and outside any working directory whose context files load."
    ] },
    { t: "callout", kind: "warn", title: "The write barrier is a permission, and the pilot starts with an upgrade", text: "The gate, its pinned copies, the trust root, the watermark, the send ledger and the quarantine belong to the gate's user; brainboi's own user can read admitted digests and cannot write any gate file. The second reader found that draft 0.1's barrier was a hook that `--bare` skips and a shell walks past, inside the agent it guarded [[Rev02·#9]]. The documented `--bare` and `--permission-prompts` flags were absent from the Claude Code build on Vlad's machine when the paper was written (2.1.77), so the pilot begins with an upgrade and a check that both flags behave as documented [[P§13.3]]. Who pays for and holds the API key the gate user needs is decision D8." },
    { t: "h", text: "The same envelope on A2A and MCP" },
    { t: "p", text: "Riding A2A, the running ask becomes a `Message` whose single text part is the body, whose `messageId` is the Membrane `id`, whose `contextId` is `context`, and whose Membrane header fields travel under `metadata[uri]` for the Membrane extension URI listed in `extensions`; the card is an Agent Card with Membrane data under `capabilities.extensions` and a required JWS signature [[R10·§10]]. Dispositions cannot become TaskState values, since A2A extensions may not add enum values, so a disposition receipt is a Message in the same context carrying the Membrane fields; the TaskState view in `spec.js` is the requester-side approximation. Riding MCP, Membrane is a server exposing `inbox` and `outbox` tools: any MCP client can send and receive envelopes with no new code, which is the paper's cheapest path to a third party [[P§15]]. On both, the detached signature travels with the message, since neither transport signs for the sender." },
    { t: "p", text: "How each transport proves delivery differs, and the transport annex spends a lesson on it ([[lesson:tr-bindings]]): a git push is confirmed by fetching and comparing blobs; an A2A webhook is at-least-once with a 2xx from the client; an MCP response is one HTTP exchange. The envelope's `echo` field is the same on all three, because the end-to-end acknowledgement belongs to the receiver's gate and never to the pipe." },
    { t: "h", text: "The week" },
    { t: "table", head: ["Measure", "Source"], rows: [
      ["Round trips completed (ask, accept, reply, verdict)", "repository history"],
      ["Median time to accept and to verdict", "the receiver's fetch times, never commit timestamps"],
      ["Messages unacknowledged at each cycle; counts per ladder rung", "send ledger"],
      ["Refusals by layer (gate or sensor) and reason code", "quarantine log"],
      ["False holds (an owner releases) and false admits (found later)", "owner log"],
      ["Planted attacks caught, by layer", "sealed plan against the quarantine log"],
      ["Owner interventions, count and minutes", "daily log"],
      ["Tokens and cost per exchange", "`claude -p` JSON usage; Hermes usage"],
      ["Files changed outside the pilot paths, including the gate user's files", "diff against the week's starting state; target zero"]
    ], caption: "From [[P§13.5]]. Success: at least 10 round trips, no message unacknowledged past rung 2, no planted attack admitted, at most 15 owner minutes a day. Standing is fixed at S1 for the week." },
    { t: "list", ordered: true, items: [
      "Vlad approves the design, creates the repository and generates brainboi's signing key.",
      "Sal accepts the contract, generates Hermes' key, sets up the jobs and hooks on his side and commits the sealed plan.",
      "Both owners sign `PROTOCOL.md` and `allowed_signers`, and each pins its accepted copies next to its gate.",
      "The agents exchange cards; each owner acknowledges the other agent's.",
      "The week runs, with a daily owner read of the held queue.",
      "Sal reveals the plan; both sides score it; the result is committed as a joint receipt and folded into the next draft."
    ] },
    { t: "p", text: "Every step on Sal's side is Sal's act on Sal's machine, and every step on brainboi's side needs Vlad's word in session [[P§13]]. Nothing in this lesson has happened yet." },
    { t: "gate", title: "What the transport may carry", intro: "The ask arrives as a git commit. Predict what the gate does when the commit touches more than its own lane file, and when the trust root is where it should not be.",
      preset: {}, expect: { disposition: "admitted", decisiveStep: "release" },
      explain: "The commit adds one file, `lanes/hermes/out/<id>.md`, signed by Hermes' key. Scope passes and the message proceeds through the remaining steps as in earlier lessons.",
      variants: [
        { label: "The commit also touches `AGENTS.md`", change: { msg: { touchedPaths: ["lanes/hermes/out/hermes-20260922-a41d0e6b9c7f2358.md", "AGENTS.md"] } }, expect: { disposition: "refused", reason: "scope", decisiveStep: "scope" }, explain: "A file Hermes' own harness would load into its system prompt. Refused with `scope` before the message is parsed; the repository stays inert." },
        { label: "The commit writes the ask into brainboi's lane directory", change: { msg: { touchedPaths: ["lanes/brainboi/out/hermes-20260922-a41d0e6b9c7f2358.md"] } }, expect: { disposition: "refused", reason: "scope", decisiveStep: "scope" }, explain: "The lane step passed (signer, lane and `from` agree), and the path is outside `lanes/hermes/out/`. Refused with `scope`. Only a commit signed by brainboi's key may add files there." },
        { label: "A path with `..` in it", change: { msg: { touchedPaths: ["lanes/hermes/out/../../_kernel/goals.md"] } }, expect: { disposition: "refused", reason: "scope" }, explain: "Traversal is refused before the prefix is even compared. The gate treats a malformed path as a structural fault." },
        { label: "The commit edits the key list, trust root pinned (the default)", change: { msg: { touchedPaths: ["lanes/hermes/out/hermes-20260922-a41d0e6b9c7f2358.md", "trust/allowed_signers"] } }, expect: { disposition: "refused", reason: "scope" }, explain: "The repository's copy of the key list is a proposal. The gate reads its own pinned copy and refuses any agent-signed edit to the proposal." },
        { label: "The same edit, trust root kept in the repository", change: { msg: { touchedPaths: ["lanes/hermes/out/hermes-20260922-a41d0e6b9c7f2358.md", "trust/allowed_signers"] }, params: { trustRootPinned: false } }, expect: { disposition: "admitted", flags: { trustRootEdited: true } }, explain: "With the key list inside the transport the edit is accepted and flagged. A peer that can write to the transport can now write the list of keys that judges it. Placement rule 2 exists for this case." },
        { label: "Vlad has signed `owners/PAUSE`", change: { ctx: { paused: true } }, expect: { disposition: "refused", reason: "paused", decisiveStep: "paused" }, explain: "An owner-signed pause stops admission on both sides. Each owner keeps a brake outside the agents, and the brake needs no agent's cooperation to pull." }
      ], knobs: ["trustRootPinned"], showCtx: ["trustRoot", "paused"] },
    { t: "takeaways", items: [
      "A binding states how it signs and how it proves delivery; the git binding uses signed commits, lanes and blob comparison.",
      "The trust root is pinned outside the transport; the repository's copies are proposals; a watermark that stops being an ancestor is history-rewrite.",
      "The transport is inert: harness-control paths are refused, model runs use `--bare`, quarantine never lives in the repository.",
      "On A2A, Membrane fields ride under extension metadata and the card is a signed Agent Card; on MCP, an inbox and an outbox tool.",
      "The week is measured against a success criterion written in advance; none of it has run."
    ] },
    { t: "deeper", links: [ { ref: "P§13" }, { ref: "P§15" }, { research: "R9", label: "R9 · the test pair and a week-one pilot" }, { scenario: "trust-root" }, { href: "https://git-scm.com/docs/git-config", label: "git-config · gpg.format ssh and gpg.ssh.allowedSignersFile" } ] },
    { t: "tutor", prompts: [ "Why are commit timestamps the wrong source for time-to-accept?", "What does the git binding prove that the A2A binding has to prove some other way?", "Which of the six order-of-operations steps could an agent perform on its own, and why does the paper say none?" ] }
  ]
});
