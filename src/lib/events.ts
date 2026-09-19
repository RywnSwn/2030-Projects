"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { getSupabase, isSupabaseConfigured, type EventRow } from "./supabase";

export const MAX_EVENT_TITLE_LENGTH = 120;
export const MAX_EVENT_DESCRIPTION_LENGTH = 2000;
export const MAX_EVENT_LOCATION_LENGTH = 200;

/** The shape components work with. ISO strings in, `Date` handed to <input> helpers where needed. */
export interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string | null;
  createdByUid: string;
  createdByPersonId: string;
  createdAt: string;
}

function fromRow(row: EventRow): EventItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    startAt: row.start_at,
    endAt: row.end_at,
    createdByUid: row.created_by_uid,
    createdByPersonId: row.created_by_person_id,
    createdAt: row.created_at,
  };
}

const emptyToUndefined = (v: string) => (v.trim() === "" ? undefined : v);

export const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Give it a title.")
      .max(MAX_EVENT_TITLE_LENGTH, `Keep it under ${MAX_EVENT_TITLE_LENGTH} characters.`),
    description: z.string().trim().max(MAX_EVENT_DESCRIPTION_LENGTH, `Keep it under ${MAX_EVENT_DESCRIPTION_LENGTH} characters.`),
    location: z.string().trim().max(MAX_EVENT_LOCATION_LENGTH, `Keep it under ${MAX_EVENT_LOCATION_LENGTH} characters.`),
    startAt: z.string().min(1, "Pick a start time."),
    endAt: z.string().transform(emptyToUndefined).optional(),
  })
  .refine((v) => !v.endAt || new Date(v.endAt) >= new Date(v.startAt), {
    message: "End has to be after the start.",
    path: ["endAt"],
  });

export type EventFormValues = z.infer<typeof eventSchema>;

// One fetch per app load, shared by the events page. Dropped on any write.
let cache: Promise<EventItem[]> | null = null;

async function fetchEvents(): Promise<EventItem[]> {
  const { data, error } = await getSupabase().from("events").select("*").order("start_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

function loadEvents(): Promise<EventItem[]> {
  cache ??= fetchEvents();
  return cache;
}

export interface UseEventsResult {
  events: EventItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/** Every upcoming and past event, shared grade-wide. Empty while signed out or unconfigured. */
export function useEvents(ready: boolean): UseEventsResult {
  // Carries the nonce it was fetched for, so a stale in-flight fetch never overwrites a newer one.
  const [result, setResult] = useState<{ nonce: number; events: EventItem[]; error: string | null } | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured || !ready) return;
    let cancelled = false;
    loadEvents()
      .then((items) => {
        if (!cancelled) setResult({ nonce, events: items, error: null });
      })
      .catch((err: unknown) => {
        console.error("loading events failed", err);
        if (!cancelled) {
          setResult({ nonce, events: [], error: err instanceof Error ? err.message : "Could not load events." });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ready, nonce]);

  const settled = result?.nonce === nonce ? result : null;
  const events = settled?.events ?? [];
  const error = settled?.error ?? null;
  const loading = ready && settled === null;

  const refresh = useCallback(() => {
    cache = null;
    setNonce((n) => n + 1);
  }, []);

  return { events, loading, error, refresh };
}

function toPatch(values: EventFormValues) {
  const parsed = eventSchema.parse(values);
  return {
    title: parsed.title,
    description: parsed.description,
    location: parsed.location,
    start_at: new Date(parsed.startAt).toISOString(),
    end_at: parsed.endAt ? new Date(parsed.endAt).toISOString() : null,
  };
}

export async function createEvent(personId: string, uid: string, values: EventFormValues): Promise<void> {
  const { error } = await getSupabase()
    .from("events")
    .insert({ ...toPatch(values), created_by_uid: uid, created_by_person_id: personId });
  if (error) throw error;
  cache = null;
}

export async function updateEvent(id: string, values: EventFormValues): Promise<void> {
  const { error } = await getSupabase().from("events").update(toPatch(values)).eq("id", id);
  if (error) throw error;
  cache = null;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await getSupabase().from("events").delete().eq("id", id);
  if (error) throw error;
  cache = null;
}
