# Course content format

The course is data. Each file in `course/lessons/` calls `Course.parts([...])` or `Course.lesson({...})`; the renderer (`course/kit.js`, `course/main.js`) turns the data into pages. Lesson files contain no DOM code and no functions, so `node course/dev/check.js` can load and check them.

Files load in name order: `00-parts.js` first, then `NN-<id>.js`. The check must pass with zero errors before a lesson is done.

## Parts

```js
Course.parts([
  { id: "foundations", track: "foundation", title: "Foundations", blurb: "One line." },
  { id: "parents", track: "core", title: "The two parents", blurb: "One line." },
  { id: "annex-network", track: "annex", title: "Annex · Network science", blurb: "One line." }
]);
```

`track` is `foundation` (prerequisites, optional for readers who have them), `core` (the main path, in order) or `annex` (deep dives a lesson can point to).

## Lesson

```js
Course.lesson({
  id: "envelope",            // the URL #anchor: lowercase letters, digits, dashes
  part: "waist",             // a part id
  title: "The envelope",     // short and abstract
  kicker: "Seven fields, one hash, and the rules for bytes",
  minutes: 9,
  refs: ["P§4.1", "P§4.2", "P§4.3"],        // paper sections and research findings this lesson rests on
  objectives: ["Write a valid Membrane header by hand.", "..."],   // 2 to 4, each a thing the reader can do
  prereq: ["hashes"],        // optional: lesson ids worth reading first (foundations)
  stamps: ["membrane", "id", "from", "to", "act", "at", "body"],    // fields of the running envelope this lesson teaches (see below)
  summary: "Up to 120 words. The tutor reads it as context.",
  blocks: [ /* see Blocks */ ]
});
```

**The running envelope.** One message runs through the core track: Hermes (Sal's agent) asks brainboi (Vlad's agent) which week of the pilot it is. Its header, in wire order: `membrane, id, from, to, act, form, at, by, effect, contract, context, acceptance, turn, body`. A dock beside every lesson shows it; each lesson's `stamps` light up the fields it taught. The capstone sends it through the gate. The base case `ask` in `course/scenario.js` is this message.

## Inline markup (any `text`, `q`, option, item, table cell)

| Write | Renders |
|---|---|
| `` `code` `` | code |
| `**bold**`, `*italic*` | emphasis |
| `[[P§6.2]]`, `[[R11·§7]]`, `[[R3·F5]]`, `[[Rev02·#3]]`, `[[RFC 9413]]`, `[[A2A:TaskState]]` | a reference chip that links to the paper section, research file or RFC |
| `{{env.effect}}` or `{{env.effect\|effect}}` | a contract term (any item id in `spec.js`, or `L1`..`L9`); hover or tap shows its definition and why |
| `[[lesson:gate]]` or `[[lesson:gate\|the gate lesson]]` | a link to another lesson |
| `[label](https://…)` | an external link (opens a new tab) |

## Blocks

Every block is `{ t: "<type>", ... }`.

| t | Fields | Renders |
|---|---|---|
| `p` | `text` | a paragraph |
| `h` | `text` | a section heading inside the lesson |
| `list` | `items[]`, `ordered?` | a list |
| `define` | `terms: [{ term, def, ref? }]` | glossary cards (use for prerequisite concepts) |
| `callout` | `kind`, `title?`, `text`, `law?` | a set-off note. kinds: `law` (with `law: "L6"`), `parent` (what MCP or A2A do here), `field` (where another discipline reached the same idea), `warn`, `note`, `brobber` (from brobber's pack), `web` (a fact checked on the web: say the date and the source in the text), `history` |
| `wire` | `text`, `caption?`, `mark?: ["field"]` | a Membrane message as it sits in a file, fields coloured, `mark` fields highlighted |
| `code` | `lang` (`json`, `http`, `js`, `text`), `text`, `caption?`, `mark?: [line numbers]` | a code block |
| `table` | `head[]`, `rows[][]`, `caption?` | a table |
| `compare` | `cols: [{ title, text? , items? }]`, `caption?` | side-by-side columns (MCP · A2A · Membrane) |
| `quiz` | `q`, `options[]`, `answer` (index), `explain`, `why?: []` (one line per option) | a multiple-choice check; the reader answers, then sees why |
| `sort` | `prompt`, `buckets: [{ id, label }]`, `items: [{ text, bucket, why }]` | tap an item, tap a bucket; each placement is marked right or wrong with its `why` |
| `steps` | `title`, `frames: [{ title, text, actor?, wire?, code?, lang?, mark? }]` | a step-through (prev, next, dots). `actor` like `"Hermes → brainboi"` draws the hop. Use for wire-level sequences |
| `machine` | `title`, `caption?`, `prompt?`, `start`, `states: [{ id, label, kind, x, y, note? }]`, `edges: [{ from, to, label }]` | a state machine the reader drives by choosing transitions. `kind`: `start`, `active`, `interrupted`, `terminal`. `x`, `y` on a 0–100 grid |
| `gate` | see below | the live gate: predict, run, read the trace |
| `widget` | `name`, `props?`, `spec?` | a named interactive (see Widgets) |
| `figure` | `name`, `caption?`, `props?`, `spec?` | a named drawing (see Widgets) |
| `takeaways` | `items[]` | 3 to 5 lines to keep |
| `deeper` | `links: [{ ref } \| { research, label? } \| { scenario } \| { challenge } \| { playground: "" or a route like "contract", label? } \| { href, label }]` | where to go next: paper sections, research files, a Playground scenario, a Gatekeeper challenge, the web |
| `tutor` | `prompts[]` | suggested questions for the in-page tutor (shown only where the page can ask Claude) |

### The `gate` block

```js
{ t: "gate",
  title: "Break the bytes",
  intro: "Pick a case, predict what brainboi's gate does, then run it.",
  preset: { },                         // a scenario descriptor (course/scenario.js header); {} is the clean ask
  expect: { disposition: "admitted", tier: "T1" },
  variants: [
    { label: "A carriage return in the body", change: { body: "…\r\n" },
      expect: { disposition: null, reason: "malformed", decisiveStep: "syntax" },
      explain: "One or two sentences shown after the run." }
  ],
  explain: "Shown after the preset runs.",
  editable: "wire",                    // "wire": the reader can edit the message text and rerun; default "none"
  knobs: ["cumulativeAck"],            // contract params the reader may switch (ids from MEMBRANE.params)
  showCtx: ["standing", "holdsToday"]  // receiver state worth showing beside the message
}
```

**Predicting more than the disposition** (added after panel round 0). `predict: ["disposition", "tier"]` asks for each named part, and a prediction scores right only when every part is right. Parts: `disposition`, `tier`, `reason` (a select of every reason code), `decisiveStep` (a select of the 21 steps), `receiptOwed`, `admittedAs`, `standing`, `awaiting`, `answerScope`; for `call: "page"`: `page`, `level`. `predict: false` turns prediction off. Ask for the part the lab's text asks about: a lab that says "predict the tier" must name `tier`.

**Goal mode: the reader makes the gate do something.** `goals: [{ text, want, solution }]` shows a checklist above an editable message. The reader edits the wire (or a knob) and runs it; a goal ticks when the real gate's result matches `want` (any `expect` keys). `solution` is a descriptor patch on the preset that reaches the goal: the checker runs it to prove the goal is reachable and fails if the unedited preset already meets it; the page offers it as "Show one way". Goal mode sets `editable: "wire"`. Combine with `predict: false` for a pure making lab, or keep a prediction for the preset.

**Untaught steps.** The trace dims any step whose teaching lesson comes later in the core and links to it. A lesson may list the gate steps it teaches in `gateSteps: ["lane", "scope"]` (ids from `Gate.STEPS`); otherwise a built-in map is used.

The reader chooses a case, predicts one of: `admitted`, `held`, `refused`, `expired`, `logged only` (no receipt is sent: `disposition: null`), and runs it. The trace shows all 21 steps, the deciding step, the reason code and the tier. **Every case states `expect`, and `node course/dev/check.js` runs it through the real gate.** `expect` may name any of: `disposition`, `reason`, `decisiveStep`, `tier`, `admittedAs`, `receiptOwed`, `awaiting`, `answerScope`, `evidence`, `standing`, `flags: { … }`; with `call: "page"` in the descriptor: `page`, `level`.

A descriptor (full list in the header of `course/scenario.js`): `base` (`ask`, `accept`, `reply`, `claim`, `receipt`, `alert`), `header` overrides, `unset`, `body`, `keepHash`, `msg` (signer, sigValid, lane, touchedPaths, reads, sources, origin, recordOk, secondSignal, capability), `ctx` (receiver state), `params` (contract knobs), `call`.

## Widgets

Named interactives the renderer provides. `props` tune them; `spec` describes intent when a widget is requested new.

| name | What it does | props |
|---|---|---|
| `tierCalc` | declared effect × contract effect × standing × quarantined answering → tier and who may release; runs `Gate.effectOf` and `Gate.evaluate` | `start?: { declared, contract, standing }` |
| `pageCalc` | urgency, severity, certainty × the receiver's ceiling × the interrupt budget → page or not; runs `Gate.pageDecision` | |
| `sensorLab` | type a body; see the heuristic sensor's signals, impact, reach and the injection flag at three strictness levels | `text?` |
| `relayChain` | Hermes → Echo → brainboi: a relayed claim, the evidence kind at each hop, the `noUpgradeRelay` switch | |
| `receiptLoop` | two agents trade messages; with cumulative acknowledgement off, receipts answer receipts | |
| `ladder` | the escalation ladder R0–R5 against the receiver's cycle and the ask's `by` | |
| `standingClock` | a 90-day line of receipts (clean, contradicted, unverifiable); standing S0–S3, the demotion clock, the newcomer floor | |
| `bspl` | the pilot contract (§10.4): what each message needs and binds; the reader sends messages and sees which become enabled | |
| `bindings` | the running envelope shown three ways: Membrane wire, an A2A `Message`, an MCP `tools/call` | |
| `vectors` | the 29 conformance vectors in `test-vectors/`, run in the browser against the gate | |
| `redteam` | the six Gatekeeper challenges: build a message, run it, score | |
| `graphLab` | network science: generate a random, small-world or scale-free network; degree distribution, path length, clustering; run a cascade; add a Sybil region | `model?` |
| `lossyChannel` | transport: send over a channel that drops, duplicates and reorders; at-most-once, at-least-once, and at-least-once plus dedup by id | |
| `hashLab` | security: a body and its hash; change one character and watch the hash change; sign with a key and verify | |

| figure | Shows |
|---|---|
| `hourglass` | the narrow waist: applications above, bindings below, the waist fixed |
| `dispositions` | received → sealed → held → admitted · refused · expired |
| `mcpArch` | host, clients, servers; where consent lives |
| `a2aArch` | client agent, Agent Card, remote agent, task |
| `stack` | the agent stack beside the internet stack: what each layer guarantees |
| `twoParents` | what Membrane borrowed, extended, broke and found absent in MCP and A2A |

A lesson may name a widget or figure that is not in these tables. Give it a `spec` precise enough to build from (inputs, what moves, what the reader learns, which gate functions it calls if any). Keep new ones few.

## Round-1 engine additions

- **Cold opens.** A `gate` block before the lesson's first `h` block is the cold open: titled "Cold open · not scored", it stores the reader's guess and never counts toward checks or stamps. Set `cold: false` on a block to opt out, or `cold: true` to mark one placed after a heading. A later case whose label starts "From the cold open", or that has `fromCold: true`, shows the reader's earlier guess under each prediction row.
- **`whyNot`** on a case (preset or variant): one sentence shown after the per-part feedback when the prediction is wrong. The engine already explains each wrong part from its trace field; use `whyNot` only for the misconception the case is built to catch.
- **Machine targets.** A `machine` block takes `targets: [{ text, state, via?: [stateIds], avoid?: [stateIds] }]`. A target ticks when the reader's walk reaches `state` having passed every `via` and none of the `avoid` states, and it counts as a make. Write prose targets ("Reach violated without the creditor ever acting") as data instead.
- **Tier and standing.** A message that stops before step 16 has no tier, and one that stops before step 18 has no standing: predict `null` ("not read") or leave the part out. The checker rejects `expect.tier` on such a case and accepts `tier: null`.
- **Quizzes.** The checker prints where right answers land (slots A–D) and fails when the right option is the longest in more than a third of the quizzes. Keep the right option within 20% of the longest distractor.
- **Minutes** are counted from the lesson (words, cases, checks, widgets); the `minutes` field is ignored.
- **Hero copy and labels** belong to the engine. "Next" finishes a lesson, so lessons need no closing instruction.
