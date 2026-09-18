"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { GraphCanvas, type GraphCanvasRef, type InternalGraphNode, type NodeRendererProps } from "reagraph";
import { buildEgoGraph, type PersonNodeData } from "@/lib/graphData";
import { graphTheme } from "@/lib/graphTheme";
import { PersonNode } from "../graph/PersonNode";

interface EgoMiniGraphProps {
  personId: string;
  photos?: Record<string, string | null>;
}

/**
 * Tighter than the main map on purpose. This is a hub with up to ~35 spokes in
 * a small box, so the ring has to stay compact or fitting it in view zooms out
 * until the names are unreadable.
 */
const LAYOUT = {
  linkDistance: 42,
  nodeStrength: -55,
  forceLinkDistance: 42,
  forceCharge: -120,
};

/**
 * One person and their direct connections, flat and pan-only. Built from
 * `buildEgoGraph`, so weight 0/1 ties cannot reach it. No idle drift here: a
 * small graph sitting inside a page should hold still.
 */
export function EgoMiniGraph({ personId, photos }: EgoMiniGraphProps) {
  const ref = useRef<GraphCanvasRef | null>(null);
  const router = useRouter();
  const { nodes, edges } = useMemo(() => buildEgoGraph(personId), [personId]);

  // Fit once the force layout has settled, then again on resize.
  useEffect(() => {
    const fit = () => ref.current?.fitNodesInView(undefined, { animated: true });
    const initial = window.setTimeout(fit, 900);
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(fit, 250);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(initial);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, [personId]);

  const renderNode = useCallback(
    (props: NodeRendererProps) => {
      const id = (props.node.data as PersonNodeData | undefined)?.personId;
      return <PersonNode {...props} photoURL={id ? photos?.[id] : null} />;
    },
    [photos],
  );

  const handleClick = useCallback(
    (node: InternalGraphNode) => {
      const id = (node.data as PersonNodeData | undefined)?.personId;
      if (id && id !== personId) router.push(`/profile/${id}/`);
    },
    [router, personId],
  );

  return (
    <GraphCanvas
      ref={ref}
      nodes={nodes}
      edges={edges}
      theme={graphTheme}
      layoutType="forceDirected2d"
      layoutOverrides={LAYOUT}
      cameraMode="pan"
      sizingType="attribute"
      sizingAttribute="strength"
      minNodeSize={9}
      maxNodeSize={16}
      labelType="none"
      edgeInterpolation="curved"
      edgeArrowPosition="none"
      animated
      draggable={false}
      renderNode={renderNode}
      onNodeClick={handleClick}
      minDistance={150}
      maxDistance={9000}
    >
      <directionalLight position={[-3, 4, 6]} intensity={0.9} />
      <directionalLight position={[4, -2, -3]} intensity={0.25} />
    </GraphCanvas>
  );
}
