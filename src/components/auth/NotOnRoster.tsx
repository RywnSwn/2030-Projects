"use client";

import { LogOut, UserX } from "lucide-react";
import { useAuth } from "@/lib/auth";

/** Shown when a Google account signs in but no roster row has that email. */
export function NotOnRoster({ failed }: { failed: boolean }) {
  const { state, signOut } = useAuth();
  const email = state.status === "signed-in" ? state.user.email : null;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-24 text-center">
      <UserX size={40} aria-hidden="true" className="mx-auto text-ink-muted" />
      <h1 className="mt-4 text-2xl font-semibold">{failed ? "Could not check your account." : "That account is not on the list."}</h1>
      <p className="mt-2 text-ink-muted">
        {failed ? (
          <>Something went wrong while linking your account. Try signing out and back in.</>
        ) : (
          <>
            This site is only for the Class of 2030. {email ? <>You signed in as <strong className="text-ink">{email}</strong>, which is not a roster email. </> : null}
            If it should be, tell whoever runs the site.
          </>
        )}
      </p>
      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 font-display text-bg"
      >
        <LogOut size={16} aria-hidden="true" /> Sign out
      </button>
    </div>
  );
}
