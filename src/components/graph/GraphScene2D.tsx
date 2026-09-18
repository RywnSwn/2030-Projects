"use client";

import { FriendGraphCanvas, type GraphSceneProps } from "./FriendGraphCanvas";

/** Small screens: the same graph laid out flat, pan and pinch only. */
export function GraphScene2D(props: GraphSceneProps) {
  return <FriendGraphCanvas mode="2d" {...props} />;
}
