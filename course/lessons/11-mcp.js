Course.lesson({
  id: "mcp", part: "parents", title: "A host and its tools",
  kicker: "How a model's host reaches a tool while consent stays off the wire",
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
    { t: "p", text: "Before brainboi can answer Hermes it has to read a file, and the Model Context Protocol (MCP) is how the program around a model reaches a tool to do that. It is the first of Membrane's two parents. One question to carry through the lesson: a tool is halfway through its work and needs the user to confirm a value. Who asks the human, and how does the question travel?" },
    { t: "h", text: "The wire" },
    { t: "p", text: "Everything in MCP is a JSON-RPC message." },
    { t: "p", text: "Since revision 2026-07-28 there is no handshake: the first message a client sends can be the call itself, and every request carries the protocol version and the client's capabilities inside `params._meta` [[R11·§2]]. Over HTTP each message is its own POST, and selected body fields are mirrored into headers so that intermediaries can route without parsing the body." },
    { t: "code", lang: "http", caption: "A tools/call request in the 2026-07-28 shape, as the Streamable HTTP page prints it (opened 2026-10-03). The three headers mirror the body; a mismatch is refused with -32020.", text: "POST /mcp HTTP/1.1\nContent-Type: application/json\nMCP-Protocol-Version: 2026-07-28\nMcp-Method: tools/call\nMcp-Name: read_file\n\n{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"read_file\",\n    \"arguments\": { \"path\": \"pilot/shareable/week.md\" },\n    \"_meta\": {\n      \"io.modelcontextprotocol/protocolVersion\": \"2026-07-28\",\n      \"io.modelcontextprotocol/clientCapabilities\": {}\n    }\n  }\n}", mark: [3, 4, 5, 14, 15] },
    { t: "code", lang: "json", caption: "The result. Every result carries resultType; content[] is what the model reads; isError marks an execution error the model may learn from.", text: "{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"result\": {\n    \"resultType\": \"complete\",\n    \"content\": [ { \"type\": \"text\", \"text\": \"week: 2\\n\" } ],\n    \"isError\": false\n  }\n}" },
    { t: "define", terms: [
      { term: "host", def: "The application the user runs; it owns the conversation and the user's consent." },
      { term: "client", def: "A connector inside the host, one per server." },
      { term: "server", def: "A program exposing tools, resources and prompts; it sees only its own client." },
      { term: "tool", def: "A named operation with a JSON Schema; the model chooses to call it." },
      { term: "resource", def: "Addressable content the application reads into context." },
      { term: "prompt", def: "A server-authored template the user picks." }
    ] },
    { t: "figure", name: "mcpArch", caption: "One host, several clients, one server per client. The host holds the context and the consent; a server sees only its own client." },
    { t: "h", text: "The 2026-07-28 shape" },
    { t: "p", text: "Revision 2026-07-28 was the largest since MCP launched and it broke compatibility on purpose [[R1·F1]]." },
    { t: "list", items: [
      "**Stateless requests.** No request may depend on an earlier one on the same connection. Anything that spans calls travels as an explicit identifier, authorized each time. A handle is a name; it carries no authority of its own [[R11·§2]].",
      "**Per-request declaration.** Version and client capabilities ride in `_meta` on every request; a server must not rely on anything undeclared, and a request for a version the server lacks is refused with `-32022` and the list it does support [[R11·§5]].",
      "**Ask by returning (MRTR, Multi Round-Trip Requests).** A server that needs input does not call the client. It returns `resultType: \"input_required\"` with `inputRequests` and an opaque `requestState`; the client gathers the input and re-issues the original request with the state echoed. The state is attacker-controlled input: the page makes integrity protection a MUST where the state influences authorization, resource access or business logic, and binding to the principal, a short lifetime and a tie to the request a SHOULD [[R11·§2]].",
      "**Discovery.** `server/discover` returns supported versions, capabilities and instructions, cacheable with a `ttlMs`. Calling it is optional [[R11·§1a]].",
      "**Tasks as an extension.** Long work moved out of the core into `io.modelcontextprotocol/tasks`: a durable handle with five states (`working`, `input_required`, `completed`, `failed`, `cancelled`), polled with `tasks/get`, cancelled cooperatively, with no listing, and whose id is a bearer secret [[R11·§3]].",
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
    { t: "p", text: "MCP's security section asks hosts to obtain explicit consent before exposing user data and before invoking any tool, and then says the protocol \"cannot enforce these principles at the protocol level\" [[R11·§4]]. The specification is right about its own limits: consent is a human act inside the host, and the wire carries only the call. What follows is a set of rules about trusting nothing the wire says about itself." },
    { t: "p", text: "A tool's annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) are hints; clients must treat them as untrusted unless the server is trusted, the schema comment says never to decide tool use from them, and the defaults are pessimistic, with `destructiveHint` and `openWorldHint` both true [[R11·§1a]]. A tool name is unique per server only; one 2026 study ran two servers with an identically named tool and saw the wrong provider execute in 52 of 100 trials, which it attributed to a missing cryptographic binding between tool and provider [[R1·F2]]. And a client must send an RFC 8707 `resource` so that a token is bound to one server, while a server must never pass a received token upstream [[R11·§4]]." },
    { t: "callout", kind: "brobber", title: "What a hub red team saw about consent", text: "In brobber's red team of an MCP hub design, approvals that were given once did not hold: the design that survived filtered the tool list per caller and re-authorised every single call, so that consent was a property of each request, with no session carrying it forward. The other findings from that exercise are listed, one per runnable case, in [[lesson:attack|the attack lesson]]." },
    { t: "h", text: "Two failure channels" },
    { t: "p", text: "MCP separates a protocol error (a JSON-RPC error: unknown tool, malformed params) from an execution error (a normal result with `isError: true`), and asks clients to pass execution errors to the model so it can correct itself [[R11·§2]]. Between two owners a third outcome is missing: a decline on policy. Without a distinct word for it, a gate's refusal reads as a bug, and a model told to self-correct on errors will route around a refusal the way [[lesson:problem|the deployed agent in the first lesson]] drove the user interface [[R11·§7]]. Membrane's `refused` with a reason code is that third channel." },
    { t: "quiz", q: "brainboi exposes its inbox as an MCP server. Halfway through a `tools/call`, the server needs Vlad to confirm a value before it can finish. What does a conforming 2026-07-28 server do?", options: [
      "Sends a JSON-RPC request to the client over the open response stream, as `elicitation/create`, and waits for the client's answer before finishing",
      "Returns an interim result carrying the question and an opaque token, and finishes when the client re-issues the call with the answer",
      "Opens a `subscriptions/listen` stream, publishes the question on it as a notification, and resumes when the client posts the answer to the same endpoint",
      "Fails the call with -32602 and a message naming the missing value, so the client can ask the user and send a corrected call"
    ], answer: 1, explain: "Servers never initiate requests in this revision. The interim result is `input_required`, the token is `requestState`, and the client retries the same call with `inputResponses`. Membrane borrows the token as the `state` field: the receiver holds nothing between turns, so a pending exchange sits in quarantine by construction.", why: [
      "Server-initiated requests were removed; a server that sends one is non-conforming.",
      "Correct: Multi Round-Trip Requests.",
      "The listen stream carries change notifications only.",
      "-32602 is for invalid params, a protocol error, and ends the call."
    ] },
    { t: "quiz", q: "A server's `delete_record` tool is annotated `destructiveHint: false`. The host's user has never seen this server before. What may the host conclude?", options: [
      "The tool is safe to run without asking, since the server has declared the operation non-destructive and the host must honour declared annotations",
      "Nothing about safety; the annotation is a hint from an untrusted server, and consent is still the host's to obtain",
      "The server is lying, since a tool named delete is always destructive, and the host should refuse to list the tool to the model at all",
      "The schema is invalid, because `destructiveHint` defaults to true and a server may only omit the field; setting it to false is forbidden"
    ], answer: 1, explain: "Annotations are self-description. Clients must treat them as untrusted unless the server is trusted, and the host must still obtain consent before invoking any tool. The pessimistic default exists for servers that say nothing; a server that says something is still a server.", why: [
      "Hints never settle safety.",
      "Correct.",
      "Maybe, and the host cannot know; the point is that it need not decide.",
      "A default is what applies when the field is absent; setting it false is valid."
    ] },
    { t: "callout", kind: "parent", title: "What Membrane takes from here", text: "Per-request declaration becomes the `membrane` field and the contract hash on every message. Statelessness becomes `context` and `re` carried on every message, with authority rechecked each time. The MRTR `requestState` recipe becomes the optional `state` field, which the playground's gate does not check yet. Audience binding becomes the no-passthrough rule. What breaks: one host consenting for all servers. Between two owners there is no shared host, so consent moves to each receiver's gate, outside the agent, under its owner's tiers [[R11·§7]]. [[lesson:gap|The next lesson]] sorts the whole list." },
    { t: "takeaways", items: [
      "MCP is JSON-RPC between a host's clients and servers; since 2026-07-28 every request declares its version and capabilities and nothing depends on connection state.",
      "A server that needs input returns input_required with an opaque state and the client retries.",
      "Consent lives at the host and the protocol cannot enforce it; annotations are untrusted hints with pessimistic defaults.",
      "A policy refusal needs a third channel beside protocol and execution errors, or it reads as a bug to route around."
    ] },
    { t: "deeper", links: [ { research: "R11", label: "R11 · MCP distilled: essence and extension map" }, { research: "R1", label: "R1 · the landscape, F1 and F2" }, { href: "https://modelcontextprotocol.io/specification/2026-07-28/changelog", label: "MCP 2026-07-28 changelog" }, { href: "https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http", label: "Streamable HTTP transport (2026-07-28)" } ] },
    { t: "tutor", prompts: [ "Why is a task id a bearer secret, and what does Membrane do instead?", "If annotations are untrusted, what is `destructiveHint` for?", "How would the 52-of-100 wrong-provider result show up between two Membrane peers?", "Where does the MRTR `requestState` live between the two calls, and who could tamper with it?", "Which of the six 2026-07-28 changes would break first if two owners shared one MCP server?" ] }
  ]
});
