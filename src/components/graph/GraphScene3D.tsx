"use client";

import { FriendGraphCanvas } from "./FriendGraphCanvas";
import type { PersonNodeData } from "@/lib/graphData";

/** Desktop: semi-3D orbit scene with depth fog and slow idle drift. */
export function GraphScene3D(props: { onHoverPerson?: (d: PersonNodeData | null) => void }) {
  return <FriendGraphCanvas mode="3d" {...props} />;
}
