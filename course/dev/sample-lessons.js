/* Dev only: sample lessons that exercise every block type and widget, loaded by course/dev/test.html. Not part of the course. */
Course.parts([
  { id: "f", track: "foundation", title: "Foundations", blurb: "Prerequisites." },
  { id: "waist", track: "core", title: "The waist", blurb: "The fixed vocabulary." },
  { id: "membrane", track: "core", title: "The membrane", blurb: "The gate and its rules." },
  { id: "annex-net", track: "annex", title: "Annex · Network science", blurb: "Graphs." }
]);
Course.lesson({ id: "dev-hashes", part: "f", title: "Hashes and signatures", kicker: "Why a hash in a signed header proves the body", minutes: 7, stamps: [],
  blocks: [{ t: "p", text: "A hash is a fingerprint of bytes." }, { t: "widget", name: "hashLab" }, { t: "widget", name: "lossyChannel" }] });
Course.lesson({ id: "dev-blocks", part: "waist", title: "Every block", kicker: "A tour of the renderer", minutes: 9, refs: ["P§4.1", "R11·§7", "RFC 9413"], objectives: ["See each block.", "Run the gate."], prereq: ["dev-hashes"], stamps: ["membrane", "id", "from", "to", "act", "at", "body"],
  summary: "Dev lesson.",
  blocks: [
    { t: "p", text: "Plain text with `code`, **bold**, *italic*, a ref [[P§6.2]], a term {{env.effect}}, a labelled term {{disp.held|held}}, a law {{L6}}, a lesson link [[lesson:dev-widgets|the widgets lesson]] and [a link](https://example.org)." },
    { t: "h", text: "A heading" },
    { t: "list", items: ["one {{env.from}}", "two"] },
    { t: "define", terms: [{ term: "Hash", def: "A short fingerprint of some bytes.", ref: "P§4.1" }, { term: "Signature", def: "Proof that a key holder approved these bytes." }] },
    { t: "callout", kind: "law", law: "L1" },
    { t: "callout", kind: "parent", text: "MCP keeps consent at the host [[R11·§4]]." },
    { t: "callout", kind: "field", title: "Immunology", text: "Costimulation." },
    { t: "callout", kind: "web", text: "Checked 2026-10-03 on modelcontextprotocol.io." },
    { t: "callout", kind: "brobber", text: "Count parties, not documents." },
    { t: "wire", text: "membrane: 0\nid: x\nfrom: hermes\n---\nhello\n", mark: ["from"], caption: "A caption." },
    { t: "code", lang: "json", text: "{\n  \"jsonrpc\": \"2.0\",\n  \"method\": \"tools/call\",\n  \"id\": 1,\n  \"ok\": true\n}", mark: [3] },
    { t: "table", head: ["Field", "Meaning"], rows: [["`membrane`", "version"], ["`id`", "unique"]] },
    { t: "compare", cols: [{ title: "MCP", items: ["agent to tool"] }, { title: "A2A", text: "agent to agent" }, { title: "Membrane", text: "the boundary" }] },
    { t: "quiz", q: "Who declares completion?", options: ["The provider", "The requester"], answer: 1, explain: "L3.", why: ["The provider only asserts.", "Right."] },
    { t: "sort", prompt: "Which protocol answers it?", buckets: [{ id: "mcp", label: "MCP" }, { id: "a2a", label: "A2A" }, { id: "none", label: "Neither" }], items: [{ text: "Call a tool", bucket: "mcp", why: "tools/call" }, { text: "Find an agent's card", bucket: "a2a", why: "Agent Card" }, { text: "Should I believe this peer?", bucket: "none", why: "The boundary." }] },
    { t: "steps", title: "A tools/call", frames: [{ title: "Request", actor: "client → server", code: "{\"method\":\"tools/call\"}", lang: "json", text: "The client asks." }, { title: "Result", actor: "server → client", text: "The server answers." }] },
    { t: "machine", title: "A2A task", start: "submitted", states: [{ id: "submitted", label: "SUBMITTED", kind: "start", x: 0, y: 50 }, { id: "working", label: "WORKING", kind: "active", x: 35, y: 50 }, { id: "input", label: "INPUT_REQUIRED", kind: "interrupted", x: 60, y: 10 }, { id: "completed", label: "COMPLETED", kind: "terminal", x: 100, y: 30 }, { id: "rejected", label: "REJECTED", kind: "terminal", x: 100, y: 90 }],
      edges: [{ from: "submitted", to: "working", label: "agent starts" }, { from: "working", to: "input", label: "needs input" }, { from: "input", to: "working", label: "client answers" }, { from: "working", to: "completed", label: "done" }, { from: "submitted", to: "rejected", label: "refuses" }] },
    { t: "gate", title: "Break the bytes", intro: "Predict, then run.", preset: {}, expect: { disposition: "admitted", tier: "T1" }, editable: "wire", knobs: ["quarantinedAnswer", "holdBudget"], showCtx: ["standing", "holdsToday", "shareable"],
      variants: [{ label: "CR in the body", change: { body: "x\r\n" }, expect: { disposition: null, reason: "malformed" }, explain: "CR breaks the byte rules." },
        { label: "No effect", change: { unset: ["effect"] }, expect: { disposition: "held", reason: "awaiting-owner" } },
        { label: "Stranger", change: { ctx: { standing: { hermes: "S0" } } }, expect: { disposition: "held" } }] },
    { t: "gate", title: "Two-part prediction", preset: {}, expect: { disposition: "admitted", tier: "T1" }, predict: ["disposition", "tier", "decisiveStep"],
      variants: [{ label: "No effect", change: { unset: ["effect"] }, expect: { disposition: "held", tier: "T4" } }] },
    { t: "gate", title: "Make it happen", predict: false, preset: {}, expect: { disposition: "admitted" }, knobs: ["holdBudget"],
      goals: [{ text: "Make brainboi hold the ask for its owner.", want: { disposition: "held", awaiting: "owner" }, solution: { unset: ["effect"] } },
        { text: "Make the gate log it and send nothing.", want: { disposition: null }, solution: { body: "x\r\n" } }] },
    { t: "takeaways", items: ["One.", "Two {{env.body}}."] },
    { t: "deeper", links: [{ ref: "P§4.1" }, { research: "R11" }, { scenario: "happy" }, { challenge: "g3" }, { href: "https://www.rfc-editor.org/rfc/rfc9413", label: "RFC 9413" }] },
    { t: "tutor", prompts: ["Why does a CR make a message malformed?"] }
  ] });
Course.lesson({ id: "dev-widgets", part: "membrane", title: "Every widget", kicker: "Widgets and figures", minutes: 12, stamps: ["effect", "contract"],
  blocks: ["hourglass", "dispositions", "mcpArch", "a2aArch", "stack", "twoParents", "twoOwners"].map((n) => ({ t: "figure", name: n, caption: "Figure " + n }))
    .concat(["tierCalc", "pageCalc", "sensorLab", "relayChain", "receiptLoop", "ladder", "standingClock", "bspl", "bindings", "vectors", "redteam", "attentionFlow", "mailQueue", "preRotation"].map((n) => ({ t: "widget", name: n })))
    .concat([{ t: "widget", name: "notBuiltYet", spec: "A spec for a widget that does not exist." }]) });
Course.lesson({ id: "dev-graph", part: "annex-net", title: "Networks", kicker: "Graphs and Sybils", minutes: 10, blocks: [{ t: "widget", name: "graphLab" }] });
