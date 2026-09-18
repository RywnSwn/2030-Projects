"use client";

import { useEffect, type RefObject } from "react";
import type { GraphCanvasRef } from "reagraph";

type Controls = NonNullable<ReturnType<GraphCanvasRef["getControls"]>>;
type MouseAction = Controls["mouseButtons"]["left"];
type SingleTouchAction = Controls["touches"]["one"];
type MultiTouchAction = Controls["touches"]["two"];

/** camera-controls hangs its action enum off the class, so read it from the instance. */
function actionsOf(controls: Controls): Record<string, number> {
  return (controls.constructor as unknown as { ACTION: Record<string, number> }).ACTION;
}

const noTruck = () => Promise.resolve();

/**
 * Rotate and zoom only. Reagraph's `cameraMode` sets the left mouse button and
 * nothing else, so pan stays live on the right button, the middle button,
 * two-finger touch, hold-space-and-drag, and window-level arrow keys. Any of
 * those lets someone shove the whole grade off screen with no way back.
 *
 * The action map covers the pointer gestures. Arrow keys don't go through it:
 * reagraph calls `controls.truck()` directly, so that one gets neutralized on
 * the instance. Nothing else in reagraph trucks (camera fits go through
 * `fitToBox`/`zoomTo`), so no fit or recenter breaks.
 *
 * Re-checked every frame rather than set once, because reagraph reassigns the
 * actions whenever its own camera effects re-run, and holding space rewrites
 * the left button on purpose.
 */
export function useLockedCamera(ref: RefObject<GraphCanvasRef | null>, { rotate }: { rotate: boolean }) {
  useEffect(() => {
    let frame = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      frame = requestAnimationFrame(tick);

      const controls = ref.current?.getControls();
      if (!controls) return;
      if (controls.truck !== noTruck) controls.truck = noTruck;

      const ACTION = actionsOf(controls);
      const left = (rotate ? ACTION.ROTATE : ACTION.NONE) as MouseAction;
      if (controls.mouseButtons.left === left && controls.mouseButtons.right === ACTION.NONE) return;

      controls.mouseButtons.left = left;
      controls.mouseButtons.right = ACTION.NONE as MouseAction;
      controls.mouseButtons.middle = ACTION.DOLLY as MouseAction;
      controls.mouseButtons.wheel = ACTION.DOLLY as MouseAction;
      controls.touches.one = (rotate ? ACTION.TOUCH_ROTATE : ACTION.NONE) as SingleTouchAction;
      controls.touches.two = ACTION.TOUCH_DOLLY as MultiTouchAction;
      controls.touches.three = ACTION.NONE as MultiTouchAction;
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [ref, rotate]);
}
