"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Fog } from "three";

/**
 * Depth fog that follows the camera. Reagraph's own fog uses fixed distances
 * that rarely line up with where the camera ends up after auto-fit, so this
 * re-derives the fog range from the live camera distance every frame: nodes at
 * the front stay crisp, nodes at the back fade toward the page color. This is
 * the light-mode stand-in for the neon glow dark sites use to sell depth.
 */
export function DepthFog({ color, strength = 1 }: { color: string; strength?: number }) {
  const fogRef = useRef<Fog | null>(null);

  useFrame(({ camera }) => {
    const fog = fogRef.current;
    if (!fog) return;
    const d = camera.position.length();
    fog.near = d * (0.72 / strength);
    fog.far = d * (1.9 / strength);
  });

  return <fog ref={fogRef} attach="fog" args={[color, 1, 2]} />;
}
