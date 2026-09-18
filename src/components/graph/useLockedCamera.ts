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
 * Rotation is the only camera control. No pan, no zoom: the graph is framed to
 * fit and stays that way, so nobody can shove the grade off screen or scale it
 * into a blur with no way back.
 *
 * Reagraph's `cameraMode` only sets the left mouse button, leaving pan on the
 * right button, the middle button, two-finger touch and hold-space-and-drag,
 * and zoom on the wheel and pinch. All of those get cleared here. Arrow keys
 * don't go through the action map at all: reagraph calls `controls.truck()`
 * directly, so that gets neutralized on the instance. Nothing else in reagraph
 * trucks (camera fits go through `fitToBox`/`zoomTo`), so fitting still works.
 *
 * Re-checked every frame rather than set once, because reagraph reassigns the
 * actions whenever its own camera effects re-run, and holding space rewrites
 * the left button on purpose.
 *
 * Clearing the wheel action also hands the wheel back to the page, which is
 * what lets the landing page scroll over a live map.
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
      if (
        controls.mouseButtons.left === left &&
        controls.mouseButtons.right === ACTION.NONE &&
        controls.mouseButtons.wheel === ACTION.NONE
      ) {
        return;
      }

      controls.mouseButtons.left = left;
      controls.mouseButtons.right = ACTION.NONE as MouseAction;
      controls.mouseButtons.middle = ACTION.NONE as MouseAction;
      controls.mouseButtons.wheel = ACTION.NONE as MouseAction;
      controls.touches.one = (rotate ? ACTION.TOUCH_ROTATE : ACTION.NONE) as SingleTouchAction;
      controls.touches.two = ACTION.NONE as MultiTouchAction;
      controls.touches.three = ACTION.NONE as MultiTouchAction;
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [ref, rotate]);
}
