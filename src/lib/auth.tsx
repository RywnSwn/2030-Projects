"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getPerson } from "./graphData";
import { getSupabase, isSupabaseConfigured, type PersonRow } from "./supabase";
import { withBasePath } from "./basePath";
import type { Person } from "./types";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  avatarURL: string | null;
}

export type AuthState =
  /** No Supabase keys at build time. Nothing is gated. */
  | { status: "unconfigured" }
  /** Session being restored from storage or the OAuth redirect. */
  | { status: "loading" }
  | { status: "signed-out" }
  /** Signed in with Google. `person` is null while claiming or if the email is not on the roster. */
  | { status: "signed-in"; user: AuthUser; person: Person | null; claim: "pending" | "claimed" | "no-match" | "error" };

interface AuthContextValue {
  state: AuthState;
  /** Starts the Google redirect. `next` is the in-app path to land on afterwards. */
  signIn: (next?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const NEXT_KEY = "auth:next";

function toUser(session: Session): AuthUser {
  const meta = session.user.user_metadata ?? {};
  return {
    uid: session.user.id,
    email: session.user.email ?? null,
    displayName: (meta.full_name as string | undefined) ?? (meta.name as string | undefined) ?? null,
    avatarURL: (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined) ?? null,
  };
}

/**
 * Links the signed-in Google account to its roster row (first login only) and
 * returns the matching static Person. See claim_person() in the migration.
 */
async function claimPersonRecord(): Promise<Person | null> {
  const { data, error } = await getSupabase().rpc("claim_person");
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as PersonRow | undefined;
  return row ? (getPerson(row.id) ?? null) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(isSupabaseConfigured ? { status: "loading" } : { status: "unconfigured" });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    let cancelled = false;

    const apply = async (session: Session | null) => {
      if (!session) {
        setState({ status: "signed-out" });
        return;
      }
      const user = toUser(session);
      setState({ status: "signed-in", user, person: null, claim: "pending" });
      try {
        const person = await claimPersonRecord();
        if (!cancelled) setState({ status: "signed-in", user, person, claim: person ? "claimed" : "no-match" });
      } catch (err) {
        console.error("claim_person failed", err);
        if (!cancelled) setState({ status: "signed-in", user, person: null, claim: "error" });
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) void apply(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Token refreshes carry the same user; no need to re-run the claim.
      if (event === "TOKEN_REFRESHED") return;
      void apply(session);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (next?: string) => {
    if (next) sessionStorage.setItem(NEXT_KEY, next);
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        // Must be listed under Authentication > URL Configuration > Redirect URLs.
        redirectTo: `${window.location.origin}${withBasePath("/login/")}`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
  }, []);

  const value = useMemo(() => ({ state, signIn, signOut }), [state, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Reads and clears the path stashed by signIn(next). */
export function takeNextPath(): string | null {
  try {
    const v = sessionStorage.getItem(NEXT_KEY);
    sessionStorage.removeItem(NEXT_KEY);
    return v && v.startsWith("/") ? v : null;
  } catch {
    return null;
  }
}
