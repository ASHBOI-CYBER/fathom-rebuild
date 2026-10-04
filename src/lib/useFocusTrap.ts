'use client';
import { useEffect, type RefObject } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keep keyboard focus inside a dialog while it is open, move focus into it on
 * open, and hand focus back to whatever opened it on close.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, open: boolean, initial?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open || !ref.current) return;
    const root = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    const first = () => root.querySelectorAll<HTMLElement>(FOCUSABLE);
    (initial?.current ?? first()[0] ?? root).focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = [...first()].filter((el) => el.getClientRects().length);
      if (!items.length) return;
      const a = items[0];
      const z = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      } else if (!root.contains(document.activeElement)) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open, ref, initial]);
}
