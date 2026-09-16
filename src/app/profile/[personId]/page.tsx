import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { communityColor } from "@/lib/louvainColors";
import { communityOf, getPerson, people, visibleNeighbors } from "@/lib/graphData";

export function generateStaticParams() {
  return people.map((p) => ({ personId: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/profile/[personId]">): Promise<Metadata> {
  const { personId } = await params;
  return { title: getPerson(personId)?.name ?? "Profile" };
}

/**
 * Profile stub (Phase 3). Phase 5 adds the photo, bio, edit form and the ego
 * mini-graph. Everything here is derived from weight >= 2 connections only.
 */
export default async function ProfilePage({ params }: PageProps<"/profile/[personId]">) {
  const { personId } = await params;
  const person = getPerson(personId);
  if (!person) notFound();

  const community = communityOf(person.id);
  const neighbors = visibleNeighbors(person.id);
  const initials = person.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" /> Back to the map
      </Link>

      <header className="mt-6 flex items-center gap-4">
        <div
          aria-hidden="true"
          className="flex size-20 shrink-0 items-center justify-center rounded-full font-display text-2xl font-semibold"
          style={{ backgroundColor: communityColor(community) }}
        >
          {initials}
        </div>
        <div>
          <h1 className="text-3xl font-semibold">{person.name}</h1>
          <p className="mt-1 inline-flex items-center gap-2 text-ink-muted">
            <span
              aria-hidden="true"
              className="inline-block size-3 rounded-full border border-ink/15"
              style={{ backgroundColor: communityColor(community) }}
            />
            Group {community + 1}
          </p>
        </div>
      </header>

      <p className="mt-6 rounded-xl border border-dashed border-line bg-bg-muted/50 p-4 text-sm text-ink-muted">
        Bio and photo arrive once sign-in is wired up. Only {person.name} will be able to edit them.
      </p>

      <section className="mt-8" aria-labelledby="connections-heading">
        <h2 id="connections-heading" className="text-xl font-semibold">
          Connections <span className="text-ink-muted">({neighbors.length})</span>
        </h2>
        <ul className="mt-3 divide-y divide-line/70">
          {neighbors.map(({ person: other, label }) => (
            <li key={other.id}>
              <Link
                href={`/profile/${other.id}/`}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-bg-muted focus-visible:bg-bg-muted"
              >
                <span
                  aria-hidden="true"
                  className="inline-block size-3 shrink-0 rounded-full border border-ink/15"
                  style={{ backgroundColor: communityColor(communityOf(other.id)) }}
                />
                <span className="font-display font-medium">{other.name}</span>
                <span className="ml-auto text-sm text-ink-muted">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
