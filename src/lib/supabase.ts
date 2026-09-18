import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * False until the two NEXT_PUBLIC_SUPABASE_* variables are set at build time.
 * While false the app runs with no sign-in at all (nothing is gated), so the
 * static site still works on GitHub Pages before Supabase is connected.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Lazily created browser client. Throws if called while unconfigured. */
export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY).");
  client ??= createClient(url, anonKey, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      // After Google redirects back, the ?code= in the URL is exchanged here.
      detectSessionInUrl: true,
    },
  });
  return client;
}

/** Row shape of public.people (see supabase/migrations). */
export interface PersonRow {
  id: string;
  email: string | null;
  owner_uid: string | null;
  /** Object path in the private profile-photos bucket, not a URL. See src/lib/profiles.ts. */
  photo_path: string | null;
  bio: string;
  is_admin: boolean;
  updated_at: string;
}
