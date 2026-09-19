"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useProfiles, type LiveProfile } from "@/lib/profiles";
import { communityOf } from "@/lib/graphData";
import { communityColor } from "@/lib/louvainColors";
import { Avatar } from "./Avatar";
import { ProfileEditForm } from "./ProfileEditForm";
import type { Person } from "@/lib/types";

// WebGL stays out of the static prerender, same as the main map.
const EgoMiniGraph = dynamic(() => import("./EgoMiniGraph").then((m) => m.EgoMiniGraph), { ssr: false });

const BLANK: LiveProfile = { bio: "", photoPath: null, photoURL: null, ownerUid: null, isAdmin: false };

/**
 * The live half of a profile page: photo, bio, the owner's edit form, and the
 * person's own corner of the map. Everything static (name, group, connection
 * list) is rendered by the page around this.
 */
export function ProfileClient({ person }: { person: Person }) {
  const { state } = useAuth();
  const { profiles, photos, loading, refresh } = useProfiles();
  const [editing, setEditing] = useState(false);

  const profile = profiles[person.id] ?? BLANK;
  const isOwner = state.status === "signed-in" && state.person?.id === person.id;
  const community = communityOf(person.id);
  const firstName = person.name.split(/\s+/)[0];

  return (
    <>
      <header className="mt-6 flex items-center gap-4">
        <Avatar personId={person.id} name={person.name} photoURL={profile.photoURL} className="size-20 text-2xl" />
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold">{person.name}</h1>
          <p className="mt-1 inline-flex items-center gap-2 text-ink-muted">
            <span
              aria-hidden="true"
              className="inline-block size-3 rounded-full border border-ink/45"
              style={{ backgroundColor: communityColor(community) }}
            />
            Group {community + 1}
          </p>
        </div>
        {isOwner && !editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 font-display text-sm font-medium transition-colors hover:bg-bg-muted"
          >
            <Pencil size={15} aria-hidden="true" /> Edit
          </button>
        ) : null}
      </header>

      {editing ? (
        <ProfileEditForm
          person={person}
          profile={profile}
          onSaved={() => {
            refresh();
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <Bio bio={profile.bio} loading={loading} isOwner={isOwner} unconfigured={state.status === "unconfigured"} />
      )}

      <section className="mt-8" aria-labelledby="ego-heading">
        <h2 id="ego-heading" className="text-xl font-semibold">
          {firstName}&rsquo;s corner of the map
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Click a dot to open that person.</p>
        <div className="graph-frame relative mt-3 h-80 overflow-hidden rounded-2xl border border-line bg-bg sm:h-[28rem]">
          <EgoMiniGraph personId={person.id} photos={photos} />
        </div>
      </section>
    </>
  );
}

function Bio({
  bio,
  loading,
  isOwner,
  unconfigured,
}: {
  bio: string;
  loading: boolean;
  isOwner: boolean;
  unconfigured: boolean;
}) {
  if (unconfigured) {
    return (
      <p className="mt-6 rounded-xl border border-dashed border-line bg-bg-muted/50 p-4 text-sm text-ink-muted">
        Bios and photos need sign-in, which is not connected yet.
      </p>
    );
  }
  if (loading) return <p className="mt-6 h-6" aria-hidden="true" />;
  if (bio) return <p className="mt-6 text-lg leading-relaxed">{bio}</p>;
  return (
    <p className="mt-6 text-ink-muted">{isOwner ? "You have not written a bio yet." : "No bio yet."}</p>
  );
}
