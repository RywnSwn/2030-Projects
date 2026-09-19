"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { getSupabase, isSupabaseConfigured, type AnnouncementRow } from "./supabase";

export const MAX_ANNOUNCEMENT_TITLE_LENGTH = 120;
export const MAX_ANNOUNCEMENT_BODY_LENGTH = 4000;

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdByUid: string;
  createdByPersonId: string;
  createdAt: string;
}

function fromRow(row: AnnouncementRow): AnnouncementItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    pinned: row.pinned,
    createdByUid: row.created_by_uid,
    createdByPersonId: row.created_by_person_id,
    createdAt: row.created_at,
  };
}

export const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give it a title.")
    .max(MAX_ANNOUNCEMENT_TITLE_LENGTH, `Keep it under ${MAX_ANNOUNCEMENT_TITLE_LENGTH} characters.`),
  body: z
    .string()
    .trim()
    .min(1, "Say something.")
    .max(MAX_ANNOUNCEMENT_BODY_LENGTH, `Keep it under ${MAX_ANNOUNCEMENT_BODY_LENGTH} characters.`),
  pinned: z.boolean(),
});

export type AnnouncementFormValues = z.infer<typeof announcementSchema>;

// One fetch per app load, shared by the announcements page. Dropped on any write.
let cache: Promise<AnnouncementItem[]> | null = null;

async function fetchAnnouncements(): Promise<AnnouncementItem[]> {
  const { data, error } = await getSupabase()
    .from("announcements")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

function loadAnnouncements(): Promise<AnnouncementItem[]> {
  cache ??= fetchAnnouncements();
  return cache;
}

export interface UseAnnouncementsResult {
  announcements: AnnouncementItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/** Pinned first, then newest first. Empty while signed out or unconfigured. */
export function useAnnouncements(ready: boolean): UseAnnouncementsResult {
  // Carries the nonce it was fetched for, so a stale in-flight fetch never overwrites a newer one.
  const [result, setResult] = useState<{ nonce: number; announcements: AnnouncementItem[]; error: string | null } | null>(
    null,
  );
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured || !ready) return;
    let cancelled = false;
    loadAnnouncements()
      .then((items) => {
        if (!cancelled) setResult({ nonce, announcements: items, error: null });
      })
      .catch((err: unknown) => {
        console.error("loading announcements failed", err);
        if (!cancelled) {
          setResult({ nonce, announcements: [], error: err instanceof Error ? err.message : "Could not load announcements." });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ready, nonce]);

  const settled = result?.nonce === nonce ? result : null;
  const announcements = settled?.announcements ?? [];
  const error = settled?.error ?? null;
  const loading = ready && settled === null;

  const refresh = useCallback(() => {
    cache = null;
    setNonce((n) => n + 1);
  }, []);

  return { announcements, loading, error, refresh };
}

export async function createAnnouncement(personId: string, uid: string, values: AnnouncementFormValues): Promise<void> {
  const parsed = announcementSchema.parse(values);
  const { error } = await getSupabase()
    .from("announcements")
    .insert({ ...parsed, created_by_uid: uid, created_by_person_id: personId });
  if (error) throw error;
  cache = null;
}

export async function updateAnnouncement(id: string, values: AnnouncementFormValues): Promise<void> {
  const parsed = announcementSchema.parse(values);
  const { error } = await getSupabase().from("announcements").update(parsed).eq("id", id);
  if (error) throw error;
  cache = null;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await getSupabase().from("announcements").delete().eq("id", id);
  if (error) throw error;
  cache = null;
}
