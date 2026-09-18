"use client";

import { useCallback, useEffect, useState } from "react";

/** A ref you can hand to any element, whatever its tag. */
export type InViewRef = (node: HTMLElement | null) => void;

/**
 * True once the element has been scrolled into view. Never flips back: things
 * stay revealed, so scrolling up doesn't re-run the whole page's animations.
 *
 * The observer is wired up in a callback ref rather than an effect for two
 * reasons: callback refs are contravariant in the element type, so one hook
 * works on a <div>, an <li> and a <span> alike, and it keeps the setup out of
 * an effect body where a synchronous setState would cascade renders.
 */
export function useInView(
  options: { rootMargin?: string; threshold?: number } = {},
): [InViewRef, boolean] {
  const [seen, setSeen] = useState(false);
  const { rootMargin = "0px 0px -12% 0px", threshold = 0.15 } = options;

  const ref = useCallback<InViewRef>(
    (node) => {
      if (!node || seen) return;

      // No IntersectionObserver (or a very old browser): show the content
      // rather than leaving the page permanently blank.
      if (typeof IntersectionObserver === "undefined") {
        setSeen(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setSeen(true);
            observer.disconnect();
          }
        },
        { rootMargin, threshold },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [seen, rootMargin, threshold],
  );

  return [ref, seen];
}

/** Respects the OS "reduce motion" setting, and keeps up if it changes mid-session. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}
