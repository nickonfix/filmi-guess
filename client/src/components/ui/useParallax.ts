'use client';
import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/**
 * Pointer-driven parallax for the hero. Attach the returned ref + handlers to a
 * container; on pointer move it writes the normalized cursor offset to CSS vars
 * on that element so children can react without any React re-renders:
 *
 *   --px / --py  → -0.5..0.5 from the container center (translate / 3D tilt)
 *   --hx / --hy  → cursor position as a %            (a glow that follows the cursor)
 *
 * Updates are coalesced onto a single animation frame. Disabled entirely under
 * `prefers-reduced-motion` or on coarse (touch) pointers, where the vars stay 0
 * and everything renders in its neutral resting state.
 */
export function useParallax<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  const frame = useRef(0);
  const enabled = useRef(false);

  useEffect(() => {
    enabled.current =
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      window.matchMedia('(pointer: fine)').matches;
    return () => cancelAnimationFrame(frame.current);
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<T>) => {
    const el = ref.current;
    if (!enabled.current || !el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--px', (x - 0.5).toFixed(3));
      el.style.setProperty('--py', (y - 0.5).toFixed(3));
      el.style.setProperty('--hx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--hy', `${(y * 100).toFixed(1)}%`);
      el.classList.add('is-pointer');
    });
  }, []);

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty('--px', '0');
    el.style.setProperty('--py', '0');
    el.classList.remove('is-pointer');
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}
