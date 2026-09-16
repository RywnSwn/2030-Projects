import { designTokens } from "./designTokens";

/** Relative luminance per WCAG 2.x. */
function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** WCAG contrast ratio between two hex colors (1 to 21). */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = luminance(hexA);
  const lb = luminance(hexB);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Pastel for a community index, wrapping if there are more communities than pastels. */
export function communityColor(index: number): string {
  return designTokens.pastels[index % designTokens.pastels.length];
}

/**
 * The pastel with the best contrast against ink. Used for buttons and accents
 * so text on them always passes WCAG AA.
 */
export const accentColor: string = [...designTokens.pastels].sort(
  (a, b) => contrastRatio(b, designTokens.ink) - contrastRatio(a, designTokens.ink),
)[0];

/** Every pastel/ink pairing actually used, with its ratio. Handy for the a11y audit. */
export function contrastReport(): { hex: string; ratio: number; passesAA: boolean }[] {
  return designTokens.pastels.map((hex) => {
    const ratio = contrastRatio(hex, designTokens.ink);
    return { hex, ratio: Number(ratio.toFixed(2)), passesAA: ratio >= 4.5 };
  });
}

/** Darken a hex color by mixing toward ink. `amount` 0..1. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const ink = parseInt(designTokens.ink.replace("#", ""), 16);
  const mix = (shift: number) => {
    const c = (n >> shift) & 255;
    const i = (ink >> shift) & 255;
    return Math.round(c + (i - c) * amount);
  };
  return `#${((mix(16) << 16) | (mix(8) << 8) | mix(0)).toString(16).padStart(6, "0")}`;
}

/** Linear mix of two hex colors. `t` 0 returns `a`, 1 returns `b`. */
export function mixHex(a: string, b: string, t: number): string {
  const na = parseInt(a.replace("#", ""), 16);
  const nb = parseInt(b.replace("#", ""), 16);
  const ch = (shift: number) => {
    const ca = (na >> shift) & 255;
    const cb = (nb >> shift) & 255;
    return Math.round(ca + (cb - ca) * t);
  };
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}
