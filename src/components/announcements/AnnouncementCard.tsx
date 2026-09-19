"use client";

import { format } from "date-fns";
import { Pencil, Pin, Trash2 } from "lucide-react";
import { getPerson } from "@/lib/graphData";
import type { AnnouncementItem } from "@/lib/announcements";

interface AnnouncementCardProps {
  announcement: AnnouncementItem;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}

export function AnnouncementCard({ announcement, canManage, onEdit, onDelete, deleting }: AnnouncementCardProps) {
  const poster = getPerson(announcement.createdByPersonId);

  return (
    <li className="rounded-2xl border border-line bg-bg-muted/30 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {announcement.pinned ? (
            <p className="inline-flex items-center gap-1.5 font-display text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
              <Pin size={12} aria-hidden="true" /> Pinned
            </p>
          ) : null}
          <h3 className="mt-0.5 text-xl font-semibold">{announcement.title}</h3>
        </div>
        {canManage ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${announcement.title}`}
              className="rounded-full p-2 text-ink-muted transition-colors hover:bg-bg-muted hover:text-ink"
            >
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              aria-label={`Delete ${announcement.title}`}
              className="rounded-full p-2 text-ink-muted transition-colors hover:bg-bg-muted hover:text-red-700 disabled:opacity-60"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      <p className="mt-3 leading-relaxed whitespace-pre-wrap">{announcement.body}</p>

      <p className="mt-3 text-xs text-ink-muted">
        {poster?.name ?? "The site"} · {format(new Date(announcement.createdAt), "MMM d, yyyy · h:mm a")}
      </p>
    </li>
  );
}
