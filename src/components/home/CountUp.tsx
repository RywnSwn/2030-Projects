"use client";

import { useEffect, useState } from "react";
import { useInView, usePrefersReducedMotion } from "./useInView";

/**
 * Counts from zero to `value` once it scrolls into view. Skips straight to the
 * real number when motion is reduced, and always puts the final number in the
 * DOM so a screen reader is never read a half-finished count.
 */
export function CountUp({ value, durationMs = 1100 }: { value: number; durationMs?: number }) {
  const [ref, seen] = useInView();
  const reduced = usePrefersReducedMotion();
  const [counted, setCounted] = useState(0);

  useEffect(() => {
    if (!seen || reduced) return;

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // Ease out cubic: fast at first, gently lands on the real number.
      setCounted(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [seen, value, durationMs, reduced]);

  return (
    <span ref={ref} className="tabular-nums">
      <span aria-hidden="true">{reduced ? value : counted}</span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
