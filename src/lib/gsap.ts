'use client';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);
// Time-based, not frame-based: if the tab is throttled (background tab, preview
// pane), entrances still finish on schedule instead of leaving content hidden.
gsap.ticker.lagSmoothing(0);

export { gsap, useGSAP };

/**
 * Backstop for entrance tweens: if animation frames never arrive (some embedded
 * previews and screenshotters never fire rAF), jump to the end state so content
 * is never left hidden.
 */
export function settle<T extends gsap.core.Animation>(anim: T): T {
  window.setTimeout(() => {
    if (anim.progress() < 1) anim.progress(1);
  }, (anim.totalDuration() + 0.4) * 1000);
  return anim;
}
