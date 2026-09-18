"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { peopleAlphabetical, visibleConnections } from "@/lib/graphData";
import { gradeStats } from "@/lib/gradeStats";
import { useProfiles } from "@/lib/profiles";
import { Avatar } from "@/components/profile/Avatar";
import { Reveal } from "./Reveal";

/** personId -> the ids of everyone they have a visible (weight >= 2) friendship with. */
function useNeighbourMap(): Map<string, Set<string>> {
  return useMemo(() => {
    const map = new Map<string, Set<string>>(peopleAlphabetical.map((p) => [p.id, new Set<string>()]));
    for (const c of visibleConnections) {
      map.get(c.a)?.add(c.b);
      map.get(c.b)?.add(c.a);
    }
    return map;
  }, []);
}

/**
 * Everyone, in one grid. Hovering a face dims the people they aren't friends
 * with to 40%, the same ego-highlight the map uses, so the same gesture works
 * whether you are looking at dots or at faces.
 */
export function FaceWall() {
  const { profiles } = useProfiles();
  const neighbours = useNeighbourMap();
  const [focused, setFocused] = useState<string | null>(null);

  const lit = focused ? neighbours.get(focused) : null;
  const focusedName = focused ? peopleAlphabetical.find((p) => p.id === focused)?.name : null;

  return (
    <section className="border-t border-line/70 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal className="max-w-xl">
          <h2 className="font-display text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">
            Everyone
          </h2>
          <p className="mt-4 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            All {gradeStats.peopleCount} of us, in one place.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Hover anyone to light up their friends. Click to open their page.
          </p>
        </Reveal>

        <ul
          className="mt-10 grid grid-cols-4 gap-x-3 gap-y-6 sm:grid-cols-6 sm:gap-x-4 lg:grid-cols-8"
          onMouseLeave={() => setFocused(null)}
        >
          {peopleAlphabetical.map((person, i) => {
            const isFocused = focused === person.id;
            const dimmed = Boolean(focused) && !isFocused && !lit?.has(person.id);
            return (
              <Reveal as="li" key={person.id} delay={Math.min(i, 16) * 25}>
                <Link
                  href={`/profile/${person.id}/`}
                  onMouseEnter={() => setFocused(person.id)}
                  onFocus={() => setFocused(person.id)}
                  onBlur={() => setFocused(null)}
                  className={clsx(
                    "group flex flex-col items-center gap-2 rounded-2xl p-1 transition-opacity duration-300",
                    dimmed ? "opacity-40" : "opacity-100",
                  )}
                >
                  <Avatar
                    personId={person.id}
                    name={person.name}
                    photoURL={profiles[person.id]?.photoURL}
                    className={clsx(
                      "w-full text-sm ring-1 ring-ink/10 transition-transform duration-300 ease-spring",
                      isFocused ? "scale-110" : "group-hover:scale-105",
                    )}
                  />
                  <span className="text-center font-display text-[0.7rem] font-medium leading-tight sm:text-xs">
                    {person.name}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </ul>

        {/* Reserved line so the grid never shifts when the readout appears. */}
        <p className="mt-8 min-h-6 text-center text-sm text-ink-muted">
          {focusedName && lit ? (
            <>
              <span className="font-display font-medium text-ink">{focusedName}</span> is friends with{" "}
              <span className="tabular-nums">{lit.size}</span> people here
            </>
          ) : (
            <span className="sr-only">Hover a face to see their friend count.</span>
          )}
        </p>
      </div>
    </section>
  );
}
