"use client";

import { memo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { GraphSceneClient } from "@/components/graph/GraphSceneClient";
import { GraphLegend } from "@/components/graph/GraphLegend";
import { communityColor } from "@/lib/louvainColors";
import { communities, people, visibleConnections, type PersonNodeData } from "@/lib/graphData";

/** Fraction of a screen you scroll before the title has fully handed over the map. */
const REVEAL_SCREENS = 0.7;

/** Hover and reveal state change often; the WebGL scene should not re-render for either. */
const GraphLayer = memo(GraphSceneClient);

const stats = [
  { value: people.length, label: "people" },
  { value: visibleConnections.length, label: "friendships" },
  { value: communities.communityMeta.length, label: "friend groups" },
];

/**
 * The landing page hero: one graph, two states. It opens as a title card over a
 * dimmed map, and a screen of scrolling lifts the wash off and hands the map
 * over. Scrolling back brings the title back, which only works because the
 * camera has no zoom and so never swallows the wheel.
 *
 * The stage is taller than the reveal needs so the map gets a screen or so of
 * being yours before the rest of the page arrives underneath it.
 */
export function WelcomeMap() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const [hovered, setHovered] = useState<PersonNodeData | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const distance = Math.max(1, window.innerHeight * REVEAL_SCREENS);
      const progress = Math.min(1, window.scrollY / distance);
      stage.style.setProperty("--reveal", progress.toFixed(3));
      setRevealed(progress > 0.98);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Once the map is scrolled away, stop the idle drift and let the compositor
  // drop the canvas layer. The scene stays mounted: remounting would restart
  // the force layout and re-shuffle the whole grade on the way back up.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setOffscreen(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const handOver = () => {
    window.scrollTo({
      top: window.innerHeight * REVEAL_SCREENS,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  return (
    <div id="top" className="relative h-[230dvh]">
      <div ref={stageRef} className="sticky top-14 h-[calc(100dvh-3.5rem)] overflow-hidden">
        <div
          role="region"
          aria-label="Friend map"
          className={clsx("graph-frame absolute inset-0", !revealed && "pointer-events-none")}
          style={{ visibility: offscreen ? "hidden" : "visible" }}
        >
          <GraphLayer onHoverPerson={setHovered} paused={offscreen} />
        </div>

        {/* Warm wash over the map while the title is up; lifts as you scroll. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-bg/75 transition-opacity duration-500 ease-out"
          style={{ opacity: "calc(1 - var(--reveal, 0))" }}
        />

        <div
          inert={revealed}
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 transition-[opacity,transform] duration-500 ease-out"
          style={{
            opacity: "calc(1 - var(--reveal, 0) * 1.5)",
            transform: "translateY(calc(var(--reveal, 0) * -2rem))",
          }}
        >
          <div className={clsx("max-w-2xl text-center", !revealed && "pointer-events-auto")}>
            <p className="font-display text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">
              ISY · Class of 2030
            </p>
            <h1 className="mt-4 text-[2.75rem] font-semibold leading-[0.95] tracking-tight sm:mt-5 sm:text-7xl">
              The grade,
              <br />
              as a map.
            </h1>
            <p className="mx-auto mt-5 max-w-md leading-relaxed text-ink-muted sm:mt-6 sm:text-lg">
              Everyone placed by who they actually hang out with. The colors are friend groups the math
              found on its own, not groups anyone named.
            </p>

            <dl className="mx-auto mt-7 flex max-w-md justify-center divide-x divide-line sm:mt-9">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse gap-0.5 px-4 sm:px-5">
                  <dt className="font-display text-[0.65rem] uppercase tracking-[0.14em] text-ink-muted sm:text-[0.7rem]">
                    {s.label}
                  </dt>
                  <dd className="font-display text-2xl font-semibold tabular-nums">{s.value}</dd>
                </div>
              ))}
            </dl>

            <button
              type="button"
              onClick={handOver}
              className="mt-8 inline-flex sm:mt-10 items-center gap-2 rounded-full border border-ink/15 bg-bg/80 px-5 py-2.5 font-display text-sm font-medium shadow-sm backdrop-blur transition-colors hover:bg-ink hover:text-bg"
            >
              Explore the map
              <ChevronDown size={16} aria-hidden="true" className="animate-bob" />
            </button>
          </div>
        </div>

        <div
          inert={!revealed}
          className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4 transition-opacity duration-500 ease-out sm:p-6"
          style={{ opacity: "calc(var(--reveal, 0) * 2 - 1)" }}
        >
          {/* Hover readout. Deliberately not a live region: announcing every dot
              the pointer crosses is noise, and /people is the real screen reader path. */}
          <p className="pointer-events-auto hidden min-h-11 items-center gap-2.5 rounded-full border border-line/70 bg-bg/85 px-4 text-sm shadow-sm backdrop-blur sm:flex">
            {hovered ? (
              <>
                <span
                  aria-hidden="true"
                  className="size-3 shrink-0 rounded-full border border-ink/45"
                  style={{ backgroundColor: communityColor(hovered.community) }}
                />
                <span className="font-display font-medium">{hovered.name}</span>
                <span className="text-ink-muted">
                  {hovered.degree} {hovered.degree === 1 ? "connection" : "connections"}
                </span>
              </>
            ) : (
              <span className="text-ink-muted">Hover a dot to light up their friends, click to open their page</span>
            )}
          </p>

          <div className="pointer-events-auto flex flex-col items-start gap-2 sm:items-end">
            <GraphLegend />
            <Link
              href="/people/"
              className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink"
            >
              Browse everyone by name
            </Link>
          </div>
        </div>

        {/* Says there is a page under the map. Without it the hero reads as the
            whole site and nobody scrolls past it. */}
        <p
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center transition-opacity duration-500 ease-out sm:bottom-24"
          style={{ opacity: "calc(var(--reveal, 0) * 2 - 1)" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-bg/70 px-3 py-1 font-display text-[0.7rem] uppercase tracking-[0.18em] text-ink-muted backdrop-blur">
            Keep scrolling
            <ChevronDown size={13} className="animate-bob" />
          </span>
        </p>
      </div>
    </div>
  );
}
