"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { communityColor } from "@/lib/louvainColors";
import { communityOf, peopleAlphabetical, visibleNeighbors } from "@/lib/graphData";

/**
 * Keyboard-first way to reach every person without touching the graph.
 * Tab to the search box, type, Tab through results, Enter to open a profile.
 */
export function PeopleListFallback() {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);

  const results = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    return q ? peopleAlphabetical.filter((p) => p.name.toLowerCase().includes(q)) : peopleAlphabetical;
  }, [deferred]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">Everyone</h1>
      <p className="mt-1 text-ink-muted">All {peopleAlphabetical.length} people, A to Z.</p>

      <label className="mt-6 block">
        <span className="sr-only">Search by name</span>
        <span className="flex items-center gap-2 rounded-full border border-line bg-bg-muted/60 px-4 py-2 focus-within:border-ink">
          <Search size={18} aria-hidden="true" className="text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name"
            autoComplete="off"
            className="w-full bg-transparent font-display outline-none placeholder:text-ink-muted"
          />
        </span>
      </label>

      <p role="status" aria-live="polite" className="sr-only">
        {results.length} {results.length === 1 ? "person" : "people"} shown
      </p>

      <ul className="mt-4 divide-y divide-line/70">
        {results.map((p) => {
          const community = communityOf(p.id);
          const count = visibleNeighbors(p.id).length;
          return (
            <li key={p.id}>
              <Link
                href={`/profile/${p.id}/`}
                className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-bg-muted focus-visible:bg-bg-muted"
              >
                <span
                  aria-hidden="true"
                  className="inline-block size-3.5 shrink-0 rounded-full border border-ink/45"
                  style={{ backgroundColor: communityColor(community) }}
                />
                <span className="font-display font-medium">{p.name}</span>
                <span className="ml-auto text-sm tabular-nums text-ink-muted">
                  {count} {count === 1 ? "connection" : "connections"}
                </span>
              </Link>
            </li>
          );
        })}
        {results.length === 0 && <li className="py-6 text-ink-muted">No one by that name.</li>}
      </ul>
    </div>
  );
}
