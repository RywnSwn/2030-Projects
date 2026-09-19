import { communities, communityOf, people, visibleConnections } from "./graphData";
import type { Person } from "./types";

/**
 * Numbers about the grade as a whole, for the landing page.
 *
 * PRIVACY: every figure here is derived from `visibleConnections` (weight >= 2)
 * only, per the rule in graphData.ts. Nothing on this page may be computed from
 * a hidden 0/1 edge. The community a person belongs to is a whole-graph
 * aggregate and is already public in the map, so grouping by it is fine.
 */

function adjacency(): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>(people.map((p) => [p.id, new Set<string>()]));
  for (const c of visibleConnections) {
    adj.get(c.a)?.add(c.b);
    adj.get(c.b)?.add(c.a);
  }
  return adj;
}

/** Longest shortest-path across the visible graph, or null if it isn't fully connected. */
function degreesOfSeparation(adj: Map<string, Set<string>>): number | null {
  let longest = 0;
  for (const start of adj.keys()) {
    const seen = new Map<string, number>([[start, 0]]);
    const queue = [start];
    for (let i = 0; i < queue.length; i += 1) {
      const current = queue[i];
      const depth = seen.get(current) ?? 0;
      for (const next of adj.get(current) ?? []) {
        if (seen.has(next)) continue;
        seen.set(next, depth + 1);
        queue.push(next);
      }
    }
    if (seen.size !== adj.size) return null;
    for (const depth of seen.values()) longest = Math.max(longest, depth);
  }
  return longest;
}

export interface GroupSummary {
  index: number;
  colorHex: string;
  members: Person[];
  /** Friendships where both people are in this group. */
  inside: number;
  /** Friendships from someone in this group to someone outside it. */
  outside: number;
}

export interface GradeStats {
  peopleCount: number;
  friendshipCount: number;
  groupCount: number;
  /** Friendships that cross a group boundary. The headline number. */
  crossGroup: number;
  /** Friendships where both people share a color. */
  insideGroup: number;
  /** crossGroup as a whole-number percentage. */
  crossGroupPercent: number;
  /** How many people have at least one friend outside their own color. */
  withOutsideFriend: number;
  /** Group pairs with at least one friendship between them, out of every possible pair. */
  linkedPairs: number;
  possiblePairs: number;
  /** Mean visible friendships per person, to one decimal. */
  averageFriends: number;
  /** Longest chain of friendships between any two people, or null if someone is unreachable. */
  separation: number | null;
  groups: GroupSummary[];
}

function computeGradeStats(): GradeStats {
  const adj = adjacency();

  let crossGroup = 0;
  const pairs = new Set<string>();
  const inside = new Map<number, number>();
  const outside = new Map<number, number>();

  for (const c of visibleConnections) {
    const ca = communityOf(c.a);
    const cb = communityOf(c.b);
    if (ca === cb) {
      inside.set(ca, (inside.get(ca) ?? 0) + 1);
      continue;
    }
    crossGroup += 1;
    outside.set(ca, (outside.get(ca) ?? 0) + 1);
    outside.set(cb, (outside.get(cb) ?? 0) + 1);
    pairs.add(ca < cb ? `${ca}-${cb}` : `${cb}-${ca}`);
  }

  const withOutsideFriend = people.filter((p) => {
    const mine = communityOf(p.id);
    for (const other of adj.get(p.id) ?? []) {
      if (communityOf(other) !== mine) return true;
    }
    return false;
  }).length;

  const groupCount = communities.communityMeta.length;
  const degreeTotal = [...adj.values()].reduce((sum, set) => sum + set.size, 0);

  const groups: GroupSummary[] = communities.communityMeta.map((meta) => ({
    index: meta.index,
    colorHex: meta.colorHex,
    members: people
      .filter((p) => communityOf(p.id) === meta.index)
      .sort((a, b) => a.name.localeCompare(b.name)),
    inside: inside.get(meta.index) ?? 0,
    outside: outside.get(meta.index) ?? 0,
  }));

  // Keep the roster whole even if a community ends up with no meta row.
  const placed = new Set(groups.flatMap((g) => g.members.map((m) => m.id)));
  if (placed.size !== people.length) {
    console.warn(`gradeStats: ${people.length - placed.size} people are missing a community`);
  }

  return {
    peopleCount: people.length,
    friendshipCount: visibleConnections.length,
    groupCount,
    crossGroup,
    insideGroup: visibleConnections.length - crossGroup,
    crossGroupPercent: Math.round((crossGroup / Math.max(1, visibleConnections.length)) * 100),
    withOutsideFriend,
    linkedPairs: pairs.size,
    possiblePairs: (groupCount * (groupCount - 1)) / 2,
    averageFriends: Number((degreeTotal / Math.max(1, people.length)).toFixed(1)),
    separation: degreesOfSeparation(adj),
    groups,
  };
}

/** Computed once at module load: the roster is static JSON, it never changes at runtime. */
export const gradeStats: GradeStats = computeGradeStats();
