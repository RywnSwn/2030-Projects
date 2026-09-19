"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/profiles";
import { deleteAnnouncement, useAnnouncements, type AnnouncementItem } from "@/lib/announcements";
import { isSupabaseConfigured } from "@/lib/supabase";
import { AnnouncementForm } from "./AnnouncementForm";
import { AnnouncementCard } from "./AnnouncementCard";

/** Grade-wide announcements: read by everyone signed in, posted only by site admins. */
export function AnnouncementsClient() {
  const { state } = useAuth();
  const ready = state.status === "signed-in";
  const { announcements, loading, error, refresh } = useAnnouncements(ready);
  const isAdmin = useIsAdmin();

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const person = state.status === "signed-in" ? state.person : null;
  const uid = state.status === "signed-in" ? state.user.uid : null;
  const canPost = isAdmin && Boolean(person && uid);

  const handleDelete = async (announcement: AnnouncementItem) => {
    if (!window.confirm(`Delete "${announcement.title}"? This can't be undone.`)) return;
    setDeletingId(announcement.id);
    try {
      await deleteAnnouncement(announcement.id);
      refresh();
    } catch (err) {
      console.error("deleting the announcement failed", err);
      window.alert(err instanceof Error ? err.message : "Could not delete. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Announcements</h1>
          <p className="mt-1 text-ink-muted">Official word for the whole grade.</p>
        </div>
        {canPost && !creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-4 py-2 font-display text-sm font-medium transition-colors hover:bg-bg-muted"
          >
            <Plus size={16} aria-hidden="true" /> New announcement
          </button>
        ) : null}
      </div>

      {!isSupabaseConfigured ? (
        <p className="mt-6 rounded-xl border border-dashed border-line bg-bg-muted/50 p-4 text-sm text-ink-muted">
          Announcements need sign-in, which is not connected yet.
        </p>
      ) : null}

      {creating && person && uid ? (
        <div className="mt-6">
          <AnnouncementForm
            personId={person.id}
            uid={uid}
            onSaved={() => {
              refresh();
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-6 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? <p className="mt-6 h-6" aria-hidden="true" /> : null}

      {!loading && ready && announcements.length === 0 ? (
        <p className="mt-6 text-ink-muted">Nothing posted yet.</p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {announcements.map((announcement) =>
          editingId === announcement.id && person && uid ? (
            <li key={announcement.id}>
              <AnnouncementForm
                announcement={announcement}
                personId={person.id}
                uid={uid}
                onSaved={() => {
                  refresh();
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              canManage={isAdmin}
              onEdit={() => setEditingId(announcement.id)}
              onDelete={() => handleDelete(announcement)}
              deleting={deletingId === announcement.id}
            />
          ),
        )}
      </ul>
    </div>
  );
}
