import { communities } from "@/lib/graphData";
import { Reveal } from "./Reveal";

const pastels = communities.communityMeta.map((c) => c.colorHex);

const items = [
  {
    title: "Color is a friend group",
    body: "Nobody picked these. An algorithm read who spends time with who and sorted the grade on its own. It has never met any of us.",
    art: (
      <svg viewBox="0 0 120 60" className="h-14 w-full" aria-hidden="true">
        {pastels.slice(0, 4).map((hex, i) => (
          <circle key={hex} cx={18 + i * 28} cy={30} r={11} fill={hex} stroke="#1C1A17" strokeOpacity={0.45} />
        ))}
      </svg>
    ),
  },
  {
    title: "Size is how many friends",
    body: "A bigger dot means more people named you. It counts friendships only, never anything anyone kept to themselves.",
    art: (
      <svg viewBox="0 0 120 60" className="h-14 w-full" aria-hidden="true">
        {[6, 10, 14, 18].map((r, i) => (
          <circle key={r} cx={16 + i * 29} cy={30} r={r} fill={pastels[1] ?? "#CFC5F5"} stroke="#1C1A17" strokeOpacity={0.45} />
        ))}
      </svg>
    ),
  },
  {
    title: "Thickness is how close",
    body: "A hairline is a classmate you know. A thick one is someone you would actually text on a Saturday.",
    art: (
      <svg viewBox="0 0 120 60" className="h-14 w-full" aria-hidden="true">
        {[1.5, 3.5, 6, 9].map((w, i) => (
          <line
            key={w}
            x1={12}
            y1={12 + i * 12}
            x2={108}
            y2={12 + i * 12}
            stroke="#C9BFB0"
            strokeWidth={w}
            strokeLinecap="round"
          />
        ))}
      </svg>
    ),
  },
];

/** A short decode strip, so the map stops being a pretty thing nobody can read. */
export function HowToRead() {
  return (
    <section className="border-t border-line/70 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <h2 className="font-display text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">
            How to read the map
          </h2>
        </Reveal>
        <ul className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-10">
          {items.map((item, i) => (
            <Reveal as="li" key={item.title} delay={i * 110}>
              <div className="rounded-2xl bg-bg-muted/60 px-4 py-3">{item.art}</div>
              <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
