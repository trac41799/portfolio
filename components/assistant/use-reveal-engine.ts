"use client";

import { useCallback, useEffect, useRef } from "react";

export interface RevealOptions {
  startCount: number;
  targetCount: number;
  speedMs: number;
  onReveal: (count: number) => void;
  onComplete?: () => void;
}

// Ported from aiolabz-fe useRevealEngine: a requestAnimationFrame-driven reveal
// counter, throttled so downstream renders stay cheap. Notify ~30fps (plain
// text render is cheap, so a smoother cadence than the original 10fps).
const NOTIFY_INTERVAL_MS = 33;

export function useRevealEngine() {
  const frameIdRef = useRef<number | null>(null);
  const stateRef = useRef({
    revealedCount: 0,
    targetCount: 0,
    speedMs: 6,
    lastFrameTime: 0,
    lastNotifyTime: 0,
    isAnimating: false,
    onReveal: null as ((count: number) => void) | null,
    onComplete: null as (() => void) | null,
  });

  const stop = useCallback(() => {
    if (frameIdRef.current !== null && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(frameIdRef.current);
    }
    frameIdRef.current = null;
    stateRef.current.isAnimating = false;
  }, []);

  const animate = useCallback(() => {
    const state = stateRef.current;
    if (!state.isAnimating) return;
    const now = performance.now();
    const elapsed = now - state.lastFrameTime;
    const toReveal = Math.floor(elapsed / state.speedMs);

    if (toReveal > 0) {
      const next = Math.min(state.revealedCount + toReveal, state.targetCount);
      if (next !== state.revealedCount) {
        state.revealedCount = next;
        state.lastFrameTime = now;
        const complete = next >= state.targetCount;
        if (now - state.lastNotifyTime >= NOTIFY_INTERVAL_MS || complete) {
          state.lastNotifyTime = now;
          state.onReveal?.(next);
        }
      }
      if (state.revealedCount >= state.targetCount) {
        state.isAnimating = false;
        state.onComplete?.();
        frameIdRef.current = null;
        return;
      }
    }
    frameIdRef.current = requestAnimationFrame(animate);
  }, []);

  const start = useCallback(
    (options: RevealOptions) => {
      stop();
      const state = stateRef.current;
      state.revealedCount = options.startCount;
      state.targetCount = options.targetCount;
      state.speedMs = options.speedMs;
      state.lastFrameTime = performance.now();
      state.lastNotifyTime = 0;
      state.isAnimating = true;
      state.onReveal = options.onReveal;
      state.onComplete = options.onComplete ?? null;

      if (options.startCount >= options.targetCount) {
        state.isAnimating = false;
        options.onReveal(options.targetCount);
        options.onComplete?.();
        return;
      }
      if (typeof requestAnimationFrame === "function") {
        frameIdRef.current = requestAnimationFrame(animate);
      } else {
        // No RAF (SSR / test) — reveal instantly.
        options.onReveal(options.targetCount);
      }
    },
    [animate, stop],
  );

  useEffect(() => stop, [stop]);

  return { start, stop };
}
