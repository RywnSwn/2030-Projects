"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2 } from "lucide-react";
import { Avatar } from "./Avatar";
import {
  ACCEPTED_PHOTO_TYPES,
  MAX_BIO_LENGTH,
  bioSchema,
  describePhotoProblem,
  saveOwnProfile,
  type LiveProfile,
} from "@/lib/profiles";
import type { Person } from "@/lib/types";

const schema = z.object({ bio: bioSchema });
type Values = z.infer<typeof schema>;

interface ProfileEditFormProps {
  person: Person;
  profile: LiveProfile;
  /** Saved successfully; the parent refetches and leaves edit mode. */
  onSaved: () => void;
  onCancel: () => void;
}

/** Owner-only editor for the two things a person controls: their bio and their photo. */
export function ProfileEditForm({ person, profile, onSaved, onCancel }: ProfileEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { bio: profile.bio } });

  // undefined = leave the current photo alone, File = replace it, null = remove it.
  const [photo, setPhoto] = useState<File | null | undefined>(undefined);
  const [objectURL, setObjectURL] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
  }, [objectURL]);

  const previewURL = photo === null ? null : photo ? objectURL : profile.photoURL;

  // Counted here rather than through watch(), which opts the whole component
  // out of React Compiler memoization.
  const [bioLength, setBioLength] = useState(profile.bio.length);
  const bioField = register("bio");

  const pickPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Clear the input so removing and re-picking the same file still fires a change.
    event.target.value = "";
    if (!file) return;
    const problem = describePhotoProblem(file);
    if (problem) {
      setPhotoError(problem);
      return;
    }
    setPhotoError(null);
    setPhoto(file);
    setObjectURL(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoError(null);
    setPhoto(null);
    setObjectURL(null);
  };

  const onSubmit = handleSubmit(async ({ bio }) => {
    setSaveError(null);
    try {
      await saveOwnProfile({ personId: person.id, bio, photo, currentPhotoPath: profile.photoPath });
      onSaved();
    } catch (err) {
      console.error("saving the profile failed", err);
      setSaveError(err instanceof Error ? err.message : "Could not save. Try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-line bg-bg-muted/40 p-4 sm:p-5">
      <h2 className="font-display text-lg font-semibold">Edit your profile</h2>

      <div className="mt-4 flex items-start gap-4">
        <Avatar personId={person.id} name={person.name} photoURL={previewURL} className="size-16 text-xl" />
        <div className="min-w-0 flex-1">
          <label htmlFor="photo" className="block font-display text-sm font-medium">
            Profile photo
          </label>
          <input
            id="photo"
            type="file"
            accept={ACCEPTED_PHOTO_TYPES.join(",")}
            onChange={pickPhoto}
            aria-describedby={photoError ? "photo-error" : "photo-hint"}
            className="mt-1.5 block w-full text-sm text-ink-muted file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:font-display file:text-sm file:text-bg hover:file:opacity-90"
          />
          <p id="photo-hint" className="mt-1.5 text-xs text-ink-muted">
            JPEG, PNG, WebP or GIF, up to 5 MB. Only the grade can see it.
          </p>
          {photoError ? (
            <p id="photo-error" role="alert" className="mt-1.5 text-sm text-red-700">
              {photoError}
            </p>
          ) : null}
          {previewURL ? (
            <button
              type="button"
              onClick={removePhoto}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-sm text-ink-muted transition-colors hover:bg-bg-muted hover:text-ink"
            >
              <Trash2 size={15} aria-hidden="true" /> Remove photo
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="bio" className="block font-display text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          rows={3}
          maxLength={MAX_BIO_LENGTH}
          aria-describedby={errors.bio ? "bio-error" : "bio-count"}
          className="mt-1.5 w-full rounded-xl border border-line bg-bg p-3 text-ink placeholder:text-ink-muted/70"
          placeholder="A line or two about you."
          {...bioField}
          onChange={(event) => {
            setBioLength(event.target.value.length);
            return bioField.onChange(event);
          }}
        />
        <div className="mt-1 flex items-center justify-between gap-3">
          <p id="bio-count" className="text-xs text-ink-muted">
            {bioLength}/{MAX_BIO_LENGTH}
          </p>
          {errors.bio ? (
            <p id="bio-error" role="alert" className="text-sm text-red-700">
              {errors.bio.message}
            </p>
          ) : null}
        </div>
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
