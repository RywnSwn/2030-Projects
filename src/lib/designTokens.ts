// Single source of truth for colors. `scripts/generate-tokens.mjs` turns this
// into src/styles/tokens.css (CSS variables for Tailwind), and the WebGL scene
// imports these hex strings directly so the graph and the UI never drift apart.

export const designTokens = {
  /** Warm off-white page background (pure white washes out pastels). */
  bg: "#FBF7F1",
  /** Slightly deeper warm tone for cards and the graph canvas fog. */
  bgMuted: "#F3ECE2",
  /** Near-black warm ink for all text. */
  ink: "#1C1A17",
  /** Secondary text. */
  inkMuted: "#6B655C",
  /** Hairlines and dividers. */
  line: "#E4DCCF",
  /**
   * One pastel per detected community, assigned by descending cluster size.
   * Order matters: index 0 goes to the biggest community.
   */
  pastels: [
    "#B8EBD0", // neo mint
    "#CFC5F5", // lavender
    "#F7C6CF", // blush
    "#F7E39B", // butter yellow
    "#BFDCF5", // soft sky
    "#F9CFB0", // peach
    "#D6E6A8", // pistachio
  ],
  /** Edge color in the graph before per-edge opacity is applied. */
  edge: "#C9BFB0",
} as const;

export type DesignTokens = typeof designTokens;
