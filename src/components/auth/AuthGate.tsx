"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { NotOnRoster } from "./NotOnRoster";
import { SitePaused } from "./SitePaused";

/** Pages anyone can open without signing in. Everything else needs a claimed account. */
const PUBLIC_PATHS = ["/login", "/privacy"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * `next build` sets this; `next dev` does not. Used to tell "still building
 * locally" apart from "this is the bundle that actually got deployed."
 */
const isDeployedBuild = process.env.NODE_ENV === "production";

/**
 * Route-level login gate for the whole static site.
 *
 * Before Supabase is configured there is no login to send anyone to, so a
 * local dev server stays fully open for convenience while building. A
 * **deployed** build is different: it sits at a real public URL, and this
 * site's whole point is that real names and the friend graph are NOT public.
 * So a deployed build with Supabase still unconfigured shows a "not open
 * yet" notice on every route except /login and /privacy, instead of quietly
 * running wide open until someone remembers to finish wiring sign-in up.
 *
 * This is still only a UI gate: the data that matters is protected by row
 * level security in Supabase, not by this component.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const publicPath = isPublic(pathname);
  const pausedForDeploy = !publicPath && state.status === "unconfigured" && isDeployedBuild;
  const needsRedirect = !publicPath && state.status === "signed-out";

  useEffect(() => {
    if (needsRedirect) router.replace(`/login/?next=${encodeURIComponent(pathname)}`);
  }, [needsRedirect, pathname, router]);

  if (publicPath) return <>{children}</>;
  if (pausedForDeploy) return <SitePaused />;
  if (state.status === "unconfigured") return <>{children}</>; // local dev, not deployed

  if (state.status === "signed-in" && state.claim === "claimed") return <>{children}</>;

  if (state.status === "signed-in" && (state.claim === "no-match" || state.claim === "error")) {
    return <NotOnRoster failed={state.claim === "error"} />;
  }

  // loading, claim pending, or about to redirect: keep the layout, hide the page.
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-ink-muted" aria-busy="true" aria-live="polite">
      Checking who you are…
    </div>
  );
}
