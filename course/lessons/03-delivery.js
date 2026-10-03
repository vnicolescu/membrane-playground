Course.lesson({
  id: "delivery", part: "foundations", title: "Delivery semantics",
  kicker: "At most once, at least once, and why exactly once is a property of the endpoints",
  minutes: 9,
  refs: ["P§4.2", "P§5.4", "R6·F9", "R6·F13", "R2·F8", "R8·F1"],
  objectives: [
    "Define at-most-once and at-least-once delivery and say which choice of commit point gives each.",
    "Explain idempotency and deduplication by identifier.",
    "Say why ordering is a promise channels between scheduled agents cannot keep, and what replaces it.",
    "State why exactly-once is something the endpoints build."
  ],
  summary: "A channel that may lose, duplicate or reorder messages forces a choice. Committing the read position before processing gives at-most-once: a crash loses the message. Committing after gives at-least-once: a crash repeats it. Exactly-once at the channel is not available; it is built at the endpoints by making repeats harmless, either because the operation is idempotent or because the receiver remembers identifiers and answers a repeat the same way it answered the original. Ordering is a promise only a live connection can keep; between agents on different schedules, order follows from what each message needs to know. Membrane takes the at-least-once side: resend is the recovery, from plus id is the duplicate key, a duplicate gets the original receipt, and messages older than the window are stale.",
  blocks: [
    { t: "p", text: "Hermes writes a message into a git lane; brainboi fetches it six hours later, or fails to; Hermes' receipt may be lost on the way back. Every channel between two agents that run on their own schedules drops, duplicates and reorders. This lesson is the vocabulary for living with that, and the one result that tells you where the fix belongs." },
    { t: "define", terms: [
      { term: "at-most-once", def: "Each message is delivered zero or one times. Nothing is ever repeated; some things are lost." },
      { term: "at-least-once", def: "Each message is delivered one or more times. Nothing is lost; some things are repeated." },
      { term: "idempotent", def: "An operation whose repetition has the same effect as doing it once. Setting a value is idempotent; adding to it is not." },
      { term: "dedup key", def: "The identifier a receiver remembers so that a repeat is recognised and answered the same way as the original. In Membrane, `from` plus `id`.", ref: "P§4.2" },
      { term: "ordering", def: "The promise that messages arrive in the sequence they were sent. Only a live connection can keep it; a mailbox cannot." }
    ] },
    { t: "h", text: "Where the commit point sits" },
    { t: "p", text: "The guarantee a receiver gets depends on when it records that it has handled a message. Record first and process second, and a crash between the two loses the message: at-most-once. Process first and record second, and a crash repeats it: at-least-once. Kafka's documentation states the rule in those terms, and exactly-once there needs the read position and the output written in one transaction [[R6·F9]]. The transactional outbox pattern puts the send inside the local transaction so a message goes out if and only if the state change committed; the relay that reads the outbox can still send twice, so consumers track which identifiers they have processed. Stripe's API keys the first response under a client-chosen identifier and returns it again on a repeat; CloudEvents requires `source` plus `id` to be unique, which makes that pair the dedup key [[R6·F9]]." },
    { t: "widget", name: "lossyChannel", props: {} },
    { t: "h", text: "Exactly once belongs to the ends" },
    { t: "p", text: "Saltzer, Reed and Clark's example is a careful file transfer. The sender's application computes a checksum, the receiver's application reads the stored copy back and recomputes it, and only when the two agree does the transfer count as committed; a reliable network underneath reduces the number of retries and changes nothing about correctness [[R8·F1]]. Duplicate suppression is the same case: the application retries on a lost acknowledgement and so creates duplicates that only it can recognise, so the mechanism that removes them must live at the end and key on something inside the message. The transport annex works the argument through: [[lesson:tr-e2e]]." },
    { t: "p", text: "So exactly-once is built, at the endpoints, out of at-least-once plus one of two things: an operation that does not mind repetition, or a memory of identifiers. Membrane chooses the second for its envelope and gets the first from its contracts. A message with a seen `from` and `id` and the same body is a duplicate: the receiver resends its original receipt, if one was owed, and does nothing else [[P§4.2]]. And under a contract a binding is set once, so a repeated `accept` or `reply` binds nothing new; duplicates become harmless and resending is the recovery [[R2·F8]]." },
    { t: "h", text: "Order" },
    { t: "p", text: "A live connection can number its segments and hold back the ones that arrive early; a mailbox read every six hours cannot promise anything about the order in which two messages were written, and two agents on different clocks cannot even agree on which one was first. Lamport's clocks give the one direction that holds: if event a caused event b, a's timestamp is smaller, and the reverse does not follow, so a timestamp alone cannot prove causality [[R6·F13]]. Membrane therefore assumes no message ordering and lets order follow from information: each message type in a contract states what it needs to know already, and a `reply` that needs `accepted` cannot be sent before an `accept` whatever order they arrive in [[P§5.4]]. The paper's reading of session types is that they give strong guarantees and assume first-in-first-out channels, which two agents on different schedules do not have." },
    { t: "sort", prompt: "Match each mechanism to the guarantee it provides.", buckets: [ { id: "amo", label: "At-most-once" }, { id: "alo", label: "At-least-once" }, { id: "eo", label: "Exactly-once at the endpoints" } ], items: [
      { text: "Record the read position, then process", bucket: "amo", why: "A crash after recording and before processing loses the message." },
      { text: "Process, then record the read position", bucket: "alo", why: "A crash after processing and before recording repeats it on restart." },
      { text: "Remember `from` plus `id` and resend the original receipt on a repeat", bucket: "eo", why: "At-least-once delivery plus a memory of identifiers at the receiver." },
      { text: "A binding that, once set, never changes", bucket: "eo", why: "An idempotent operation: the second `accept` binds nothing new." },
      { text: "Fire a notification and forget it", bucket: "amo", why: "Nothing is retried or recorded; loss is accepted." },
      { text: "Retry until an acknowledgement arrives", bucket: "alo", why: "A lost acknowledgement means a repeated delivery." }
    ] },
    { t: "gate", title: "The same message twice", intro: "The running ask, then the same ask arriving again after brainboi already admitted it. Predict what the gate does the second time.",
      preset: {}, expect: { disposition: "admitted", decisiveStep: "release" },
      explain: "First arrival: admitted, and brainboi records `from` plus `id` with the body hash and the disposition.",
      variants: [
        { label: "The same ask again", change: { ctx: { seenIds: { "hermes|hermes-20260922-a41d0e6b9c7f2358": { body: "$body", disposition: "admitted", receiptOwed: false, effect: "disclose" } } } }, expect: { disposition: "admitted", reason: "duplicate", decisiveStep: "duplicate" }, explain: "Recognised at the duplicate step. The gate reports the original disposition and would resend the original receipt if one had been owed. Nothing is evaluated twice and nothing new happens: at-least-once delivery made harmless by a memory of identifiers." },
        { label: "The same id with a different body", change: { ctx: { seenIds: { "hermes|hermes-20260922-a41d0e6b9c7f2358": { body: "$hash:a different body\n", disposition: "admitted" } } } }, expect: { disposition: "refused", reason: "id-reuse" }, explain: "This is not a repeat; it is a second message wearing the first one's identifier. Refused and logged, because every receipt that cited the id would otherwise be ambiguous." }
      ] },
    { t: "takeaways", items: [
      "Commit before processing: at-most-once. Commit after: at-least-once. The channel offers nothing better.",
      "Exactly-once is built at the endpoints from at-least-once plus idempotency or a memory of identifiers.",
      "Membrane: `from` plus `id` is the dedup key; a duplicate gets the original receipt; bindings are set once.",
      "A mailbox cannot promise order; order follows from what each message needs to know."
    ] },
    { t: "deeper", links: [ { ref: "P§4.2" }, { ref: "P§5.4" }, { research: "R6", label: "R6 · F9, delivery guarantees in Kafka, Stripe, CloudEvents, SQS" }, { research: "R2", label: "R2 · F8, BSPL over unordered, lossy transport" }, { scenario: "lost-receipt" } ] }
  ]
});
