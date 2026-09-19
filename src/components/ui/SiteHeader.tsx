"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Megaphone, Users, Waypoints } from "lucide-react";
import clsx from "clsx";
import { AccountMenu } from "@/components/auth/AccountMenu";

const links = [
  { href: "/", label: "Map", icon: Waypoints },
  { href: "/people/", label: "People", icon: Users },
  { href: "/announcements/", label: "Announcements", icon: Megaphone },
  { href: "/events/", label: "Events", icon: CalendarDays },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/85 backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
      >
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight"
        >
          Class of 2030
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <ul className="flex items-center gap-0.5 sm:gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    aria-label={label}
                    className={clsx(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-display text-sm font-medium transition-colors sm:px-3",
                      active
                        ? "bg-ink text-bg"
                        : "text-ink-muted hover:bg-bg-muted hover:text-ink",
                    )}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <AccountMenu />
        </div>
      </nav>
    </header>
  );
}
