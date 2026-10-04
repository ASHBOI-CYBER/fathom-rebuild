'use client';
import Link from 'next/link';
import { useRef } from 'react';
import { ArrowRight, Play } from '@phosphor-icons/react';
import { gsap, settle, useGSAP } from '@/lib/gsap';
import { personColor, person } from '@/lib/people';
import type { MeetingIndex } from '@/lib/types';
import { HeroField } from './HeroField';
import { clamp, useScrub } from './progress';

export function Hero({ meeting }: { meeting: MeetingIndex }) {
  const sec = useRef<HTMLElement>(null);
  const placed = useRef<HTMLSpanElement>(null);
  const turns = meeting.segments.length;
  const minutes = Math.round(meeting.duration / 60);

  // One number for the stylesheet to read; everything in the hero keys off it.
  useScrub(sec, (p) => {
    const q = clamp(p / 0.82);
    sec.current?.style.setProperty('--p', q.toFixed(4));
    if (placed.current) placed.current.textContent = String(Math.round(q * turns));
  });

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.from('.hw', { yPercent: 115, duration: 1.3, stagger: 0.09 }, 0.15).from('.hf', { opacity: 0, y: 18, duration: 1, stagger: 0.08 }, 0.7);
        settle(tl);
      });
    },
    { scope: sec },
  );

  return (
    <section ref={sec} className="relative h-[290vh] bg-abyss motion-reduce:h-auto" style={{ '--p': 0 } as React.CSSProperties}>
      <div className="sticky top-0 h-[100dvh] min-h-[600px] overflow-hidden">
        <HeroField
          section={sec}
          participants={meeting.participants}
          talk={meeting.talk}
          duration={meeting.duration}
          segments={meeting.segments}
          chapterStarts={meeting.chapterStarts}
        />
        {/* keep the copy readable over the swirl */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(9,16,23,0.98)_30%,rgba(9,16,23,0.55)_50%,transparent_68%)] min-[900px]:bg-[radial-gradient(62%_70%_at_16%_52%,rgba(9,16,23,0.93),rgba(9,16,23,0.5)_55%,transparent_82%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-abyss to-transparent" />

        <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-9 sm:px-8 min-[900px]:justify-center min-[900px]:pb-0">
          <div className="max-w-[min(780px,56vw)] max-[899px]:max-w-none">
            <h1 className="display text-[clamp(60px,8.4vw,150px)] uppercase leading-[0.84] tracking-[0.005em] text-fg" aria-label="Nothing said gets lost.">
              {['Nothing said', 'gets lost.'].map((l) => (
                <span key={l} className="block overflow-hidden pb-[0.04em]" aria-hidden>
                  <span className="hw block">{l}</span>
                </span>
              ))}
            </h1>
            <p className="hf mt-6 max-w-[46ch] text-[17px] leading-relaxed text-fg-soft sm:text-[19px]">
              Sounding sits in on your calls, writes down every word with a name on it, and draws the whole conversation as one picture.
              <span className="max-[899px]:hidden"> Scroll, and watch a real one draw itself.</span>
            </p>
            <div className="hf mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link href="/meetings" className="press group inline-flex items-center gap-3 rounded-full bg-signal py-2 pl-6 pr-2 text-[16px] font-semibold text-on-signal hover:bg-signal-hover">
                Open the demo
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-on-signal/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-105">
                  <ArrowRight size={16} weight="bold" />
                </span>
              </Link>
              <Link href={`/meetings/${meeting.id}`} className="group inline-flex items-center gap-2.5 text-[15px] font-semibold text-fg">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong transition-colors group-hover:border-signal group-hover:text-signal">
                  <Play size={13} weight="fill" />
                </span>
                Play this call
              </Link>
            </div>
            <p className="hf mt-6 text-[13px] text-fg-faint">No sign-up. Ten calls inside, ready to play.</p>
          </div>
        </div>

        {/* what you're looking at, once it has drawn itself */}
        <div
          className="pointer-events-none absolute bottom-10 right-8 hidden w-[380px] min-[900px]:block"
          style={{ opacity: 'clamp(0, calc((var(--p) - 0.55) * 4), 1)' }}
        >
          <p className="text-[13px] text-fg-faint">
            <span ref={placed} className="tabular text-fg">
              0
            </span>{' '}
            of {turns} turns placed
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-fg-soft" style={{ opacity: 'clamp(0, calc((var(--p) - 0.85) * 8), 1)' }}>
            A real call from the demo: {meeting.title.split(':')[0]}, {meeting.participants.length} people, {minutes} minutes. Each ring is a person, loudest on
            the outside. Each arc is a time they spoke.
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5" style={{ opacity: 'clamp(0, calc((var(--p) - 0.9) * 10), 1)' }}>
            {meeting.participants.map((id) => (
              <li key={id} className="flex items-center gap-1.5 text-[13px] text-fg-soft">
                <span className="h-2 w-2 rounded-full" style={{ background: personColor(id) }} />
                {person(id).name.split(' ')[0]}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[13px] text-fg-faint min-[900px]:flex motion-reduce:hidden"
          style={{ opacity: 'clamp(0, calc(1 - var(--p) * 8), 1)' }}
        >
          Scroll to draw the call
          <span className="relative h-10 w-px overflow-hidden bg-line-strong">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[cue_1.8s_cubic-bezier(0.6,0,0.2,1)_infinite] bg-signal" />
          </span>
        </div>
      </div>
    </section>
  );
}
