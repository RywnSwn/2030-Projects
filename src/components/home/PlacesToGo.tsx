"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Megaphone, UserRound, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Reveal } from "./Reveal";
import { gradeStats } from "@/lib/gradeStats";

interface Place {
  href: string;
  title: string;
  blurb: string;
  icon: typeof Users;
}

const places: Place[] = [
  {
    href: "/people/",
    title: "Everyone",
    blurb: `All ${gradeStats.peopleCount} of us, A to Z. Search a name, open their page.`,
    icon: Users,
  },
  {
    href: "/announcements/",
    title: "Announcements",
    blurb: "Anything the whole grade needs to know, pinned to the top when it matters.",
    icon: Megaphone,
  },
  {
    href: "/events/",
    title: "Events",
    blurb: "Whatever we have going on. Anyone can post one, everyone can see it.",
    icon: CalendarDays,
  },
];

/**
 * The map is the front door; this is the hallway. Sits where the chord diagram
 * and the face grid used to, and its job is to get people off the landing page
 * and into the rest of the site.
 */
export function PlacesToGo() {
  const { state } = useAuth();
  const own = state.status === "signed-in" ? state.person : null;

  const cards: Place[] = own
    ? [
        ...places,
        {
          href: `/profile/${own.id}/`,
          title: "Your page",
          blurb: "Your photo, your bio, your corner of the map. Nobody else can edit it.",
          icon: UserRound,
        },
      ]
    : places;

  return (
    <section className="border-t border-line/70 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal className="max-w-xl">
          <h2 className="font-display text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">
            The rest of it
          </h2>
          <p className="mt-4 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            The map is only the front page.
          </p>
        </Reveal>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {cards.map((place, i) => (
            <Reveal as="li" key={place.href} delay={i * 90}>
              <Link
                href={place.href}
                className="group flex h-full items-start gap-4 rounded-3xl border border-line bg-bg p-6 shadow-sm transition-transform duration-200 ease-spring hover:-translate-y-0.5 focus-visible:-translate-y-0.5"
              >
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-bg-muted text-ink"
                >
                  <place.icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 font-display text-xl font-semibold">
                    {place.title}
                    <ArrowRight
                      size={17}
                      aria-hidden="true"
                      className="text-ink-muted transition-transform duration-200 ease-spring group-hover:translate-x-1"
                    />
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-ink-muted">{place.blurb}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
