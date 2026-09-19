"use client";

import { format, isSameDay } from "date-fns";
import { Pencil, Trash2, MapPin } from "lucide-react";
import { getPerson } from "@/lib/graphData";
import type { EventItem } from "@/lib/events";

function formatRange(startAt: string, endAt: string | null): string {
  const start = new Date(startAt);
  const startText = format(start, "EEE, MMM d · h:mm a");
  if (!endAt) return startText;
  const end = new Date(endAt);
  return isSameDay(start, end) ? `${startText} – ${format(end, "h:mm a")}` : `${startText} – ${format(end, "EEE, MMM d · h:mm a")}`;
}

interface EventCardProps {
  event: EventItem;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}

export function EventCard({ event, canManage, onEdit, onDelete, deleting }: EventCardProps) {
  const creator = getPerson(event.createdByPersonId);

  return (
    <li className="rounded-2xl border border-line bg-bg-muted/30 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-sm font-medium text-ink-muted">{formatRange(event.startAt, event.endAt)}</p>
          <h3 className="mt-0.5 text-xl font-semibold">{event.title}</h3>
        </div>
        {canManage ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${event.title}`}
              className="rounded-full p-2 text-ink-muted transition-colors hover:bg-bg-muted hover:text-ink"
            >
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              aria-label={`Delete ${event.title}`}
              className="rounded-full p-2 text-ink-muted transition-colors hover:bg-bg-muted hover:text-red-700 disabled:opacity-60"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      {event.location ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-muted">
          <MapPin size={14} aria-hidden="true" /> {event.location}
        </p>
      ) : null}

      {event.description ? <p className="mt-3 leading-relaxed whitespace-pre-wrap">{event.description}</p> : null}

      <p className="mt-3 text-xs text-ink-muted">Posted by {creator?.name ?? "someone off the roster"}</p>
    </li>
  );
}
