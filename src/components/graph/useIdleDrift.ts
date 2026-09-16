"use client";

import { useEffect, type RefObject } from "react";
import type { GraphCanvasRef } from "reagraph";

interface IdleDriftOptions {
  /** Master switch. Off for the 2D scene. */
  enabled: boolean;
  /** Degrees per second of slow orbit. */
  degreesPerSecond?: number;
  /** How long after the last interaction before drifting resumes. */
  resumeAfterMs?: number;
  /** Set true while a node is hovered so the scene holds still. */
  paused?: boolean;
  /** Limit camera tilt to +/- this many radians from level. */
  maxTiltRadians?: number;
}

/**
 * Slow idle camera orbit so the scene never looks frozen. Pauses the moment the
 * person touches the camera (drag, wheel, pinch) and resumes after a quiet gap.
 * Reagraph has no built-in version of this that pauses, so it's hand rolled on
 * the camera-controls instance reagraph exposes.
 */
export function useIdleDrift(
  ref: RefObject<GraphCanvasRef | null>,
  { enabled, degreesPerSecond = 3, resumeAfterMs = 8000, paused = false, maxTiltRadians = 0.55 }: IdleDriftOptions,
) {
  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    let lastTime = 0;
    let idleSince = performance.now();
    let interacting = false;
    let attached: ReturnType<GraphCanvasRef["getControls"]> | null = null;
    let cancelled = false;

    const onControlStart = () => {
      interacting = true;
    };
    const onControlEnd = () => {
      interacting = false;
      idleSince = performance.now();
    };

    const tick = (now: number) => {
      if (cancelled) return;
      frame = requestAnimationFrame(tick);

      const controls = ref.current?.getControls();
      if (!controls) return;

      if (controls !== attached) {
        attached?.removeEventListener("controlstart", onControlStart);
        attached?.removeEventListener("controlend", onControlEnd);
        controls.addEventListener("controlstart", onControlStart);
        controls.addEventListener("controlend", onControlEnd);
        controls.minPolarAngle = Math.PI / 2 - maxTiltRadians;
        controls.maxPolarAngle = Math.PI / 2 + maxTiltRadians;
        attached = controls;
      }

      const delta = lastTime ? (now - lastTime) / 1000 : 0;
      lastTime = now;

      const quiet = now - idleSince > resumeAfterMs;
      if (!interacting && !paused && quiet && controls.enabled) {
        controls.azimuthAngle += degreesPerSecond * delta * (Math.PI / 180);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      attached?.removeEventListener("controlstart", onControlStart);
      attached?.removeEventListener("controlend", onControlEnd);
    };
  }, [ref, enabled, degreesPerSecond, resumeAfterMs, paused, maxTiltRadians]);
}
