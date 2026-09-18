import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { communityColor } from "@/lib/louvainColors";
import { communityOf, getPerson, people, visibleNeighbors } from "@/lib/graphData";
import { ProfileClient } from "@/components/profile/ProfileClient";

export function generateStaticParams() {
  return people.map((p) => ({ personId: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/profile/[personId]">): Promise<Metadata> {
  const { personId } = await params;
  return { title: getPerson(personId)?.name ?? "Profile" };
}

/**
 * One person's page. The static half (name, group, connection list) is
 * rendered here; the live half (photo, bio, editing, ego graph) is the
 * ProfileClient island. Every connection shown comes from `visibleNeighbors`,
 * so weight 0/1 ties cannot reach this page.
 */
export default async function ProfilePage({ params }: PageProps<"/profile/[personId]">) {
  const { personId } = await params;
  const person = getPerson(personId);
  if (!person) notFound();

  const neighbors = visibleNeighbors(person.id);

  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" /> Back to the map
      </Link>

      <ProfileClient person={person} />

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
                  className="inline-block size-3 shrink-0 rounded-full border border-ink/45"
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
