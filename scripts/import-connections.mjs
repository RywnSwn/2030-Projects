// One-off importer: turns the human-readable connection list from PLAN.md
// (lines shaped like `Name A - Name B: 3 (Friends)`) into data/connections.json,
// and the numbered roster into data/people.json.
//
// Usage: node scripts/import-connections.mjs [path/to/PLAN.md]
// Re-run only when the source data is re-collected. Commit the JSON output.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const src = resolve(process.argv[2] ?? "PLAN.md");
const text = readFileSync(src, "utf8");

const slug = (name) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// --- roster: numbered list under the "Names" heading ---
const rosterSection = text.split("**Names")[1] ?? "";
const roster = [];
for (const line of rosterSection.split("\n")) {
  const m = /^(\d+)\.\s+(.+?)\s*$/.exec(line);
  if (m) roster.push(m[2]);
  if (roster.length && line.startsWith("**Connections")) break;
}
if (roster.length !== 39) throw new Error(`expected 39 names, got ${roster.length}`);

// Preserve any emails / gradYear already filled in by hand.
const peoplePath = resolve("data/people.json");
const existing = existsSync(peoplePath)
  ? Object.fromEntries(JSON.parse(readFileSync(peoplePath, "utf8")).map((p) => [p.id, p]))
  : {};

const people = roster.map((name) => {
  const id = slug(name);
  return {
    id,
    name,
    email: existing[id]?.email ?? null,
    gradYear: existing[id]?.gradYear ?? 2030,
  };
});

// --- connections: every `A - B: w (label)` line inside the fenced block ---
const byName = new Map(people.map((p) => [p.name, p.id]));
const connections = [];
const seen = new Set();
const rowRe = /^(.+?) - (.+?): ([0-5]) \((.+?)\)\s*$/;
for (const line of text.split("\n")) {
  const m = rowRe.exec(line);
  if (!m) continue;
  const [, aName, bName, w, label] = m;
  const a = byName.get(aName.trim());
  const b = byName.get(bName.trim());
  if (!a || !b) throw new Error(`unknown name in row: ${line}`);
  const key = [a, b].sort().join("|");
  if (seen.has(key)) {
    console.warn(`duplicate pair skipped: ${line}`);
    continue;
  }
  seen.add(key);
  connections.push({ a, b, weight: Number(w), label });
}

writeFileSync(peoplePath, JSON.stringify(people, null, 2) + "\n");
writeFileSync(resolve("data/connections.json"), JSON.stringify(connections, null, 2) + "\n");
console.log(`wrote ${people.length} people and ${connections.length} connections`);
