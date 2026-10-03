Course.lesson({
  id: "jsonrpc", part: "foundations", title: "JSON-RPC and HTTP",
  kicker: "The wire format underneath both parents",
  minutes: 8,
  refs: ["R11·§2", "R10·§8", "R10·§9"],
  objectives: [
    "Write a JSON-RPC 2.0 request, notification, response and error by hand.",
    "Name the reserved error codes and the ranges MCP and A2A allocate from.",
    "Say how one HTTP POST carries a request and how a server-sent-events stream carries a long answer."
  ],
  summary: "JSON-RPC 2.0 is a remote-procedure-call format in JSON with four objects. A Request has jsonrpc (exactly \"2.0\"), method, optional params and an id; a Request without an id is a Notification and gets no response. A Response has the same id and exactly one of result or error. An Error has an integer code, a short message and optional data; -32700 to -32603 are reserved and -32000 to -32099 are for implementation-defined server errors. MCP and A2A both ride JSON-RPC over HTTP: each message is an HTTP POST, the answer is either one JSON body or a server-sent-events stream, and status codes carry the transport-level verdict. MCP reserves -32020 to -32099; A2A uses -32001 to -32099.",
  blocks: [
    { t: "p", text: "MCP is JSON-RPC between a host and a server. A2A's default binding is JSON-RPC between two agents. Membrane's own envelope is plain text, and its A2A and MCP bindings put that text inside JSON-RPC. There is less of the format than its name suggests." },
    { t: "h", text: "Four objects" },
    { t: "code", lang: "json", caption: "A request. `jsonrpc` MUST be exactly \"2.0\"; `params` MAY be omitted; `id` MUST be a string, number or null if included. Omitting it makes the message a notification.", text: "{ \"jsonrpc\": \"2.0\", \"id\": 7, \"method\": \"tools/call\",\n  \"params\": { \"name\": \"read_file\", \"arguments\": { \"path\": \"pilot/shareable/week.md\" } } }" },
    { t: "code", lang: "json", caption: "The two possible responses. `result` is required on success and MUST NOT exist on error; `error` the reverse. The `id` MUST equal the request's.", text: "{ \"jsonrpc\": \"2.0\", \"id\": 7, \"result\": { \"content\": [ { \"type\": \"text\", \"text\": \"week: 2\\n\" } ] } }\n\n{ \"jsonrpc\": \"2.0\", \"id\": 7, \"error\": { \"code\": -32601, \"message\": \"Method not found\" } }" },
    { t: "code", lang: "json", caption: "A notification: no `id`, so no response is expected. MCP's `notifications/progress` and `notifications/cancelled` have this shape.", text: "{ \"jsonrpc\": \"2.0\", \"method\": \"notifications/progress\",\n  \"params\": { \"progressToken\": \"p1\", \"progress\": 3, \"total\": 5 } }" },
    { t: "define", terms: [
      { term: "JSON-RPC 2.0", def: "A stateless remote-procedure-call format in JSON, from jsonrpc.org." },
      { term: "Request", def: "`jsonrpc`, `method`, optional `params`, and an `id` the client chooses." },
      { term: "Notification", def: "A Request without an `id`; it gets no response." },
      { term: "Response", def: "The request's `id` with exactly one of `result` or `error`." },
      { term: "server-sent events", def: "An open `text/event-stream` response carrying `data:` lines." }
    ] },
    { t: "table", head: ["Code", "Message", "Meaning"], rows: [
      ["-32700", "Parse error", "invalid JSON was received"],
      ["-32600", "Invalid Request", "the JSON is not a valid Request object"],
      ["-32601", "Method not found", "the method does not exist or is not available"],
      ["-32602", "Invalid params", "invalid method parameters"],
      ["-32603", "Internal error", "internal JSON-RPC error"],
      ["-32000 to -32099", "Server error", "reserved for implementation-defined server errors"]
    ], caption: "The reserved codes from the JSON-RPC 2.0 specification. Everything from -32768 to -32000 is reserved; application errors live outside that range." },
    { t: "p", text: "Both parents allocate from the server-error range." },
    { t: "p", text: "MCP keeps -32000 to -32019 as legacy codes with no new allocations and defines -32020 (`HeaderMismatch`), -32021 (`MissingRequiredClientCapability`) and -32022 (`UnsupportedProtocolVersion`) in the range it reserves to -32099 [[R11·§2]]. A2A uses -32001 to -32099 for its own: `TaskNotFoundError` is -32001, `ExtensionSupportRequiredError` -32008, `VersionNotSupportedError` -32009, with an `error.data` array of typed objects carrying a reason such as `TASK_NOT_FOUND` [[R10·§9]]. Membrane's reason codes are words and travel in a header field; the bindings map them onto these numbers where a transport needs one. A batch is an array of Request objects answered with an array of Response objects; neither MCP's 2026-07-28 revision nor A2A's bindings rely on it, and this course does not use it." },
    { t: "h", text: "The HTTP underneath" },
    { t: "p", text: "HTTP gives JSON-RPC a transport. A client sends a request as the body of an HTTP `POST` to one endpoint URL, with `Content-Type: application/json`, and the server answers with a status code and a body. The simple pattern is `200 OK` with a single JSON object, the response. The streaming pattern is `200 OK` with `Content-Type: text/event-stream`, an open connection on which the server writes `data:` lines, each a JSON-RPC message, until the final response closes it. MCP's Streamable HTTP uses both and requires the client to accept either [[R11·§2]]; A2A's `SendStreamingMessage` returns a stream whose `data:` lines are JSON-RPC responses wrapping status and artifact events [[R10·§8]]." },
    { t: "table", head: ["Status", "What it means in these protocols"], rows: [
      ["200 OK", "a JSON-RPC response or an SSE stream follows"],
      ["202 Accepted", "MCP: a notification was accepted; no body"],
      ["400 Bad Request", "MCP: header mismatch, unsupported protocol version, missing capability; a JSON-RPC error body says which"],
      ["401 Unauthorized", "the server wants credentials; MCP's `WWW-Authenticate` header points at its resource metadata"],
      ["403 Forbidden", "MCP: an invalid `Origin` header, a defence against DNS rebinding"],
      ["404 Not Found", "MCP: the RPC method does not exist; A2A: a task was not found"],
      ["405 Method Not Allowed", "MCP 2026-07-28: a legacy GET or DELETE to the endpoint"]
    ], caption: "Status codes carry the transport's verdict; the JSON-RPC error inside carries the protocol's. Membrane adds a third layer on top, the receiver's disposition, which neither of the two below can express." },
    { t: "p", text: "Headers do one more job in MCP. The 2026-07-28 revision mirrors selected body fields into headers (`MCP-Protocol-Version`, `Mcp-Method`, `Mcp-Name`) so that a load balancer can route without parsing JSON, and requires the server to refuse with -32020 when a header and the body disagree, because a router acting on one source of truth and a server acting on another is a security hole [[R11·§2]]. A2A carries its version in an `A2A-Version` header for the same reason." },
    { t: "quiz", q: "Which of these responses is invalid JSON-RPC 2.0?", options: [ "`{ \"jsonrpc\": \"2.0\", \"id\": 1, \"result\": null }`, because a success must carry a value and null is the absence of one", "`{ \"jsonrpc\": \"2.0\", \"id\": 1, \"error\": { \"code\": -32602, \"message\": \"Invalid params\", \"data\": { \"param\": \"path\" } } }`", "`{ \"jsonrpc\": \"2.0\", \"id\": 1, \"result\": {}, \"error\": { \"code\": -32603, \"message\": \"oops\" } }`", "`{ \"jsonrpc\": \"2.0\", \"id\": null, \"error\": { \"code\": -32700, \"message\": \"Parse error\" } }`, because an id of null can never match a request" ], answer: 2, explain: "A response carries exactly one of `result` or `error`. A null result is a valid success; a parse error legitimately has a null id because the request's id could not be read.", why: [ "Valid: `result` may be any JSON value, including null.", "Valid error response.", "Correct: both members present.", "Valid: when the request could not be parsed, the id is null." ] },
    { t: "quiz", q: "brainboi's MCP server receives a POST whose `Mcp-Name` header says `read_file` and whose body names `delete_file`. What does a conforming server do?", options: [ "Runs `read_file`, since the mirrored headers exist so that routers and servers act on the same value, and the header is the one a router already acted on", "Runs `delete_file`, since the JSON-RPC body is the authoritative request and the headers are a routing convenience the server may ignore", "Refuses with 400 and -32020, because the header and the body disagree", "Runs neither and returns 202 Accepted, the status for a message the server has taken but not acted on, and logs the mismatch for the operator" ], answer: 2, explain: "Two sources of truth is the hole: a router that acts on the header and a server that acts on the body can be made to disagree. The server validates the mirror and refuses a mismatch.", why: [ "Routers read headers; servers must check them against the body.", "Authoritative or not, the mismatch itself is the fault.", "Correct.", "202 is for accepted notifications." ] },
    { t: "takeaways", items: [
      "Request, Notification (no id), Response (one of result or error), Error (integer code, message, data).",
      "-32700 to -32603 are reserved; -32000 to -32099 are the server range both parents allocate from.",
      "Over HTTP: one POST per message; the answer is one JSON body or an SSE stream; mirrored headers must match the body."
    ] },
    { t: "deeper", links: [ { href: "https://www.jsonrpc.org/specification", label: "JSON-RPC 2.0 specification" }, { href: "https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http", label: "MCP · Streamable HTTP (2026-07-28)" }, { research: "R10", label: "R10 §8 and §9 · A2A operations and error codes" }, { research: "R11", label: "R11 §2 · the MCP request envelope" } ] }
  ]
});
