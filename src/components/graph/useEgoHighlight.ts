"use client";

import { useCallback, type RefObject } from "react";
import { useSelection, type GraphCanvasRef, type GraphEdge, type GraphNode } from "reagraph";

/**
 * Hover-only "ego highlight": while a person is hovered, they and their direct
 * connections stay at full opacity and everyone else dims to the theme's
 * inactiveOpacity (0.4). Nothing is click-locked; a click navigates instead.
 */
export function useEgoHighlight(ref: RefObject<GraphCanvasRef | null>, nodes: GraphNode[], edges: GraphEdge[]) {
  const selection = useSelection({
    ref,
    nodes,
    edges,
    type: "single",
    pathHoverType: "direct",
    pathSelectionType: "direct",
    focusOnSelect: false,
  });

  const onNodePointerOver = useCallback(
    (node: GraphNode) => selection.onNodePointerOver?.(node),
    [selection],
  );
  const onNodePointerOut = useCallback(
    (node: GraphNode) => selection.onNodePointerOut?.(node),
    [selection],
  );

  return {
    /** Ids (nodes and edges) that should stay bright. Empty means nothing hovered. */
    actives: selection.actives,
    onNodePointerOver,
    onNodePointerOut,
  };
}
