"use client";

import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

/** Header slot: sign-in link, or the signed-in person's name and a sign-out button. */
export function AccountMenu() {
  const { state, signOut } = useAuth();

  if (state.status === "unconfigured" || state.status === "loading") return null;

  if (state.status === "signed-out") {
    return (
      <Link
        href="/login/"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-sm font-medium text-ink-muted transition-colors hover:bg-bg-muted hover:text-ink"
      >
        <LogIn size={16} aria-hidden="true" /> Sign in
      </Link>
    );
  }

  const label = state.person?.name ?? state.user.displayName ?? state.user.email ?? "You";
  return (
    <div className="flex items-center gap-1">
      {state.person ? (
        <Link
          href={`/profile/${state.person.id}/`}
          className="hidden rounded-full px-3 py-1.5 font-display text-sm font-medium text-ink-muted hover:bg-bg-muted hover:text-ink sm:inline-block"
        >
          {label}
        </Link>
      ) : (
        <span className="hidden px-3 text-sm text-ink-muted sm:inline-block">{label}</span>
      )}
      <button
        type="button"
        onClick={() => void signOut()}
        aria-label="Sign out"
        title="Sign out"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-sm font-medium text-ink-muted transition-colors hover:bg-bg-muted hover:text-ink"
      >
        <LogOut size={16} aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">Sign out</span>
      </button>
    </div>
  );
}
