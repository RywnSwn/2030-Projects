"use client";

import { FriendGraphCanvas } from "./FriendGraphCanvas";
import type { PersonNodeData } from "@/lib/graphData";

/** Small screens: the same graph laid out flat, pan and pinch only. */
export function GraphScene2D(props: { onHoverPerson?: (d: PersonNodeData | null) => void }) {
  return <FriendGraphCanvas mode="2d" {...props} />;
}
