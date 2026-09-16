import Link from "next/link";
import { GraphSceneClient } from "@/components/graph/GraphSceneClient";
import { GraphLegend } from "@/components/graph/GraphLegend";
import { people, visibleConnections } from "@/lib/graphData";

export default function HomePage() {
  return (
    <div className="relative flex flex-1 flex-col">
      {/* On phones the intro sits above the graph; on larger screens it floats over the top-left corner. */}
      <div className="z-10 px-4 pt-4 sm:pointer-events-none sm:absolute sm:inset-x-0 sm:top-0 sm:p-6">
        <div className="max-w-md rounded-2xl border border-line/70 bg-bg/85 p-4 shadow-sm backdrop-blur sm:pointer-events-auto">
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">The grade, as a map.</h1>
          <p className="mt-1.5 text-ink-muted">
            {people.length} people, {visibleConnections.length} friendships. Colors are friend groups found by the
            math, not picked by anyone. Hover a dot to see who someone hangs out with; click to open their page.
          </p>
          <div className="mt-3">
            <GraphLegend />
          </div>
        </div>
      </div>

      <section
        className="graph-frame relative min-h-[70dvh] flex-1 sm:min-h-[calc(100dvh-3.5rem)]"
        aria-label="Friend map"
      >
        <GraphSceneClient />

        <p className="absolute bottom-3 left-4 z-10 text-xs text-ink-muted sm:left-6">
          Prefer a list?{" "}
          <Link href="/people/" className="underline underline-offset-2 hover:text-ink">
            Browse everyone by name
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
