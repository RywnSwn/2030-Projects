"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { PersonNodeData } from "@/lib/graphData";
import { useProfiles } from "@/lib/profiles";

// WebGL never runs during static prerender: both scenes load client-side only.
const GraphScene3D = dynamic(() => import("./GraphScene3D").then((m) => m.GraphScene3D), { ssr: false });
const GraphScene2D = dynamic(() => import("./GraphScene2D").then((m) => m.GraphScene2D), { ssr: false });

const SMALL_SCREEN = "(max-width: 767px), (pointer: coarse) and (max-width: 1024px)";

function useSmallScreen(): boolean | null {
  const [small, setSmall] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(SMALL_SCREEN);
    const update = () => setSmall(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return small;
}

/**
 * Client boundary around the graph. Picks the flat 2D scene on phones and the
 * semi-3D scene everywhere else. Renders nothing until the breakpoint is known
 * so the wrong scene never flashes. Profile photos are fetched here and fade
 * onto the dots whenever they arrive; the graph never waits for them.
 */
export function GraphSceneClient({ onHoverPerson }: { onHoverPerson?: (d: PersonNodeData | null) => void }) {
  const small = useSmallScreen();
  const { photos } = useProfiles();
  if (small === null) return null;
  const Scene = small ? GraphScene2D : GraphScene3D;
  return <Scene photos={photos} onHoverPerson={onHoverPerson} />;
}
