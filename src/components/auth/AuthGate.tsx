"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { NotOnRoster } from "./NotOnRoster";

/** Pages anyone can open without signing in. Everything else needs a claimed account. */
const PUBLIC_PATHS = ["/login", "/privacy"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Route-level login gate for the whole static site. When Supabase is not
 * configured it is transparent, so the site keeps working before sign-in is
 * hooked up. This is a UI gate: the data that matters is protected by row
 * level security in Supabase, not by this component.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const open = state.status === "unconfigured" || isPublic(pathname);

  useEffect(() => {
    if (!open && state.status === "signed-out") {
      router.replace(`/login/?next=${encodeURIComponent(pathname)}`);
    }
  }, [open, state.status, pathname, router]);

  if (open) return <>{children}</>;

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
