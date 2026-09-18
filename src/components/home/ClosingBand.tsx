import Link from "next/link";
import { gradeStats } from "@/lib/gradeStats";
import { Reveal } from "./Reveal";
import { NameMarquee } from "./NameMarquee";

/** The sign-off. Loud on purpose: this is the part that is just for us. */
export function ClosingBand() {
  return (
    <section className="border-t border-line/70 bg-bg-muted/50 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="font-display text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">
          ISY &middot; Class of 2030
        </p>
        <h2 className="mt-5 text-4xl font-semibold leading-[0.95] tracking-tight sm:text-6xl">
          Best grade in
          <br />
          the school.
        </h2>
        <p className="mx-auto mt-6 max-w-xl leading-relaxed text-ink-muted sm:text-lg">
          We will argue about that forever and we are never going to settle it. What we can settle is the
          rest of it: {gradeStats.peopleCount} people, {gradeStats.friendshipCount} friendships, not one
          person left off the map.
        </p>
      </Reveal>

      <div className="mt-12 border-y border-line/70 bg-bg sm:mt-16">
        <NameMarquee />
      </div>

      <Reveal className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-3 px-4 sm:mt-16 sm:px-6">
        <Link
          href="/people/"
          className="inline-flex items-center rounded-full bg-ink px-5 py-2.5 font-display text-sm font-medium text-bg transition-colors hover:bg-ink/85"
        >
          Browse everyone by name
        </Link>
        <a
          href="#top"
          className="inline-flex items-center rounded-full border border-ink/15 px-5 py-2.5 font-display text-sm font-medium transition-colors hover:bg-bg-muted"
        >
          Back to the map
        </a>
      </Reveal>
    </section>
  );
}
