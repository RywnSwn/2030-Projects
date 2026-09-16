"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Waypoints } from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/", label: "Map", icon: Waypoints },
  { href: "/people/", label: "People", icon: Users },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/85 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          Class of 2030
        </Link>
        <ul className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-sm font-medium transition-colors",
                    active ? "bg-ink text-bg" : "text-ink-muted hover:bg-bg-muted hover:text-ink",
                  )}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
