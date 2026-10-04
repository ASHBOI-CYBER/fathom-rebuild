'use client';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { ArrowRight, MagnifyingGlass } from '@phosphor-icons/react';
import { gsap, settle, useGSAP } from '@/lib/gsap';
import { NextUp } from './NextUp';
import { Seabed } from './Seabed';
import { SonarPrint } from './SonarPrint';
import { dateLabel, dayGroup } from '@/lib/format';
import { ME, person } from '@/lib/people';
import type { MeetingIndex } from '@/lib/types';
import { useClient } from '@/lib/useClient';
import { openSearch } from './SearchPalette';

type Filter = 'all' | 'external' | 'internal' | 'mine';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'external', label: 'With customers' },
  { id: 'internal', label: 'Internal' },
  { id: 'mine', label: 'Hosted by me' },
];

function greeting(local: boolean) {
  if (!local) return 'Welcome back';
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

const hm = (sec: number) => {
  const m = Math.round(sec / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
};

export function MeetingList({ meetings }: { meetings: MeetingIndex[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const local = useClient();
  const latest = meetings[0];

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return meetings.filter((m) => {
      if (filter === 'external' && m.kind !== 'external') return false;
      if (filter === 'internal' && m.kind !== 'internal') return false;
      if (filter === 'mine' && m.host !== ME) return false;
      if (!needle) return true;
      return [m.title, m.type, m.externalCompany ?? '', ...m.participants.map((p) => person(p).name)].join(' ').toLowerCase().includes(needle);
    });
  }, [meetings, filter, q]);

  const groups = useMemo(() => {
    const now = new Date();
    const out: { label: string; items: MeetingIndex[] }[] = [];
    for (const m of shown) {
      const label = dayGroup(m.startsAt, now, local);
      const g = out.find((x) => x.label === label);
      if (g) g.items.push(m);
      else out.push({ label, items: [m] });
    }
    return out;
  }, [shown, local]);

  const totalMin = Math.round(meetings.reduce((a, m) => a + m.duration, 0) / 60);

  // One orchestrated entrance: the greeting rises word by word while the
  // latest meeting's print turns into place beside it.
  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.from('.hero-word', { yPercent: 110, duration: 1.1, stagger: 0.07 })
          .from('.hero-fade', { opacity: 0, y: 14, duration: 0.9, stagger: 0.08 }, '-=0.75')
          .from('.latest-print', { rotate: -60, opacity: 0, scale: 0.9, duration: 1.8 }, 0.15);
        settle(tl);
      });
    },
    { scope: root },
  );

  const hello = `${greeting(local)}, ${person(ME).name.split(' ')[0]}.`;

  return (
    <div ref={root}>
      {/* First screen: greeting and one action on the left, the latest meeting on the right, over the seabed */}
      <section className="relative -mt-16 overflow-hidden pt-16">
        <Seabed meetings={meetings} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-abyss to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-abyss to-transparent" />
        {/* a pool of darkness behind the copy so the point cloud never crosses the text */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-[radial-gradient(90%_50%_at_30%_40%,rgba(9,16,23,0.95),rgba(9,16,23,0.6)_60%,transparent_90%)] lg:w-[70%] lg:bg-[radial-gradient(60%_55%_at_22%_58%,rgba(9,16,23,0.92),rgba(9,16,23,0.55)_55%,transparent_80%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[45%] bg-[radial-gradient(55%_45%_at_55%_62%,rgba(9,16,23,0.85),rgba(9,16,23,0.4)_60%,transparent_85%)] lg:block" />
        <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[1320px] items-center gap-12 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div>
            <h1 className="display text-[clamp(54px,7.4vw,104px)] text-fg" aria-label={hello}>
              {hello.split(' ').map((w, i) => (
                <span key={i} className="inline-block overflow-hidden pb-[0.06em] align-bottom" aria-hidden>
                  <span className="hero-word inline-block pr-[0.2em]">{w}</span>
                </span>
              ))}
            </h1>
            <p className="hero-fade mt-6 max-w-[44ch] text-[18px] leading-relaxed text-fg-soft">
              {meetings.length} calls and {Math.floor(totalMin / 60)} hours {totalMin % 60} minutes of talk this fortnight. Each ridge behind this is one of them; the peaks are where it got lively.
            </p>
            <div className="hero-fade mt-9 flex flex-wrap items-center gap-x-6 gap-y-5">
              <button onClick={openSearch} className="press group flex items-center gap-3 rounded-full bg-signal py-2 pl-6 pr-2 text-[16px] font-semibold text-on-signal hover:bg-signal-hover">
                Search every word
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-on-signal/10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:scale-105">
                  <MagnifyingGlass size={17} weight="bold" />
                </span>
              </button>
              <NextUp />
            </div>
          </div>

          {latest && (
            <Link href={`/meetings/${latest.id}`} className="hero-fade group mx-auto block w-full max-w-[420px] text-center">
              <span className="latest-print relative block transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[16deg]">
                <SonarPrint participants={latest.participants} talk={latest.talk} duration={latest.duration} segments={latest.segments} chapterStarts={latest.chapterStarts} detail className="h-auto w-full" />
                <span className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="display text-[40px] tabular text-fg">{hm(latest.duration).replace(' min', 'm')}</span>
                  <span className="mt-1 text-[13px] text-fg-soft">{latest.participants.length} voices</span>
                </span>
              </span>
              <span className="mt-6 block text-[14px] text-fg-faint">Latest · {dateLabel(latest.startsAt, local)}</span>
              <span className="mt-1 block text-[22px] font-semibold leading-snug text-fg">{latest.title}</span>
              <span className="mt-3 inline-flex items-center gap-2 text-[15px] font-semibold text-signal">
                Open the meeting <ArrowRight size={15} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* The ledger: every call, newest first */}
      <section className="mx-auto max-w-[1320px] px-5 pb-28 pt-6 sm:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <h2 className="display text-[clamp(40px,4vw,56px)] text-fg">The fortnight</h2>
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter meetings">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={`press rounded-full px-4 py-2 text-[14px] ${filter === f.id ? 'bg-fg font-semibold text-abyss' : 'text-fg-soft hover:bg-raised hover:text-fg'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <label className="flex w-full items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 focus-within:border-line-strong md:ml-2 md:w-[240px]">
              <MagnifyingGlass size={15} className="text-fg-faint" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Title or person"
                className="w-full bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-faint"
                aria-label="Filter meetings by title or person"
              />
            </label>
          </div>
        </div>

        {!groups.length && (
          <p className="rounded-[20px] border border-dashed border-line-strong px-8 py-14 text-center text-[16px] text-fg-soft">
            Nothing matches that filter. Clear it, or search inside every transcript.
          </p>
        )}

        {groups.map((g) => (
          <div key={g.label} className="mb-10">
            <h3 className="mb-2 px-4 text-[14px] font-semibold text-fg-faint">{g.label}</h3>
            <ul>
              {g.items.map((m) => (
                <LedgerRow key={m.id} m={m} local={local} />
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}

function LedgerRow({ m, local }: { m: MeetingIndex; local: boolean }) {
  return (
    <li>
      <Link
        href={`/meetings/${m.id}`}
        className="group grid grid-cols-[64px_minmax(0,1fr)] items-center gap-x-5 rounded-[20px] px-3 py-4 transition-colors duration-300 hover:bg-surface sm:grid-cols-[96px_minmax(0,1fr)_120px] sm:gap-x-8 sm:px-4"
      >
        <span className="block transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[24deg]">
          <SonarPrint participants={m.participants} talk={m.talk} duration={m.duration} segments={m.segments} mono className="h-auto w-full" title={`${m.title}: who spoke when`} />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] text-fg-faint">
            {dateLabel(m.startsAt, local)} · {m.type}
            {m.externalCompany ? ` · ${m.externalCompany}` : ''}
          </span>
          <span className="mt-0.5 block text-[21px] font-semibold leading-snug text-fg transition-colors group-hover:text-white">{m.title}</span>
          <span className="mt-1.5 line-clamp-2 max-w-[78ch] text-[15px] leading-relaxed text-fg-soft sm:line-clamp-1">{m.tldr}</span>
        </span>
        <span className="col-start-2 mt-2 flex gap-4 text-[13.5px] text-fg-faint tabular sm:col-start-auto sm:mt-0 sm:flex-col sm:items-end sm:gap-0.5">
          <span className="text-fg-soft">{hm(m.duration)}</span>
          <span>{m.participants.length} people</span>
        </span>
      </Link>
    </li>
  );
}
