import { communities } from "@/lib/graphData";

/** Small key for the community colors. Sizes are whole-graph aggregates, so safe to show. */
export function GraphLegend() {
  return (
    <ul aria-label="Friend groups" className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
      {communities.communityMeta.map((c) => (
        <li key={c.index} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block size-3 rounded-full border border-ink/15"
            style={{ backgroundColor: c.colorHex }}
          />
          Group {c.index + 1}
          <span className="tabular-nums">({c.size})</span>
        </li>
      ))}
    </ul>
  );
}
