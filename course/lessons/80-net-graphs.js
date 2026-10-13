Course.lesson({
  id: "net-graphs", part: "annex-network", title: "Graphs and degree",
  kicker: "The shape of a network decides how far a claim travels",
  minutes: 10,
  refs: ["P§6.3", "P§9.4", "R7·F11"],
  objectives: [
    "Define degree, path length and clustering and read a degree distribution.",
    "Tell a random network from a small-world and a scale-free one by those three measures.",
    "Say why hubs exist in one model and not another, and what a hub means for a relayed claim."
  ],
  summary: "A network is nodes and edges; a node's degree is its number of edges. In a random network every pair is joined with the same probability, degrees cluster around the average and there are no hubs. Watts and Strogatz showed that rewiring a few edges of a regular lattice gives a network that is highly clustered like the lattice and has short paths like a random graph: a small world. Barabási and Albert showed that growth plus preferential attachment, new nodes joining well-connected ones, gives a degree distribution that falls as a power law, so a few hubs carry a large share of the edges. In an agent network the hub is a relay, and a relay is where an evidence kind gets laundered unless the origin travels with the claim.",
  blocks: [
    { t: "p", text: "Echo, the playground's relay, has more neighbours than any other agent in the simulation, and a habit of forwarding what it hears with the label it was given. Whether that habit matters depends on the shape of the network around it: with two agents there is no shape, with a hundred there is, and the shape decides how fast a claim spreads, how far a false one travels before a second signal catches it, and whether a reputation computed over the network can be gamed. Three models and three numbers are the vocabulary for that shape." },
    { t: "widget", name: "graphLab", props: { model: "random" } },
    { t: "define", terms: [
      { term: "degree", def: "The number of edges at a node." },
      { term: "degree distribution", def: "P(k), the fraction of nodes with degree k." },
      { term: "path length", def: "Edges on the shortest route between two nodes, averaged over pairs." },
      { term: "clustering", def: "How often two neighbours of a node are neighbours of each other." },
      { term: "hub", def: "A node with a degree far above the average." }
    ] },
    { t: "h", text: "Three models" },
    { t: "table", head: ["Model", "How it is built", "Degree distribution", "Path length", "Clustering", "Hubs"], rows: [
      ["Random (Erdős and Rényi)", "every pair of nodes is joined with the same probability", "peaked around the average; most nodes have about the same degree", "short", "low", "none"],
      ["Small world (Watts and Strogatz)", "a regular lattice with a small fraction of edges rewired at random", "close to the lattice's", "short, once a few long-range edges exist", "high", "none"],
      ["Scale-free (Barabási and Albert)", "the network grows, and each new node attaches preferentially to well-connected nodes", "a power law, P(k) proportional to k to a negative exponent", "short", "low, falling with size", "a few, carrying a large share of edges"]
    ], caption: "Build each in the lab and watch the three measures. Barabási and Albert open their paper by noting that the predictions of Erdős and Rényi's random-graph theory had rarely been tested on large real networks before data arrived." },
    { t: "p", text: "Watts and Strogatz tuned a single parameter, the probability of rewiring an edge, from zero (a lattice) to one (a random graph), and found a broad middle region where the network is highly clustered, like a lattice, and has a short characteristic path length, like a random graph. They called such networks small-world, by analogy with six degrees of separation, and showed that the neural network of the worm *C. elegans*, the power grid of the western United States and the collaboration graph of film actors all have the property. The last sentence of their abstract is the one the next lesson returns to: infectious diseases spread more easily in small-world networks than in regular lattices." },
    { t: "p", text: "Barabási and Albert found that in networks as different as the web and scientific citations, the probability that a node has k edges falls as a power law, P(k) proportional to k to the power minus gamma, with the exponent near 3 in their model. Two ingredients produce it: the network grows by adding nodes, and new nodes attach preferentially to nodes that already have many edges. Remove either and the power law disappears." },
    { t: "p", text: "The consequence is hubs. In a random network of a thousand agents with an average degree of four, no agent has fifty peers; in a scale-free one, a few do." },
    { t: "h", text: "What the shape does to a protocol" },
    { t: "p", text: "Membrane is specified for two owners and says so, and its rules are written so that they still hold when the pair becomes a network." },
    { t: "list", items: [
      "**Relays are hubs.** In a scale-free network most paths between two agents run through a few nodes, so the rule that relays never upgrade a claim, and that `origin` names the first assertion, does most of its work at the hubs [[P§6.3]]. The cascade in the next lesson shows how far a laundered claim gets with the rule off.",
      "**Short paths cut both ways.** A small world means a claim reaches everyone in a few hops, and so does a false one, and so does an attack signature. Membrane's answer is that every hop re-judges the claim against the evidence kind it carries, and a shared signature enters as a held detector that decays unless confirmed locally.",
      "**Reputation over a network is where Sybils live.** A reputation function that depends only on the shape of the graph can be inflated by a cluster of fake identities linking to each other. The functions that resist this start from a trusted source and follow edges outward [[R7·F11]]. Membrane's standing counts indirect evidence only through peers the reader already trusts; [[lesson:net-sybil|the Sybil lesson]] has the theorem and the price."
    ] },
    { t: "quiz", q: "A network of a thousand agents has an average degree of four. Which model would you suspect if you found an agent with eighty peers, twenty times the average?", options: [ "Random: a lucky node, since with a thousand draws some node will sit far out in the tail of the degree distribution", "Small world: a node that received several rewired long-range edges, which the rewiring step hands out at random", "Scale-free: a hub produced by preferential attachment", "None of the three; a node with eighty peers at average degree four is a measurement error or a duplicate identity" ], answer: 2, explain: "In a random network with average degree four, a degree of eighty is vanishingly unlikely; in a small world the distribution stays close to the lattice's, and rewiring moves one edge at a time. A power-law tail is the only one of the three that routinely produces nodes with degrees twenty times the average; the lab's own generator at a thousand nodes gives a largest degree near eighty.", why: [ "The random distribution falls off far too fast for this.", "Rewiring moves edges; it does not pile them onto one node.", "Correct.", "Hubs are the signature of real networks, and the reason the random model was revised." ] },
    { t: "quiz", q: "Which measure separates a small-world network from a random one with the same number of nodes and edges?", options: [ "Path length", "Clustering", "Average degree", "Number of hubs" ], answer: 1, explain: "Both have short paths and the same average degree, and neither has hubs. The small world keeps the lattice's high clustering; the random graph has almost none.", why: [ "Both are short; that is what makes the small world small.", "Correct.", "Equal by construction.", "Neither model produces hubs." ] },
    { t: "takeaways", items: [
      "Degree, path length, clustering: three numbers that tell the three models apart.",
      "Growth plus preferential attachment makes hubs; a relay is a hub; `origin` and the no-upgrade rule do their work there.",
      "Short paths carry claims and attacks alike, so every hop re-judges what it receives."
    ] },
    { t: "deeper", links: [ { href: "https://arxiv.org/abs/cond-mat/9910332", label: "Barabási and Albert (1999) · Emergence of scaling in random networks" }, { href: "https://arxiv.org/abs/cond-mat/0303516", label: "Newman (2003) · The structure and function of complex networks" }, { research: "R7", label: "R7 · F11, Sybil-proof reputation" }, { ref: "P§6.3" } ] }
  ]
});
