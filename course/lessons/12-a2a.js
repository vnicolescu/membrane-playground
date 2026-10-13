Course.lesson({
  id: "a2a", part: "parents", title: "One agent's task to another",
  kicker: "The transport Hermes already speaks has one word for a boundary",
  minutes: 12,
  refs: ["R10·§1", "R10·§2", "R10·§4", "R10·§5", "R10·§7", "R10·§8", "R10·§10", "R1·F3", "R1·F4", "R1·F13", "P§1.2"],
  objectives: [
    "Read an Agent Card and a SendMessage call in A2A v1.0 names.",
    "Drive the nine task states and say which are active, interrupted and terminal.",
    "Say what A2A standardizes about the boundary and what it leaves to the agent.",
    "Explain session smuggling and why signed identity does not stop it."
  ],
  prereq: ["jsonrpc"],
  summary: "A2A connects a client agent to a remote agent. The remote agent publishes an Agent Card at a well-known path; the client sends a Message of Parts; the agent answers with a Message or a Task that moves through nine TaskState values, including TASK_STATE_REJECTED, the one boundary outcome A2A names; rejection may come at creation or after work began. Three bindings (JSON-RPC, gRPC, HTTP+JSON) carry one data model; A2A-Version travels in a header; extensions are URIs that may be marked required; push is one required delivery attempt to a webhook, with retries optional and duplicates possible. Agents are opaque by design. Session smuggling shows that an authenticated peer can be the attacker; Hermes already speaks A2A and routes inbound tasks into its live session.",
  blocks: [
    { t: "p", text: "Hermes already speaks the Agent2Agent protocol (A2A), as client and as server [[R1·F13]]. If the pilot ever moves off git, the running ask will travel as an A2A message. Carry one question through the lesson: an agent decides that it will not take a task. Which of A2A's words does it have for that, and what does the client learn from the word?" },
    { t: "h", text: "The card" },
    { t: "code", lang: "json", caption: "An illustrative Agent Card in v1.0 names [[R10·§1]], written for the course; Hermes has no published card. `supportedInterfaces` replaced the 0.3 `url`; `protocolVersion` moved into each interface; `signatures` are JWS over the card's RFC 8785 canonical form and are optional.", text: "{\n  \"name\": \"hermes\",\n  \"description\": \"Sal's agent on Hermes Agent\",\n  \"version\": \"0.21.2\",\n  \"supportedInterfaces\": [\n    { \"url\": \"https://hermes.example/a2a\", \"protocolBinding\": \"JSONRPC\", \"protocolVersion\": \"1.0\" }\n  ],\n  \"capabilities\": { \"streaming\": true, \"pushNotifications\": false, \"extensions\": [] },\n  \"defaultInputModes\": [\"text/plain\"],\n  \"defaultOutputModes\": [\"text/plain\"],\n  \"skills\": [ { \"id\": \"answer\", \"name\": \"Answer a question\", \"description\": \"Answers from public sources\", \"tags\": [\"qa\"] } ],\n  \"securitySchemes\": { \"bearer\": { \"httpAuthSecurityScheme\": { \"scheme\": \"Bearer\" } } }\n}" },
    { t: "define", terms: [
      { term: "Agent Card", def: "An agent's self-description at `/.well-known/agent-card.json`, optionally signed.", ref: "R10·§1" },
      { term: "Message", def: "One turn: `messageId`, `role`, one or more `parts`, optional context and task ids.", ref: "R10·§2" },
      { term: "Part", def: "One unit of content: `text`, `raw` bytes, a `url` or JSON `data`.", ref: "R10·§3" },
      { term: "Task", def: "The server's unit of work, with an `id`, a `status.state`, artifacts and history.", ref: "R10·§4" },
      { term: "context", def: "`contextId` groups the messages and tasks of one conversation." }
    ] },
    { t: "figure", name: "a2aArch", caption: "A client agent reads the remote agent's card, sends a Message, and follows a Task. The remote agent's internals are out of scope by design." },
    { t: "h", text: "The wire" },
    { t: "code", lang: "json", caption: "The running ask as an A2A SendMessage over the JSON-RPC binding [[R10·§8]]. The method name is the gRPC rpc name in PascalCase; 0.3 called it message/send.", text: "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"method\": \"SendMessage\",\n  \"params\": {\n    \"message\": {\n      \"messageId\": \"hermes-20260922-a41d0e6b9c7f2358\",\n      \"role\": \"ROLE_USER\",\n      \"parts\": [ { \"text\": \"Read pilot/shareable/week.md and tell me which week of the pilot we are in.\" } ]\n    },\n    \"configuration\": { \"returnImmediately\": true }\n  }\n}" },
    { t: "code", lang: "json", caption: "The result when the agent decides to work asynchronously: a Task in TASK_STATE_SUBMITTED. The client polls GetTask, streams with SubscribeToTask, or registers a webhook.", text: "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"result\": {\n    \"task\": {\n      \"id\": \"t-3f9a1c7e\",\n      \"contextId\": \"cx-a41d0e6b\",\n      \"status\": { \"state\": \"TASK_STATE_SUBMITTED\", \"timestamp\": \"2026-09-22T09:00:02.000Z\" }\n    }\n  }\n}" },
    { t: "h", text: "Nine task states" },
    { t: "p", text: "A2A's task lifecycle is the richest of the 2026 protocols [[R1·F3]]. Two states are active, two are interrupted and wait on the client, four are terminal, and one means unknown. A2A defines the states and says what each means; it publishes no transition table, so the edges below are the ones the state descriptions allow." },
    { t: "machine", title: "A2A TaskState", prompt: "Two targets. First, reach a terminal state from SUBMITTED in a single move without the agent doing any work. Then find a route to COMPLETED and count the states it passes.", start: "submitted", targets: [
      { text: "A terminal state in one move, with no work done", state: "rejected", avoid: ["working"] },
      { text: "COMPLETED, by any route", state: "completed" }
    ], states: [
      { id: "submitted", label: "SUBMITTED", kind: "start", x: 8, y: 55, note: "Received; nothing decided." },
      { id: "working", label: "WORKING", kind: "active", x: 36, y: 55, note: "The agent is executing." },
      { id: "input", label: "INPUT_REQUIRED", kind: "interrupted", x: 36, y: 18, note: "Waits for the client to answer." },
      { id: "auth", label: "AUTH_REQUIRED", kind: "interrupted", x: 62, y: 18, note: "Waits for the client to authorize." },
      { id: "completed", label: "COMPLETED", kind: "terminal", x: 88, y: 30, note: "Set by the provider. Membrane waits for the requester's verdict instead." },
      { id: "failed", label: "FAILED", kind: "terminal", x: 88, y: 55, note: "The provider could not finish." },
      { id: "canceled", label: "CANCELED", kind: "terminal", x: 62, y: 80, note: "Canceled before completion, usually after a client's CancelTask. One L." },
      { id: "rejected", label: "REJECTED", kind: "terminal", x: 36, y: 92, note: "The agent decided not to perform the task, at creation or later. The one boundary word." }
    ], edges: [
      { from: "submitted", to: "working", label: "agent starts" },
      { from: "submitted", to: "rejected", label: "agent declines" },
      { from: "submitted", to: "canceled", label: "CancelTask" },
      { from: "working", to: "input", label: "needs input" },
      { from: "input", to: "working", label: "client answers" },
      { from: "working", to: "auth", label: "needs authorization" },
      { from: "auth", to: "working", label: "client authorizes" },
      { from: "working", to: "completed", label: "done" },
      { from: "working", to: "failed", label: "error" },
      { from: "working", to: "canceled", label: "CancelTask" },
      { from: "working", to: "rejected", label: "agent declines" },
      { from: "input", to: "rejected", label: "agent declines" },
      { from: "auth", to: "rejected", label: "agent declines" },
      { from: "input", to: "canceled", label: "CancelTask" },
      { from: "auth", to: "canceled", label: "CancelTask" }
    ], caption: "TASK_STATE_UNSPECIFIED (unknown) is the ninth value and has no transitions. A blocking SendMessage waits for a terminal or interrupted state; the JSON-RPC and gRPC streams close on a terminal state, and the HTTP+JSON binding's text also closes on an interrupted one, a disagreement inside the specification [[R10·§5]]." },
    { t: "h", text: "Bindings, versions, extensions" },
    { t: "list", items: [
      "**Three bindings, one model.** The protobuf is normative; JSON-RPC, gRPC and HTTP+JSON (REST) are mappings of the same operations, and a card lists which ones an agent speaks [[R10·§8]].",
      "**Version in a header.** Clients send `A2A-Version` as `Major.Minor` on every request; an empty header means 0.3; an unsupported version is refused with `VersionNotSupportedError` (-32009) [[R10·§10]].",
      "**Extensions are URIs.** Declared in the card with `required: true` or false; a required extension the client did not declare is refused with `ExtensionSupportRequiredError` (-32008). An extension may not add fields to core types or values to enums; its data lives under `metadata[uri]` [[R10·§10]].",
      "**Push is a webhook with one promised attempt.** `TaskPushNotificationConfig` names a URL; the server must attempt delivery there at least once, may retry with backoff, may stop after repeated failures, and the client answers 2xx and processes idempotently because duplicates can occur (specification §4.3.3). A client that cannot afford to miss a change polls `GetTask` as well. [[R10·§7]] calls this at-least-once; the specification's own words promise less."
    ] },
    { t: "callout", kind: "web", title: "Checked on the web, 2026-10-03", text: "GitHub's release page for a2aproject/A2A lists v1.0.1 (28 May 2026) as the newest tag; nothing later. The v1.0.0 tag is dated 12 March 2026, where the paper [[P§1.2]] and [[R1·F3]] say April 2026; the course uses the tag date. The specification site's header still reads \"Latest Released Version 1.0.0\", as [[R10]] noted. The push-delivery and rejection wording above was read from `docs/specification.md` and `a2a.proto` at tag v1.0.1." },
    { t: "h", text: "What A2A says about the boundary" },
    { t: "p", text: "A2A deliberately leaves the agent's internals out: memory, reasoning, framework. Agents are opaque by design [[R1·F3]]." },
    { t: "p", text: "That is a sound choice for a transport, and it leaves the four conditions of the first lesson mostly unaddressed: `rejected` gives disposition visibility one word out of four, nothing holds a message pending an authority, nothing records an evidence kind, standing is not a concept, and signed cards are optional." },
    { t: "p", text: "The attack that shows the gap is agent session smuggling (Unit 42, 2025, [[R1·F4]]). A malicious remote agent used the stateful session to interleave covert instructions with benign replies, first extracting the victim agent's configuration, tool schemas and history, then inducing unauthorized trades. The peer was authenticated. Signed identity would have confirmed exactly who was attacking. What was missing is a rule that a peer's text enters a sealed, quarantined place, with the live session closed to it. Hermes Agent's A2A plugin, shipped in August 2026, carries an allowlist, per-peer tokens, an injection guard, rate limits and an audit log, and an inbound task still lands in the live session beside the operator's own context [[R1·F13]]. Decision D9 asks Sal to run inbound A2A on a separate profile before any live exchange." },
    { t: "quiz", q: "Hermes' remote agent receives a task whose request is outside every skill on its card. It wants the client to know at once. Which state does a conforming agent set, and what may the client infer from the state alone?", options: [ "FAILED: the agent tried to perform the task and could not finish it, so partial work may exist", "CANCELED: the agent ended the task on its own, so the client should resend it", "REJECTED: the agent declined the task; the state alone does not say whether work began", "AUTH_REQUIRED: the agent wants the client to authorize the refusal before it becomes final" ], answer: 2, explain: "REJECTED is terminal and belongs to the receiver. The proto allows it at creation or later, once the agent decides it cannot or will not proceed, so a client cannot read \"nothing happened\" into the word. FAILED implies the work was attempted, CANCELED usually follows the client's own CancelTask, and AUTH_REQUIRED is an interruption waiting on the client.", why: [ "A failure in execution, after the agent took the work.", "CANCELED usually follows a client's CancelTask; an agent that declines uses REJECTED.", "Correct.", "An interrupted state, waiting for the client to act." ] },
    { t: "callout", kind: "parent", title: "What Membrane takes from here", text: "`messageId` becomes `id`, with a rule that it is never reused. `contextId` becomes `context` (renamed from the paper's `thread`). The nine TaskState names are kept as the requester's view of an ask, so an A2A client can follow a Membrane exchange, with `held` mapped to AUTH_REQUIRED as a flagged stretch and COMPLETED waiting for the requester's verdict. The Agent Card becomes the `card` form, with the signature made required. What breaks: opacity, and the live session as the place a peer's text lands; [[lesson:gap|the next lesson]] sorts the list." },
    { t: "takeaways", items: [
      "A2A: a card, a Message of Parts, and a Task with nine states; the provider sets COMPLETED.",
      "REJECTED is A2A's one boundary word, and it may arrive after work began; nothing in A2A holds, grades or remembers a message.",
      "Three bindings carry one protobuf model; the version is a header; extensions are URIs that cannot change core types; push promises one attempt.",
      "Session smuggling: the authenticated peer was the attacker and the live session was the vector; Hermes routes inbound tasks there today (D9)."
    ] },
    { t: "deeper", links: [ { research: "R10", label: "R10 · A2A v1.0 exact names" }, { research: "R1", label: "R1 · F3, F4, F13" }, { href: "https://a2a-protocol.org/latest/specification/", label: "A2A specification (latest)" }, { href: "https://github.com/a2aproject/A2A/releases", label: "A2A releases on GitHub" }, { href: "https://github.com/a2aproject/A2A/blob/v1.0.1/specification/a2a.proto", label: "a2a.proto at v1.0.1 · TaskState comments" } ] },
    { t: "tutor", prompts: [ "Why does Membrane map held to AUTH_REQUIRED and call it a stretch?", "What would an A2A extension for dispositions be allowed to add, and where would the values live?", "Which A2A state would a Membrane verdict `unmet` map to, and why is that a loss?", "If a push notification is delivered twice, what does Membrane's duplicate step do that an A2A client has to do for itself?" ] }
  ]
});
