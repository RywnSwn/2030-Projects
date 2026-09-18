"use client";

import { gradeStats, groupLinks } from "@/lib/gradeStats";
import { shade } from "@/lib/louvainColors";
import { CountUp } from "./CountUp";
import { Reveal } from "./Reveal";
import { useInView } from "./useInView";

const SIZE = 400;
const CENTER = SIZE / 2;
const RING = 124;

/** How far an opposite-group chord is pushed off the centre line. */
const DIAGONAL_BOW = 54;

interface Point {
  x: number;
  y: number;
}

/** Group i sits on a circle, starting at the top and going clockwise. */
function groupPoint(index: number, total: number): Point {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return { x: CENTER + Math.cos(angle) * RING, y: CENTER + Math.sin(angle) * RING };
}

/**
 * Control point for the chord between two groups.
 *
 * Most chords bow gently toward the middle, the way a chord diagram reads best.
 * Two groups sitting opposite each other are the exception: their midpoint IS
 * the centre, so there is no inward direction, and bowing them would flatten
 * both into the same straight line through the middle. Those get pushed
 * sideways instead, to opposite sides, so they stay two distinct threads.
 */
function chordControl(a: Point, b: Point, fromGroup: number): Point {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const offCentre = Math.hypot(mid.x - CENTER, mid.y - CENTER);

  if (offCentre < 12) {
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const side = fromGroup % 2 === 0 ? -1 : 1;
    return {
      x: mid.x + ((-(b.y - a.y) / length) * DIAGONAL_BOW * side),
      y: mid.y + (((b.x - a.x) / length) * DIAGONAL_BOW * side),
    };
  }

  return { x: CENTER + (mid.x - CENTER) * 0.78, y: CENTER + (mid.y - CENTER) * 0.78 };
}

/**
 * The map separates people into colors. This is the answer to that: a chord
 * diagram of every friendship that ignores those colors entirely. It draws
 * itself in when scrolled to, one thread at a time.
 */
function ThreadDiagram() {
  const [ref, seen] = useInView({ threshold: 0.3 });
  const { groups } = gradeStats;
  const links = groupLinks();
  const heaviest = Math.max(1, ...links.map((l) => l.friendships));

  return (
    <div ref={ref} className={seen ? "reveal reveal-in" : "reveal"}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto w-full max-w-md"
        role="img"
        aria-label={`Every one of the ${gradeStats.groupCount} friend groups is tied to every other one: ${gradeStats.crossGroup} of the grade's ${gradeStats.friendshipCount} friendships cross a group boundary.`}
      >
        <g>
          {links.map((link, i) => {
            const a = groupPoint(link.from, groups.length);
            const b = groupPoint(link.to, groups.length);
            const control = chordControl(a, b, link.from);
            return (
              <path
                key={`${link.from}-${link.to}`}
                className="thread"
                pathLength={1}
                d={`M ${a.x} ${a.y} Q ${control.x} ${control.y} ${b.x} ${b.y}`}
                fill="none"
                stroke={groups[link.from]?.colorHex ?? "#C9BFB0"}
                strokeWidth={4 + (link.friendships / heaviest) * 9}
                strokeLinecap="round"
                opacity={0.72}
                style={{ transitionDelay: `${i * 130}ms` }}
              />
            );
          })}
        </g>

        {groups.map((group, i) => {
          const point = groupPoint(i, groups.length);
          const radius = 20 + group.members.length * 1.3;
          return (
            <g key={group.index}>
              <circle cx={point.x} cy={point.y} r={radius} fill={group.colorHex} stroke="#1C1A17" strokeOpacity={0.45} />
              <text
                x={point.x}
                y={point.y + 5}
                textAnchor="middle"
                className="font-display"
                fontSize={15}
                fontWeight={600}
                fill={shade(group.colorHex, 0.75)}
              >
                {group.members.length}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const headline = [
  {
    value: gradeStats.crossGroup,
    suffix: null,
    label: "friendships cross a group line",
    note: `out of ${gradeStats.friendshipCount} total, so ${gradeStats.crossGroupPercent}% of this grade's friendships ignore the colors completely`,
  },
  {
    value: gradeStats.withOutsideFriend,
    suffix: ` of ${gradeStats.peopleCount}`,
    label: "of us have a friend in another group",
    note: "not most of us, not nearly all of us. every single person here",
  },
  {
    value: gradeStats.separation ?? 0,
    suffix: null,
    label: "degrees of separation, at most",
    note: "pick any two people in the grade. they are friends, or they share one",
  },
];

/**
 * The emotional centre of the page. The map hands you a grade split into
 * colors; this section is the rebuttal, and every number in it is measured off
 * the same data the map is drawn from.
 */
export function ThreadsBetween() {
  return (
    <section className="border-t border-line/70 bg-bg-muted/40 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">
            The part the colors don&rsquo;t tell you
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            The groups are threads,
            <br />
            not walls.
          </h2>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed text-ink-muted sm:text-lg">
            Being far apart on the map only means the math sorted you differently. It has never meant you
            aren&rsquo;t friends, and the numbers underneath say so out loud.
          </p>
        </Reveal>

        <div className="mt-14 grid items-center gap-12 sm:mt-16 lg:grid-cols-2 lg:gap-16">
          <ThreadDiagram />

          <ul className="space-y-8">
            {headline.map((stat, i) => (
              <Reveal as="li" key={stat.label} delay={i * 110}>
                <p className="font-display text-5xl font-semibold leading-none sm:text-6xl">
                  <CountUp value={stat.value} />
                  {stat.suffix && <span className="text-ink-muted">{stat.suffix}</span>}
                </p>
                <p className="mt-2 font-display text-base font-medium sm:text-lg">{stat.label}</p>
                <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-muted">{stat.note}</p>
              </Reveal>
            ))}
          </ul>
        </div>

        <Reveal className="mx-auto mt-14 max-w-2xl rounded-3xl border border-line bg-bg px-6 py-8 text-center shadow-sm sm:mt-16 sm:px-10">
          <p className="text-lg leading-relaxed sm:text-xl">
            Every one of the {gradeStats.groupCount} groups is tied to every other one. All{" "}
            {gradeStats.possiblePairs} possible pairs, connected. There is no corner of this grade that
            stands on its own, and that is the thing actually worth being proud of.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
