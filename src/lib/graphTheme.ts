import type { Theme } from "reagraph";
import { designTokens } from "./designTokens";

/**
 * Light reagraph theme built from the design tokens. Hover highlighting keeps
 * the person and their direct connections at full opacity and dims everyone
 * else to 40% (soft, not a hard fade).
 */
export const INACTIVE_OPACITY = 0.4;

export const graphTheme: Theme = {
  canvas: {
    background: designTokens.bg,
    // Fog is managed by <DepthFog> so its range follows the camera distance.
    fog: null,
  },
  node: {
    fill: designTokens.pastels[0],
    activeFill: designTokens.pastels[0],
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: INACTIVE_OPACITY,
    label: {
      color: designTokens.ink,
      stroke: designTokens.bg,
      activeColor: designTokens.ink,
    },
    subLabel: {
      color: designTokens.inkMuted,
      stroke: designTokens.bg,
      activeColor: designTokens.ink,
    },
  },
  ring: {
    fill: designTokens.ink,
    activeFill: designTokens.ink,
  },
  edge: {
    fill: designTokens.edge,
    activeFill: designTokens.inkMuted,
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: INACTIVE_OPACITY * 0.5,
    label: {
      color: designTokens.inkMuted,
      stroke: designTokens.bg,
      activeColor: designTokens.ink,
      fontSize: 6,
    },
  },
  arrow: {
    fill: designTokens.edge,
    activeFill: designTokens.inkMuted,
  },
  lasso: {
    border: `1px solid ${designTokens.inkMuted}`,
    background: "rgba(28, 26, 23, 0.06)",
  },
};
