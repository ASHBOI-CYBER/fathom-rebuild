'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Check } from '@phosphor-icons/react';

type Plan = { name: string; blurb: string; price: { m: number; y: number }; cta: string; feats: string[]; featured?: boolean };

const PLANS: Plan[] = [
  {
    name: 'Solo',
    blurb: 'For your own calls.',
    price: { m: 0, y: 0 },
    cta: 'Start with Solo',
    feats: ['Unlimited recordings', 'A name on every line of the transcript', 'Notes in four templates', 'Search your last 30 days', 'Five shared clips a month'],
  },
  {
    name: 'Crew',
    blurb: 'For teams who live in meetings.',
    price: { m: 14, y: 11 },
    cta: 'Try Crew free for 14 days',
    featured: true,
    feats: ['Everything in Solo', 'Search every call, all the way back', 'Unlimited clips with private links', 'A shared clip library', 'Your own note templates', 'Talk time across calls'],
  },
  {
    name: 'Harbor',
    blurb: 'For companies with rules to follow.',
    price: { m: 26, y: 22 },
    cta: 'See it in the demo',
    feats: ['Everything in Crew', 'Single sign-on and an audit log', 'Retention you set per team', 'Recordings kept in your region', 'A named person to call'],
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(true);
  return (
    <section id="pricing" data-tone="light" className="tone-light relative scroll-mt-24 overflow-hidden bg-[linear-gradient(to_bottom,#dfeaee,#e8eff1)] py-24 sm:py-32">
      {/* colour for the glass to catch */}
      <div aria-hidden className="pointer-events-none absolute left-[8%] top-[38%] h-[420px] w-[420px] rounded-full bg-[#6fbdb4] opacity-35 blur-[110px]" />
      <div aria-hidden className="pointer-events-none absolute right-[6%] top-[52%] h-[380px] w-[380px] rounded-full bg-[#7f9fd6] opacity-35 blur-[110px]" />
      <div aria-hidden className="pointer-events-none absolute left-[46%] top-[20%] h-[260px] w-[260px] rounded-full bg-[#ebc95c] opacity-25 blur-[100px]" />

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-8">
          <div>
            <h2 className="display text-[clamp(52px,6.4vw,104px)] uppercase leading-[0.86] text-fg">
              Pay per person,
              <br />
              not per minute.
            </h2>
            <p className="mt-5 max-w-[46ch] text-[18px] leading-relaxed text-fg-soft">Every plan records every call in full. You pay for how many people are on the crew.</p>
          </div>
          <div role="radiogroup" aria-label="Billing period" className="relative grid grid-cols-2 rounded-full bg-white/60 p-1 ring-1 ring-[rgba(11,26,34,0.08)] backdrop-blur-md">
            <span
              aria-hidden
              className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#0b1a22] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${yearly ? 'translate-x-full' : ''}`}
            />
            {[false, true].map((y) => (
              <button
                key={String(y)}
                role="radio"
                aria-checked={yearly === y}
                onClick={() => setYearly(y)}
                className={`relative rounded-full px-5 py-2 text-[14.5px] font-semibold transition-colors duration-300 ${yearly === y ? 'text-[#e4ecef]' : 'text-fg-soft hover:text-fg'}`}
              >
                {y ? 'Yearly, save 20%' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {PLANS.map((p) => (
            <article
              key={p.name}
              className={`relative flex flex-col rounded-[30px] p-2 ${
                p.featured ? 'bg-[#0b1a22]/10 ring-1 ring-[#0b1a22]/10 lg:-my-5' : 'bg-white/30 ring-1 ring-white/70'
              }`}
            >
              <div
                className={`flex flex-1 flex-col rounded-[23px] px-7 pb-7 pt-8 ${
                  p.featured
                    ? 'tone-dark bg-[#0b1a22] shadow-[0_40px_80px_-40px_rgba(11,26,34,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'bg-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_30px_60px_-40px_rgba(11,42,58,0.35)] backdrop-blur-xl'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="display text-[40px] uppercase leading-none text-fg">{p.name}</h3>
                  {p.featured && <span className="rounded-md bg-signal px-2 py-1 text-[12px] font-semibold text-on-signal">What most teams pick</span>}
                </div>
                <p className="mt-2 text-[15.5px] text-fg-soft">{p.blurb}</p>
                <p className="mt-8 flex items-baseline gap-2">
                  <span className="display text-[76px] leading-none tabular text-fg">${yearly ? p.price.y : p.price.m}</span>
                  <span className="text-[14px] leading-tight text-fg-faint">
                    {p.price.m === 0 ? (
                      'free, for good'
                    ) : (
                      <>
                        per person a month
                        <br />
                        {yearly ? 'billed yearly' : 'billed monthly'}
                      </>
                    )}
                  </span>
                </p>
                <ul className="mt-8 flex-1 space-y-3 border-t border-line pt-7">
                  {p.feats.map((f) => (
                    <li key={f} className="flex gap-3 text-[15.5px] leading-snug text-fg">
                      <Check size={17} weight="bold" className={`mt-0.5 shrink-0 ${p.featured ? 'text-signal' : 'text-fg-faint'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/meetings"
                  className={`press mt-9 block rounded-full py-3.5 text-center text-[15.5px] font-semibold ${
                    p.featured ? 'bg-signal text-on-signal hover:bg-signal-hover' : 'bg-[#0b1a22] text-[#e4ecef] hover:bg-[#16303b]'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-10 text-center text-[13.5px] text-fg-faint">Demo pricing for a demo product. Nothing on this page takes payment; every button opens the demo.</p>
      </div>
    </section>
  );
}
