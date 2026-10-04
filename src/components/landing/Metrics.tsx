'use client';
import { useEffect, useRef } from 'react';
import { gsap, settle } from '@/lib/gsap';
import { prefersReducedMotion } from './progress';
import type { Stats } from './types';

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const hm = (sec: number) => `${Math.floor(sec / 3600)}h ${String(Math.round((sec % 3600) / 60)).padStart(2, '0')}m`;

/** The demo workspace, counted. Real numbers from the seeded calls, not a sales deck. */
export function Metrics({ stats }: { stats: Stats }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const nums = Array.from(el.querySelectorAll<HTMLElement>('[data-count]'));
    const tweens: gsap.core.Tween[] = [];
    // start from zero only once the section is on its way in
    nums.forEach((n) => (n.textContent = n.dataset.kind === 'time' ? hm(0) : '0'));
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        nums.forEach((n, i) => {
          const to = Number(n.dataset.count);
          const o = { v: 0 };
          const t = gsap.to(o, {
            v: to,
            duration: 2.4,
            delay: i * 0.12,
            ease: 'expo.out',
            onUpdate: () => {
              n.textContent = n.dataset.kind === 'time' ? hm(o.v) : fmt(o.v);
            },
          });
          tweens.push(settle(t));
        });
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      tweens.forEach((t) => t.kill());
      nums.forEach((n) => (n.textContent = n.dataset.kind === 'time' ? hm(Number(n.dataset.count)) : fmt(Number(n.dataset.count))));
    };
  }, []);

  const rows = [
    { n: stats.actions, label: 'action items caught, each with an owner and the moment it was agreed' },
    { n: stats.seconds, kind: 'time', label: 'of talk you can search word by word' },
    { n: stats.turns, label: 'turns, every one with a name on it' },
  ];

  return (
    <section ref={root} className="relative bg-abyss pb-28 pt-24 sm:pb-36 sm:pt-32">
      <div className="mx-auto grid max-w-[1400px] gap-x-20 gap-y-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
        <div>
          <p className="mb-6 max-w-[40ch] text-[16px] text-fg-faint">Counted from the {stats.calls} calls in the demo workspace. Nothing rounded up.</p>
          <p className="display text-[clamp(96px,15.5vw,250px)] leading-[0.8] tabular text-fg" data-count={stats.words}>
            {fmt(stats.words)}
          </p>
          <p className="mt-5 max-w-[30ch] text-[22px] leading-snug text-fg-soft">words written down, so nobody had to.</p>
        </div>
        <dl className="divide-y divide-line border-y border-line">
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-baseline gap-6 py-6">
              <dt className="display min-w-[3.2ch] text-[clamp(52px,5.4vw,84px)] leading-none tabular text-fg" data-count={r.n} data-kind={r.kind}>
                {r.kind === 'time' ? hm(r.n) : fmt(r.n)}
              </dt>
              <dd className="text-[16px] leading-snug text-fg-soft">{r.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** The climb from the deep to the surface: light arriving from above, a few bubbles going up. */
export function Surfacing() {
  const bubbles = Array.from({ length: 22 }, (_, i) => {
    const r = (i * 9301 + 49297) % 233280;
    const f = r / 233280;
    return { left: (i * 37 + 11) % 100, size: 3 + ((i * 7) % 9), dur: 11 + ((i * 5) % 9), delay: -((i * 13) % 17), o: 0.25 + f * 0.4 };
  });
  return (
    <div aria-hidden className="relative h-[70vh] overflow-hidden bg-[linear-gradient(to_bottom,#091017_0%,#10232d_28%,#2f5866_55%,#88aeb9_80%,#dfeaee_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_30%,rgba(255,255,255,0.07)_38%,transparent_46%),linear-gradient(80deg,transparent_55%,rgba(255,255,255,0.06)_61%,transparent_68%)] [mask-image:linear-gradient(to_top,black,transparent_85%)]" />
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="rise absolute bottom-0 rounded-full border border-white/50"
          style={
            {
              left: `${b.left}%`,
              width: b.size,
              height: b.size,
              '--rise-dur': `${b.dur}s`,
              '--rise-o': b.o,
              animationDelay: `${b.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
