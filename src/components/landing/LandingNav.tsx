'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Wordmark } from '../Brand';

const LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#questions', label: 'Questions' },
];

/** A floating pill that turns from deep-water glass to surface glass as the page rises. */
export function LandingNav() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const seen = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target);
          else seen.delete(e.target);
        }
        setLight(seen.size > 0);
      },
      { rootMargin: '-36px 0px -92% 0px' },
    );
    document.querySelectorAll('[data-tone="light"]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-5">
      <nav
        aria-label="Main"
        className={`mx-auto flex h-14 max-w-[900px] items-center gap-2 rounded-full border pl-5 pr-1.5 backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-500 ${
          light
            ? 'tone-light border-[rgba(11,26,34,0.08)] bg-white/65 shadow-[0_18px_50px_-24px_rgba(11,42,58,0.45)]'
            : 'tone-dark border-white/10 bg-[rgba(12,21,28,0.55)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
        }`}
      >
        <Link href="/" aria-label="Sounding, back to top" className="shrink-0">
          <Wordmark />
        </Link>
        <div className="ml-auto hidden items-center gap-0.5 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-full px-3.5 py-2 text-[14.5px] text-fg-soft transition-colors hover:text-fg">
              {l.label}
            </a>
          ))}
        </div>
        <Link
          href="/meetings"
          className="press ml-auto rounded-full bg-signal px-5 py-2.5 text-[14.5px] font-semibold text-on-signal hover:bg-signal-hover md:ml-3"
        >
          Open the demo
        </Link>
      </nav>
    </header>
  );
}
