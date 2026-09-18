import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Shared shell for the privacy and terms pages. These are the only two pages
 * readable without signing in, so they carry their own way back to the map
 * rather than relying on the signed-in navigation.
 */
export function LegalPage({
  title,
  lede,
  updated,
  children,
}: {
  title: string;
  lede: string;
  /** Human-readable month and year, shown so nobody has to guess how stale this is. */
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-display text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to the map
      </Link>

      <h1 className="mt-8 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-muted">{lede}</p>
      <p className="mt-4 font-display text-xs uppercase tracking-[0.18em] text-ink-muted">
        Last updated {updated}
      </p>

      <div className="mt-12 space-y-10">{children}</div>
    </div>
  );
}

/**
 * One titled block of a legal page. The prose styling lives here so every
 * section on both pages reads the same without repeating class lists.
 */
export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{heading}</h2>
      <div className="mt-3 space-y-3 leading-relaxed [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-ink-muted [&_li]:pl-1 [&_strong]:font-display [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:space-y-2.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
