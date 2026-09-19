import { ViewTransition } from "react";
import type { ReactNode } from "react";

/**
 * Crossfades one route's content into the next. Lives in every page.tsx, not
 * the root layout: the header/footer there persist across navigation, so
 * they never unmount/remount and would never see an enter/exit animation.
 * The browser only animates what actually changed, so header and footer stay
 * put while this fades and drifts the page content in and out.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit">
      {children}
    </ViewTransition>
  );
}
