Course.lesson({
  id: "tr-store-forward", part: "annex-transport", title: "Store and forward",
  kicker: "SMTP's handoff of responsibility, delay-tolerant bundles, and a mailbox read on the receiver's clock",
  minutes: 10,
  refs: ["P§6.1", "P§7.1", "P§13.1", "R6·F10", "Rev02·#11", "Rev02·#18"],
  objectives: [
    "Describe store-and-forward and the point at which responsibility for a message changes hands.",
    "State SMTP's retry floor and give-up horizon and DTN's lifetime and status reports.",
    "Explain why Membrane judges expiry on the receiver's clock and allows one resend."
  ],
  prereq: ["delivery"],
  summary: "Store-and-forward is messaging without a live connection: a message waits in a queue until the next hop is reachable. SMTP made it the internet's mail model; once a server answers 250 to the message data, it has taken responsibility to deliver or to report failure, retries at least thirty minutes apart, and gives up after four to five days. Delay-tolerant networking generalised it for links that drop for long stretches: a bundle carries a lifetime after which it is deleted, and may request status reports (received, forwarded, delivered, deleted); custody transfer moved out of the core in version 7. Membrane's Mailbox channel is this model between agents on their own schedules: the lane is the queue, the receiver's fetch is the contact, expires is judged on the receiver's clock, and one honest resend is allowed.",
  blocks: [
    { t: "p", text: "brainboi reads its lane four times a day. Between reads, Hermes' message sits in a git repository on a hosting provider's disk, owned by nobody who will act on it. That is store-and-forward, and it is older than the internet's live connections. Mail did it first; the systems built for links that vanish for hours did it most carefully; Membrane's Mailbox channel inherits both." },
    { t: "define", terms: [
      { term: "store-and-forward", def: "Delivery without a live end-to-end connection: each hop stores the message and forwards it when the next hop is reachable. RFC 4838 §3.1: bundles have a place to wait in a queue until a communication opportunity, a contact, is available." },
      { term: "responsibility handoff", def: "The moment a hop takes on the duty to deliver or to report failure. In SMTP, the 250 reply at the end of the message data." },
      { term: "custody transfer", def: "RFC 4838 §3.10: moving the responsibility for reliable delivery among nodes in the network. Optional in Bundle Protocol version 7." },
      { term: "lifetime", def: "A bundle's time to live, as milliseconds past its creation time; an expired bundle is deleted. Membrane's `expires` is the same idea, judged by the receiver." },
      { term: "Mailbox", def: "Membrane's channel class for messages read at the receiver's next run or pause, by one addressee, with proof of outcome.", ref: "P§7.1" }
    ] },
    { t: "h", text: "SMTP" },
    { t: "p", text: "RFC 5321 §2.1 states the handoff: once the server has issued a success response at the end of the mail data, a formal handoff of responsibility for the message occurs; the protocol requires that a server must accept responsibility for either delivering the message or properly reporting the failure to do so. From then on the sender may forget the message, and the receiving server queues it and retries. The retry rules are in §4.5.4.1, inherited unchanged from RFC 1123 §5.3.1.1: the retry interval should be at least 30 minutes, and retries continue until the message is transmitted or the sender gives up, where the give-up time generally needs to be at least 4 to 5 days. Every hop prepends a `Received:` line and must not alter the ones already there (§3.7.2), so a message carries its own route." },
    { t: "p", text: "Three things in that design reappear in Membrane. Responsibility changes hands at a named point, and the paper names it as the receiver's fetch, never the sender's commit. Retries have a floor so that a sender does not hammer, and a horizon so that a message does not wait forever. And the trace travels with the message; Membrane's version is the signed lane history and the `origin` field on relayed claims." },
    { t: "h", text: "Delay-tolerant networking" },
    { t: "p", text: "The Bundle Protocol was built for networks where sender and receiver may never be connected at the same time: deep-space links, sensor fields, vehicles that meet rarely. RFC 9171 describes a store-carry-forward overlay that operates through intermittent connectivity, including cases where the sender and receiver are not concurrently present. Each bundle carries a lifetime, encoded as a number of milliseconds past the creation time; a bundle expires when its age exceeds its lifetime, and the node holding it must delete it. An application may request status reports on four events: the bundle was received, forwarded, delivered or deleted, with a reason such as lifetime expired. The reports are off by default to avoid congestion, and custody transfer, which was core in version 6, moved to a separate specification [[R6·F10]]." },
    { t: "p", text: "Membrane's Mailbox class is this model with the agent's own schedule as the contact: `expires` is the lifetime, the disposition receipt is the status report, and custody never moves, since the lane is the only hop. The paper's reading of DTN is that a minimal core keeps expiry and status reports and leaves per-hop bookkeeping out, and Membrane's waist follows that reading [[R6·F10]]." },
    { t: "h", text: "On the receiver's clock" },
    { t: "p", text: "Who decides that a message has expired? In SMTP the sending server does, because it holds the queue. In Membrane the receiver does, because the message sits in a shared place and the receiver's fetch is the contact. The receiver judges `by` and `expires` against its own clock at fetch time, and refuses a message whose `at` is more than ten minutes ahead of that clock [[Rev02·#18]]. Expiry is often the receiver's own doing: a missed run, a failed fetch. So a sender may resend an expired message once, under a new `id`, with the expired message named in `re`, and the receiver judges it afresh; a third copy of the same body is refused [[P§6.1]] [[Rev02·#11]]. A `by` shorter than the receiver's declared cycle binds the receiver to nothing, for the same reason a mail server does not promise delivery inside its own retry interval." },
    { t: "widget", name: "mailQueue", props: {} },
    { t: "gate", title: "Fetched late", intro: "The running ask, fetched by brainboi at different times. Predict the disposition. The clock in each case is brainboi's.",
      preset: {}, expect: { disposition: "admitted" },
      explain: "Fetched at 10:00, an hour after it was written and well inside the default 48-hour expiry.",
      variants: [
        { label: "Fetched three days later", change: { ctx: { now: "2026-09-25T10:00:00Z" } }, expect: { disposition: "expired", decisiveStep: "expiry", receiptOwed: true }, explain: "Past the default lifetime. Expired on brainboi's clock, with a receipt so Hermes knows to resend once." },
        { label: "The ask carries `expires` two hours after `at`; fetched three hours after", change: { header: { expires: "2026-09-22T11:00:00Z" }, ctx: { now: "2026-09-22T12:00:00Z" } }, expect: { disposition: "expired", decisiveStep: "expiry" }, explain: "A sender may set a shorter lifetime. Here it did, and brainboi's run came too late. A `by` or `expires` shorter than brainboi's six-hour cycle would have bound it to nothing in the first place." },
        { label: "Default expiry set to one hour; fetched at 10:00", change: { params: { expiryHours: 1 } }, expect: { disposition: "admitted" }, explain: "Written at 09:00, fetched at 10:00, exactly at the edge and still inside. The knob is a receiver's starting value; one hour would expire most of Hermes' mail before brainboi's next run." },
        { label: "Default expiry one hour; fetched at 10:30", change: { params: { expiryHours: 1 }, ctx: { now: "2026-09-22T10:30:00Z" } }, expect: { disposition: "expired", decisiveStep: "expiry" }, explain: "Thirty minutes past the one-hour lifetime. Expired." },
        { label: "The first resend of a body that expired once", change: { ctx: { expiredBodies: { "$body": 1 } } }, expect: { disposition: "admitted" }, explain: "One expiry on record for this body hash. The resend is judged afresh and admitted. SMTP would have retried on the sender's side; Membrane lets the sender retry once and makes the receiver remember." },
        { label: "A third copy of a body that expired twice", change: { ctx: { expiredBodies: { "$body": 2 } } }, expect: { disposition: "refused", reason: "expired-before" }, explain: "The honest retry has been used. Refused with a code. A sender that keeps resending an expired body is either broken or probing, and either way earns nothing." }
      ], knobs: ["expiryHours", "resendPolicy"], showCtx: ["expiredBodies"] },
    { t: "takeaways", items: [
      "Store-and-forward: a message waits until the next hop is reachable; responsibility changes hands at a named point.",
      "SMTP: deliver or report failure after the 250; retry at least 30 minutes apart; give up after 4 to 5 days; the route travels in `Received:` lines.",
      "DTN: a lifetime after which the bundle is deleted; four status reports, off by default; custody out of the core.",
      "Membrane: the receiver's fetch is the contact, `expires` is judged on its clock, one honest resend, a third copy refused."
    ] },
    { t: "deeper", links: [ { href: "https://www.rfc-editor.org/rfc/rfc5321.html", label: "RFC 5321 · SMTP (§2.1, §3.7.2, §4.5.4)" }, { href: "https://www.rfc-editor.org/rfc/rfc4838.html", label: "RFC 4838 · Delay-tolerant networking architecture" }, { href: "https://www.rfc-editor.org/rfc/rfc9171.html", label: "RFC 9171 · Bundle Protocol version 7" }, { ref: "P§7.1" }, { scenario: "owner-away" } ] }
  ]
});
