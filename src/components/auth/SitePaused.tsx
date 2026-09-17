"use client";

import { Lock } from "lucide-react";

/**
 * Shown instead of the whole site on a deployed build when Supabase is not
 * configured. A dev server (`next dev`) still runs open for convenience while
 * building; a build that is actually live at a public URL never should,
 * since real names and the friend graph would sit there with no wall in
 * front of them. See AuthGate.
 */
export function SitePaused() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-24 text-center">
      <Lock size={40} aria-hidden="true" className="mx-auto text-ink-muted" />
      <h1 className="mt-4 text-2xl font-semibold">Not open yet.</h1>
      <p className="mt-2 text-ink-muted">
        This is a private site for one grade. It is being built in the open on GitHub, but sign-in is not connected on
        this deploy yet, so nothing behind it is shown until it is.
      </p>
    </div>
  );
}
