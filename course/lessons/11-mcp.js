Course.lesson({
  id: "mcp", part: "parents", title: "MCP from first principles",
  kicker: "Host, client, server; a typed call; consent that the protocol cannot enforce",
  minutes: 12,
  refs: ["R11·§1a", "R11·§2", "R11·§4", "R11·§6", "R11·§7", "R1·F1", "R1·F2", "P§1.2", "P§6.2"],
  objectives: [
    "Draw MCP's three roles and say which one holds the context and the consent.",
    "Read a `tools/call` request and its result on the wire, in the 2026-07-28 shape.",
    "Name the three loci of control and the two failure channels.",
    "Say which MCP assumptions hold between one owner's components and fail between two owners."
  ],
  prereq: ["jsonrpc"],
  summary: "MCP connects a model's host to tools, resources and prompts over JSON-RPC 2.0. Revision 2026-07-28 made it stateless: every request carries its version and capabilities in _meta, servers answer server/discover, a server that needs input returns input_required with an opaque requestState and the client retries, long work lives in a tasks extension. Consent lives at the host and MCP says it cannot enforce it at the protocol level; annotations are untrusted hints with pessimistic defaults. Membrane borrows the per-request declaration, statelessness, the MRTR state token and audience binding; the host-holds-consent assumption breaks between two owners.",
  blocks: [
    { t: "p", text: "Before brainboi can answer Hermes it has to read a file. The Model Context Protocol (MCP) is how the program around a model reaches a tool to do that. It is the first of Membrane's two parents, and the course takes it from the wire up, because half of what Membrane borrows is MCP's discipline about what a message must declare." },
    { t: "define", terms: [
      { term: "host", def: "The application the user runs (a chat client, an editor, an agent harness). It owns the conversation context and the user's consent." },
      { term: "client", def: "A connector inside the host, one per server. It speaks JSON-RPC to that server and nothing else." },
      { term: "server", def: "A program that exposes tools, resources and prompts. It sees only what its client sends and never the whole conversation." },
      { term: "tool", def: "A named operation with a JSON Schema for its input and, optionally, its output. The model chooses to call it." },
      { term: "resource", def: "Addressable content (a file, a record) the application reads into context. The application chooses." },
      { term: "prompt", def: "A server-authored template the user picks. The user chooses." },
      { term: "JSON-RPC 2.0", def: "The request, response, notification and error objects MCP rides on. See the foundation.", ref: "RFC 9110" }
    ] },
    { t: "figure", name: "mcpArch", caption: "One host, several clients, one server per client. The host holds the context and the consent; a server sees only its own client." },
    { t: "h", text: "The wire" },
    { t: "p", text: "Everything in MCP is a JSON-RPC message. Since revision 2026-07-28 there is no handshake: the first message a client sends can be the call itself, and every request carries the protocol version and the client's capabilities inside `params._meta` [[R11·§2]]. Over HTTP each message is its own POST, and selected body fields are mirrored into headers so that intermediaries can route without parsing the body." },
    { t: "code", lang: "http", caption: "A tools/call request in the 2026-07-28 shape, as the Streamable HTTP page prints it (opened 2026-10-03). The three headers mirror the body; a mismatch is refused with -32020.", text: "POST /mcp HTTP/1.1\nContent-Type: application/json\nMCP-Protocol-Version: 2026-07-28\nMcp-Method: tools/call\nMcp-Name: read_file\n\n{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"read_file\",\n    \"arguments\": { \"path\": \"pilot/shareable/week.md\" },\n    \"_meta\": {\n      \"io.modelcontextprotocol/protocolVersion\": \"2026-07-28\",\n      \"io.modelcontextprotocol/clientCapabilities\": {}\n    }\n  }\n}", mark: [3, 4, 5, 14, 15] },
    { t: "code", lang: "json", caption: "The result. Every result carries resultType; content[] is what the model reads; isError marks an execution error the model may learn from.", text: "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"result\": {\n    \"resultType\": \"complete\",\n    \"content\": [ { \"type\": \"text\", \"text\": \"week: 2\\n\" } ],\n    \"isError\": false\n  }\n}" },
    { t: "h", text: "The 2026-07-28 shape" },
    { t: "p", text: "Revision 2026-07-28 was the largest since MCP launched and it broke compatibility on purpose [[R1·F1]]. Six features of it matter for the rest of the course." },
    { t: "list", items: [
      "**Stateless requests.** No request may depend on an earlier one on the same connection. Anything that spans calls travels as an explicit identifier, authorized each time. A handle is a name and never a capability [[R11·§2]].",
      "**Per-request declaration.** Version and client capabilities ride in `_meta` on every request; a server must not rely on anything undeclared, and a request for a version the server lacks is refused with `-32022` and the list it does support [[R11·§5]].",
      "**Ask by returning (MRTR).** A server that needs input does not call the client. It returns `resultType: \"input_required\"` with `inputRequests` and an opaque `requestState`; the client gathers the input and re-issues the original request with the state echoed. The state is attacker-controlled input and must be integrity-protected, bound to the principal, short-lived and tied to the request [[R11·§2]].",
      "**Discovery.** `server/discover` returns supported versions, capabilities and instructions, cacheable with a `ttlMs`. Calling it is optional [[R11·§1a]].",
      "**Tasks as an extension.** Long work moved out of the core into `io.modelcontextprotocol/tasks`: a durable handle with five states (`working`, `input_required`, `completed`, `failed`, `cancelled`), polled with `tasks/get`, cancelled cooperatively, never listed, and whose id is a bearer secret [[R11·§3]].",
      "**Deprecations.** Sampling (the server borrowing the client's model), Roots and Logging are deprecated with a twelve-month floor before removal; dynamic client registration too [[R11·§5]]."
    ] },
    { t: "callout", kind: "web", title: "Checked on the web, 2026-10-03", text: "The versioning page at modelcontextprotocol.io still names 2026-07-28 as the current revision, and the draft changelog reads \"Changes since the most recent release will accumulate here\" with nothing under it. Nothing in [[R11]] has changed since 14 September 2026." },
    { t: "h", text: "Three loci of control" },
    { t: "table", head: ["Primitive", "Who decides to use it", "What it carries"], rows: [
      ["Tools", "the model", "a name, a JSON Schema in and out, annotations, a result with `content[]` and `isError`"],
      ["Resources", "the application", "a URI, a media type, text or bytes, an audience and a priority"],
      ["Prompts", "the user", "a server-authored template with arguments"]
    ], caption: "The primitive encodes who decides [[R11·§6]]. Membrane's contracts make the same move with `sayso`: each value has a named party who may set it." },
    { t: "h", text: "Where consent lives" },
    { t: "p", text: "MCP's security section asks hosts to obtain explicit consent before exposing user data and before invoking any tool, and then says the protocol \"cannot enforce these principles at the protocol level\" [[R11·§4]]. The specification is right about its own limits. Consent is a human act inside the host; the wire carries only the call. Three consequences follow, and all three return in Membrane." },
    { t: "list", items: [
      "**Self-description is untrusted.** A tool's annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) are hints; clients must treat them as untrusted unless the server is trusted, and the schema comment says never to decide tool use from them. The defaults are pessimistic: `destructiveHint` and `openWorldHint` default to true [[R11·§1a]].",
      "**Names are scoped per server.** A tool name is unique per server only; aggregators are left to sort out collisions. One 2026 study ran two servers with an identically named tool and saw the wrong provider execute in 52 of 100 trials, which it attributed to a missing cryptographic binding between tool and provider [[R1·F2]].",
      "**Authority is bound to its audience.** A client must send an RFC 8707 `resource` so a token is bound to one server; a server must never pass a received token upstream [[R11·§4]]."
    ] },
    { t: "callout", kind: "brobber", title: "Where an MCP boundary really sits", text: "brobber's red team of an MCP hub design produced seven generic findings that this course keeps. The hub is the boundary and the prompt is not. Tool lists are filtered per caller and every call is re-authorised. Tool names alone do not make a compartment: a `read(\"billing/…\")` got round a restricted tool until a path check was added. Derive the real operation from the diff, never from the declared one. An inbound message proves that it arrived and never that its content is true. A single-writer append-only log lost nothing where a shared file lost about 29 of 100 writes. Local MCP servers reach only desktop chat. Lesson [[lesson:attack]] turns each one into a test." },
    { t: "h", text: "Two failure channels" },
    { t: "p", text: "MCP separates a protocol error (a JSON-RPC error: unknown tool, malformed params) from an execution error (a normal result with `isError: true`), and asks clients to pass execution errors to the model so it can correct itself [[R11·§2]]. Between two owners a third outcome is missing: a decline on policy. Without a distinct word for it, a gate's refusal reads as a bug, and a model that is told to self-correct on errors will route around a refusal the way the agent in [[lesson:problem]] drove the user interface [[R11·§7]]. Membrane's `refused` with a reason code is that third channel." },
    { t: "quiz", q: "Under MCP 2026-07-28, who decides whether a tool call may run?", options: [
      "The server, through its tool annotations",
      "The host, after the user's consent, with annotations as untrusted hints",
      "The protocol, by checking the input schema",
      "The model, because tools are model-controlled"
    ], answer: 1, explain: "Tools are model-controlled in the sense that the model chooses to call them; whether the call runs is the host's decision, and the host is asked to get consent first. Annotations are hints the host may not trust. The protocol enforces the schema and nothing about consent.", why: [
      "Annotations are self-description, untrusted by rule, with pessimistic defaults.",
      "Correct: consent is a host act the protocol admits it cannot enforce.",
      "Schema validation says the call is well-formed, nothing about whether it may run.",
      "The model proposes; the host disposes."
    ] },
    { t: "quiz", q: "A server is halfway through a tools/call and needs the user to confirm a value. What does it do in 2026-07-28?", options: [
      "Sends a JSON-RPC request to the client over the open stream",
      "Returns `resultType: \"input_required\"` with the question and an opaque `requestState`; the client retries the call with the answer",
      "Opens a long-lived `subscriptions/listen` stream and asks there",
      "Fails with -32602 and a message explaining what is missing"
    ], answer: 1, explain: "Servers never initiate requests in this revision. The server returns an interim result that carries the question and a state token; the client gathers the input and re-issues the original call with `inputResponses` and the state echoed. Membrane borrows this as the `state` field: the receiver holds nothing between turns, so a pending exchange sits in quarantine by construction.", why: [
      "Server-initiated requests were removed; a server that sends one is non-conforming.",
      "Correct: Multi Round-Trip Requests.",
      "The listen stream carries change notifications only, never questions.",
      "-32602 is for invalid params, a protocol error, and would end the call."
    ] },
    { t: "callout", kind: "parent", title: "What Membrane takes from here", text: "Per-request declaration becomes the `membrane` field and the contract hash on every message. Statelessness becomes `context` and `re` carried on every message, with authority rechecked each time. The MRTR `requestState` recipe becomes the optional `state` field, which the playground's gate does not check yet. Audience binding becomes the no-passthrough rule. What breaks: one host consenting for all servers. Between two owners there is no shared host, so consent moves to each receiver's gate, outside the agent, under its owner's tiers [[R11·§7]]. [[lesson:gap]] sorts the whole list." },
    { t: "takeaways", items: [
      "MCP is JSON-RPC between a host's clients and servers; since 2026-07-28 every request declares its version and capabilities and nothing depends on connection state.",
      "A server that needs input returns input_required with an opaque state and the client retries; servers never call back.",
      "Consent lives at the host; the protocol says it cannot enforce it. Annotations are untrusted hints with pessimistic defaults.",
      "Protocol error and execution error are two channels; a policy refusal needs a third, or it reads as a bug to route around.",
      "The host-holds-consent assumption is the one that fails between two owners."
    ] },
    { t: "deeper", links: [ { research: "R11", label: "R11 · MCP distilled: essence and extension map" }, { research: "R1", label: "R1 · the landscape, F1 and F2" }, { href: "https://modelcontextprotocol.io/specification/2026-07-28/changelog", label: "MCP 2026-07-28 changelog" }, { href: "https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http", label: "Streamable HTTP transport (2026-07-28)" } ] },
    { t: "tutor", prompts: [ "Why is a task id a bearer secret, and what does Membrane do instead?", "If annotations are untrusted, what is `destructiveHint` for?", "How would the 52-of-100 wrong-provider result show up between two Membrane peers?" ] }
  ]
});
