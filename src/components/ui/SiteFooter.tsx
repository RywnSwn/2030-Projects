import Link from "next/link";
import { gradeStats } from "@/lib/gradeStats";

const links = [
  { href: "/privacy/", label: "Privacy" },
  { href: "/terms/", label: "House rules" },
  { href: "/people/", label: "Everyone" },
];

/** Site footer: the standing disclaimer about the colors, plus the legal pages. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 text-sm text-ink-muted sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-md leading-relaxed">
          The groups on this map were found by an algorithm reading who spends time with who. Nobody
          picked them, nobody can edit them, and being in a different one from a friend does not mean
          anything about that friendship.
        </p>

        <div className="flex flex-col gap-3 sm:items-end">
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 font-display sm:justify-end">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="underline underline-offset-2 hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="font-display sm:text-right">
            ISY Class of 2030
            <br />
            <span className="tabular-nums">
              {gradeStats.peopleCount} people &middot; {gradeStats.friendshipCount} friendships
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
