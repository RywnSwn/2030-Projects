"use client";

import { FriendGraphCanvas, type GraphSceneProps } from "./FriendGraphCanvas";

/** Desktop: semi-3D orbit scene with depth fog and slow idle drift. */
export function GraphScene3D(props: GraphSceneProps) {
  return <FriendGraphCanvas mode="3d" {...props} />;
}
