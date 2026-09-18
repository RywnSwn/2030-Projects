"use client";

import Link from "next/link";
import { gradeStats } from "@/lib/gradeStats";
import { shade } from "@/lib/louvainColors";
import { useProfiles } from "@/lib/profiles";
import { Avatar } from "@/components/profile/Avatar";
import { Reveal } from "./Reveal";

/**
 * Turns each legend swatch into a set of actual faces. The corner key on the
 * map can only say "Group 2, nine people"; this says who they are.
 */
export function GroupCards() {
  const { profiles } = useProfiles();

  return (
    <section className="border-t border-line/70 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal className="max-w-xl">
          <h2 className="font-display text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">
            The {gradeStats.groupCount} groups the math found
          </h2>
          <p className="mt-4 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            Numbered, not named. Nobody gets to decide what these are called, including us.
          </p>
        </Reveal>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {gradeStats.groups.map((group, i) => (
            <Reveal as="li" key={group.index} delay={i * 90}>
              <div className="h-full rounded-3xl border border-line bg-bg p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="size-6 rounded-full border border-ink/45"
                    style={{ backgroundColor: group.colorHex }}
                  />
                  <h3 className="font-display text-xl font-semibold">Group {group.index + 1}</h3>
                  <span
                    className="ml-auto rounded-full px-3 py-1 font-display text-xs font-medium"
                    style={{ backgroundColor: group.colorHex, color: shade(group.colorHex, 0.75) }}
                  >
                    {group.members.length} people
                  </span>
                </div>

                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {group.members.map((person) => (
                    <li key={person.id}>
                      <Link
                        href={`/profile/${person.id}/`}
                        title={person.name}
                        className="block rounded-full transition-transform duration-200 ease-spring hover:scale-110"
                      >
                        <Avatar
                          personId={person.id}
                          name={person.name}
                          photoURL={profiles[person.id]?.photoURL}
                          className="size-9 text-[0.7rem] ring-1 ring-ink/10"
                        />
                        <span className="sr-only">{person.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <p className="mt-5 text-sm leading-relaxed text-ink-muted">
                  <span className="font-display font-medium text-ink tabular-nums">{group.outside}</span>{" "}
                  friendships reach outside this group.{" "}
                  <span className="font-display font-medium text-ink tabular-nums">{group.inside}</span> stay
                  inside it.
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
