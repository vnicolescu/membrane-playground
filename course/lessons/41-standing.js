Course.lesson({
  id: "standing", part: "time", title: "Identity and standing",
  kicker: "Who signed is cryptography; how good a peer is stays a local judgment",
  minutes: 11,
  refs: ["P§9.1", "P§9.2", "P§9.3", "P§9.4", "P§9.5", "R7·F1", "R7·F2", "R7·F3", "R7·F10", "R7·F11", "R7·F13", "R7·F14", "R7·F16", "R7·F17", "R7·F19", "Rev02·#23", "Rev02·#24"],
  objectives: [
    "Separate identity integrity, record integrity and reputation meaning, and say which cryptography can deliver.",
    "Explain pre-rotation in two sentences.",
    "Read the standing table and say what S0 to S3 each release.",
    "Apply the demotion clock, the griefing cap and the newcomer floor."
  ],
  prereq: ["hashes"],
  gateSteps: ["signature", "lane", "standing"],
  summary: "An unhackable reputation splits into three claims: identity integrity (this message was signed by the controller of this identifier, and a stolen key cannot take the identifier), record integrity (the history cannot be rewritten or shown differently to different readers), and reputation meaning (this agent is good), which is always a judgment. Membrane makes the first two strong with pre-rotation and append-only hash-chained logs, and keeps the third local, asymmetric and recoverable. Standing S0 to S3 is computed by each agent for each peer. Promotion follows clean countersigned receipts; one contradicted receipt lowers a peer one level for thirty days; a clean thirty days restores it; the record stays. Newcomers start at S0 and only the receiver's own owner can introduce one, at S1 at most.",
  blocks: [
    { t: "gate", title: "Cold case", intro: "Before the rule: an agent called Iris, whom brainboi has never heard of, sends a well-formed claim with a record behind it. Predict the disposition and the standing the gate reads.", preset: { base: "claim", header: { from: "iris", evidence: "record" }, msg: { signer: "iris", lane: "iris", recordOk: true } }, predict: ["disposition", "standing"], expect: { disposition: "held", reason: "awaiting-owner", standing: "S0", flags: { unknownSigner: true } }, explain: "Held for Vlad at S0, with the trace noting an unknown identifier. A correct envelope and a record that checks out bought nothing. The lesson is about why that is the right starting point." },
    { t: "p", text: "For the pilot week, Hermes stands at S1 with brainboi, fixed by both owners. That one level is what lets the gate release the ask at T1 without asking Vlad." },
    { t: "p", text: "The seed list that began the paper asked for an unhackable reputation, and the paper's first move was to split that phrase into three claims that cryptography treats very differently [[P§9.1]]." },
    { t: "h", text: "Three separate claims" },
    { t: "list", items: [
      "**Identity integrity**: this message was signed by the controller of this identifier, and a stolen key cannot take the identifier. Achievable with cryptography.",
      "**Record integrity**: the history of what an agent did cannot be rewritten or shown differently to different readers. Achievable with append-only hash-chained logs and witnesses.",
      "**Reputation meaning**: this agent is good. Always one party's judgment of another."
    ] },
    { t: "p", text: "Without a trusted issuer or costly identity, one party can present many identities (Douceur 2002, [[R7·F10]]); no reputation function that treats all nodes symmetrically resists such Sybil identities (Cheng and Friedman 2005, [[R7·F11]]); and reputation is always one party's view of another (Jøsang and Ismail 2002, [[R7·F14]]). So the paper makes the first two claims strong and keeps the third local, asymmetric and recoverable." },
    { t: "define", terms: [
      { term: "pre-rotation", def: "Committing to the next key by its digest before using it.", ref: "R7·F1" },
      { term: "countersigned receipt", def: "A receipt both parties sign, carrying both log heads.", ref: "P§9.3" },
      { term: "standing", def: "S0 to S3, per receiver and per peer.", ref: "P§9.4" },
      { term: "duplicity", def: "Two conflicting key events, or a log head that fails to extend an earlier one.", ref: "R7·F2" }
    ] },
    { t: "h", text: "The identifier" },
    { t: "list", items: [
      "**Pre-rotation.** The identifier is derived from an inception event that holds the current public key and a digest of the next key. A rotation must be signed with the committed next key, so a thief holding the current key cannot rotate the identity away (KERI, [[R7·F1]]). The owner keeps the next key offline.",
      "**Delegation.** The agent's identifier is a delegate of its owner's. The owner can rotate or retire it. With the delegation extension the agent names its owner in {{ext.for}}; the gate checks the field against the delegation record, and `for` never raises tier, standing or urgency [[R7·F3]]. A claim that a principal approved something counts only as a separate message signed by that principal's own key.",
      "**Configuration change.** A change of model family or harness is a signed event in the agent's key log, and readers may lower the agent one level. A version change within the same family and harness is reported in a pulse and lowers nothing. Both test agents update weekly.",
      "**Succession.** When both key sets are lost, the owner retires the identifier and names a successor; readers may carry standing across one level lower.",
      "**Duplicity.** Conflicting key events, or a Membrane log head that fails to extend one seen earlier, go to the identity layer and are not forgiven on a clock. A reused message identifier is `id-reuse`, a lesser fault."
    ] },
    { t: "p", text: "The pilot approximates all of this with one SSH signing key per agent, an `allowed_signers` file with validity windows pinned outside the transport, and rotations signed by owner keys held on hardware that requires a touch for each signature [[P§9.2]]. Which identity mechanism the pair adopts after the pilot is decision D4." },
    { t: "h", text: "The countersigned receipt" },
    { t: "p", text: "Standing is built from receipts. The unit of evidence is a receipt signed by both parties: the request's hash and acceptance line, the deliverable's hash, the provider's verdict and latest log head, and the counterparty's `met`, `unmet` or contradiction with its own signature and log head [[P§9.3]]. The head is the head of the agent's Membrane log, an append-only file of the hashes of every message it sent and received, kept in its own lane. It is never the head of a working repository that allows rebasing; the paper's second reviewer pointed out that brainboi's own rebases would otherwise read as duplicity [[Rev02·#19]]. Because each receipt carries both heads, each party witnesses the other's history, and a head that fails to extend an earlier one is evidence. Certificate Transparency rests on the same property." },
    { t: "p", text: "Signatures can be withheld. A counterparty may withhold its signature on good work. An unsigned receipt is a sender-side state called `offered`; unanswered past the next cycle it climbs the ladder no further than R2, and the withholding is recorded against the withholder. Receipts are written only by the two parties to an exchange, and there is no operation for rating a stranger: the 2019 keyserver flooding showed what a store accepting third-party attestations without the subject's consent becomes [[R7·F17]]." },
    { t: "h", text: "Standing" },
    { t: "table", head: ["Level", "Meaning", "Reached by"], rows: [
      ["{{st.S0}}", "full quarantine: nothing released without the owner", "every unknown identifier, whatever it claims"],
      ["{{st.S1}}", "T0 released by the gate; T1 under a contract", "an introduction by the receiver's own owner, or a clean record"],
      ["{{st.S2}}", "T2 within granted capabilities", "a longer clean record"],
      ["{{st.S3}}", "the widest unattended scope the owner allows", "owner grant only"]
    ], caption: "From [[P§9.4]]. S-levels describe the sender; T-tiers describe the effect. Draft 0.1 had let the two collide [[Rev02·#23]]." },
    { t: "list", items: [
      "**Promotion** follows a stated number of clean countersigned receipts within a window. `unverifiable` verdicts are neither clean nor contradicted.",
      "**Contradiction.** A contradiction is an `unmet` verdict with a pointer the provider can open. A bare `unmet` counts as `unverifiable`, so no requester can demote a provider by assertion alone [[Rev02·#24]].",
      "**Demotion.** One contradicted receipt lowers the peer one level for thirty days; a clean thirty days restores its earlier level. The record stays; its weight fades, with a starting half-life of thirty days to be measured ({{st.demotion}}).",
      "**Griefing.** A requester whose `unverifiable` verdicts and withheld countersignatures exceed half of its last ten receipts is capped at S1 in the provider's view.",
      "**Indirect evidence** counts only as flow from peers already above S1 in the reader's own view: the asymmetric construction that resists Sybil rings.",
      "**Newcomer floor.** With cheap pseudonyms, no equilibrium sustains much more cooperation than one where newcomers start poorly treated and earn standing (Friedman and Resnick 2001, [[R7·F13]]). Only the receiver's own owner can introduce a peer, an introduction reaches S1 at most, and an identifier introduced while another identifier of the same owner is demoted starts at S0, so a discarded identity costs its owner the demotion and buys no higher start."
    ] },
    { t: "widget", name: "standingClock", props: {} },
    { t: "callout", kind: "history", title: "Where the thirty days come from", text: "brainboi's automated passes may merge into the main branch only while their receipts hold; a receipt claim later contradicted on disk stops that authority for thirty days, and a clean thirty days restores it [[P§9.4]]. The missing half of the rule, that authority should shrink as well as grow, was admitted in the paper's own self-review and pressed by a reviewer persona modelled on Sal. The rule has never fired, and decision D10 asks Sal whether he wants graduated sanctions in its place." },
    { t: "p", text: "Law {{L7}} gathers the mechanism: records are permanent; their weight forgets. Bayesian reputation systems carry a forgetting factor [[R7·F14]]; consumer credit reports most negative items for seven years; community software demotes as well as promotes, on clocks [[R7·F16]]. Terminal revocation is what every protocol the sweep opened offers instead, and terminal revocation is what makes a fresh pseudonym rational." },
    { t: "h", text: "The ledger question" },
    { t: "p", text: "Git is a content-addressed Merkle graph: rewriting any commit changes every descendant's hash, and a counterparty that has recorded a head holds an anchor. Transparency logs add witnesses that cosign consistency, so a log cannot show different histories to different readers. The decision procedure of Wüst and Gervais ends at \"no blockchain\" when each log has one writer and the counterparties are known, which is the Membrane case [[R7·F19]]. A public chain is an optional anchor and stays out of the core; it would become core if the protocol moved value, if standing were backed by stake that can be slashed, or if many unknown, mutually untrusting agents needed one global name or one shared ordering with no acceptable witness set [[P§9.5]]. None holds today; decision D14 asks both owners to confirm the three." },
    { t: "gate", title: "Who is this", intro: "Iris again, then Hermes at other standing levels, then messages whose signer and sender disagree. Predict the disposition and the standing the gate reads. One case recalls the evidence lesson.",
      preset: { base: "claim", header: { from: "iris", evidence: "record" }, msg: { signer: "iris", lane: "iris", recordOk: true } }, predict: ["disposition", "standing"], expect: { disposition: "held", reason: "awaiting-owner", standing: "S0", flags: { unknownSigner: true } },
      explain: "From the cold open. A valid signature from a key brainboi's trust root does not list; step 18 reads S0, and step 21 holds for the owner with `awaiting-owner`.",
      variants: [
        { label: "Iris introduced by Vlad (standing S1 on record)", change: { ctx: { standing: { iris: "S1" } } }, expect: { disposition: "admitted", admittedAs: "fact", standing: "S1" }, explain: "An introduction by the receiver's own owner reaches S1, and S1 is enough for a T0 claim with a verified record. Step 21 admits as fact." },
        { label: "Vlad signs this one message over its hash, Iris still at S0", change: { ctx: { ownerSigned: ["$hash:The pilot repository moved to a self-hosted remote last night.\n"] } }, expect: { disposition: "admitted", standing: "S0" }, explain: "The owner's signature over the sealed hash releases this message at step 21 and changes nothing about Iris: standing stays S0 and the next message from her is held again." },
        { label: "Unknown peers start at S1 (the knob)", change: { params: { newcomerLevel: "S1" } }, expect: { disposition: "admitted", standing: "S1" }, explain: "A receiver's policy choice and the newcomer scenario's broken rule: every stranger with a valid key now gets T0 released by the gate at step 21." },
        { label: "Iris sends an ask instead of a claim", change: { base: "ask", header: { from: "iris" }, msg: { signer: "iris", lane: "iris" }, unset: ["evidence"] }, expect: { disposition: "refused", reason: "contract-mismatch", decisiveStep: "contract" }, explain: "A request needs an accepted contract, and Vlad has accepted none with Iris. Step 10 refuses before standing is read." },
        { label: "Hermes demoted to S0 for thirty days", change: { base: "ask", header: { from: "hermes" }, msg: { signer: "hermes", lane: "hermes", recordOk: undefined }, unset: ["evidence"], ctx: { standing: { hermes: "S0" } } }, expect: { disposition: "held", reason: "awaiting-owner", tier: "T1", standing: "S0" }, explain: "Same ask, same contract, one contradicted receipt. Step 18 reads S0, and the T1 release the gate made in the effects lesson now goes to Vlad at step 21. The clock restores it." },
        { label: "Hermes at S2", change: { base: "ask", header: { from: "hermes" }, msg: { signer: "hermes", lane: "hermes", recordOk: undefined }, unset: ["evidence"], ctx: { standing: { hermes: "S2" } } }, expect: { disposition: "admitted", standing: "S2", tier: "T1" }, explain: "A longer clean record. Admitted at step 21 as before; what S2 adds is reversible effects within granted capabilities, which this ask does not use." },
        { label: "`from: vlad`, signed with Hermes' key", change: { base: "ask", header: { from: "vlad" }, msg: { signer: "hermes", lane: "hermes", recordOk: undefined }, unset: ["evidence"] }, expect: { disposition: "refused", reason: "lane", decisiveStep: "lane" }, explain: "Signer, lane and `from` must agree, and they do not. Step 2 refuses with `lane` before any model reads a word: the paper's authority-spoof case." },
        { label: "Hermes' commit written into brainboi's lane", change: { base: "ask", header: { from: "hermes" }, msg: { signer: "hermes", lane: "brainboi", recordOk: undefined }, unset: ["evidence"] }, expect: { disposition: "refused", reason: "lane", decisiveStep: "lane" }, explain: "Lane forgery. Step 2 refuses with `lane` on both sides, and brainboi's gate alerts Vlad." },
        { label: "A signature that fails to verify", change: { msg: { sigValid: false } }, expect: { disposition: null, reason: "unsigned", decisiveStep: "signature", receiptOwed: false }, explain: "Step 1. Logged only, with nothing sent to the claimed sender." },
        { label: "From earlier (evidence): Iris's claim relabelled `synthesis`, with Vlad's introduction", change: { header: { evidence: "synthesis" }, ctx: { standing: { iris: "S1" } } }, expect: { disposition: "held", reason: "awaiting-signal", standing: "S1" }, explain: "Standing S1 is enough for the gate to release, and step 17 still holds a synthesis for a second signal. Standing and evidence are two separate checks." }
      ], knobs: ["newcomerLevel", "laneBound"], showCtx: ["standing", "trustRoot"] },
    { t: "gate", title: "Make it happen", intro: "Iris's claim is in the editor. Each goal is reached by editing one header line or turning one knob.",
      preset: { base: "claim", header: { from: "iris", evidence: "record" }, msg: { signer: "iris", lane: "iris", recordOk: true } }, predict: false, expect: { disposition: "held" },
      goals: [
        { text: "Change `from` to a peer brainboi knows and see what a key that does not match the name earns.", want: { disposition: "refused", reason: "lane" }, solution: { header: { from: "hermes" } } },
        { text: "Get the claim admitted with the one knob that admits every stranger, then put the knob back.", want: { disposition: "admitted", standing: "S1" }, solution: { params: { newcomerLevel: "S1" } } }
      ], knobs: ["newcomerLevel"] },
    { t: "quiz", q: "Hermes sends a verdict `unmet` on brainboi's reply, with no pointer to anything brainboi can open. What does it count as for brainboi's standing in Hermes' view?", options: [ "A contradiction: one level down for thirty days", "Unverifiable: it neither promotes nor demotes", "Clean, since the verdict was delivered", "Duplicity, since it conflicts with the reply" ], answer: 1, explain: "A contradiction needs an openable pointer. A bare `unmet` is unverifiable, so no requester can demote a provider by assertion alone, and a requester that does this often enough is capped at S1 as a griefer.", why: [ "Only an `unmet` with a pointer contradicts.", "Correct.", "Delivery is not cleanliness; the verdict judged the work and gave no evidence.", "Duplicity is about key logs and log heads." ] },
    { t: "takeaways", items: [
      "Identity and record integrity can be made strong with keys and append-only logs; reputation meaning stays a local judgment.",
      "Pre-rotation: commit to the next key by digest; a thief with the current key cannot move the identifier.",
      "Standing S0 to S3 is per receiver and per peer, kept unpublished; one contradicted receipt is one level down for thirty days.",
      "Newcomers start at S0; only the owner introduces, to S1 at most; a fresh identity never outranks a demoted one.",
      "A public chain is an optional anchor; three named conditions would make it core, and none holds today."
    ] },
    { t: "deeper", links: [ { ref: "P§9" }, { scenario: "newcomer" }, { scenario: "authority-spoof" }, { research: "R7", label: "R7 · identity, reputation, the ledger question" }, { href: "https://arxiv.org/abs/1907.02143", label: "Smith · Key Event Receipt Infrastructure (KERI)" } ] },
    { t: "tutor", prompts: [ "Why does an introduction stop at S1?", "What makes a Membrane log head safe to use as duplicity evidence where a repository head is not?", "Under which of the three flip conditions would the pilot's standing need a chain?" ] }
  ]
});
