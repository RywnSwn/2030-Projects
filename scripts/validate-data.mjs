// Sanity check for the static graph data. Exits non-zero on hard errors.
// Run: node scripts/validate-data.mjs

import { readFileSync } from "node:fs";

const people = JSON.parse(readFileSync(new URL("../data/people.json", import.meta.url), "utf8"));
const connections = JSON.parse(readFileSync(new URL("../data/connections.json", import.meta.url), "utf8"));

const errors = [];
const warnings = [];

// --- people ---
const ids = new Set();
for (const p of people) {
  if (!p.id || !/^[a-z0-9-]+$/.test(p.id)) errors.push(`bad id: ${JSON.stringify(p)}`);
  if (ids.has(p.id)) errors.push(`duplicate id: ${p.id}`);
  ids.add(p.id);
  if (!p.name) errors.push(`missing name for ${p.id}`);
  if (p.email === null) warnings.push(`no email yet for ${p.id} (needed for login claiming in Phase 4)`);
}
if (people.length !== 39) errors.push(`expected 39 people, found ${people.length}`);

// --- connections ---
const maxPairs = (people.length * (people.length - 1)) / 2;
const seenPairs = new Set();
const degree = Object.fromEntries(people.map((p) => [p.id, 0]));
for (const c of connections) {
  if (!ids.has(c.a)) errors.push(`unknown person "${c.a}" in connection`);
  if (!ids.has(c.b)) errors.push(`unknown person "${c.b}" in connection`);
  if (c.a === c.b) errors.push(`self-connection for ${c.a}`);
  if (!Number.isInteger(c.weight) || c.weight < 0 || c.weight > 5) errors.push(`weight out of [0,5]: ${JSON.stringify(c)}`);
  const key = [c.a, c.b].sort().join("|");
  if (seenPairs.has(key)) errors.push(`duplicate pair: ${key}`);
  seenPairs.add(key);
  if (degree[c.a] !== undefined) degree[c.a]++;
  if (degree[c.b] !== undefined) degree[c.b]++;
}
if (connections.length > maxPairs) errors.push(`more connections (${connections.length}) than possible pairs (${maxPairs})`);

const expectedDegree = people.length - 1;
for (const [id, d] of Object.entries(degree)) {
  if (d < expectedDegree * 0.5) warnings.push(`${id} has only ${d}/${expectedDegree} rated connections`);
}

const weightHistogram = [0, 1, 2, 3, 4, 5].map((w) => `${w}:${connections.filter((c) => c.weight === w).length}`).join("  ");

console.log(`people: ${people.length}`);
console.log(`connections: ${connections.length} of ${maxPairs} possible pairs`);
console.log(`weights: ${weightHistogram}`);
for (const w of warnings) console.warn(`warn: ${w}`);
for (const e of errors) console.error(`ERROR: ${e}`);
if (errors.length) {
  console.error(`${errors.length} error(s)`);
  process.exit(1);
}
console.log("ok");
