import { communities } from "@/lib/graphData";

/** Small key for the community colors. Sizes are whole-graph aggregates, so safe to show. */
export function GraphLegend() {
  return (
    <ul aria-label="Friend groups" className="flex flex-wrap gap-1.5 sm:justify-end">
      {communities.communityMeta.map((c) => (
        <li
          key={c.index}
          className="inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-bg/85 px-2.5 py-1 font-display text-xs shadow-sm backdrop-blur"
        >
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full border border-ink/45"
            style={{ backgroundColor: c.colorHex }}
          />
          Group {c.index + 1}
          <span className="tabular-nums text-ink-muted">{c.size}</span>
        </li>
      ))}
    </ul>
  );
}
