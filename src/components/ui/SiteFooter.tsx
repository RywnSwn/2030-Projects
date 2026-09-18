import { gradeStats } from "@/lib/gradeStats";

/**
 * Site footer. No privacy link yet on purpose: `/privacy` is built in Phase 10,
 * and a 404 is worse than no link. Add it here the moment that page exists.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 text-sm text-ink-muted sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-md leading-relaxed">
          The groups on this map were found by an algorithm reading who spends time with who. Nobody
          picked them, nobody can edit them, and being in a different one from a friend does not mean
          anything about that friendship.
        </p>
        <p className="shrink-0 font-display sm:text-right">
          ISY Class of 2030
          <br />
          <span className="tabular-nums">
            {gradeStats.peopleCount} people &middot; {gradeStats.friendshipCount} friendships
          </span>
        </p>
      </div>
    </footer>
  );
}
