"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useAuth } from "./auth";
import { getSupabase, isSupabaseConfigured } from "./supabase";

const BUCKET = "profile-photos";

/** How long a photo link stays valid. Long enough for a session, short enough to not be a public URL. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export const MAX_BIO_LENGTH = 280;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Must stay in step with allowed_mime_types on the bucket (see the Phase 5 migration). */
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const bioSchema = z.string().max(MAX_BIO_LENGTH, `Keep it under ${MAX_BIO_LENGTH} characters.`);

/** The live half of a person: what they can change about themselves. */
export interface LiveProfile {
  bio: string;
  /** Object path in the private bucket. Not a URL. */
  photoPath: string | null;
  /** Short-lived signed link for `photoPath`, or null when there is no photo. */
  photoURL: string | null;
  ownerUid: string | null;
  isAdmin: boolean;
}

export type ProfileMap = Record<string, LiveProfile>;

interface PeopleSelectRow {
  id: string;
  bio: string | null;
  photo_path: string | null;
  owner_uid: string | null;
  is_admin: boolean | null;
}

async function fetchProfiles(): Promise<ProfileMap> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("people").select("id, bio, photo_path, owner_uid, is_admin");
  if (error) throw error;

  const rows = (data ?? []) as PeopleSelectRow[];
  const paths = rows.map((r) => r.photo_path).filter((p): p is string => Boolean(p));
  const signed = await signPhotoUrls(paths);

  const profiles: ProfileMap = {};
  for (const row of rows) {
    profiles[row.id] = {
      bio: row.bio ?? "",
      photoPath: row.photo_path,
      photoURL: row.photo_path ? (signed[row.photo_path] ?? null) : null,
      ownerUid: row.owner_uid,
      isAdmin: row.is_admin ?? false,
    };
  }
  return profiles;
}

/** One batch call for every photo on the page. A photo that fails to sign just falls back to initials. */
async function signPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await getSupabase().storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.error("signing profile photos failed", error);
    return {};
  }
  const out: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) out[item.path] = item.signedUrl;
  }
  return out;
}

// One fetch per signed-in session, shared by the map and every profile page.
let cache: { uid: string; promise: Promise<ProfileMap> } | null = null;

function loadProfiles(uid: string): Promise<ProfileMap> {
  if (cache?.uid !== uid) cache = { uid, promise: fetchProfiles() };
  return cache.promise;
}

export interface UseProfilesResult {
  profiles: ProfileMap;
  /** personId -> signed photo URL, for the graph. */
  photos: Record<string, string | null>;
  loading: boolean;
  error: string | null;
  /** Re-reads after an edit. `saveOwnProfile` drops the cache, so this refetches. */
  refresh: () => void;
}

const EMPTY: ProfileMap = {};

/**
 * Live profile data for everyone. Resolves to nothing (without erroring) while
 * Supabase is unconfigured or nobody is signed in, so the map and the profile
 * pages keep working off the static roster alone.
 */
export function useProfiles(): UseProfilesResult {
  const { state } = useAuth();
  const uid = state.status === "signed-in" ? state.user.uid : null;
  // Carries the uid it belongs to, so a sign-out never shows the last account's data.
  const [result, setResult] = useState<{ uid: string; profiles: ProfileMap; error: string | null } | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured || !uid) return;
    let cancelled = false;
    loadProfiles(uid)
      .then((profiles) => {
        if (!cancelled) setResult({ uid, profiles, error: null });
      })
      .catch((err: unknown) => {
        console.error("loading profiles failed", err);
        if (!cancelled) {
          setResult({ uid, profiles: EMPTY, error: err instanceof Error ? err.message : "Could not load profiles." });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [uid, nonce]);

  const settled = result?.uid === uid ? result : null;
  const profiles = settled?.profiles ?? EMPTY;
  const error = settled?.error ?? null;
  const loading = Boolean(uid) && settled === null;

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // Stable identity: this feeds the graph's node renderer, which must not be
  // rebuilt on every render.
  const photos = useMemo(() => {
    const out: Record<string, string | null> = {};
    for (const [id, profile] of Object.entries(profiles)) out[id] = profile.photoURL;
    return out;
  }, [profiles]);

  return { profiles, photos, loading, error, refresh };
}

/** True once the signed-in person's own people row loads with is_admin = true. */
export function useIsAdmin(): boolean {
  const { state } = useAuth();
  const { profiles } = useProfiles();
  if (state.status !== "signed-in" || !state.person) return false;
  return profiles[state.person.id]?.isAdmin ?? false;
}

export function describePhotoProblem(file: File): string | null {
  if (!(ACCEPTED_PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return "Pick a JPEG, PNG, WebP or GIF image.";
  }
  if (file.size > MAX_PHOTO_BYTES) return "That image is over 5 MB. Pick a smaller one.";
  return null;
}

/**
 * Writes the signed-in person's own bio and/or photo. Row level security is
 * what actually enforces ownership; `personId` only says which row to aim at.
 */
export async function saveOwnProfile({
  personId,
  bio,
  photo,
  currentPhotoPath,
}: {
  personId: string;
  bio: string;
  /** A new file, `null` to remove the existing photo, or undefined to leave it alone. */
  photo?: File | null;
  currentPhotoPath: string | null;
}): Promise<void> {
  const supabase = getSupabase();
  const patch: { bio: string; photo_path?: string | null } = { bio: bioSchema.parse(bio).trim() };
  let uploadedPath: string | null = null;

  if (photo) {
    const problem = describePhotoProblem(photo);
    if (problem) throw new Error(problem);
    const extension = EXTENSIONS[photo.type] ?? "jpg";
    uploadedPath = `${personId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from(BUCKET).upload(uploadedPath, photo, {
      contentType: photo.type,
      upsert: false,
    });
    if (error) throw error;
    patch.photo_path = uploadedPath;
  } else if (photo === null) {
    patch.photo_path = null;
  }

  const { error } = await supabase.from("people").update(patch).eq("id", personId);
  if (error) {
    // Don't leave an orphan in the bucket if the row update was rejected.
    if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath]);
    throw error;
  }

  // The old file is now unreferenced. Failing to delete it is not worth an error.
  if (currentPhotoPath && patch.photo_path !== undefined && currentPhotoPath !== patch.photo_path) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([currentPhotoPath]);
    if (removeError) console.error("removing the old profile photo failed", removeError);
  }

  cache = null;
}
