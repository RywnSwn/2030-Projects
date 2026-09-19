"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MAX_EVENT_DESCRIPTION_LENGTH,
  MAX_EVENT_LOCATION_LENGTH,
  MAX_EVENT_TITLE_LENGTH,
  createEvent,
  eventSchema,
  updateEvent,
  type EventFormValues,
  type EventItem,
} from "@/lib/events";

/** "2026-09-19T14:30" — what <input type="datetime-local"> wants, in local time. */
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface EventFormProps {
  /** Present when editing an existing event; absent when creating one. */
  event?: EventItem;
  personId: string;
  uid: string;
  onSaved: () => void;
  onCancel: () => void;
}

/** Create/edit form for one event. Any member can create; edit is gated by the caller (creator or admin). */
export function EventForm({ event, personId, uid, onSaved, onCancel }: EventFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title ?? "",
      description: event?.description ?? "",
      location: event?.location ?? "",
      startAt: event ? toLocalInputValue(event.startAt) : "",
      endAt: event?.endAt ? toLocalInputValue(event.endAt) : "",
    },
  });
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    setSaveError(null);
    try {
      if (event) await updateEvent(event.id, values);
      else await createEvent(personId, uid, values);
      onSaved();
    } catch (err) {
      console.error("saving the event failed", err);
      setSaveError(err instanceof Error ? err.message : "Could not save. Try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-bg-muted/40 p-4 sm:p-5">
      <h2 className="font-display text-lg font-semibold">{event ? "Edit event" : "New event"}</h2>

      <div className="mt-4">
        <label htmlFor="event-title" className="block font-display text-sm font-medium">
          Title
        </label>
        <input
          id="event-title"
          type="text"
          maxLength={MAX_EVENT_TITLE_LENGTH}
          aria-describedby={errors.title ? "event-title-error" : undefined}
          className="mt-1.5 w-full rounded-xl border border-line bg-bg p-3 text-ink placeholder:text-ink-muted/70"
          placeholder="Grade movie night"
          {...register("title")}
        />
        {errors.title ? (
          <p id="event-title-error" role="alert" className="mt-1.5 text-sm text-red-700">
            {errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="event-start" className="block font-display text-sm font-medium">
            Starts
          </label>
          <input
            id="event-start"
            type="datetime-local"
            aria-describedby={errors.startAt ? "event-start-error" : undefined}
            className="mt-1.5 w-full rounded-xl border border-line bg-bg p-3 text-ink"
            {...register("startAt")}
          />
          {errors.startAt ? (
            <p id="event-start-error" role="alert" className="mt-1.5 text-sm text-red-700">
              {errors.startAt.message}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="event-end" className="block font-display text-sm font-medium">
            Ends <span className="text-ink-muted">(optional)</span>
          </label>
          <input
            id="event-end"
            type="datetime-local"
            aria-describedby={errors.endAt ? "event-end-error" : undefined}
            className="mt-1.5 w-full rounded-xl border border-line bg-bg p-3 text-ink"
            {...register("endAt")}
          />
          {errors.endAt ? (
            <p id="event-end-error" role="alert" className="mt-1.5 text-sm text-red-700">
              {errors.endAt.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="event-location" className="block font-display text-sm font-medium">
          Location <span className="text-ink-muted">(optional)</span>
        </label>
        <input
          id="event-location"
          type="text"
          maxLength={MAX_EVENT_LOCATION_LENGTH}
          className="mt-1.5 w-full rounded-xl border border-line bg-bg p-3 text-ink placeholder:text-ink-muted/70"
          placeholder="The usual spot"
          {...register("location")}
        />
      </div>

      <div className="mt-4">
        <label htmlFor="event-description" className="block font-display text-sm font-medium">
          Description <span className="text-ink-muted">(optional)</span>
        </label>
        <textarea
          id="event-description"
          rows={3}
          maxLength={MAX_EVENT_DESCRIPTION_LENGTH}
          className="mt-1.5 w-full rounded-xl border border-line bg-bg p-3 text-ink placeholder:text-ink-muted/70"
          placeholder="What's the plan?"
          {...register("description")}
        />
      </div>

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
          {isSubmitting ? "Saving…" : "Save"}
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
