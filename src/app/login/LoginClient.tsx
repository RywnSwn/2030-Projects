"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, PlugZap } from "lucide-react";
import { takeNextPath, useAuth } from "@/lib/auth";

function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

export function LoginClient() {
  const { state, signIn } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [error, setError] = useState<string | null>(null);

  // Already signed in (or just came back from Google): go where they were headed.
  useEffect(() => {
    if (state.status === "signed-in" && state.claim !== "pending") {
      router.replace(takeNextPath() ?? next);
    }
  }, [state, next, router]);

  if (state.status === "unconfigured") {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-24 text-center">
        <PlugZap size={40} aria-hidden="true" className="mx-auto text-ink-muted" />
        <h1 className="mt-4 text-2xl font-semibold">Sign-in is not connected yet.</h1>
        <p className="mt-2 text-ink-muted">
          The site is running without accounts. Once the Supabase keys are added at build time, this page turns into a
          Google sign-in button and the rest of the site asks for it.
        </p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-ink px-4 py-2 font-display text-bg">
          Back to the map
        </Link>
      </div>
    );
  }

  const busy = state.status === "loading" || state.status === "signed-in";

  return (
    <div className="mx-auto w-full max-w-md px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold">Class of 2030</h1>
      <p className="mt-2 text-ink-muted">
        Sign in with your school Google account. Only people on the grade list can get in, and you will land on your own
        profile.
      </p>

      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setError(null);
          signIn(next).catch((e: unknown) => setError(e instanceof Error ? e.message : "Sign-in failed"));
        }}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-display text-bg transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        <LogIn size={18} aria-hidden="true" />
        {busy ? "One moment…" : "Continue with Google"}
      </button>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <p className="mt-10 text-xs text-ink-muted">
        Google may show an &ldquo;unverified app&rdquo; screen the first time. That is expected for a private site this
        small; click through it.
      </p>
    </div>
  );
}
