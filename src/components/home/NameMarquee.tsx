import { communityOf, peopleAlphabetical } from "@/lib/graphData";
import { communityColor } from "@/lib/louvainColors";

const names = peopleAlphabetical.map((p) => ({
  id: p.id,
  name: p.name,
  color: communityColor(communityOf(p.id)),
}));

/**
 * A slow ticker of the whole roster. Purely decorative: every name here is
 * already in the face wall above as a real link, so this is hidden from screen
 * readers rather than read out twice.
 */
export function NameMarquee() {
  return (
    <div aria-hidden="true" className="select-none overflow-hidden py-6">
      <div className="flex w-max animate-marquee">
        {/* Two identical runs: the animation loops at -50%, which lands exactly
            on the start of the second run, so the seam is invisible. */}
        {[0, 1].map((run) => (
          <ul key={run} className="flex shrink-0 items-center">
            {names.map((person) => (
              <li key={`${run}-${person.id}`} className="flex items-center gap-4 px-5">
                <span
                  className="size-2.5 shrink-0 rounded-full border border-ink/10"
                  style={{ backgroundColor: person.color }}
                />
                <span className="whitespace-nowrap font-display text-xl font-medium sm:text-2xl">
                  {person.name}
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
