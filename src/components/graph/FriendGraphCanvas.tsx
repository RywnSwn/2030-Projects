"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GraphCanvas, type GraphCanvasRef, type GraphNode, type InternalGraphNode, type NodeRendererProps } from "reagraph";
import { buildFriendGraph, linkStrengthForWeight, type PersonNodeData } from "@/lib/graphData";
import { graphTheme } from "@/lib/graphTheme";
import { designTokens } from "@/lib/designTokens";
import { DepthFog } from "./DepthFog";
import { PersonNode } from "./PersonNode";
import { useEgoHighlight } from "./useEgoHighlight";
import { useIdleDrift } from "./useIdleDrift";

export type GraphMode = "2d" | "3d";

/** Shape of a link as reagraph hands it to the layout strength callbacks. */
interface LayoutLink {
  data?: { weight?: number };
  weight?: number;
}

function weightOf(e: LayoutLink): number {
  return e?.data?.weight ?? e?.weight ?? 2;
}

interface FriendGraphCanvasProps {
  mode: GraphMode;
  /** personId -> photoURL from live profiles (Phase 5). */
  photos?: Record<string, string | null>;
  onHoverPerson?: (data: PersonNodeData | null) => void;
}

/**
 * The shared graph canvas. GraphScene2D / GraphScene3D are thin wrappers that
 * set `mode`; everything else (theme, nodes, hover dimming, click-to-profile)
 * is identical, which is the whole point of picking reagraph.
 */
export function FriendGraphCanvas({ mode, photos, onHoverPerson }: FriendGraphCanvasProps) {
  const ref = useRef<GraphCanvasRef | null>(null);
  const router = useRouter();
  const [hovering, setHovering] = useState(false);
  const { nodes, edges } = useMemo(() => buildFriendGraph(photos), [photos]);
  const { actives, onNodePointerOver, onNodePointerOut } = useEgoHighlight(ref, nodes, edges);

  useIdleDrift(ref, { enabled: mode === "3d", paused: hovering });

  // Reagraph fits the camera once, early. Fit again after the layout settles
  // and whenever the viewport changes so portrait phones see the whole graph.
  // (maxDistance below must stay generous: the 10 degree lens needs a long
  // pull-back to fit a wide graph into a narrow viewport.)
  useEffect(() => {
    const fit = () => ref.current?.fitNodesInView(undefined, { animated: true });
    const initial = window.setTimeout(fit, 1400);
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
  }, [mode]);

  const handleOver = useCallback(
    (node: InternalGraphNode) => {
      setHovering(true);
      onNodePointerOver(node as GraphNode);
      onHoverPerson?.((node.data as PersonNodeData) ?? null);
    },
    [onNodePointerOver, onHoverPerson],
  );

  const handleOut = useCallback(
    (node: InternalGraphNode) => {
      setHovering(false);
      onNodePointerOut(node as GraphNode);
      onHoverPerson?.(null);
    },
    [onNodePointerOut, onHoverPerson],
  );

  const handleClick = useCallback(
    (node: InternalGraphNode) => {
      const data = node.data as PersonNodeData | undefined;
      if (data?.personId) router.push(`/profile/${data.personId}/`);
    },
    [router],
  );

  const is3d = mode === "3d";

  // reagraph invokes renderNode as a plain function, so it must return an
  // element; PersonNode itself uses hooks and has to be a real component.
  const renderNode = useCallback((props: NodeRendererProps) => <PersonNode {...props} />, []);

  // Louvain groups pull together, cross-group ties stay loose, and every tie
  // scales with its weight so the picture matches the numbers.
  const layoutOverrides = useMemo(
    () => ({
      linkDistance: is3d ? 26 : 24,
      nodeStrength: is3d ? -130 : -110,
      clusterStrength: 0.85,
      forceLinkDistance: 55,
      forceCharge: -320,
      linkStrengthIntraCluster: (e: LayoutLink) => linkStrengthForWeight(weightOf(e), true),
      linkStrengthInterCluster: (e: LayoutLink) => linkStrengthForWeight(weightOf(e), false),
    }),
    [is3d],
  );

  return (
    <GraphCanvas
      ref={ref}
      nodes={nodes}
      edges={edges}
      theme={graphTheme}
      layoutType={is3d ? "forceDirected3d" : "forceDirected2d"}
      layoutOverrides={layoutOverrides}
      clusterAttribute="community"
      cameraMode={is3d ? "rotate" : "pan"}
      sizingType="attribute"
      sizingAttribute="strength"
      minNodeSize={8}
      maxNodeSize={18}
      labelType="none"
      edgeInterpolation="curved"
      edgeArrowPosition="none"
      animated
      draggable={false}
      actives={actives}
      selections={[]}
      renderNode={renderNode}
      onNodePointerOver={handleOver}
      onNodePointerOut={handleOut}
      onNodeClick={handleClick}
      minDistance={is3d ? 400 : 250}
      maxDistance={30000}
    >
      <directionalLight position={[-3, 4, 6]} intensity={0.9} />
      <directionalLight position={[4, -2, -3]} intensity={0.25} />
      {is3d && <DepthFog color={designTokens.bg} />}
    </GraphCanvas>
  );
}
