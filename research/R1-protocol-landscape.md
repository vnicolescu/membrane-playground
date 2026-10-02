---
thread: R1 – the landscape of agent communication protocols (September 2026)
date: 2026-09-14
sources_opened: 38
---
# R1 – The agent protocol landscape as of September 2026, and what it leaves out

**Method note.** Pages were opened with a fetch tool that returns a model-written digest of the page, not raw text. Where a digest looked wrong (a mis-expanded acronym, a tool count that disagreed with itself), the finding says so. `opened` = read on its primary page through that tool; `secondary` = seen only in search snippets or third-party pages; `unverified` = not confirmed.

**The shape of the field in one paragraph.** Consolidation happened. Anthropic's MCP (agent-to-tool) and Google's A2A (agent-to-agent) are both Linux Foundation projects; IBM's ACP folded into A2A in August 2025; AP2 went to the FIDO Alliance in April 2026; x402 got its own foundation. Both big protocols spent 2026 *shrinking their core* and moving everything else into negotiated extensions. Identity is settling on domain-anchored PKI, DIDs and transparency logs. What nobody standardizes is the layer the seeds live in: quarantine, impact, urgency, recoverable reputation, the goals of the boundary itself. Every protocol leaves those to the agent (defensible, by the end-to-end argument), but they also omit the *vocabulary to signal them across the wire* (not defensible, because the peer cannot act on a verdict it cannot read).

## 1. Findings

### 1a. Protocol by protocol

**F1. MCP 2026-07-28: the core went stateless and completion became a retry.** Owner: Anthropic-originated, donated to the Agentic AI Foundation (AAIF, Linux Foundation) on 2025-12-09; platinum members include AWS, Anthropic, Google, Microsoft, OpenAI. The 2025-11-25 revision added URL-mode elicitation (send the human to a browser page, out of band), tool calling inside sampling, OAuth Client ID Metadata Documents, OpenID Connect discovery, incremental scope consent, and experimental tasks. The 2026-07-28 revision (largest since launch, breaking) removed the initialize handshake and protocol sessions: every request carries version and capabilities in `_meta`, servers must answer `server/discover`. Server-to-client requests (elicitation, sampling, roots) are replaced by Multi Round-Trip Requests: the server returns `resultType: "input_required"` with `inputRequests` and an opaque `requestState`; the client gathers input and *re-issues* the original request. Every result now carries `resultType` (`complete` / `input_required`). Tasks moved out of core into the `io.modelcontextprotocol/tasks` extension (states working, input_required, completed, failed, cancelled; polling via `tasks/get`, input via `tasks/update`; task IDs are bearer tokens). SSE resumability and redelivery were removed: a broken stream loses the request. Sampling, Roots and Logging are deprecated; Dynamic Client Registration is deprecated for CIMD. A feature lifecycle policy guarantees at least twelve months between deprecation and removal.
- Mechanism · state lives at the endpoints, the wire carries only what a stateless retry needs; `requestState` must be treated as attacker-controlled and integrity-protected (HMAC/AEAD), bound to principal, TTL and originating request.
- Failure prevented · sticky-session scaling failure; server-initiated requests that bypass the client's control.
- Cost · delivery guarantees now belong to the client (no redelivery); the protocol has no notion of "received and read".
- Transport · stdio, Streamable HTTP. Discovery · `server/discover`, registry (server.json). Auth · OAuth 2.1 + RFC 9728 protected-resource metadata, RFC 9207 `iss` validation.
- Leaves out · peer identity beyond OAuth client, reputation, message priority, any provenance binding of tool descriptions to a provider.
- Sources: modelcontextprotocol.io/specification/2026-07-28/changelog (2026) `opened`; …/2025-11-25/changelog (2025) `opened`; …/basic/patterns/mrtr (2026) `opened`; tasks.extensions.modelcontextprotocol.io (2026) `opened`; linuxfoundation.org AAIF press (2025) `opened`.

**F2. MCP's known security failures are all boundary failures.** Tool poisoning (Invariant Labs, April 2025): instructions hidden in a tool description are visible to the model but not the user; a benign `add` tool exfiltrated SSH keys. Rug pull: a server changes a description after approval. Shadowing: one server's description rewrites behaviour of another server's tool (email recipient hijack). Invariant's mitigations are checksum pinning, UI that shows what the model sees, and cross-server dataflow boundaries. CVE-2025-6514 (mcp-remote, CVSS 9.6): RCE on the client from a malicious authorization endpoint `secondary`. CVE-2025-54136 (Cursor): no re-validation after first approval `secondary`. A 2026 threat-modeling paper measured identically named tools from two servers producing wrong-provider execution in 52 of 100 randomized trials, attributing it to missing cryptographic binding between tool and provider.
- Mechanism of the failure · approval is a one-time event; the approved artifact can drift; nothing hashes it.
- House reading · this is the **mirror** primitive missing: approve a hash, diff on every load.
- Sources: invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks (2025) `opened`; arxiv.org/html/2602.11327v2 (Anbiaee et al., 2026) `opened`.

**F3. A2A v1.0 (2026-04-09): the richest task lifecycle, including an explicit refusal state.** Owner: Google-originated, Linux Foundation since June 2025; TSC includes Google, Microsoft, AWS, Cisco, Salesforce, ServiceNow, SAP, IBM. 150+ supporting organizations, integrated in Azure AI Foundry, Copilot Studio and Bedrock AgentCore; five SDK languages. Three layers: canonical data model (protobuf), abstract operations, bindings (JSON-RPC 2.0, gRPC, HTTP/REST). **Agent Card** at a well-known path declares identity, provider, skills with schemas, security schemes (API key, HTTP auth, OAuth2, OIDC, mTLS), extensions, and optional **JWS signatures** with canonicalization; an extended card is shown only after authentication. **Task states:** submitted, working (active); input_required, auth_required (interrupted, awaiting the client); completed, failed, canceled, **rejected** (terminal). Message = role + Parts (text, file, structured data); Artifacts = outputs made of Parts; `contextId` groups tasks, and agents must reject a mismatched contextId/taskId pair. Updates: polling, SSE streaming (status and artifact events), push notifications to a client webhook (servers must validate webhook URLs against SSRF). Extensions are URI-identified, declared in the card, can be marked required (`ExtensionSupportRequiredError`).
- Deliberately out · agent internals, memory, reasoning, framework; agents are opaque.
- Failure prevented · capability guessing; silent refusal (REJECTED is a first-class outcome); context confusion.
- Cost · stateful multi-turn sessions are the attack surface (F4).
- Sources: a2a-protocol.org/latest/specification (2026) `opened`; linuxfoundation.org A2A one-year press (2026) `opened`; lfaidata.foundation ACP-joins-A2A (2025-08-29) `opened`, which confirms IBM's ACP was wound down and its team moved to A2A.

**F4. Agent session smuggling: the peer is the attacker, and memory is the vector.** Unit 42 (2025-10-31): a malicious remote A2A agent uses the stateful session to interleave covert instructions with benign replies, first extracting a victim agent's config, tool schemas and history, then inducing unauthorized trades. The paper contrasts this with MCP's then-stateless tool calls. Mitigations: out-of-band human confirmation for sensitive actions, context grounding to detect drift from the original task, signed Agent Cards, surfacing remote activity to the user. (A widely repeated "87% of downstream decisions" figure does *not* appear in the Unit 42 article.)
- House reading · signed identity does not help when the authenticated peer is hostile; what helps is the **constructed layer** rule (a peer's output is synthesis, not measurement) plus enforcement outside the agent.
- Source: unit42.paloaltonetworks.com/agent-session-smuggling-in-agent2agent-systems (2025) `opened`.

**F5. ANP: identity first, then a negotiated protocol.** Owner: an open community (MIT), incubated in the W3C AI Agent Protocol Community Group (founded 2025-05-08, chairs Gaowei Chang and Song Xu, ~273 participants; white paper May 2025, spec draft August 2025). Three layers: (1) identity and encrypted communication with the `did:wba` DID method and ECDHE end-to-end encryption; (2) a meta-protocol layer where agents describe needs in natural language, negotiate a protocol, generate code, test it jointly, and cache the result; (3) application layer with the Agent Description Protocol (JSON-LD) and discovery via `.well-known/agent-descriptions` or search-service indexing. Its own white paper names unresolved incentive, governance and standardization questions. Threat modeling rates ANP lowest baseline risk of four protocols but flags cross-layer token reuse.
- Failure prevented · lock-in to one fixed message schema; platform-owned identity.
- Cost · negotiation needs an LLM on both ends and generated code on both ends.
- Sources: agent-network-protocol.com/specs/white-paper.html (2025) `opened`; w3.org/community/agentprotocol (2025–26) `opened`; arxiv.org/html/2602.11327v2 `opened`.

**F6. Agora: protocols as hash-addressed documents, with language as the fallback.** Marro, La Malfa, Wright, Li, Shadbolt, Wooldridge, Torr (Oxford, arXiv 2410.11905, October 2024). The **agent communication trilemma**: a protocol cannot easily be versatile (any content), efficient (cheap per message) and portable (little implementation effort) at once. Agora's answer is frequency-tiered: frequent exchanges run on human-written routines, less frequent ones on LLM-written routines against a **Protocol Document** (a self-contained plain-text spec identified by its SHA1 hash, fetched from listed sources and hash-checked), and rare or failed exchanges drop to natural language. Each message carries `protocolHash`, `protocolSources`, `body`. In a 100-agent demo, 1,000 queries cost $36.23 in pure natural language versus $7.67 with Agora (about 5x cheaper). Security is barely discussed; the 2026 threat model rates Agora high risk (self-declared identity, PD integrity only as good as the hash source, metadata leakage in negotiation, generated code with no sandbox discussion).
- House reading · a PD hash is a **seal**: a contract both sides can cite verbatim. This is the nearest existing thing to seed 7 (contract language).
- Sources: arxiv.org/abs/2410.11905 and /html/2410.11905 (2024) `opened`; arxiv.org/html/2602.11327v2 `opened`.

**F7. AGNTCY: the only stack that treats group messaging and a hardened runtime as protocol concerns.** Cisco-originated (March 2025, with LangChain and Galileo), Linux Foundation project with Cisco, Dell, Google Cloud, Oracle, Red Hat as formative members. Components: **OASF** (schema for agent records spanning A2A and MCP), **Agent Directory** (federated registry for publishing, verifying, discovering), **SLIM** (IETF individual draft `draft-mpsb-agntcy-slim-02`, July 2026: gRPC over HTTP/2 and HTTP/3, routing nodes, pub/sub and group sessions, MLS end-to-end encryption so routers cannot read payloads after TLS termination, hierarchical `org/namespace/service/instance` names with DIDs), **Identity** (identifiers, verifiable credentials, policy-based access), **SHADI** (hardened host: verified identity, gated secrets, OS sandbox, encrypted local memory), observability. Note: AGNTCY's own "ACP" is the Agent Connect Protocol, a different thing from IBM's ACP and from the commerce ACP.
- Failure prevented · intermediaries reading traffic; group channels without membership control (MLS groups add and remove members cryptographically).
- Cost · infrastructure weight: routing nodes, control plane, MLS group state.
- Sources: docs.agntcy.org (2026) `opened`; datatracker.ietf.org/doc/html/draft-mpsb-agntcy-slim (2026) `opened`; linuxfoundation.org AGNTCY press `secondary`. The Identity docs host did not resolve; identity detail is from docs.agntcy.org only.

**F8. AP2: the one protocol with a quarantine-then-anchor pattern, applied to money.** Google-originated (September 2025), donated to the FIDO Alliance on 2026-04-28 alongside Mastercard's Verifiable Intent, into new Agentic Authentication and Payments technical working groups; ~60 organizations. Built as an A2A extension. Mandates are signed verifiable credentials: the site now describes a Checkout Mandate (to the merchant) and a Payment Mandate (to credential provider and network); earlier material names Intent, Cart and Payment mandates. Human-present flows get a user signature on the specific cart; human-not-present flows act inside a pre-signed intent. The outcome is a non-repudiable audit trail of what the user actually authorized.
- Mechanism · the agent's proposal (a cart) has no effect until a signature from the authority (the user's key) converts it; the network sees only the derived mandate.
- Failure prevented · agent-inferred intent treated as user intent; dispute without evidence.
- Cost · a signing ceremony per transaction, or a pre-signed envelope whose bounds must be right.
- House reading · the Cart Mandate is a **proposal** that applies nothing until the operator's word, made cryptographic.
- Sources: ap2-protocol.org (2026) `opened` (mandate naming differs across versions; flagged); blog.google AP2-to-FIDO (2026-04-28) `opened`.

**F9. Agentic Commerce Protocol (OpenAI + Stripe) and x402: payment rails, no trust semantics.** ACP-commerce (Apache 2.0, beta, founding maintainers OpenAI and Stripe, SEP process, stated intent to move to a neutral foundation; latest stable 2026-04-17 adds cart, feed, orders, authentication, MCP binding): checkout sessions, delegated payment, shared payment tokens. x402 (Coinbase, now `x402-foundation`): server answers `402 Payment Required` with a `PAYMENT-REQUIRED` header, client retries with `PAYMENT-SIGNATURE`, a facilitator verifies and settles on-chain, server returns `PAYMENT-RESPONSE`; schemes `exact` and `upto`; the facilitator cannot move funds beyond the client's signed intent. x402.org reports ~75M transactions and ~$24M volume over the last 30 days (self-reported). Neither addresses refunds, disputes, or reputation.
- House reading · x402 is the purest instance of "payment as a retry with a proof", the same shape as MCP's MRTR. A cost-bearing message is a spam filter (the economic gatekeeper).
- Sources: github.com/agentic-commerce-protocol/agentic-commerce-protocol (2026) `opened`; x402.org (2026) `opened`; github.com/coinbase/x402 (2026) `opened`; x402 Foundation under Linux Foundation from 2026-04-02 `secondary`; Google/Shopify Universal Commerce Protocol (January 2026, plugs into AP2, MCP, A2A) `secondary`.

**F10. Eclipse LMOS and NLWeb: the Web-of-Things and schema.org lineages.** LMOS (Eclipse Foundation, Deutsche Telekom-origin `secondary`): agents described as W3C WoT Thing Descriptions in signed JSON-LD, DIDs plus OAuth2 for identity, discovery by mDNS/DNS-SD locally and registries globally, transport negotiated (HTTP, WebSocket, MQTT, AMQP); work in progress. NLWeb (Microsoft-backed, MIT): every instance is an MCP server with an `ask` method returning schema.org JSON; positions itself as the HTML to MCP's HTTP. Neither adds trust semantics.
- Sources: eclipse.dev/lmos/docs/lmos_protocol/introduction (2026) `opened`; github.com/nlweb-ai/NLWeb (2026) `opened`.

**F11. Identity is converging on three moves: short-lived workload credentials, domain anchoring, transparency logs; reputation is deferred by all of them.**
- *IETF `draft-klrc-aiagent-auth-03`* (2026-07-06; Defakto, AWS, Zscaler, Ping, OpenAI, Okta; WIMSE WG): the AIMS stack treats an agent as a workload. SPIFFE/WIMSE identifiers, short-lived credentials (static API keys named an antipattern; the LLM must never hold the agent's credentials), attestation at provisioning, OAuth token exchange and transaction tokens to downscope along call chains, CIBA for out-of-band human approval, and the **Shared Signals Framework** (CAEP, RISC) to push revocation and risk events so peers cut sessions immediately. Policy format, compliance criteria and mission-to-permission translation are out of scope.
- *ANS v2* (`draft-narajala-courtney-ansv2-01`, 2026-04-13; GoDaddy, OWASP, Cisco): identity `ans://v{version}.{host}` anchored to a DNS name proven by ACME; dual certificates; every register/renew/revoke event sealed in an append-only SCITT-aligned transparency log; verification tiers Bronze (PKI), Silver (+DANE), Gold (+log). It names a three-layer trust model (identity, operational attestations, behavioural reputation) and explicitly defers reputation scoring to companion documents; revocation is terminal.
- *OpenID Foundation* white paper (arXiv 2510.25819, October 2025): delegation chains, scope attenuation across recursive delegation, revocation and human oversight are the open problems; existing standards cover single-hop.
- *W3C*: besides the AI Agent Protocol CG, 2026 saw an Agent Identity Registry Protocol CG and an Agent Declaration and Assurance CG `secondary`.
- Sources: datatracker.ietf.org/doc/draft-klrc-aiagent-auth (2026) `opened`; datatracker.ietf.org/doc/html/draft-narajala-courtney-ansv2-01 (2026) `opened`; arxiv.org/abs/2510.25819 (2025) `opened`.

**F12. ERC-8004 is the only live design for on-chain reputation, and it records rather than judges.** Draft ERC (2025-08-13; authors from MetaMask, Ethereum Foundation, Google, Coinbase). Three registries: Identity (ERC-721 token per agent), Reputation (any non-owner address posts a signed score with tags and an off-chain URI; the submitter can revoke; anyone can append a response), Validation (independent checks by stake-secured re-execution, zkML or TEE oracles, scored 0–100). Aggregation algorithms, payments and capability verification are left off-chain.
- Mechanism · append-only public feedback with right of reply; trust models pluggable by value at risk.
- Failure prevented · platform-owned, unportable reputation.
- Cost · Sybil feedback is cheap unless weighted by stake or payment; no restoration path is defined, only the right to respond.
- House reading · the right of reply is half of **recoverable reputation**; the missing half is the house **demotion** rule (a dated penalty that expires on a clean record).
- Source: eips.ethereum.org/EIPS/eip-8004 (2025) `opened`.

**F13. Hermes Agent (the test pair's other side) already speaks A2A v1.0, and routes inbound peer traffic into its live session.** Nous Research, MIT. MCP client (stdio and HTTP), ACP as in the *Agent Client Protocol* for editors (Zed, VS Code, JetBrains; the release digest mis-expanded ACP, flagged), OpenAI-compatible API server, webhooks, a messaging gateway (Telegram, Discord, Slack, WhatsApp, Signal, Email and 20+ more), built-in cron with delivery to any platform, `delegate_task` subagents (isolated context, restricted toolsets, 3 concurrent by default), skills on the agentskills.io format, bounded `MEMORY.md`/`USER.md`. **A2A plugin** (PR #77109, merged 2026-08-02, shipped in v0.20.0 on 2026-08-03): outbound tools (`a2a_discover`, `a2a_call`, `a2a_list`, `a2a_history`, `a2a_orchestrate` with all/first/best fan-out; opt-in); inbound Agent Card at `/.well-known/agent-card.json`, JSON-RPC with SSE, per-peer bearer tokens (localhost-only without credentials), `A2A_TRUSTED_PEERS` allowlist, prompt-injection guard on peer text, credential redaction on output, per-peer token-bucket rate limit (default 60/min), SSRF checks on callbacks, append-only audit log, anti-loop turn caps (`A2A_MAX_PINGPONG_TURNS`), HMAC-signed push webhooks. Supports five of A2A's eight task states (no canceled, rejected, auth_required per the PR digest). Out of scope in the plugin: tenant isolation, gRPC, mid-turn abort. **Inbound A2A tasks enter the agent's active gateway session with full memory.** A 2026-09-07 issue records a three-profile local A2A mesh where an agent ran the wrong "peer" command, saw an empty list and misdiagnosed a healthy mesh (name collision across three peer surfaces).
- House reading · the plugin has a gatekeeper's *tools* (allowlist, rate limit, redaction, audit, loop cap) but no **quarantine**: a peer's message lands in the same context as the operator's. That is exactly the session-smuggling surface of F4.
- Sources: github.com/nousresearch/hermes-agent (2026) `opened`; hermes-agent.nousresearch.com/docs/integrations and /user-guide/features/overview (2026) `opened` (these docs pages do not yet mention A2A); github.com/NousResearch/hermes-agent/pull/77109 (2026) `opened`; …/releases/tag/v2026.8.3 (2026) `opened`; …/issues/105174 (2026) `opened`.

**F14. The surveys, and the axes they compare on.**
- *Yang et al.*, "A Survey of AI Agent Protocols" (arXiv 2504.16736, April 2025): two-axis taxonomy, context-oriented vs inter-agent and general-purpose vs domain-specific; evaluates on efficiency, scalability, security, reliability and operability-style dimensions; calls for group interaction, privacy, layered architectures, collective intelligence. `opened` (abstract page).
- *Ehtesham et al.*, "A survey of agent interoperability protocols: MCP, ACP, A2A, ANP" (arXiv 2505.02279, May 2025): axes are interaction mode, discovery, communication pattern, security model; proposes phased adoption MCP → ACP → A2A → ANP. `opened`.
- *Anbiaee et al.*, threat modeling of MCP, A2A, Agora, ANP (arXiv 2602.11327v2, 2026): three impact domains (authentication and access control; supply chain and ecosystem integrity; operational integrity) crossed with lifecycle phase (creation, operation, update). Every protocol is weak at update: no coordinated revocation, no version pinning. `opened`.
- *Kang & Diponegoro*, "Governance Gaps in Agent Interoperability Protocols" (arXiv 2606.31498, 2026-06-30): six governance dimensions from organizational theory (membership, deliberation, voting, dissent preservation, human escalation, audit/replay) across MCP, A2A, ACP, ANP, ERC-8004. Voting and dissent preservation are absent everywhere; the authors conclude governance is a missing *layer above* the protocols, not a missing feature within them. `opened` (abstract page).
- *"Beyond Message Passing: A Semantic View of Agent Communication Protocols"* (arXiv 2604.02369, 2026): communication, syntactic and semantic layers across 18 protocols; transport and schema are well covered, protocol-level clarification, context alignment and verification are thin, so semantics leak into prompts and wrappers. `opened` (abstract page).

## 1b. Gap table

S = supported in the spec · P = partial or adjacent · A = absent. "Agent" = left to the endpoint by design.

**Table 1 – communication protocols**

| Seed / axis | MCP 2026-07-28 | A2A v1.0 | ANP | AGNTCY (SLIM, Dir, Identity) | Agora |
|---|---|---|---|---|---|
| 1 Quarantine pending anchor | A – tool approval is one-shot; rug pulls exploit it | A – no "held" state; peer output enters context | A | P – SHADI gates secrets, not inbound knowledge | A |
| 2 Gatekeeper on the boundary | P – client is the implicit gate; Origin check, scopes | P – auth schemes, extended card after auth; REJECTED state | P – E2E encryption, DID auth | P – MLS group membership, policy-based access | A |
| 3 Impact assessment of messages | A | A | A | A | A |
| 4 Immune function / health | A – `ping` removed | A – no health op | A | P – observability/eval components | A |
| 5a Channels by time | S – request, input_required retry, tasks polling, `subscriptions/listen` | S – sync, SSE stream, push webhook, polling | P – p2p sessions | S – RPC, streaming, pub/sub | P – per-query HTTPS |
| 5b Channels by spread / broadcast / interrupt | A – one-to-one; no priority | A – point-to-point; no priority | A | P – group channels; no urgency class | P – PD sharing across peers |
| 6 Message types | P – method-typed; `resultType` complete / input_required | P – roles + 8 task states; no check-in or info-request performatives | P – negotiated per pair | P – OASF describes skills, not speech acts | P – whatever the PD defines |
| 7 Contract language | P – JSON Schema I/O | P – skill schemas, required extensions | P – NL negotiation → generated code | P – OASF records | S – hash-sealed Protocol Documents, NL fallback |
| 8 Progressive escalation | P – URL elicitation sends the human out of band | P – input_required / auth_required go back to the *caller*, not to the receiver's operator | A | A | P – routine → LLM → natural language is a de-escalation ladder |
| 9 Stated boundary goals | A | A – agents opaque by design | A | A | A |
| 10 Blockchain / ledger | A | A | A | A | A |
| 11 Identity + recoverable reputation | P – OAuth client, CIMD; no reputation | P – signed Agent Cards (JWS); no reputation | P – `did:wba`; no reputation | P – DIDs, VCs, directory verification; no reputation | A – self-declared |
| Delivery ack / "read, not sent" | A – redelivery removed | P – HTTP 2xx on push only | A | P – session-layer reliability | A |
| Delegation chain / scope attenuation | P – incremental scope consent | P – in-task auth | A | P | A |
| Revocation broadcast | A | A | A | A | A |
| Versioning / deprecation | S – lifecycle policy, 12-month window | S – Major.Minor | P – 1.0 → 1.1 | P | S – new hash = new version |
| Dissent / voting / audit-replay (Kang) | A / A / P | A / A / P | A | P – observability | A |

**Table 2 – trust, payment, identity layers, and the Hermes implementation**

| Seed / axis | AP2 (FIDO) | ACP-commerce / x402 | IETF AIMS + ANS v2 | ERC-8004 | Hermes A2A plugin |
|---|---|---|---|---|---|
| 1 Quarantine pending anchor | S (for payments) – cart inert until user-signed mandate | A | A | P – validation registry can gate on re-execution | A – inbound lands in live session |
| 2 Gatekeeper | P – credential provider sees only derived mandate | P – facilitator verifies before settle | P – authorization server decides; LLM never holds creds | A | P – allowlist, injection guard, redaction, rate limit |
| 3 Impact assessment | P – human-present vs not-present by value/intent | A | A | P – trust model scaled to value at risk | A |
| 4 Immune function | A | A | P – SSF risk and revocation signals | P – validators score 0–100 | P – anti-loop cap, audit log |
| 5 Channels (time / spread / interrupt) | A | A – per-request | P – SSF push events | A | P – SSE, HMAC push; cron exists in agent, not protocol |
| 6 Message types | P – mandate types | P – checkout lifecycle / 402 challenge-response | A | P – feedback, response, validation request | P – A2A's, 5 of 8 states |
| 7 Contract language | P – mandate is a signed contract, not code | P – `exact`/`upto` schemes | A – policy format out of scope | A | A |
| 8 Progressive escalation | P – out-of-band user signature | A | P – CIBA to a human | A | P – ping-pong turn cap |
| 9 Boundary goals | A | A | A | A | A |
| 10 Blockchain | A | S – x402 settles on-chain | P – transparency log (not a chain) | S | A |
| 11 Identity + recoverable reputation | P – VC signer identity | A | P – domain + ACME + log; reputation deferred; revocation terminal | P – portable feedback, revocable by submitter, right of reply; no restoration rule | P – per-peer tokens; no reputation |
| Delivery ack | P – signed receipts of intent | S – `PAYMENT-RESPONSE` | A | A | P – audit log |
| Delegation / attenuation | S – intent mandate bounds autonomous action | P – delegated payment token | S – token exchange, transaction tokens | A | A |
| Revocation broadcast | A | A | S – SSF / CAEP / RISC | P – feedback revoke | A |

**Reading the tables.** Rows 3, 9 and "revocation broadcast" are nearly empty across every column; row 1 is filled only where money is at stake. Row 5 is well covered on the *time* axis and almost empty on *spread and urgency*. Row 11 is covered for identity and empty for recoverable reputation everywhere.

## 2. Candidate primitives

| Name | One-line mechanism | Seed(s) | Verdict |
|---|---|---|---|
| **Disposition field** | Every reply carries the receiver's verdict on the inbound message: accepted / quarantined-pending-<anchor> / rejected-<reason> / escalated. Extends A2A's REJECTED to the knowledge layer. | 1, 2, 6 | Core. The judgment stays in the agent (end-to-end), the *signal* must cross the wire or the sender cannot adapt. |
| **Sealed contract ref** | A message cites the contract it runs under by content hash (Agora PD) plus a URI; mismatch = refuse. | 7 | Core (the hash); the contract language itself optional. |
| **Anchor-signed conversion** | A proposal becomes effective only with a signature from a named authority (AP2 mandate, generalized). | 1, 8 | Optional layer; core for any state-changing request. |
| **Impact class + urgency** | Sender declares impact (inform / request / state-change / irreversible) and urgency (batch / next-cycle / now / interrupt); receiver may downgrade, never silently upgrade. | 3, 5 | Core as two small enums; assessment logic out (agent). |
| **Read receipt with watermark** | Ack means read back, carrying a covered-through stamp; unacked past next cycle escalates. MCP dropped redelivery, so this must be end-to-end. | 5, 6, 8 | Core. |
| **Risk signal broadcast** | SSF-style push of "peer X revoked / demoted / compromised" to subscribers. | 4, 11 | Optional layer. |
| **Pinned descriptor** | Capabilities (card, tools) approved by hash; any change forces re-approval (fixes rug pull, shadowing). | 2, 4 | Core. |
| **Dated demotion** | Reputation events are dated, attributable, expiring; a clean window restores standing; right of reply attached. ERC-8004 feedback + house demotion rule. | 11 | Optional layer (ledger out; the record format core). |
| **Boundary charter** | Each agent's card states its boundary goals (protect kernel / probe / stay compatible) and what it will never accept inbound. | 9 | Optional, but cheap; turns opacity into a declared policy. |
| **Blockchain settlement** | On-chain registry or payment. | 10 | Out of the core. A transparency log gives tamper evidence without consensus cost; use a chain only where value transfer needs it (x402, ERC-8004). |

## 3. Mapped to house primitives

- **Anchor** – AP2's user signature, ANS v2's ACME domain proof, ERC-8004 validators. The field has anchors for *identity* and *payment*, none for *knowledge*.
- **Constructed layer** – absent everywhere. A2A, MCP and Hermes all treat a peer's output as if it were measurement. Session smuggling (F4) is what that costs.
- **Reconciliation, run, seal** – Agora's hash-identified PD is a seal; ANS v2's transparency log seals lifecycle events. Nobody reconciles two independent runs.
- **Authority / demotion** – ANS v2 revocation is terminal; ERC-8004 feedback is revocable only by the submitter. The house rule (thirty-day stop, clean thirty days restores) is the missing recoverable form.
- **Receipt** – A2A terminal states and artifacts are a receipt without a verdict against a success criterion; MCP's `resultType` is a receipt with two values. x402's `PAYMENT-RESPONSE` is the only receipt that proves settlement.
- **Watermark** – no protocol stamps "covered through". MCP's `ttlMs` cache hint is the nearest.
- **Tension / escalation** – A2A input_required and auth_required, MCP URL elicitation, AIMS CIBA: all escalate to the *caller* or a human, none with a threshold that converts watching into acting.
- **Hook** – the Hermes plugin's rate limit, loop cap and redaction are hooks at the boundary. The deployed client channel's incident conclusion (enforcement outside the agent) is echoed by AIMS (the LLM never holds credentials) and AGNTCY SHADI.
- **Voice gate** – Hermes' output redaction is an outbound gate; nothing in any spec requires one.
- **Proposal** – AP2's cart before the mandate.
- **Mirror** – Invariant's tool pinning by checksum; Cursor's rug-pull CVE is the mirror not being consulted.
- **New primitive needed** – *disposition* (a receiver's verdict made visible to the sender) and *impact/urgency class*; neither exists in the house vocabulary as a wire field.

## 4. Cross-field overlaps

1. **Proposal inert until an authority signs.** AP2 mandates (payments), the house proposal and kernel rule (knowledge systems), and double-entry authorization in banking and two-person rules in nuclear command (`unverified` for the latter two, not opened in this thread). Same shape: separate who drafts from who converts.
2. **Retry-with-proof instead of stateful dialogue.** MCP's MRTR, x402's 402 challenge, HTTP auth challenges. The server keeps no state, the client returns carrying the proof. It is also the immunological logic of presenting a fragment for each check rather than trusting a session: every contact re-presents credentials. Session smuggling (F4) is what happens when the session is trusted instead.
3. **Frequency-tiered formality.** Agora's routine / generated routine / natural language; the house hook-vs-sentence rule (a rule a script can enforce is scripted, the rest stays prose); in sociolinguistics, ritualized formulae for frequent exchanges and open talk for rare ones (`unverified`, not opened). Formalize what recurs.
4. **Revocation as broadcast alarm.** OpenID Shared Signals (CAEP/RISC) in identity, certificate transparency and revocation lists in PKI, and cytokine alarm signals in immunology (`unverified` biology link; for R-threads on immunology to confirm). Local detection, network-wide notification.
5. **Tamper-evident append-only record without consensus.** ANS v2's SCITT log, git as anchor in the house system, ERC-8004's append-only feedback (with consensus). The first two show the ledger property does not need a blockchain.

## 5. Disagreements and open questions

- **Stateless vs stateful.** MCP removed sessions in 2026; A2A keeps multi-turn context, and Unit 42 shows that context is the attack channel. A minimal protocol should probably be stateless on the wire, with context carried as explicit, sealed references. Open: does that break long collaborative work between brainboi and Hermes?
- **Where does quarantine live?** End-to-end says the receiver decides; but a sender that cannot see the disposition will resend, escalate, or route around (the deployed client channel incident). Proposal: the verdict is local, the disposition code is on the wire. Needs a test.
- **Hermes routes peers into its live session.** For the test pair, either Hermes runs A2A inbound on a separate profile or subagent (a quarantine by process), or the whitepaper's first recommendation targets exactly this. Worth raising with Sal before any live exchange.
- **Does the test pair need A2A at all?** Hermes already speaks A2A v1.0; brainboi could adopt it as the transport and put every seed in an A2A extension (URI-identified, declarable as required). That keeps the whitepaper minimal and lets the extension be the contribution. Counter-view: A2A's opacity principle forbids exactly the boundary charter (seed 9).
- **Reputation.** Nobody standardizes recoverable reputation. ERC-8004 is the only design and it is Sybil-exposed. Is a two-agent pilot even the right place to test reputation, or does it need at least three parties?
- **Mandate naming in AP2** (Intent/Cart/Payment vs Checkout/Payment) differs between the current site and earlier sources; confirm on the FIDO-hosted spec before citing.
- **Unconfirmed numbers.** x402 volumes are self-reported; MCP CVE counts for 2026 come from vendor blogs (`secondary`); the "87%" session-smuggling figure is misattributed in secondary coverage.
- **Governance layer.** Kang & Diponegoro say governance sits above the protocols. The seeds (gatekeeping, escalation, reputation) are largely governance. Should the whitepaper frame itself as that missing layer rather than as another wire protocol?

## 6. Sources

| # | URL | Year | Tag |
|---|---|---|---|
| 1 | https://modelcontextprotocol.io/specification/2026-07-28/changelog | 2026 | opened |
| 2 | https://modelcontextprotocol.io/specification/2025-11-25/changelog | 2025 | opened |
| 3 | https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr | 2026 | opened |
| 4 | https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks | 2026 | opened |
| 5 | https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation | 2025 | opened |
| 6 | https://a2a-protocol.org/latest/specification/ | 2026 | opened |
| 7 | https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year | 2026 | opened |
| 8 | https://lfaidata.foundation/communityblog/2025/08/29/acp-joins-forces-with-a2a-under-the-linux-foundations-lf-ai-data/ | 2025 | opened |
| 9 | https://unit42.paloaltonetworks.com/agent-session-smuggling-in-agent2agent-systems/ | 2025 | opened |
| 10 | https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks | 2025 | opened |
| 11 | https://agent-network-protocol.com/specs/white-paper.html | 2025 | opened |
| 12 | https://www.w3.org/community/agentprotocol/ | 2025–26 | opened |
| 13 | https://arxiv.org/abs/2410.11905 | 2024 | opened |
| 14 | https://arxiv.org/html/2410.11905 | 2024 | opened |
| 15 | https://docs.agntcy.org/ | 2026 | opened |
| 16 | https://datatracker.ietf.org/doc/html/draft-mpsb-agntcy-slim | 2026 | opened |
| 17 | https://ap2-protocol.org/ | 2026 | opened |
| 18 | https://blog.google/products-and-platforms/platforms/google-pay/agent-payments-protocol-fido-alliance/ | 2026 | opened |
| 19 | https://github.com/agentic-commerce-protocol/agentic-commerce-protocol | 2026 | opened |
| 20 | https://www.x402.org/ | 2026 | opened |
| 21 | https://github.com/coinbase/x402 | 2026 | opened |
| 22 | https://eclipse.dev/lmos/docs/lmos_protocol/introduction/ | 2026 | opened |
| 23 | https://github.com/nlweb-ai/NLWeb | 2026 | opened |
| 24 | https://datatracker.ietf.org/doc/draft-klrc-aiagent-auth/ | 2026 | opened |
| 25 | https://datatracker.ietf.org/doc/html/draft-narajala-courtney-ansv2-01 | 2026 | opened |
| 26 | https://arxiv.org/abs/2510.25819 | 2025 | opened |
| 27 | https://eips.ethereum.org/EIPS/eip-8004 | 2025 | opened |
| 28 | https://github.com/nousresearch/hermes-agent | 2026 | opened |
| 29 | https://hermes-agent.nousresearch.com/docs/integrations/ | 2026 | opened |
| 30 | https://hermes-agent.nousresearch.com/docs/user-guide/features/overview | 2026 | opened |
| 31 | https://github.com/NousResearch/hermes-agent/pull/77109 | 2026 | opened |
| 32 | https://github.com/NousResearch/hermes-agent/releases/tag/v2026.8.3 | 2026 | opened |
| 33 | https://github.com/NousResearch/hermes-agent/issues/105174 | 2026 | opened |
| 34 | https://arxiv.org/abs/2504.16736 | 2025 | opened |
| 35 | https://arxiv.org/abs/2505.02279 | 2025 | opened |
| 36 | https://arxiv.org/html/2602.11327v2 | 2026 | opened |
| 37 | https://arxiv.org/abs/2606.31498 | 2026 | opened |
| 38 | https://arxiv.org/abs/2604.02369 | 2026 | opened |
| 39 | https://www.linuxfoundation.org/press/linux-foundation-welcomes-the-agntcy-project-to-standardize-open-multi-agent-system-infrastructure-and-break-down-ai-agent-silos | 2025 | secondary |
| 40 | https://www.coinbase.com/blog/coinbase-and-cloudflare-will-launch-x402-foundation | 2025 | secondary |
| 41 | https://developers.googleblog.com/under-the-hood-universal-commerce-protocol-ucp/ | 2026 | secondary |
| 42 | https://www.w3.org/community/agent-identity/ | 2026 | secondary |
| 43 | https://www.w3.org/community/adacg/2026/ | 2026 | secondary |
| 44 | https://datatracker.ietf.org/doc/draft-ni-wimse-ai-agent-identity/ | 2026 | secondary |
| 45 | CVE-2025-6514 (mcp-remote, JFrog) and CVE-2025-54136 (Cursor, Check Point), via search results | 2025 | secondary |
| 46 | https://github.com/i-am-bee/acp (IBM Agent Communication Protocol, archived into A2A) | 2025 | secondary |
