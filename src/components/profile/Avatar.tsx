"use client";

import clsx from "clsx";
import { communityOf, initialsOf } from "@/lib/graphData";
import { communityColor, shade } from "@/lib/louvainColors";

interface AvatarProps {
  personId: string;
  name: string;
  /** Short-lived signed URL, or null for the initials fallback. */
  photoURL?: string | null;
  className?: string;
}

/**
 * Round profile picture in the person's community pastel, falling back to
 * their initials. Matches the face drawn on their dot in the map.
 */
export function Avatar({ personId, name, photoURL, className }: AvatarProps) {
  const pastel = communityColor(communityOf(personId));
  const classes = clsx("aspect-square shrink-0 overflow-hidden rounded-full", className);

  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived URL; next/image cannot optimise it anyway
      <img
        src={photoURL}
        alt={`${name}'s profile photo`}
        className={clsx(classes, "object-cover")}
        style={{ backgroundColor: pastel }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={clsx(classes, "flex items-center justify-center font-display font-semibold")}
      style={{ backgroundColor: pastel, color: shade(pastel, 0.72) }}
    >
      {initialsOf(name)}
    </div>
  );
}
