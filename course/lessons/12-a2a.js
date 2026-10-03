Course.lesson({
  id: "a2a", part: "parents", title: "A2A from first principles",
  kicker: "Agent Card, Message, Task: the richest task lifecycle, and one word for refusal",
  minutes: 12,
  refs: ["R10·§1", "R10·§2", "R10·§4", "R10·§5", "R10·§8", "R10·§10", "R1·F3", "R1·F4", "R1·F13", "P§1.2"],
  objectives: [
    "Read an Agent Card and a SendMessage call in A2A v1.0 names.",
    "Drive the nine task states and say which are active, interrupted and terminal.",
    "Say what A2A standardizes about the boundary and what it leaves to the agent.",
    "Explain session smuggling and why signed identity does not stop it."
  ],
  prereq: ["jsonrpc"],
  summary: "A2A connects a client agent to a remote agent. The remote agent publishes an Agent Card at a well-known path; the client sends a Message of Parts; the agent answers with a Message or a Task that moves through nine TaskState values, including TASK_STATE_REJECTED, the one boundary outcome A2A names. Three bindings (JSON-RPC, gRPC, HTTP+JSON) carry one data model; A2A-Version travels in a header; extensions are URIs that may be marked required. Agents are opaque by design. Session smuggling shows that an authenticated peer can be the attacker; Hermes already speaks A2A and routes inbound tasks into its live session.",
  blocks: [
    { t: "p", text: "Hermes already speaks the Agent2Agent protocol (A2A), as client and as server [[R1·F13]]. If the pilot ever moves off git, the running ask will travel as an A2A message. So the second parent is read the same way as the first: the wire, the lifecycle, and the places where A2A stops." },
    { t: "define", terms: [
      { term: "Agent Card", def: "A JSON document at `https://{domain}/.well-known/agent-card.json` that declares an agent's name, interfaces, skills, security schemes and extensions, optionally signed.", ref: "R10·§1" },
      { term: "Message", def: "One turn: a `messageId`, a `role` (`ROLE_USER` from the client, `ROLE_AGENT` from the server), one or more `parts`, optional `contextId` and `taskId`.", ref: "R10·§2" },
      { term: "Part", def: "A unit of content: exactly one of `text`, `raw` (bytes, base64 in JSON), `url` or `data` (any JSON), with an optional `mediaType`.", ref: "R10·§3" },
      { term: "Task", def: "The server's unit of work: an `id`, a `status` with a `state`, optional `artifacts` and `history`. Created when a SendMessage needs more than one turn.", ref: "R10·§4" },
      { term: "context", def: "`contextId` groups messages and tasks that belong together; the server sets it on its own messages, and must reject a mismatched contextId and taskId pair.", ref: "R1·F3" }
    ] },
    { t: "figure", name: "a2aArch", caption: "A client agent reads the remote agent's card, sends a Message, and follows a Task. The remote agent's internals are out of scope by design." },
    { t: "h", text: "The card" },
    { t: "code", lang: "json", caption: "A minimal Agent Card in v1.0 names [[R10·§1]]. `supportedInterfaces` replaced the 0.3 `url`; `protocolVersion` moved into each interface; `signatures` are JWS over the card's RFC 8785 canonical form and are optional.", text: "{\n  \"name\": \"hermes\",\n  \"description\": \"Sal's agent on Hermes Agent\",\n  \"version\": \"0.21.2\",\n  \"supportedInterfaces\": [\n    { \"url\": \"https://hermes.example/a2a\", \"protocolBinding\": \"JSONRPC\", \"protocolVersion\": \"1.0\" }\n  ],\n  \"capabilities\": { \"streaming\": true, \"pushNotifications\": false, \"extensions\": [] },\n  \"defaultInputModes\": [\"text/plain\"],\n  \"defaultOutputModes\": [\"text/plain\"],\n  \"skills\": [ { \"id\": \"answer\", \"name\": \"Answer a question\", \"description\": \"Answers from public sources\", \"tags\": [\"qa\"] } ],\n  \"securitySchemes\": { \"bearer\": { \"httpAuthSecurityScheme\": { \"scheme\": \"Bearer\" } } }\n}" },
    { t: "h", text: "The wire" },
    { t: "code", lang: "json", caption: "The running ask as an A2A SendMessage over the JSON-RPC binding [[R10·§8]]. The method name is the gRPC rpc name in PascalCase; 0.3 called it message/send.", text: "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"method\": \"SendMessage\",\n  \"params\": {\n    \"message\": {\n      \"messageId\": \"hermes-20260922-a41d0e6b9c7f2358\",\n      \"role\": \"ROLE_USER\",\n      \"parts\": [ { \"text\": \"Read pilot/shareable/week.md and tell me which week of the pilot we are in.\" } ]\n    },\n    \"configuration\": { \"returnImmediately\": true }\n  }\n}" },
    { t: "code", lang: "json", caption: "The result when the agent decides to work asynchronously: a Task in TASK_STATE_SUBMITTED. The client polls GetTask, streams with SubscribeToTask, or registers a webhook.", text: "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"result\": {\n    \"task\": {\n      \"id\": \"t-3f9a1c7e\",\n      \"contextId\": \"cx-a41d0e6b\",\n      \"status\": { \"state\": \"TASK_STATE_SUBMITTED\", \"timestamp\": \"2026-09-22T09:00:02.000Z\" }\n    }\n  }\n}" },
    { t: "h", text: "Nine task states" },
    { t: "p", text: "A2A's task lifecycle is the richest of the 2026 protocols [[R1·F3]]. Two states are active, two are interrupted and wait on the client, four are terminal, and one means unknown. Drive the machine below; the one state to remember is `TASK_STATE_REJECTED`, a receiver's refusal with its own terminal word. It is the one boundary outcome A2A names." },
    { t: "machine", title: "A2A TaskState", prompt: "Start a task and choose what happens next. Terminal states end the task; interrupted states wait on the client.", start: "submitted", states: [
      { id: "submitted", label: "SUBMITTED", kind: "start", x: 10, y: 50, note: "Received; nothing decided." },
      { id: "working", label: "WORKING", kind: "active", x: 40, y: 50, note: "The agent is executing." },
      { id: "input", label: "INPUT_REQUIRED", kind: "interrupted", x: 40, y: 15, note: "Waits for the client to answer." },
      { id: "auth", label: "AUTH_REQUIRED", kind: "interrupted", x: 40, y: 85, note: "Waits for the client to authorize." },
      { id: "completed", label: "COMPLETED", kind: "terminal", x: 75, y: 15, note: "Set by the provider. Membrane waits for the requester's verdict instead." },
      { id: "failed", label: "FAILED", kind: "terminal", x: 75, y: 40, note: "The provider could not finish." },
      { id: "canceled", label: "CANCELED", kind: "terminal", x: 75, y: 65, note: "CancelTask succeeded. One L." },
      { id: "rejected", label: "REJECTED", kind: "terminal", x: 75, y: 90, note: "The receiver refused. The one boundary word." }
    ], edges: [
      { from: "submitted", to: "working", label: "agent starts" },
      { from: "submitted", to: "rejected", label: "agent refuses" },
      { from: "submitted", to: "canceled", label: "CancelTask" },
      { from: "working", to: "input", label: "needs input" },
      { from: "input", to: "working", label: "client answers" },
      { from: "working", to: "auth", label: "needs authorization" },
      { from: "auth", to: "working", label: "client authorizes" },
      { from: "working", to: "completed", label: "done" },
      { from: "working", to: "failed", label: "error" },
      { from: "working", to: "canceled", label: "CancelTask" }
    ], caption: "TASK_STATE_UNSPECIFIED (unknown) is the ninth value and has no transitions. Streams close only on terminal states; a blocking SendMessage waits for a terminal or interrupted state [[R10·§5]]." },
    { t: "h", text: "Bindings, versions, extensions" },
    { t: "list", items: [
      "**Three bindings, one model.** The protobuf is normative; JSON-RPC, gRPC and HTTP+JSON (REST) are mappings of the same operations, and a card lists which ones an agent speaks [[R10·§8]]. The transport annex compares them byte for byte: [[lesson:tr-bindings]].",
      "**Version in a header.** Clients send `A2A-Version` as `Major.Minor` on every request; an empty header means 0.3; an unsupported version is refused with `VersionNotSupportedError` (-32009) [[R10·§10]].",
      "**Extensions are URIs.** Declared in the card with `required: true` or false; a required extension the client did not declare is refused with `ExtensionSupportRequiredError` (-32008). An extension may not add fields to core types or values to enums; its data lives under `metadata[uri]` [[R10·§10]].",
      "**Push is a webhook.** `TaskPushNotificationConfig` names a URL; the server POSTs StreamResponse bodies there with at-least-once delivery and the client answers 2xx [[R10·§7]]."
    ] },
    { t: "callout", kind: "web", title: "Checked on the web, 2026-10-03", text: "GitHub's release page for a2aproject/A2A lists v1.0.1 (28 May 2026) as the newest tag; nothing later. The v1.0.0 tag is dated 12 March 2026, where the paper [[P§1.2]] and [[R1·F3]] say April 2026; the course uses the tag date. The specification site's header still reads \"Latest Released Version 1.0.0\", as [[R10]] noted." },
    { t: "h", text: "What A2A says about the boundary" },
    { t: "p", text: "A2A deliberately leaves the agent's internals out: memory, reasoning, framework. Agents are opaque [[R1·F3]]. That is a sound choice for a transport and it leaves the four conditions of [[lesson:problem]] mostly unaddressed. `rejected` gives disposition visibility one word out of four; nothing holds a message pending an authority; nothing records an evidence kind; standing is not a concept. Signed cards are optional." },
    { t: "p", text: "The attack that shows the gap is agent session smuggling (Unit 42, 2025, [[R1·F4]]). A malicious remote agent used the stateful session to interleave covert instructions with benign replies, first extracting the victim agent's configuration, tool schemas and history, then inducing unauthorized trades. The peer was authenticated. Signed identity would have confirmed exactly who was attacking. What was missing is a rule that a peer's text enters a sealed, quarantined place and never the live session. Hermes Agent's A2A plugin, shipped in August 2026, carries an allowlist, per-peer tokens, an injection guard, rate limits and an audit log, and an inbound task still enters the live session with memory and tools [[R1·F13]]. Decision D9 asks Sal to run inbound A2A on a separate profile before any live exchange." },
    { t: "quiz", q: "Which A2A task state is the receiver's own refusal of the task?", options: [ "TASK_STATE_FAILED", "TASK_STATE_CANCELED", "TASK_STATE_REJECTED", "TASK_STATE_AUTH_REQUIRED" ], answer: 2, explain: "FAILED is a provider that tried and could not; CANCELED is the client's withdrawal; AUTH_REQUIRED is an interruption waiting on the client. REJECTED is terminal and belongs to the receiver. Membrane maps it to `refused` and adds a reason code without prose.", why: [ "A failure in execution, after the agent accepted the work.", "The client cancelled; the receiver did not decide.", "Correct: a first-class, terminal refusal.", "An interrupted state: the task waits for the client to authorize." ] },
    { t: "callout", kind: "parent", title: "What Membrane takes from here", text: "`messageId` becomes `id`, with a rule that it is never reused. `contextId` becomes `context` (renamed from the paper's `thread`). The nine TaskState names are kept as the requester's view of an ask, so an A2A client can follow a Membrane exchange, with `held` mapped to AUTH_REQUIRED as a flagged stretch and COMPLETED waiting for the requester's verdict. The Agent Card becomes the `card` form, with the signature made required. What breaks: opacity, and the live session as the place a peer's text lands [[lesson:gap]]." },
    { t: "takeaways", items: [
      "A2A: a signed-or-not card, a Message of Parts, and a Task with nine states; the provider sets COMPLETED.",
      "REJECTED is the one boundary word A2A has. Nothing holds, grades or remembers.",
      "Three bindings carry one protobuf model; the version is a header; extensions are URIs that cannot change core types.",
      "Session smuggling: the authenticated peer was the attacker, and the live session was the vector.",
      "Hermes speaks A2A today and routes inbound tasks into its live session; D9 asks for a separate profile."
    ] },
    { t: "deeper", links: [ { research: "R10", label: "R10 · A2A v1.0 exact names" }, { research: "R1", label: "R1 · F3, F4, F13" }, { href: "https://a2a-protocol.org/latest/specification/", label: "A2A specification (latest)" }, { href: "https://github.com/a2aproject/A2A/releases", label: "A2A releases on GitHub" } ] },
    { t: "tutor", prompts: [ "Why does Membrane map held to AUTH_REQUIRED and call it a stretch?", "What would an A2A extension for dispositions be allowed to add, and where would the values live?", "Which A2A state would a Membrane verdict `unmet` map to, and why is that a loss?" ] }
  ]
});
