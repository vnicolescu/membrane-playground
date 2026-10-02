# R10 A2A v1.0 exact names

Opened 2026-09-14. Latest release tag v1.0.1 (2026-05-28); live site header says `1.0.0`. The proto is normative (spec 4, 10.1). JSON = ProtoJSON: camelCase fields, enums as SCREAMING_SNAKE strings (spec 5.5).

Source keys (every row below was opened at the key given):
- **P** `opened` https://raw.githubusercontent.com/a2aproject/A2A/v1.0.1/specification/a2a.proto (package `lf.a2a.v1`; identical to `main` except one comment)
- **S** `opened` https://a2a-protocol.org/latest/specification/ (rendered tables via WebFetch) + its source https://raw.githubusercontent.com/a2aproject/A2A/v1.0.1/docs/specification.md
- **E** `opened` https://a2a-protocol.org/latest/topics/extensions/ + source https://raw.githubusercontent.com/a2aproject/A2A/v1.0.1/docs/topics/extensions.md
- **W** `opened` https://raw.githubusercontent.com/a2aproject/A2A/v1.0.1/docs/whats-new-v1.md
- **J03** `opened` https://raw.githubusercontent.com/a2aproject/A2A/v0.3.0/specification/json/a2a.json (0.3 baseline only; v1.0.1 `specification/json/` holds only a README, no JSON schema)

REQ = `field_behavior = REQUIRED` in P.

## 1. AgentCard (P `AgentCard`, "Next ID: 20")

| JSON | proto | Type | REQ | Definition | Src |
|---|---|---|---|---|---|
| `name` | `name` | string | yes | Human-readable agent name | P |
| `description` | `description` | string | yes | Purpose of the agent | P |
| `supportedInterfaces` | `supported_interfaces` | AgentInterface[] | yes | Ordered interfaces; first is preferred. Replaces 0.3 `url`, `preferredTransport`, `additionalInterfaces` | P, W |
| `provider` | `provider` | AgentProvider | no | Service provider | P |
| `version` | `version` | string | yes | Agent version, e.g. "1.0.0" | P |
| `documentationUrl` | `documentation_url` | optional string | no | Docs URL | P |
| `capabilities` | `capabilities` | AgentCapabilities | yes | Capability set | P |
| `securitySchemes` | `security_schemes` | map<string,SecurityScheme> | no | Named auth schemes | P |
| `securityRequirements` | `security_requirements` | SecurityRequirement[] | no | Requirements to contact agent. 0.3 name was `security` | P, J03 |
| `defaultInputModes` | `default_input_modes` | string[] (media types) | yes | Input modes across skills | P |
| `defaultOutputModes` | `default_output_modes` | string[] | yes | Output media types | P |
| `skills` | `skills` | AgentSkill[] | yes | Agent abilities | P |
| `signatures` | `signatures` | AgentCardSignature[] | no | JWS signatures over the card (RFC 7515, canonicalized RFC 8785) | P, S 8.4 |
| `iconUrl` | `icon_url` | optional string | no | Icon URL | P |
| (absent) | (absent) | | | 0.3 `protocolVersion` moved to AgentInterface; 0.3 `supportsAuthenticatedExtendedCard` moved to `capabilities.extendedAgentCard` | W, J03 |
| discovery | | | | `https://{server_domain}/.well-known/agent-card.json` | S 8.2 |

### AgentInterface

| JSON | proto | REQ | Definition | Src |
|---|---|---|---|---|
| `url` | `url` | yes | Endpoint URL (HTTPS in production) | P |
| `protocolBinding` | `protocol_binding` | yes | Open string; core values `JSONRPC`, `GRPC`, `HTTP+JSON`; custom bindings SHOULD be a URI | P, S 5.8 |
| `tenant` | `tenant` | no | Opaque routing id; if set, clients MUST send it as `tenant` on every request | P |
| `protocolVersion` | `protocol_version` | yes | `Major.Minor`, e.g. "0.3", "1.0" | P |

### AgentProvider

| JSON | proto | REQ | Definition | Src |
|---|---|---|---|---|
| `url` | `url` | yes | Provider website | P |
| `organization` | `organization` | yes | Provider org name | P |

### AgentCapabilities

| JSON | proto | Type | Definition | Src |
|---|---|---|---|---|
| `streaming` | `streaming` | optional bool | Supports streaming | P |
| `pushNotifications` | `push_notifications` | optional bool | Supports push notifications | P |
| `extensions` | `extensions` | AgentExtension[] | Supported extensions | P |
| `extendedAgentCard` | `extended_agent_card` | optional bool | Supports extended card when authenticated (was top-level `supportsAuthenticatedExtendedCard` in 0.3) | P, W |
| (absent) | | | 0.3 `stateTransitionHistory` is gone in v1 | J03, P |

### AgentExtension

| JSON | proto | Type | Definition | Src |
|---|---|---|---|---|
| `uri` | `uri` | string | Unique URI of the extension (version SHOULD be in the URI) | P, S 4.6.3 |
| `description` | `description` | string | How this agent uses it | P |
| `required` | `required` | bool | Client must understand and comply | P |
| `params` | `params` | Struct | Extension-specific config | P |

### AgentSkill

| JSON | proto | REQ | Definition | Src |
|---|---|---|---|---|
| `id` | `id` | yes | Unique skill id | P |
| `name` | `name` | yes | Human-readable name | P |
| `description` | `description` | yes | Detailed description | P |
| `tags` | `tags` | yes | Keywords | P |
| `examples` | `examples` | no | Example prompts | P |
| `inputModes` | `input_modes` | no | Overrides default input modes | P |
| `outputModes` | `output_modes` | no | Overrides default output modes | P |
| `securityRequirements` | `security_requirements` | no | Per-skill security | P |

### AgentCardSignature

| JSON | proto | REQ | Definition | Src |
|---|---|---|---|---|
| `protected` | `protected` | yes | base64url protected JWS header | P |
| `signature` | `signature` | yes | base64url signature | P |
| `header` | `header` | no | Unprotected JWS header (Struct) | P |

### Security

| Name (proto message / oneof field -> JSON member) | Fields (proto) | Src |
|---|---|---|
| `SecurityRequirement` | `schemes` map<string, StringList{`list`}> | P |
| `SecurityScheme` oneof `scheme` | `api_key_security_scheme` (`apiKeySecurityScheme`), `http_auth_security_scheme`, `oauth2_security_scheme`, `open_id_connect_security_scheme`, `mtls_security_scheme` | P |
| `APIKeySecurityScheme` | `description`, `location` (REQ: "query"/"header"/"cookie"), `name` (REQ) | P |
| `HTTPAuthSecurityScheme` | `description`, `scheme` (REQ), `bearer_format` | P |
| `OAuth2SecurityScheme` | `description`, `flows` (REQ), `oauth2_metadata_url` | P |
| `OpenIdConnectSecurityScheme` | `description`, `open_id_connect_url` (REQ) | P |
| `MutualTlsSecurityScheme` | `description` | P |
| `OAuthFlows` oneof `flow` | `authorization_code`, `client_credentials`, `implicit` [deprecated], `password` [deprecated], `device_code` | P |
| `AuthorizationCodeOAuthFlow` | `authorization_url`, `token_url`, `refresh_url`, `scopes`, `pkce_required` | P |
| `DeviceCodeOAuthFlow` | `device_authorization_url`, `token_url`, `refresh_url`, `scopes` | P |

## 2. Message (P `Message`)

| JSON | proto | REQ | Definition | Src |
|---|---|---|---|---|
| `messageId` | `message_id` | yes | Unique id, created by message creator | P |
| `contextId` | `context_id` | no | Associates with a context; server messages must set it | P |
| `taskId` | `task_id` | no | Associates with a task; if only taskId given, server infers contextId | P |
| `role` | `role` | yes | Sender, enum `Role` | P |
| `parts` | `parts` | yes | Content, Part[] (at least one) | P |
| `metadata` | `metadata` | no | Struct | P |
| `extensions` | `extensions` | no | URIs of extensions present in this message | P |
| `referenceTaskIds` | `reference_task_ids` | no | Task ids referenced for context | P |
| `kind` | (none) | | REMOVED in v1 (was `"message"` in 0.3) | W, J03 |

`Role` enum (JSON string = proto name): `ROLE_UNSPECIFIED` (0), `ROLE_USER` (1, client to server), `ROLE_AGENT` (2, server to client). 0.3 values were `"user"`, `"agent"`. Src: P, S 4.1.5, W.

## 3. Part (P `Part`): one unified message, no TextPart/FilePart/DataPart

| JSON | proto | Kind | Definition | Src |
|---|---|---|---|---|
| `text` | `text` | oneof `content` | Text content | P |
| `raw` | `raw` | oneof `content` | File bytes, base64 in JSON | P |
| `url` | `url` | oneof `content` | URL to file content | P |
| `data` | `data` | oneof `content` | Any JSON value (google.protobuf.Value) | P |
| `metadata` | `metadata` | field | Struct | P |
| `filename` | `filename` | field | Optional filename, any part type | P |
| `mediaType` | `media_type` | field | MIME type, any part type (replaces 0.3 `mimeType`) | P, W |
| `kind`, `file`, `fileWithUri`, `fileWithBytes`, `mimeType` | (none) | | REMOVED in v1; discriminate by which member is present | W |

## 4. Task and TaskStatus

| JSON | proto | REQ | Definition | Src |
|---|---|---|---|---|
| `id` | `id` | yes | Server-generated task id | P |
| `contextId` | `context_id` | no | Context id | P |
| `status` | `status` | yes | TaskStatus | P |
| `artifacts` | `artifacts` | no | Artifact[] outputs | P |
| `history` | `history` | no | Message[] turns | P |
| `metadata` | `metadata` | no | Struct | P |
| `createdAt`, `lastModified` | (none) | | W claims these were added; NOT in proto v1.0.1 | `unverified` (W vs P conflict) |
| `kind` | (none) | | REMOVED (was `"task"`) | W, J03 |

| TaskStatus JSON | proto | REQ | Definition | Src |
|---|---|---|---|---|
| `state` | `state` | yes | TaskState | P |
| `message` | `message` | no | Message attached to the status | P |
| `timestamp` | `timestamp` | no | google.protobuf.Timestamp, JSON ISO 8601 UTC `YYYY-MM-DDTHH:mm:ss.sssZ` | P, S 5.6.1 |

## 5. TaskState (JSON string identical to proto name)

| Value | # | Class | 0.3 JSON | Src |
|---|---|---|---|---|
| `TASK_STATE_UNSPECIFIED` | 0 | unknown/indeterminate | `unknown` | P, J03 |
| `TASK_STATE_SUBMITTED` | 1 | active | `submitted` | P |
| `TASK_STATE_WORKING` | 2 | active | `working` | P |
| `TASK_STATE_COMPLETED` | 3 | terminal | `completed` | P |
| `TASK_STATE_FAILED` | 4 | terminal | `failed` | P |
| `TASK_STATE_CANCELED` | 5 | terminal (one L) | `canceled` | P |
| `TASK_STATE_INPUT_REQUIRED` | 6 | interrupted | `input-required` | P |
| `TASK_STATE_REJECTED` | 7 | terminal | `rejected` | P |
| `TASK_STATE_AUTH_REQUIRED` | 8 | interrupted | `auth-required` | P |

Blocking `SendMessage` (`returnImmediately` false) waits until terminal or interrupted. Streams close on terminal states only. Src: P `SendMessageConfiguration`, S 3.1.2.

## 6. Artifact (P `Artifact`)

| JSON | proto | REQ | Definition | Src |
|---|---|---|---|---|
| `artifactId` | `artifact_id` | yes | Unique within task | P |
| `name` | `name` | no | Human-readable name | P |
| `description` | `description` | no | Description | P |
| `parts` | `parts` | yes | Part[], at least one | P |
| `metadata` | `metadata` | no | Struct | P |
| `extensions` | `extensions` | no | Extension URIs contributing to it | P |

## 7. Push notification config and streaming events

### TaskPushNotificationConfig (flattened in v1; there is no separate `PushNotificationConfig` message in P)

| JSON | proto | REQ | Definition | Src |
|---|---|---|---|---|
| `tenant` | `tenant` | no | Routing id | P |
| `id` | `id` | no | Config id (UUID) | P |
| `taskId` | `task_id` | no | Task it belongs to (empty when sent inside SendMessage) | P |
| `url` | `url` | yes | Webhook URL | P |
| `token` | `token` | no | Token unique to task/session | P |
| `authentication` | `authentication` | no | AuthenticationInfo | P |
| `configId`, `createdAt` | (none) | | W claims added; NOT in proto | `unverified` (W vs P conflict) |

AuthenticationInfo: `scheme` (REQ, IANA HTTP auth scheme e.g. `Bearer`), `credentials`. Src: P. Webhook: HTTP POST, `Content-Type: application/a2a+json`, body = StreamResponse, at-least-once, client replies 2xx. Src: S 4.3.3.

SendMessageConfiguration (JSON `configuration`): `acceptedOutputModes`, `taskPushNotificationConfig` (0.3: `pushNotificationConfig`), `historyLength`, `returnImmediately` (0.3: `blocking`, inverted sense). Src: P, J03.

### StreamResponse (oneof `payload`; also the webhook body)

| JSON member | proto | Payload | Src |
|---|---|---|---|
| `task` | `task` | Task | P, S 3.2.3 |
| `message` | `message` | Message | P, S 3.2.3 |
| `statusUpdate` | `status_update` | TaskStatusUpdateEvent | P, S 3.2.3 |
| `artifactUpdate` | `artifact_update` | TaskArtifactUpdateEvent | P, S 3.2.3 |

| Event | JSON fields (proto) | `final` | Src |
|---|---|---|---|
| `TaskStatusUpdateEvent` | `taskId` REQ, `contextId` REQ, `status` REQ, `metadata` | REMOVED in v1; completion = stream closure on terminal state | P, W, S 3.1.2 |
| `TaskArtifactUpdateEvent` | `taskId` REQ, `contextId` REQ, `artifact` REQ, `append` (bool, append to same artifactId), `lastChunk` (`last_chunk`, final chunk), `metadata` | none | P |
| W example `index` on artifact update; W wrapper names `taskStatusUpdate`/`taskArtifactUpdate` | | | NOT in P; P and rendered S use `statusUpdate`/`artifactUpdate` | `unverified` (W vs P conflict) |

JSON-RPC stream: SSE `text/event-stream`, each `data:` line is a JSON-RPC response whose `result` is a StreamResponse. Src: S 9.4.2.

## 8. Operations (JSON-RPC method = gRPC rpc name, PascalCase)

| JSON-RPC method | 0.3 name | Params -> Result | REST (S 5.3) | Src |
|---|---|---|---|---|
| `SendMessage` | `message/send` | SendMessageRequest{`tenant`,`message`,`configuration`,`metadata`} -> {`task`\|`message`} | `POST /message:send` | P, S, W |
| `SendStreamingMessage` | `message/stream` | SendMessageRequest -> stream StreamResponse | `POST /message:stream` | P, S, W |
| `GetTask` | `tasks/get` | {`tenant`,`id`,`historyLength`} -> Task | `GET /tasks/{id}` | P, S, W |
| `ListTasks` | (new) | {`tenant`,`contextId`,`status`,`pageSize`,`pageToken`,`historyLength`,`statusTimestampAfter`,`includeArtifacts`} -> {`tasks`,`nextPageToken`,`pageSize`,`totalSize`} | `GET /tasks` | P, S, W |
| `CancelTask` | `tasks/cancel` | {`tenant`,`id`,`metadata`} -> Task | `POST /tasks/{id}:cancel` | P, S, W |
| `SubscribeToTask` | `tasks/resubscribe` | {`tenant`,`id`} -> stream StreamResponse (first event is Task) | S says `POST /tasks/{id}:subscribe`; P http option says `get` | P, S, W |
| `CreateTaskPushNotificationConfig` | `tasks/pushNotificationConfig/set` | TaskPushNotificationConfig -> same | `POST /tasks/{id}/pushNotificationConfigs` | P, S, W |
| `GetTaskPushNotificationConfig` | `tasks/pushNotificationConfig/get` | {`tenant`,`taskId`,`id`} -> config | `GET /tasks/{id}/pushNotificationConfigs/{configId}` | P, S, W |
| `ListTaskPushNotificationConfigs` | `tasks/pushNotificationConfig/list` | {`tenant`,`taskId`,`pageSize`,`pageToken`} -> {`configs`,`nextPageToken`} | `GET /tasks/{id}/pushNotificationConfigs` | P, S, W |
| `DeleteTaskPushNotificationConfig` | `tasks/pushNotificationConfig/delete` | {`tenant`,`taskId`,`id`} -> Empty | `DELETE /tasks/{id}/pushNotificationConfigs/{configId}` | P, S, W |
| `GetExtendedAgentCard` | `agent/getAuthenticatedExtendedCard` | {`tenant`} -> AgentCard | `GET /extendedAgentCard` | P, S, W |

gRPC service `A2AService`. REST paths also accept a `/{tenant}/` prefix; `/v1` prefix removed. Src: P, W.

## 9. Error codes

| Name | JSON-RPC | gRPC | HTTP | Meaning | Src |
|---|---|---|---|---|---|
| `JSONParseError` | -32700 | | | Invalid JSON | S 9.5 |
| `InvalidRequestError` | -32600 | | | Not a valid Request object | S 9.5 |
| `MethodNotFoundError` | -32601 | | | Method unknown | S 9.5 |
| `InvalidParamsError` | -32602 | | | Invalid params | S 9.5 |
| `InternalError` | -32603 | | | Server internal error | S 9.5 |
| `TaskNotFoundError` | -32001 | NOT_FOUND | 404 | Task missing or not accessible | S 5.4 |
| `TaskNotCancelableError` | -32002 | FAILED_PRECONDITION | 400 | Task not cancelable (e.g. terminal) | S 5.4 |
| `PushNotificationNotSupportedError` | -32003 | FAILED_PRECONDITION | 400 | `capabilities.pushNotifications` false/absent | S 5.4 |
| `UnsupportedOperationError` | -32004 | FAILED_PRECONDITION | 400 | Op unsupported; also streaming off, extended card off, message/subscribe to terminal task | S 5.4, 3.3.4 |
| `ContentTypeNotSupportedError` | -32005 | INVALID_ARGUMENT | 400 | Media type unsupported | S 5.4 |
| `InvalidAgentResponseError` | -32006 | INTERNAL | 500 | Agent response non-conformant | S 5.4 |
| `ExtendedAgentCardNotConfiguredError` | -32007 | FAILED_PRECONDITION | 400 | Capability declared but no card configured | S 5.4 |
| `ExtensionSupportRequiredError` | -32008 | FAILED_PRECONDITION | 400 | Required extension not declared by client | S 5.4 |
| `VersionNotSupportedError` | -32009 | FAILED_PRECONDITION | 400 | `A2A-Version` unsupported | S 5.4 |

A2A range -32001 to -32099. `error.data` is an array of objects each with `@type` (google.rpc `ErrorInfo`, `BadRequest`), e.g. `reason: "TASK_NOT_FOUND"`, `domain: "a2a-protocol.org"`. Src: S 9.5.

## 10. Extension activation and service parameters

| Item | Exact | Src |
|---|---|---|
| Activation header | `A2A-Extensions`: comma-separated extension URIs (0.3 used `X-A2A-Extensions`) | S 3.2.6, E, v0.3.0 extensions.md |
| Response | Agent SHOULD echo `A2A-Extensions` listing extensions actually activated | E |
| Unsupported, not required | Agent ignores it, proceeds without; MUST NOT fall back to another version | S 4.6.3, E |
| Required, client did not declare | Agent MUST return `ExtensionSupportRequiredError` (-32008) | S 3.3.4, 5.4 |
| Required, client requested unsupported version | Agent MUST return an error | S 4.6.3 |
| In-payload markers | `Message.extensions`, `Artifact.extensions` (URIs); data under `metadata[<extension URI>]` | S 4.6.2 |
| Limits | Extensions may not add fields to core types or add enum values; use `metadata` | E |
| Version header | `A2A-Version` (`Major.Minor`); empty = `0.3`; also allowed as query param | S 3.6 |
| Transport | JSON-RPC and REST: HTTP headers; gRPC: metadata; names prefixed `a2a-`, case-insensitive | S 3.2.6, 9.2, 10.2 |
| Official extension URIs | Prefix `https://a2a-protocol.org/extensions/` | E |
