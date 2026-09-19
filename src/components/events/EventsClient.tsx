"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/profiles";
import { deleteEvent, useEvents, type EventItem } from "@/lib/events";
import { isSupabaseConfigured } from "@/lib/supabase";
import { EventForm } from "./EventForm";
import { EventCard } from "./EventCard";

/** Grade-wide events: anyone signed in can post one; the creator or an admin can edit/delete it. */
export function EventsClient() {
  const { state } = useAuth();
  const ready = state.status === "signed-in";
  const { events, loading, error, refresh } = useEvents(ready);
  const isAdmin = useIsAdmin();

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const person = state.status === "signed-in" ? state.person : null;
  const uid = state.status === "signed-in" ? state.user.uid : null;
  const canCreate = Boolean(person && uid);

  const canManage = (event: EventItem) => isAdmin || (person !== null && event.createdByPersonId === person.id);

  const handleDelete = async (event: EventItem) => {
    if (!window.confirm(`Delete "${event.title}"? This can't be undone.`)) return;
    setDeletingId(event.id);
    try {
      await deleteEvent(event.id);
      refresh();
    } catch (err) {
      console.error("deleting the event failed", err);
      window.alert(err instanceof Error ? err.message : "Could not delete. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Lazy initial state: reads the impure clock once per mount, not on every render.
  const [now] = useState(() => Date.now());
  const upcoming = events
    .filter((e) => new Date(e.endAt ?? e.startAt).getTime() >= now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const past = events
    .filter((e) => new Date(e.endAt ?? e.startAt).getTime() < now)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Events</h1>
          <p className="mt-1 text-ink-muted">Whatever the grade has going on.</p>
        </div>
        {canCreate && !creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-4 py-2 font-display text-sm font-medium transition-colors hover:bg-bg-muted"
          >
            <Plus size={16} aria-hidden="true" /> New event
          </button>
        ) : null}
      </div>

      {!isSupabaseConfigured ? (
        <p className="mt-6 rounded-xl border border-dashed border-line bg-bg-muted/50 p-4 text-sm text-ink-muted">
          Events need sign-in, which is not connected yet.
        </p>
      ) : null}

      {creating && person && uid ? (
        <div className="mt-6">
          <EventForm
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

      {!loading && ready && events.length === 0 ? (
        <p className="mt-6 text-ink-muted">No events yet. Be the first to post one.</p>
      ) : null}

      {upcoming.length > 0 ? (
        <section className="mt-8" aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="text-xl font-semibold">
            Upcoming
          </h2>
          <EventList
            events={upcoming}
            editingId={editingId}
            deletingId={deletingId}
            canManage={canManage}
            person={person}
            uid={uid}
            onEdit={setEditingId}
            onDelete={handleDelete}
            onSaved={() => {
              refresh();
              setEditingId(null);
            }}
            onCancelEdit={() => setEditingId(null)}
          />
        </section>
      ) : null}

      {past.length > 0 ? (
        <section className="mt-8" aria-labelledby="past-heading">
          <h2 id="past-heading" className="text-xl font-semibold text-ink-muted">
            Past
          </h2>
          <EventList
            events={past}
            editingId={editingId}
            deletingId={deletingId}
            canManage={canManage}
            person={person}
            uid={uid}
            onEdit={setEditingId}
            onDelete={handleDelete}
            onSaved={() => {
              refresh();
              setEditingId(null);
            }}
            onCancelEdit={() => setEditingId(null)}
          />
        </section>
      ) : null}
    </div>
  );
}

interface EventListProps {
  events: EventItem[];
  editingId: string | null;
  deletingId: string | null;
  canManage: (event: EventItem) => boolean;
  person: { id: string } | null;
  uid: string | null;
  onEdit: (id: string) => void;
  onDelete: (event: EventItem) => void;
  onSaved: () => void;
  onCancelEdit: () => void;
}

function EventList({ events, editingId, deletingId, canManage, person, uid, onEdit, onDelete, onSaved, onCancelEdit }: EventListProps) {
  return (
    <ul className="mt-3 space-y-3">
      {events.map((event) =>
        editingId === event.id && person && uid ? (
          <li key={event.id}>
            <EventForm event={event} personId={person.id} uid={uid} onSaved={onSaved} onCancel={onCancelEdit} />
          </li>
        ) : (
          <EventCard
            key={event.id}
            event={event}
            canManage={canManage(event)}
            onEdit={() => onEdit(event.id)}
            onDelete={() => onDelete(event)}
            deleting={deletingId === event.id}
          />
        ),
      )}
    </ul>
  );
}
