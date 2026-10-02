# R11 MCP essence (revision 2026-07-28)

Opened 2026-09-14. Current revision per the versioning page: `2026-07-28`. Background: R1 F1 (the stateless turn), F2 (boundary failures). Every row carries a source key; `opened` = read on the primary page via WebFetch; `opened, digest` = the fetch returned a summarizer digest rather than raw text (tasks site, schema.ts), so exact wording is less certain; `unverified` = not confirmed.

Source keys (base `https://modelcontextprotocol.io/specification/2026-07-28`):
- **IDX** `/` · **CL** `/changelog` · **ARCH** `/architecture` · **BASE** `/basic` · **PAT** `/basic/patterns` · **MRTR** `/basic/patterns/mrtr` · **SUB** `/basic/patterns/subscriptions` · **CAN** `/basic/patterns/cancellation` · **PRG** `/basic/patterns/progress` · **VER** `/basic/versioning` · **DISC** `/server/discover`
- **TOOLS** `/server/tools` · **RES** `/server/resources` · **PR** `/server/prompts` · **COMP** `/server/utilities/completion` · **LOG** `/server/utilities/logging` · **ELIC** `/client/elicitation` · **SAMP** `/client/sampling` · **ROOTS** `/client/roots`
- **AUTH** `/basic/authorization` · **ASD** `/basic/authorization/authorization-server-discovery` · **REG** `/basic/authorization/client-registration` · **SEC** `/basic/authorization/security-considerations` · **DEP** `/deprecated`
- **VP** https://modelcontextprotocol.io/specification/versioning · **LIFE** https://modelcontextprotocol.io/community/feature-lifecycle
- **TX** https://tasks.extensions.modelcontextprotocol.io (overview) · **TXS** https://tasks.extensions.modelcontextprotocol.io/specification/2026-07-28/tasks.html
- **SCH** https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/schema/2026-07-28/schema.ts (ToolAnnotations and Annotations quoted verbatim; unions and capability interfaces from digest)

## 1. Primitives, exact names, 2026 status

### 1a. Server features

| Feature | Status | Methods | Key fields | Notifications | Src |
|---|---|---|---|---|---|
| Tools | Active, core. Model-controlled | `tools/list` (paginated, cacheable), `tools/call` (may return `input_required`) | `Tool`: `name` (1-128 chars, `[A-Za-z0-9_.-]`, unique per server only), `title`, `description`, `icons`, `inputSchema` (JSON Schema 2020-12 default, `type:"object"`, not null), `outputSchema` (optional; if present server MUST conform, client SHOULD validate), `annotations`, `_meta`. Result: `content[]` (text, image, audio, `resource_link`, `resource`), `structuredContent` (any JSON), `isError`. Property-level `x-mcp-header` mirrors a primitive arg into `Mcp-Param-{name}` HTTP header. No `execution`/`taskSupport` field in schema | `notifications/tools/list_changed` (only on a `subscriptions/listen` stream with `toolsListChanged:true`) | `opened` TOOLS, SCH, CL |
| ToolAnnotations | Active; all hints | (on `Tool.annotations`) | `title`; `readOnlyHint` default false; `destructiveHint` default **true** (meaningful only if readOnly false); `idempotentHint` default false (same condition); `openWorldHint` default **true**. Schema comment: hints are not faithful, clients should never decide tool use from annotations of untrusted servers | none | `opened` SCH verbatim, TOOLS |
| Resources | Active, core. Application-driven | `resources/list`, `resources/read` (may return `input_required`), `resources/templates/list` | `Resource`: `uri`, `name`, `title`, `description`, `icons`, `mimeType`, `size`. Contents: `{uri, mimeType, text}` or `{uri, mimeType, blob}`. `Annotations`: `audience` (`user`/`assistant`), `priority` 0..1, `lastModified` ISO 8601. Not found = `-32602` (was `-32002`) | `notifications/resources/list_changed`, `notifications/resources/updated` (`uri`) | `opened` RES, SCH |
| Resource templates | Active | `resources/templates/list` | `ResourceTemplate`: `uriTemplate` (RFC 6570), `name`, `title`, `description`, `mimeType`, `icons` | via resources list_changed | `opened` RES |
| Prompts | Active, core. User-controlled | `prompts/list`, `prompts/get` (may return `input_required`) | `Prompt`: `name`, `title`, `description`, `icons`, `arguments[]` (`name`, `description`, `required`). Result `messages[]` of `PromptMessage` (`role` user/assistant, `content`) | `notifications/prompts/list_changed` | `opened` PR |
| Completions | Active (utility) | `completion/complete` | `ref` (`ref/prompt` + `name`, or `ref/resource` + `uri`), `argument` {`name`,`value`}, `context.arguments`. Result `completion` {`values` max 100, `total`, `hasMore`} | none | `opened` COMP |
| Logging | **Deprecated** (SEP-2577), earliest removal first revision on/after 2027-07-28. Migrate to stderr / OpenTelemetry | `logging/setLevel` **removed**; level per request via `_meta` `io.modelcontextprotocol/logLevel` | levels RFC 5424 (debug..emergency) | `notifications/message` {`level`,`logger`,`data`}, request-scoped only, never without logLevel | `opened` LOG, CL, DEP |
| Subscriptions | Active, core pattern (replaces `resources/subscribe`/`unsubscribe` and HTTP GET) | `subscriptions/listen` {`notifications`: `toolsListChanged`, `promptsListChanged`, `resourcesListChanged`, `resourceSubscriptions[]`} | server MUST first send `notifications/subscriptions/acknowledged` with the honored subset; every stream message carries `io.modelcontextprotocol/subscriptionId` (= the listen request's JSON-RPC id) | graceful end = a `complete` result to the listen request | `opened` SUB, CL |
| Discovery | Active, MUST implement | `server/discover` | `DiscoverResult`: `supportedVersions[]`, `capabilities`, `instructions`, `ttlMs`, `cacheScope`, `_meta.io.modelcontextprotocol/serverInfo` | none | `opened` DISC, SCH |

`ServerCapabilities`: `tools{listChanged}`, `resources{subscribe,listChanged}`, `prompts{listChanged}`, `completions`, `logging`, `experimental`, `extensions{<id>:{settings}}`. `opened, digest` SCH; `opened` TOOLS, RES, PR.

### 1b. Client features (all delivered as `inputRequests` inside a server result; servers MUST NOT initiate JSON-RPC requests)

| Feature | Status | Method (inside `inputRequests`) | Key fields | Src |
|---|---|---|---|---|
| Elicitation, form | Active, core (the only client feature IDX lists) | `elicitation/create` `mode:"form"` (default if omitted) | `message`, `requestedSchema` (flat object of primitives: string with `email`/`uri`/`date`/`date-time`, number/integer, boolean, single/multi enum). Result `action`: `accept` (with `content`) / `decline` / `cancel`. MUST NOT request passwords, API keys, tokens, payment credentials | `opened` ELIC |
| Elicitation, URL | Active, marked "new in 2025-11-25, may change" | `elicitation/create` `mode:"url"`, `url` | `accept` means consent to navigate, not completion; outcome learned on retry. Client MUST NOT prefetch, MUST show full URL, MUST get consent, MUST open in a surface the client/LLM cannot inspect. `elicitationId` and `notifications/elicitation/complete` **removed**; `-32042` retired. Server MUST verify the user who opens the URL is the one who triggered it | `opened` ELIC, CL, BASE |
| Sampling | **Deprecated** (SEP-2577), migrate to direct provider APIs | `sampling/createMessage` | `messages`, `modelPreferences` {`hints[].name`, `costPriority`, `speedPriority`, `intelligencePriority`}, `systemPrompt`, `includeContext` (`thisServer`/`allServers` deprecated), `temperature`, `maxTokens` (required, MUST respect), `stopSequences`, `metadata`, `tools`, `toolChoice` {`mode`: auto/required/none}. Result `role`, `content`, `model`, `stopReason` (`endTurn`/`stopSequence`/`maxTokens`/`toolUse`) | `opened` SAMP, DEP |
| Roots | **Deprecated** (SEP-2577), migrate to tool params / resource URIs / config | `roots/list` | `roots[]` {`uri` (MUST be `file://`), `name`}. Informational, not access control. `notifications/roots/list_changed` **removed** | `opened` ROOTS, CL |

`ClientCapabilities`: `elicitation{form,url}` (empty object = form only), `sampling{tools,context}`, `roots`, `experimental`, `extensions`. `opened` ELIC, SAMP; `opened, digest` SCH.

## 2. The request envelope

| Element | Exact form | Rule | Src |
|---|---|---|---|
| Message types | JSON-RPC 2.0 request (`id` string/int, never null, unique among the sender's in-flight), result, error, notification (no `id`) | Servers MUST NOT initiate requests; clients send no responses | `opened` BASE, PAT |
| `_meta` required keys | `io.modelcontextprotocol/protocolVersion` (string), `io.modelcontextprotocol/clientCapabilities` | Missing = malformed, `-32602`, HTTP 400. Server MUST NOT rely on undeclared capabilities | `opened` BASE |
| `_meta` optional keys | `io.modelcontextprotocol/clientInfo` (SHOULD), `io.modelcontextprotocol/logLevel`, `progressToken`, `io.modelcontextprotocol/subscriptionId` (on stream notifications), `traceparent`/`tracestate`/`baggage` (W3C, prefix exception); result side `io.modelcontextprotocol/serverInfo` (SHOULD) | clientInfo/serverInfo self-reported, SHOULD NOT drive behaviour or security | `opened` BASE, CL |
| `_meta` key grammar | optional reverse-DNS prefix + `/` + name; any prefix whose second label is `modelcontextprotocol` or `mcp` is reserved | extensions: official under `io.modelcontextprotocol/`, third parties under their own prefix | `opened` BASE |
| HTTP headers | `MCP-Protocol-Version`, `Mcp-Method`, `Mcp-Name` (required on POST), `Mcp-Param-{name}`; `Mcp-Session-Id` **removed** | mismatch = `HeaderMismatch` `-32020` | `opened` CL, VP, TOOLS |
| `resultType` | required on every result: `"complete"`, `"input_required"`; extensions add values (tasks: `"task"`) | absent = treat as `complete` (legacy); unrecognized = invalid | `opened` BASE, TXS |
| Cacheable results | `ttlMs` (ms, freshness hint), `cacheScope` `public`/`private` required on list/read/templates/discover results | complements list_changed | `opened` CL, DISC |
| `server/discover` | params only `_meta`; result above | optional to call; any request may go inline and handle the version error | `opened` DISC, VER |
| MRTR interim | `InputRequiredResult` {`resultType:"input_required"`, `inputRequests` (map: server-chosen key to `ElicitRequest`/`CreateMessageRequest`/`ListRootsRequest`), `requestState` (opaque string)}; at least one of the two present | only on `tools/call`, `resources/read`, `prompts/get`; MUST NOT include a request type the client did not declare | `opened` MRTR |
| MRTR retry | same method and params + `inputResponses` (same keys) + `requestState` echoed exactly; new JSON-RPC `id` | client MUST NOT inspect or modify state; MUST NOT reuse it on parallel requests; server MUST NOT assume a retry comes | `opened` MRTR, TOOLS |
| `requestState` security | attacker-controlled input; if it influences authz/business logic, MUST be integrity protected (HMAC/AEAD) and rejected on failure; SHOULD bind principal, short TTL, method + digest of params | not single-use: one-time semantics MUST be enforced server-side | `opened` MRTR |
| Statelessness | no request may depend on prior requests on the connection; cross-request state MUST travel as an explicit identifier; a handle is a name, not a capability, for authenticated servers | tool/resource/prompt lists MAY vary by authorization, MUST NOT vary per connection | `opened` BASE, TOOLS, RES |
| Error codes | JSON-RPC `-32700`, `-32600`..`-32603`; `-32000`..`-32019` legacy, no new allocations; `-32020`..`-32099` MCP-reserved: `-32020` HeaderMismatch, `-32021` MissingRequiredClientCapability (`data.requiredCapabilities`), `-32022` UnsupportedProtocolVersion (`data.supported[]`, `data.requested`); retired `-32002`, `-32042` | app errors SHOULD sit outside `-32768`..`-32000`; local errors must not look like peer errors | `opened` BASE, VER, SCH |
| Tool errors | protocol error (JSON-RPC error: unknown tool, malformed) vs execution error (`isError:true` result, fed to the model for self-correction) | clients SHOULD pass execution errors to the model | `opened` TOOLS |
| Cancellation | `notifications/cancelled` {`requestId`, `reason`}; on Streamable HTTP closing the response stream IS cancellation; on stdio the notification is required | server sends it only to end a `subscriptions/listen`; races tolerated; receivers SHOULD ignore late responses; SHOULD enforce a max timeout even with progress | `opened` CAN |
| Progress | `_meta.progressToken` (string/int, unique among active requests); `notifications/progress` {`progressToken`, `progress` (MUST increase), `total`, `message`} on the request's own stream | MUST stop after completion | `opened` PRG, PAT |
| Removed | `initialize`, `notifications/initialized`, `ping`, `logging/setLevel`, protocol sessions, SSE resumability (`Last-Event-ID`): a broken stream loses the request, client MUST re-issue with a new id | | `opened` CL |

## 3. Tasks extension `io.modelcontextprotocol/tasks`

| Item | Exact form | Src |
|---|---|---|
| Negotiation | client: `_meta.io.modelcontextprotocol/clientCapabilities.extensions["io.modelcontextprotocol/tasks"]:{}`; server: `capabilities.extensions` in discover | `opened, digest` TXS |
| Opt-in | no per-request opt-in: a server MAY return a task handle instead of a result, MUST NOT to a client lacking the capability on that request. Only `tools/call` supports it today | `opened, digest` TXS, TX; `opened` CL |
| Handle | `CreateTaskResult` {`resultType:"task"`, `taskId`, `status`, `statusMessage`, `createdAt`, `lastUpdatedAt`, `ttlMs` (null = unlimited, may change), `pollIntervalMs` (client SHOULD honor)} | `opened, digest` TXS |
| Durability | server MUST NOT return the handle until `tasks/get` on it would resolve | `opened, digest` TXS |
| States | `working`, `input_required` (adds `inputRequests`), `completed` (adds `result`, including tool results with `isError:true`), `failed` (adds `error`, JSON-RPC errors only; MUST NOT represent `isError`), `cancelled`. Terminal: completed, failed, cancelled | `opened, digest` TXS |
| Methods | `tasks/get` {`taskId`} returns `DetailedTask`; `tasks/update` {`taskId`, `inputResponses`} acks with empty `complete`; `tasks/cancel` {`taskId`} cooperative. Removed from the old core design: `tasks/result` (blocking), `tasks/list` | `opened, digest` TXS; `opened` CL |
| Push | `notifications/tasks` carrying full `DetailedTask`, via `subscriptions/listen` with `notifications.taskIds[]` | `opened, digest` TXS |
| Errors | `-32602` unknown taskId, `-32603` internal, `-32021` capability missing | `opened, digest` TXS |
| Security | taskId MUST be unguessable (bearer); authn/authz MUST be checked on every task request; no listing so callers cannot see each other's tasks; hosts MUST treat task `inputRequests` with the same trust as ordinary elicitation ("not a higher-trust channel") | `opened, digest` TXS |

Other official extensions named on IDX: MCP Apps `io.modelcontextprotocol/ui`, Skills over MCP (working group; status `unverified`). Extension fallback rule: if only one side supports an extension, the supporter MUST revert to core behaviour or reject. `opened` IDX, VER.

## 4. Security and auth model

| Item | Content | Src |
|---|---|---|
| Scope | authorization OPTIONAL; HTTP transports SHOULD conform; stdio SHOULD NOT (credentials from environment); custom schemes MAY be negotiated | `opened` AUTH, BASE |
| Roles | MCP server = OAuth 2.1 resource server; MCP client = OAuth 2.1 client acting for a resource owner; authorization server issues tokens (co-hosted or separate) | `opened` AUTH |
| Protected Resource Metadata | server MUST implement RFC 9728 with at least one `authorization_servers`; discovery via `WWW-Authenticate: Bearer resource_metadata=...` on 401, else `/.well-known/oauth-protected-resource/<path>` then root | `opened` ASD |
| AS metadata | RFC 8414 and OIDC Discovery; client MUST try path-inserted oauth, path-inserted OIDC, path-appended OIDC; `issuer` MUST equal the identifier used to build the URL | `opened` ASD |
| Registration order | pre-registered, then CIMD if `client_id_metadata_document_supported`, then DCR (deprecated), then ask the user | `opened` REG, DEP |
| CIMD | `client_id` is an HTTPS URL with a path to a JSON doc with at least `client_id` (must equal URL), `client_name`, `redirect_uris`; AS fetches, validates, caches; portable across ASes; risks: SSRF, localhost redirect impersonation; AS MAY apply domain trust policies | `opened` REG, SEC |
| Token binding | client MUST send RFC 8707 `resource` (canonical server URI) on authz and token requests; server MUST validate audience; server MUST NOT accept or transit other tokens; no token passthrough upstream | `opened` AUTH, SEC |
| Flow hardening | PKCE `S256` MUST, refuse if `code_challenge_methods_supported` absent; RFC 9207 `iss` check before redeeming code; credentials keyed by issuer, re-register on AS change; HTTPS endpoints; exact redirect match | `opened` AUTH, SEC, REG, CL |
| Scopes | `scope` in 401/403 challenge authoritative for the operation; runtime `insufficient_scope` 403; server SHOULD put all needed scopes in one challenge; client unions old and new scopes (step-up) with retry limits | `opened` AUTH |
| Consent principles | users explicitly consent to data access and operations; hosts MUST get consent before exposing user data and before invoking any tool; MCP "cannot enforce these principles at the protocol level" | `opened` IDX |
| Untrusted hints | IDX: annotations untrusted unless from a trusted server. TOOLS: clients MUST treat annotations as untrusted unless from trusted servers. SCH: never decide tool use from untrusted servers' annotations. Self-reported `clientInfo`/`serverInfo` not for security; `serverInfo.name` not unique, SHOULD NOT disambiguate tools | `opened` IDX, TOOLS, SCH, BASE, DISC |
| Tool safety | SHOULD keep a human able to deny invocations; servers MUST validate inputs, access-control, rate limit, sanitize outputs; clients SHOULD show inputs before calling, validate results before the LLM, time out, log for audit | `opened` TOOLS |
| Isolation | servers should not read the whole conversation nor see into other servers; host enforces the boundary and controls cross-server interaction | `opened` ARCH |
| Schema safety | no automatic network `$ref` dereference; bound composition-keyword cost (DoS) | `opened` BASE |

## 5. Versioning and lifecycle

| Item | Content | Src |
|---|---|---|
| Version id | `YYYY-MM-DD` = date of last backward-incompatible change; not bumped for compatible changes | `opened` VP |
| Revision states | Draft, Current (may still get compatible changes), Final | `opened` VP |
| Negotiation | per request; unsupported = `-32022` with `supported[]`; client retries or surfaces error; both sides MAY support many versions | `opened` VP, VER |
| Eras | modern (per-request `_meta`, 2026-07-28+) vs legacy (`initialize`, 2025-11-25 and earlier); dual-era servers pick by how the client opens; stdio clients probe with `server/discover` | `opened` VER |
| Feature states | Active, Deprecated (in spec, migration path documented, `@deprecated` in schema, registry entry), Removed (deleted from draft, lives on in its last Final revision) | `opened` LIFE |
| Window | at least 12 months from the release of the revision that first marks it; eligible at the first Current revision on/after that; expedited floor 90 days only for an active, advisory-backed security risk with no in-place fix; deprecation reversible by SEP | `opened` LIFE, VP |
| Registry now | Roots, Sampling, Logging, DCR (all from 2026-07-28, earliest removal on/after 2027-07-28); `includeContext` values; HTTP+SSE transport. Removed: none yet | `opened` DEP |
| Process | every change is a SEP (PR-based, sponsor, labels); governance under AAIF per R1 F1 | `opened` CL, LIFE |

## 6. The essence in ten lines

1. **Per-request capability declaration.** Each request states its version and what the sender can handle; the receiver never relies on anything undeclared (BASE `_meta`; ARCH "Capability Negotiation"; `server/discover` in DISC). `opened`
2. **Typed invocation with two failure channels.** Named operations with JSON Schema input and output, and a split between protocol errors and execution errors the caller can learn from (TOOLS "Data Types", "Error Handling"). `opened`
3. **Three loci of control.** Tools are model-controlled, resources application-driven, prompts user-controlled: the primitive encodes who decides (TOOLS, RES, PR "User Interaction Model"). `opened`
4. **The host holds the context.** Servers see only what they need and never each other; the host enforces the boundary (ARCH "Design Principles" 3). `opened`
5. **Consent lives at the host, not in the wire.** Explicit consent before data exposure and tool invocation, which the protocol admits it cannot enforce (IDX "Security and Trust & Safety"). `opened`
6. **Self-description is untrusted.** Annotations, names and self-reported identity are hints; defaults are pessimistic (destructive, open-world) (TOOLS warning; SCH `ToolAnnotations`; BASE note on clientInfo). `opened`
7. **Stateless requests, explicit handles.** No connection state; anything that spans calls is an identifier passed each time, authorized each time (BASE "Statelessness"; TOOLS "Stateful Tools"). `opened`
8. **Ask by returning, not by calling back.** A receiver that needs input returns `input_required` plus integrity-protected opaque state and lets the caller retry (MRTR). `opened`
9. **Long work is a durable, pollable, bearer handle** with five states, no listing, per-call auth and cooperative cancel (TXS "Security", states). `opened, digest`
10. **Evolve by dated breaks, namespaced opt-in extensions with mandatory fallback, and a twelve-month deprecation floor** (VP; VER "Extension Negotiation"; LIFE). `opened`

## 7. Extension map: MCP idea to peer agent protocol

Verdict: **borrow** = take as is; **extend** = keep the shape, add fields or semantics; **breaks** = the MCP assumption fails between autonomous agents with different owners. House primitive per BRIEF.

| MCP idea | MCP form | Peer-to-peer form | Verdict | House primitive | Src |
|---|---|---|---|---|---|
| Client/host/server roles | host owns context; client-initiated only; servers MUST NOT send requests | each agent is its own host and exposes a server face to the other; build as two one-way MCP-shaped channels, one per direction, like the two-folder precedent | **breaks** (wire asymmetry is normative) | two folders, two directions | `opened` ARCH, PAT |
| `server/discover` | versions, capabilities, instructions, cacheable; serverInfo unverified | agent self-description signed and anchored to an identity (CIMD-style HTTPS URL or key); receiver caches by `ttlMs` | **extend** (add signature and identity anchor) | anchor | `opened` DISC, REG |
| Per-request `_meta` | version + capabilities + trace context on every message | same, plus reverse-DNS keys for sender identity, contract id, receipt id; `traceparent` correlates both sides' receipts | **borrow** | receipt, watermark | `opened` BASE |
| Capability gating | sender MUST NOT send request types the receiver did not declare; `-32021` | receiver's declared capabilities become its standing terms: what it will accept at all | **borrow** | authority tier | `opened` MRTR, BASE |
| Tools + schemas | named, JSON Schema in/out, `structuredContent` | offered actions under a contract; schema checked at the receiver's gate before the agent sees the call | **borrow** schema; **extend** with effect class and contract ref | hook (gate enforces) | `opened` TOOLS |
| Annotations | readOnly/destructive/idempotent/openWorld hints, pessimistic defaults, untrusted | declared effect class that the receiver recomputes from the action and its own policy; a declared class later contradicted by the effect is a demotion event | **extend** (claim plus recomputation plus consequence); borrow pessimistic defaults | demotion, recoverable reputation | `opened` SCH, TOOLS |
| Tool names scoped per server | collisions left to aggregators; serverInfo name not unique | names qualified by the peer identity and bound to it, so the same name from two peers never resolves wrong (R1 F2: 52/100 wrong-provider) | **extend** | anchor | `opened` TOOLS; R1 F2 |
| Resources | URI, audience, priority, lastModified, `cacheScope` public/private | shareable data under a contract: provenance, permitted use, onward-sharing flag, and a quarantine status on arrival; `cacheScope` is the seed of a use-scope | **extend** | constructed layer, quarantine | `opened` RES, CL |
| Subscriptions ack | ack lists the subset the server will honor | every accepted request is acked with the terms actually accepted, not the terms asked | **borrow** | receipt | `opened` SUB |
| Prompts | server-authored templates the user picks | a peer's template is foreign instruction text; it enters quarantine, never the kernel | **breaks** as a trust class; keep only as quarantined data | kernel, quarantine | `opened` PR |
| Completions | argument autocompletion | convenience, not protocol | out | none | `opened` COMP |
| Elicitation (form) | receiver asks the human for flat data; accept/decline/cancel | a question back to the sending agent in the same context via `input_required`; the triad applies to every request; the answer says whether the peer agent or its owner answered | **extend** | request with acceptance | `opened` ELIC, MRTR |
| Elicitation (URL) | out-of-band human channel for secrets; accept = consent, not completion | owner-to-owner out-of-band channel for anything that must not pass through either agent | **borrow** (incl. "accept is not done") | operator's word | `opened` ELIC |
| Sampling | server borrows the client's model; deprecated | asking the peer to think with its own model and context is a cross-owner compute and leakage risk | out (MCP dropped it too) | none | `opened` SAMP, DEP |
| Roots | client tells server which dirs matter; informational; deprecated | scope belongs in contract terms | out | contract | `opened` ROOTS, DEP |
| MRTR `requestState` | opaque, HMAC/AEAD, principal + TTL + request digest, single-use server-side | continuation token: the receiver holds nothing between turns, so a pending exchange sits in quarantine by construction until the retry | **borrow** whole recipe | quarantine, seal | `opened` MRTR |
| Consent at the host | one human host consents for all servers | no shared human: consent moves to each receiver's gate, outside the agent, governed by its owner's authority tiers | **breaks**; replace with per-receiver gate | hook, authority | `opened` IDX, ARCH; BRIEF incident |
| Isolation principle | server never sees the conversation or other servers | each gate minimizes outbound context too; the peer sees only what the contract names | **borrow** as principle, enforce on both sides | voice gate / outbound gatekeeper | `opened` ARCH |
| Two error channels | protocol error vs `isError` | add a third, distinct outcome: gate refusal (policy decline), so a refusal is never read as a bug to route around | **extend** | incident lesson | `opened` TOOLS; BRIEF |
| Tasks | durable handle, 5 states, bearer id, per-call auth, no list, cooperative cancel, `failed` only for protocol errors | commitments: add deadline, acceptance criterion, a `declined` state before `working`, and a closing verdict; both sides keep a record | **extend** | receipt (task_verdict), tension | `opened, digest` TXS |
| Progress | monotonic `progress`, request-scoped | heartbeat on a commitment; silence past the next cycle escalates | **borrow** plus escalation rule | known-unread escalation | `opened` PRG; BRIEF |
| Cancellation | cooperative, race-tolerant, late responses ignored | same; cancelling a commitment also emits a receipt | **borrow** | receipt | `opened` CAN |
| Explicit handles | state only via ids passed each call; a name, not a capability | contract id and commitment id travel on every message; authority rechecked each time | **borrow** | watermark | `opened` BASE, TOOLS |
| OAuth 2.1 RS/client + PRM | one resource owner, one AS, client to server | mutual: each side is resource server and client to the other; PRM-style metadata on both | **extend** | anchor | `opened` AUTH, ASD |
| Audience binding, no passthrough | RFC 8707 `resource`; never forward received tokens | a peer never forwards authority it received: no transitive delegation unless the contract names it | **borrow** | authority | `opened` SEC |
| CIMD | client id = self-hosted HTTPS metadata URL | agent id = domain-anchored metadata URL; portable across verifiers | **borrow** as identity anchor | anchor | `opened` REG |
| Step-up scopes | all needed scopes in one challenge; union on re-auth | progressive authority: ask for everything a request needs at once; widen tier by tier | **borrow** | authority tiers | `opened` AUTH |
| Versioning + lifecycle | dated breaking versions, per-request rejection with supported list, 12-month deprecation, namespaced extensions with fallback | same, scaled down for two parties | **borrow** | mirror (diffable definitions) | `opened` VP, VER, LIFE |
| Receipts | none (logging deprecated, OTel suggested) | signed completion signal with verdict on every commitment and every refusal | **absent**: new primitive | receipt | `opened` LOG, DEP |
| Quarantine | none; host "SHOULD validate tool results before passing to LLM" | inbound content held until the anchor confirms | **absent**: new primitive | constructed layer | `opened` TOOLS |

## Notes on the sources

- IDX still says extensions are negotiated "during initialization", a leftover from before the handshake was removed (CL item 2). `opened` IDX, CL.
- The spec index links the schema at `github.com/modelcontextprotocol/specification`; the fetch used `modelcontextprotocol/modelcontextprotocol` main. ToolAnnotations defaults and comments were returned verbatim; the capability interfaces and union lists came as a digest.
