"use client";

import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import { useInView, type InViewRef } from "./useInView";

interface RevealProps {
  children: ReactNode;
  /** Stagger within a group, in milliseconds. */
  delay?: number;
  className?: string;
  /** Kept open so a reveal inside a <ul> can still be a real <li>. */
  as?: "div" | "section" | "li" | "p";
}

/**
 * Lifts its children into place the first time they scroll into view. The
 * motion is CSS only, so the `prefers-reduced-motion` block in globals.css
 * flattens it to a plain appearance with no transform.
 */
export function Reveal({ children, delay = 0, className, as = "div" }: RevealProps) {
  const [ref, seen] = useInView();
  const props: { ref: InViewRef; className: string; style?: CSSProperties } = {
    ref,
    className: clsx("reveal", seen && "reveal-in", className),
    style: delay ? { transitionDelay: `${delay}ms` } : undefined,
  };

  // Written out per tag rather than as a dynamic <Tag>: a union of intrinsic
  // elements intersects its props down to `never`, which no cast fixes cleanly.
  switch (as) {
    case "li":
      return <li {...props}>{children}</li>;
    case "section":
      return <section {...props}>{children}</section>;
    case "p":
      return <p {...props}>{children}</p>;
    default:
      return <div {...props}>{children}</div>;
  }
}
