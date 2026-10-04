'use client';
import { useSyncExternalStore } from 'react';
import { Check } from 'lucide-react';

type T = { id: number; text: string };
let toasts: T[] = [];
const ls = new Set<() => void>();
const emit = () => ls.forEach((l) => l());
const EMPTY: T[] = [];

export function toast(text: string) {
  const id = Date.now() + Math.random();
  toasts = [...toasts, { id, text }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 2600);
}

export function Toaster() {
  const list = useSyncExternalStore(
    (l) => (ls.add(l), () => ls.delete(l)),
    () => toasts,
    () => EMPTY,
  );
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex flex-col items-center gap-2" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[14px] text-white shadow-lg">
          <Check size={15} className="text-[#f2a5c9]" />
          {t.text}
        </div>
      ))}
    </div>
  );
}
