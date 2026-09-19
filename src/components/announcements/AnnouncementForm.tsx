"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MAX_ANNOUNCEMENT_BODY_LENGTH,
  MAX_ANNOUNCEMENT_TITLE_LENGTH,
  announcementSchema,
  createAnnouncement,
  updateAnnouncement,
  type AnnouncementFormValues,
  type AnnouncementItem,
} from "@/lib/announcements";

interface AnnouncementFormProps {
  /** Present when editing an existing announcement; absent when posting a new one. */
  announcement?: AnnouncementItem;
  personId: string;
  uid: string;
  onSaved: () => void;
  onCancel: () => void;
}

/** Admin-only create/edit form. Gating (who may even open this) is the caller's job. */
export function AnnouncementForm({ announcement, personId, uid, onSaved, onCancel }: AnnouncementFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: announcement?.title ?? "",
      body: announcement?.body ?? "",
      pinned: announcement?.pinned ?? false,
    },
  });
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    setSaveError(null);
    try {
      if (announcement) await updateAnnouncement(announcement.id, values);
      else await createAnnouncement(personId, uid, values);
      onSaved();
    } catch (err) {
      console.error("saving the announcement failed", err);
      setSaveError(err instanceof Error ? err.message : "Could not save. Try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-bg-muted/40 p-4 sm:p-5">
      <h2 className="font-display text-lg font-semibold">{announcement ? "Edit announcement" : "New announcement"}</h2>

      <div className="mt-4">
        <label htmlFor="announcement-title" className="block font-display text-sm font-medium">
          Title
        </label>
        <input
          id="announcement-title"
          type="text"
          maxLength={MAX_ANNOUNCEMENT_TITLE_LENGTH}
          aria-describedby={errors.title ? "announcement-title-error" : undefined}
          className="mt-1.5 w-full rounded-xl border border-line bg-bg p-3 text-ink placeholder:text-ink-muted/70"
          placeholder="Picture day moved to Friday"
          {...register("title")}
        />
        {errors.title ? (
          <p id="announcement-title-error" role="alert" className="mt-1.5 text-sm text-red-700">
            {errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <label htmlFor="announcement-body" className="block font-display text-sm font-medium">
          Message
        </label>
        <textarea
          id="announcement-body"
          rows={4}
          maxLength={MAX_ANNOUNCEMENT_BODY_LENGTH}
          aria-describedby={errors.body ? "announcement-body-error" : undefined}
          className="mt-1.5 w-full rounded-xl border border-line bg-bg p-3 text-ink placeholder:text-ink-muted/70"
          placeholder="What does the grade need to know?"
          {...register("body")}
        />
        {errors.body ? (
          <p id="announcement-body-error" role="alert" className="mt-1.5 text-sm text-red-700">
            {errors.body.message}
          </p>
        ) : null}
      </div>

      <label className="mt-4 flex items-center gap-2 font-display text-sm">
        <input type="checkbox" className="size-4 rounded border-line" {...register("pinned")} />
        Pin to the top
      </label>

      {saveError ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {saveError}
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-display text-bg transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {isSubmitting ? "Posting…" : "Post"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-full px-4 py-2.5 font-display text-ink-muted transition-colors hover:bg-bg-muted hover:text-ink disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
