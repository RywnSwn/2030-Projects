import type { GraphEdge, GraphNode } from "reagraph";
import peopleJson from "../../data/people.json";
import connectionsJson from "../../data/connections.json";
import communitiesJson from "../../data/communities.json";
import type { CommunitiesFile, Connection, Person } from "./types";
import { communityColor, mixHex } from "./louvainColors";
import { designTokens } from "./designTokens";

export const people = peopleJson as Person[];
export const connections = connectionsJson as Connection[];
export const communities = communitiesJson as CommunitiesFile;

/**
 * PRIVACY RULE. Only edges at or above this weight may ever reach the UI:
 * rendering, sizing, tooltips, ARIA text, counts, ego graphs. Weight 0/1 edges
 * exist only inside scripts/compute-communities.mjs.
 */
export const VISIBLE_MIN_WEIGHT = 2;

/** The only connection list any UI code should touch. */
export const visibleConnections: Connection[] = connections.filter((c) => c.weight >= VISIBLE_MIN_WEIGHT);

const peopleById = new Map(people.map((p) => [p.id, p]));

export function getPerson(id: string): Person | undefined {
  return peopleById.get(id);
}

export function communityOf(personId: string): number {
  return communities.communities[personId] ?? 0;
}

/** "Ethan Chen Aung" -> "EA". The fallback face on both the dots and the profile avatars. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface PersonNodeData {
  personId: string;
  name: string;
  community: number;
  /** Sum of visible edge weights. Drives node size. */
  strength: number;
  /** Count of visible edges. */
  degree: number;
}

export interface VisibleNeighbor {
  person: Person;
  weight: number;
  label: string;
}

/** Direct connections (weight >= 2 only), strongest first. */
export function visibleNeighbors(personId: string): VisibleNeighbor[] {
  const out: VisibleNeighbor[] = [];
  for (const c of visibleConnections) {
    const otherId = c.a === personId ? c.b : c.b === personId ? c.a : null;
    if (!otherId) continue;
    const person = peopleById.get(otherId);
    if (person) out.push({ person, weight: c.weight, label: c.label });
  }
  return out.sort((x, y) => y.weight - x.weight || x.person.name.localeCompare(y.person.name));
}

function strengthMap(): Map<string, { strength: number; degree: number }> {
  const m = new Map<string, { strength: number; degree: number }>();
  for (const p of people) m.set(p.id, { strength: 0, degree: 0 });
  for (const c of visibleConnections) {
    for (const id of [c.a, c.b]) {
      const s = m.get(id);
      if (s) {
        s.strength += c.weight;
        s.degree += 1;
      }
    }
  }
  return m;
}

/** Edge thickness by weight. Weight 2 is a hairline; 5 is chunky. */
export function edgeSizeForWeight(weight: number): number {
  return { 2: 0.3, 3: 0.9, 4: 1.6, 5: 2.4 }[weight] ?? 0.3;
}

/**
 * Edge color by weight. Reagraph has no per-edge opacity, so faintness is
 * faked by mixing the edge color toward the page background: classmates
 * (weight 2) are a whisper, good friends (5) are solid.
 */
export function edgeColorForWeight(weight: number): string {
  const towardBg = { 2: 0.7, 3: 0.32, 4: 0.12, 5: 0 }[weight] ?? 0.7;
  return mixHex(designTokens.edge, designTokens.bg, towardBg);
}

/** How hard the layout pulls two people together, by weight. */
export function linkStrengthForWeight(weight: number, sameCommunity: boolean): number {
  const intra = { 2: 0.08, 3: 0.35, 4: 0.7, 5: 1 } as Record<number, number>;
  const inter = { 2: 0.004, 3: 0.03, 4: 0.09, 5: 0.18 } as Record<number, number>;
  return (sameCommunity ? intra : inter)[weight] ?? 0.05;
}

export interface FriendGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Builds the reagraph input. Photos deliberately do not live here: they arrive
 * after the first paint, and rebuilding the node array would restart the
 * layout. They reach the node renderer as a prop instead.
 */
export function buildFriendGraph(): FriendGraph {
  const strengths = strengthMap();
  const nodes: GraphNode[] = people.map((p) => {
    const s = strengths.get(p.id) ?? { strength: 0, degree: 0 };
    const community = communityOf(p.id);
    const data: PersonNodeData = {
      personId: p.id,
      name: p.name,
      community,
      strength: s.strength,
      degree: s.degree,
    };
    return {
      id: p.id,
      label: p.name,
      fill: communityColor(community),
      cluster: String(community),
      size: s.strength,
      data,
    };
  });

  const edges: GraphEdge[] = visibleConnections.map((c) => ({
    id: `${c.a}--${c.b}`,
    source: c.a,
    target: c.b,
    size: edgeSizeForWeight(c.weight),
    fill: edgeColorForWeight(c.weight),
    data: { weight: c.weight, label: c.label },
  }));

  return { nodes, edges };
}

/** Ego graph for one profile: the person plus only their visible neighbors. */
export function buildEgoGraph(personId: string): FriendGraph {
  const neighbors = visibleNeighbors(personId);
  const keep = new Set([personId, ...neighbors.map((n) => n.person.id)]);
  const full = buildFriendGraph();
  return {
    nodes: full.nodes.filter((n) => keep.has(n.id)),
    edges: full.edges.filter((e) => e.source === personId || e.target === personId),
  };
}

/** Sorted alphabetically for the keyboard-accessible list page. */
export const peopleAlphabetical: Person[] = [...people].sort((a, b) => a.name.localeCompare(b.name));
