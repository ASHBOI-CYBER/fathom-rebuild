'use client';
import { useEffect, useRef, type RefObject } from 'react';

/**
 * How far a tall section has scrolled past its sticky viewport: 0 when its top
 * reaches the top of the screen, 1 when its bottom reaches the bottom.
 */
export function stickyProgress(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return clamp(-r.top / Math.max(1, r.height - window.innerHeight));
}

/** How far an element has travelled up into view: 0 as it appears at the bottom, 1 once its top is `span` of the viewport higher. */
export function enterProgress(el: HTMLElement, span = 0.75) {
  const r = el.getBoundingClientRect();
  return clamp((window.innerHeight - r.top) / (window.innerHeight * span));
}

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
/** Remap v from [a, b] to [0, 1], clamped. */
export const span = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Calls `apply` with the section's progress on every scroll and resize.
 * Scroll-scrubbed, not time-based: the picture is wherever the reader's thumb is.
 */
export function useScrub(ref: RefObject<HTMLElement | null>, apply: (p: number) => void, measure: (el: HTMLElement) => number = stickyProgress) {
  const fn = useRef(apply);
  const how = useRef(measure);
  useEffect(() => {
    fn.current = apply;
    how.current = measure;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const run = () => fn.current(how.current(el));
    run();
    window.addEventListener('scroll', run, { passive: true });
    window.addEventListener('resize', run);
    return () => {
      window.removeEventListener('scroll', run);
      window.removeEventListener('resize', run);
    };
  }, [ref]);
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
