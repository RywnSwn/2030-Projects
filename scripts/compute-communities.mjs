// Runs Louvain community detection ONCE over the full weighted graph (all
// edges, including weight 0/1) and writes data/communities.json. Commit the
// output. Never import this from src/: Louvain stays out of the client bundle.
//
// Run: node scripts/compute-communities.mjs
//
// Louvain depends on node visitation order, so we seed the RNG and disable
// random walk to make the result reproducible for a given input.

import { readFileSync, writeFileSync } from "node:fs";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import { designTokens } from "../src/lib/designTokens.ts";

const people = JSON.parse(readFileSync(new URL("../data/people.json", import.meta.url), "utf8"));
const connections = JSON.parse(readFileSync(new URL("../data/connections.json", import.meta.url), "utf8"));

const graph = new Graph({ type: "undirected" });
for (const p of people) graph.addNode(p.id);
for (const c of connections) {
  // A weight-0 edge would be dropped by Louvain (it treats weight as
  // adjacency strength). Give it a tiny positive weight so the pair is still
  // "connected" in the math, but as weakly as possible.
  graph.addEdge(c.a, c.b, { weight: c.weight === 0 ? 0.01 : c.weight });
}

// Small seeded PRNG (mulberry32) so the partition is stable between runs.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const details = louvain.detailed(graph, {
  getEdgeWeight: "weight",
  resolution: 1,
  rng: mulberry32(2030),
  randomWalk: false,
});

// Re-index communities by descending size so pastel[0] is the biggest group.
const sizes = new Map();
for (const c of Object.values(details.communities)) sizes.set(c, (sizes.get(c) ?? 0) + 1);
const ordered = [...sizes.entries()].sort((x, y) => y[1] - x[1] || x[0] - y[0]);
const remap = new Map(ordered.map(([raw], i) => [raw, i]));

const communities = {};
for (const p of people) communities[p.id] = remap.get(details.communities[p.id]);

const communityMeta = ordered.map(([, size], index) => ({
  index,
  size,
  colorHex: designTokens.pastels[index % designTokens.pastels.length],
}));

if (communityMeta.length > designTokens.pastels.length) {
  console.warn(
    `warn: ${communityMeta.length} communities but only ${designTokens.pastels.length} pastels; colors will repeat`,
  );
}

const out = {
  generatedAt: new Date().toISOString(),
  modularity: Number(details.modularity.toFixed(4)),
  communities,
  communityMeta,
};
writeFileSync(new URL("../data/communities.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");

console.log(`modularity ${out.modularity}, ${communityMeta.length} communities`);
for (const m of communityMeta) {
  const members = people.filter((p) => communities[p.id] === m.index).map((p) => p.name);
  console.log(`  #${m.index} (${m.size}, ${m.colorHex}): ${members.join(", ")}`);
}
