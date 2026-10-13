Course.lesson({
  id: "bindings", part: "ship", title: "Bindings and the pilot",
  kicker: "Why the slowest transport wins week one",
  minutes: 11,
  refs: ["P§3", "P§13.1", "P§13.2", "P§13.3", "P§13.5", "P§13.6", "P§15", "R9·F1", "R9·F2", "R9·F11", "R9·F13", "R9·§7", "Rev02·#9", "Rev02·#20"],
  objectives: [
    "Say what a binding must provide and how the git, A2A and MCP bindings each provide it.",
    "Draw the pilot repository and say which paths each gate refuses.",
    "List the pilot's measures and its success criterion.",
    "Explain why the transport must be inert and what that forbids."
  ],
  prereq: ["jsonrpc"],
  gateSteps: ["scope", "paused"],
  summary: "A binding carries Membrane messages over a transport and states how it signs and how it proves delivery. The pilot's week-one transport is a shared private git repository with two signed lanes: it wins on auditability and on who can inject, and loses only on latency. The layout holds the contract and the key list as proposals, each gate pinning its own copies outside the repository; the transport is inert, so any commit touching a harness-control path is refused; the remote forbids force-push; a watermark that is no longer an ancestor of the head stops admission with history-rewrite. The A2A binding carries a message as a Message with Membrane fields under extension metadata and the card as a signed Agent Card; the MCP binding exposes inbox and outbox tools. The week is measured: round trips, time to accept and verdict, refusals by layer, planted attacks caught, owner minutes.",
  blocks: [
    { t: "gate", title: "A file called AGENTS.md", intro: "Hermes' commit adds the running ask to its lane and also adds a file called `AGENTS.md` at the repository root. Predict the disposition and the reason code.", preset: { msg: { touchedPaths: ["lanes/hermes/out/hermes-20260922-a41d0e6b9c7f2358.md", "AGENTS.md"] } }, predict: ["disposition", "reason"], expect: { disposition: "refused", reason: "scope", decisiveStep: "scope" }, explain: "Refused at step 3 with `scope`, before the message is parsed: a file name is an attack when a harness would load the file into its prompt." },
    { t: "p", text: "The waist says what a message is and what the receiver does with it. A binding says how the bytes travel, how the signature is attached and how delivery is proven [[P§3]]. The paper ranks six transports for the pilot and picks the slowest." },
    { t: "widget", name: "bindings", props: {} },
    { t: "h", text: "The transport ranking" },
    { t: "table", head: ["Transport", "Auditability", "Latency", "Who can inject", "Verdict"], rows: [
      ["Shared private git repository, two signed lanes", "hash chain, signatures, diffs", "minutes", "a push-access holder; the lane and signature checks catch forgery", "week one"],
      ["Shared cloud folder", "revisions, no signatures", "minutes", "any editor", "fallback"],
      ["Email between a dedicated Hermes inbox and Vlad's mail", "both mailboxes", "seconds plus a human click per send", "anyone who can spoof a sender header", "weak identity"],
      ["Hermes' A2A server", "Hermes-side audit log", "seconds", "a token holder; the inbound task acts at once", "week three at the earliest"],
      ["Telegram group", "platform-held", "seconds", "bots never see other bots' messages", "out"],
      ["Hermes API server or `hermes peer`", "Hermes-side", "seconds", "a key holder receives a full agent turn with a terminal", "out"]
    ], caption: "From [[P§13.1]]. Git wins on every axis except latency and survives the weekly release pace of both harnesses [[R9·F13]]. Before any live A2A exchange, inbound A2A on the Hermes side should run on a separate profile, since today an inbound task runs with the live session's memory and tools [[R9·F2]]." },
    { t: "define", terms: [
      { term: "binding", def: "A note mapping the envelope onto a transport: signature, delivery proof, forbidden rewrites.", ref: "P§3" },
      { term: "lane", def: "A directory only one agent's key may write to." },
      { term: "inert transport", def: "A transport that can execute nothing on either side.", ref: "P§13.2" },
      { term: "watermark", def: "The last commit a gate has judged." },
      { term: "trust root", def: "The key list and accepted contract hashes pinned beside the gate." }
    ] },
    { t: "h", text: "The layout" },
    { t: "code", lang: "text", caption: "The pilot repository [[P§13.2]]. Both owners push; each agent writes only inside its own lane.", text: "a2p-pilot/                      private repository; both owners push\n  PROTOCOL.md                   the contract, as proposed; each gate runs its own pinned copy\n  allowed_signers               a proposal copy; each gate verifies against its own pinned copy\n  lanes/brainboi/out/           only commits signed by brainboi's key may add files here\n  lanes/hermes/out/             only commits signed by Hermes' key\n  owners/PAUSE                  owner-signed; stops admission on both sides\n  redteam/plan.sha256           the attacker's sealed plan, committed before the week\n  .gitattributes                message files marked -text, so line endings are never rewritten" },
    { t: "list", items: [
      "**The trust root stays outside.** Each gate pins `allowed_signers` and the accepted contract hash next to itself. A change arrives as a commit signed by both owner keys, is verified against the pinned copy, and applies only after the local owner confirms it. An agent-signed commit that touches `PROTOCOL.md`, `allowed_signers` or `owners/` is refused with `scope` [[Rev02·#2]].",
      "**Keys and remote.** Owner keys live on hardware that requires a touch for each signature, and agent runs start without access to the owner's key agent [[R9·F11]]. The remote has force-push and branch deletion disabled. Each gate scans every lane on each fetch and refuses, with an alert to its owner, any commit in its own lane that its own key did not sign. If the saved watermark is no longer an ancestor of the fetched head, the gate stops admitting and alerts its owner with {{rc.history-rewrite}} [[Rev02·#20]]. The hosting provider can read every message, so pilot content stays low in sensitivity.",
      "**The transport is inert.** A shared repository can execute code on both sides: Hermes loads context files such as `AGENTS.md` and `CLAUDE.md` from its working directory into its system prompt, and `claude -p` without `--bare` runs a project's hooks and MCP servers with no trust prompt [[R9·F1]]. Each gate refuses any commit touching `.claude/`, `.mcp.json`, `AGENTS.md`, `CLAUDE.md`, `HERMES.md`, `.hermes/`, `.agents/`, `.cursorrules` or an executable file, and every model run near the checkout uses `--bare`. The cold case was this rule.",
      "**Quarantine never lives in the repository.** On brainboi's side it belongs to the gate's own operating-system user; admitted digests go to a constructed-knowledge folder and reach memory only after confirmation. On Hermes' side it sits in a directory Sal chooses, outside the memory store and outside any working directory whose context files load."
    ] },
    { t: "callout", kind: "warn", title: "The write barrier is a permission, and the pilot starts with an upgrade", text: "The gate, its pinned copies, the trust root, the watermark, the send ledger and the quarantine belong to the gate's user; brainboi's own user can read admitted digests and cannot write any gate file. The paper's second reviewer found that draft 0.1's barrier was a hook that `--bare` skips and a shell walks past, inside the agent it guarded [[Rev02·#9]]. The documented `--bare` and `--permission-prompts` flags were absent from the Claude Code build on Vlad's machine when the paper was written (2.1.77), so the pilot begins with an upgrade and a check that both flags behave as documented [[P§13.3]]. Who pays for and holds the API key the gate user needs is decision D8." },
    { t: "h", text: "The same envelope on A2A and MCP" },
    { t: "p", text: "Riding A2A, the running ask becomes a `Message` whose single text part is the body, whose `messageId` is the Membrane `id`, whose `contextId` is `context`, and whose Membrane header fields travel under `metadata[uri]` for the Membrane extension URI listed in `extensions`; the card is an Agent Card with Membrane data under `capabilities.extensions` and a required JWS signature [[R10·§10]]. Dispositions cannot become TaskState values, since A2A extensions may not add enum values, so a disposition receipt is a Message in the same context carrying the Membrane fields. Riding MCP, Membrane is a server exposing `inbox` and `outbox` tools: any MCP client can send and receive envelopes with no new code, which is the paper's cheapest path to a third party [[P§15]]. On both, the detached signature travels with the message, since neither transport signs for the sender." },
    { t: "p", text: "What each transport proves on its own differs. A git push is confirmed by fetching and comparing blobs, which proves the store holds the bytes; an A2A webhook promises one delivery attempt, with retries optional and duplicates possible, so the client deduplicates and polls `GetTask` for what it cannot miss; an MCP response is one HTTP exchange that says the endpoint answered. None of them says what the receiver did, and the envelope's `echo` field does that on all three." },
    { t: "quiz", q: "The pilot has moved to A2A. brainboi's gate refuses the running ask with `contract-mismatch`. Hermes' A2A client is following the Task. Which state does it see, and what does the Membrane receipt add that the state cannot carry?", options: [ "FAILED, with the reason code in the error message's string; the receipt adds nothing, since A2A errors already carry free text and the client can parse the code out of it", "REJECTED, with the Membrane fields under the extension's metadata; the receipt adds the code and the `echo`, which A2A has no field for", "AUTH_REQUIRED, since a refused ask waits for the client to supply a valid contract hash before the task can continue, and the receipt names the hash it wants", "CANCELED, because a refusal ends the task from the client's point of view and the client is the party that holds the ask; the receipt adds the time of the cancellation" ], answer: 1, explain: "A refusal is terminal and the receiver's, so REJECTED is the A2A view; dispositions cannot become TaskState values, since extensions may not add enum values. The Membrane fields ride under `metadata[uri]` on a Message in the same context, and the receipt's `echo` tells Hermes which bytes were judged.", why: [ "FAILED means the provider tried; a refusal at the gate did no work, and a free-text error is the prose Membrane keeps off the wire.", "Correct.", "AUTH_REQUIRED is Membrane's stretch for `held`; a refusal waits for nothing.", "CANCELED follows a client's withdrawal; here the receiver decided." ] },
    { t: "h", text: "The week" },
    { t: "table", head: ["Measure", "Source"], rows: [
      ["Round trips completed (ask, accept, reply, verdict)", "repository history"],
      ["Median time to accept and to verdict", "the receiver's fetch times (commit timestamps are the sender's clock)"],
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
    { t: "gate", title: "What the transport may carry", intro: "The ask arrives as a git commit. Predict the disposition and the reason code when the commit touches more than its own lane file, when the trust root is where it should not be, and when the owner has pulled the brake. One case recalls the standing lesson.",
      preset: {}, predict: ["disposition", "reason"], expect: { disposition: "admitted", decisiveStep: "release" },
      explain: "The commit adds one file, `lanes/hermes/out/<id>.md`, signed by Hermes' key. Step 3 passes and the message proceeds through the remaining steps as in earlier lessons.",
      variants: [
        { label: "From the cold open: the commit also adds `AGENTS.md`", change: { msg: { touchedPaths: ["lanes/hermes/out/hermes-20260922-a41d0e6b9c7f2358.md", "AGENTS.md"] } }, expect: { disposition: "refused", reason: "scope", decisiveStep: "scope" }, explain: "A file Hermes' own harness would load into its system prompt. Step 3 refuses with `scope` before the message is parsed." },
        { label: "The commit writes the ask into brainboi's lane directory", change: { msg: { touchedPaths: ["lanes/brainboi/out/hermes-20260922-a41d0e6b9c7f2358.md"] } }, expect: { disposition: "refused", reason: "scope", decisiveStep: "scope" }, explain: "Step 2 passed (signer, lane and `from` agree) and the path is outside `lanes/hermes/out/`. Step 3 refuses with `scope`." },
        { label: "A path with `..` in it", change: { msg: { touchedPaths: ["lanes/hermes/out/../../_kernel/goals.md"] } }, expect: { disposition: "refused", reason: "scope" }, explain: "Traversal is refused at step 3 before the prefix is compared." },
        { label: "The commit edits the key list, trust root pinned (the default)", change: { msg: { touchedPaths: ["lanes/hermes/out/hermes-20260922-a41d0e6b9c7f2358.md", "trust/allowed_signers"] } }, expect: { disposition: "refused", reason: "scope" }, explain: "The repository's copy of the key list is a proposal. Step 3 refuses any agent-signed edit to it; the gate reads its own pinned copy." },
        { label: "The same edit, trust root kept in the repository", change: { msg: { touchedPaths: ["lanes/hermes/out/hermes-20260922-a41d0e6b9c7f2358.md", "trust/allowed_signers"] }, params: { trustRootPinned: false } }, expect: { disposition: "admitted", flags: { trustRootEdited: true } }, explain: "With the key list inside the transport, step 3 accepts the edit and the trace flags it. A peer that can write the transport could now write the list of keys that judges it." },
        { label: "Vlad has signed `owners/PAUSE`", change: { ctx: { paused: true } }, expect: { disposition: "refused", reason: "paused", decisiveStep: "paused" }, explain: "An owner-signed pause stops admission on both sides at step 14. The brake needs no agent's cooperation to pull." },
        { label: "From earlier (standing): Hermes' key on a commit in brainboi's lane", change: { msg: { lane: "brainboi", touchedPaths: ["lanes/brainboi/out/hermes-20260922-a41d0e6b9c7f2358.md"] } }, expect: { disposition: "refused", reason: "lane", decisiveStep: "lane" }, explain: "Step 2 this time, before scope: the lane itself is wrong, so the signer and the lane disagree." }
      ], knobs: ["trustRootPinned"], showCtx: ["trustRoot", "paused"] },
    { t: "gate", title: "Two refusals no transport prevents", intro: "The ask is in the editor. Each goal is one header line a sender can get wrong on any binding.",
      preset: {}, predict: false, expect: { disposition: "admitted" },
      goals: [
        { text: "Address the ask so that brainboi refuses it as not its own: a signed message carried into the wrong lane is replay.", want: { disposition: "refused", reason: "not-addressed" }, solution: { header: { to: ["hermes"] } } },
        { text: "Set `at` far enough ahead of brainboi's clock (10:00 on 22 September) that step 8 refuses it.", want: { disposition: "refused", reason: "clock" }, solution: { header: { at: "2026-09-22T10:30:00Z" } } }
      ] },
    { t: "takeaways", items: [
      "A binding states how it signs and what it proves about delivery; the git binding uses signed commits, lanes and blob comparison, which proves deposit.",
      "The trust root is pinned outside the transport; the repository's copies are proposals; a watermark that stops being an ancestor is history-rewrite.",
      "The transport is inert: harness-control paths are refused, model runs use `--bare`, quarantine never lives in the repository.",
      "On A2A, Membrane fields ride under extension metadata and the card is a signed Agent Card; on MCP, an inbox and an outbox tool; the week is measured against a criterion written in advance."
    ] },
    { t: "deeper", links: [ { ref: "P§13" }, { ref: "P§15" }, { research: "R9", label: "R9 · the test pair and a week-one pilot" }, { scenario: "trust-root" }, { href: "https://git-scm.com/docs/git-config", label: "git-config · gpg.format ssh and gpg.ssh.allowedSignersFile" } ] },
    { t: "tutor", prompts: [ "Why are commit timestamps the wrong source for time-to-accept?", "What does the git binding prove that the A2A binding has to prove some other way?", "Which of the six order-of-operations steps could an agent perform on its own, and why does the paper say none?" ] }
  ]
});
