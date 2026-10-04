'use client';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { ArrowRight, MagnifyingGlass } from '@phosphor-icons/react';
import { gsap, settle, useGSAP } from '@/lib/gsap';
import { NextUp } from './NextUp';
import { Seabed } from './Seabed';
import { SonarPrint } from './SonarPrint';
import { AvatarStack } from './Avatar';
import { dateLabel, dayGroup, minutes } from '@/lib/format';
import { ME, person, speakerColor } from '@/lib/people';
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
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}`;
};

export function MeetingList({ meetings }: { meetings: MeetingIndex[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const local = useClient();
  const latest = meetings[0];

  const rest = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return meetings.slice(1).filter((m) => {
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
    for (const m of rest) {
      const label = dayGroup(m.startsAt, now, local);
      const g = out.find((x) => x.label === label);
      if (g) g.items.push(m);
      else out.push({ label, items: [m] });
    }
    return out;
  }, [rest, local]);

  const totalMin = Math.round(meetings.reduce((a, m) => a + m.duration, 0) / 60);

  // One orchestrated entrance: the greeting surfaces word by word, then the
  // latest meeting's print turns into place.
  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.from('.hero-word', { yPercent: 110, duration: 1.1, stagger: 0.07 })
          .from('.hero-fade', { opacity: 0, y: 14, duration: 0.9, stagger: 0.08 }, '-=0.7')
          .from('.latest-print', { rotate: -50, opacity: 0, scale: 0.92, duration: 1.6 }, '-=0.6');
        settle(tl);
      });
    },
    { scope: root },
  );

  const hello = `${greeting(local)}, ${person(ME).name.split(' ')[0]}.`;

  return (
    <div ref={root}>
      {/* Hero: the seabed of the last fortnight */}
      <section className="relative -mt-16 flex min-h-[86dvh] items-end overflow-hidden pt-16">
        <Seabed meetings={meetings} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-abyss to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-abyss via-abyss/85 to-transparent" />
        <div className="relative mx-auto w-full max-w-[1320px] px-5 pb-14 sm:px-8 sm:pb-20">
          <h1 className="display max-w-[14ch] text-[clamp(64px,10.5vw,148px)] text-fg" aria-label={hello}>
            {hello.split(' ').map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.06em] align-bottom" aria-hidden>
                <span className="hero-word inline-block pr-[0.22em]">{w}</span>
              </span>
            ))}
          </h1>
          <p className="hero-fade mt-6 max-w-[46ch] text-[18px] leading-relaxed text-fg-soft sm:text-[19px]">
            {meetings.length} calls, {Math.floor(totalMin / 60)} hours {totalMin % 60} minutes of talk. Every ridge behind this is one of them, and the peaks are where it got lively.
          </p>
          <div className="hero-fade mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <button onClick={openSearch} className="press group flex items-center gap-3 rounded-full bg-signal py-2 pl-6 pr-2 text-[16px] font-semibold text-on-signal hover:bg-signal-hover">
              Search every word
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-on-signal/10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:scale-105">
                <MagnifyingGlass size={17} weight="bold" />
              </span>
            </button>
            <NextUp />
          </div>
        </div>
      </section>

      {/* The latest meeting, given room */}
      {latest && (
        <section className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 sm:py-28">
          <Link href={`/meetings/${latest.id}`} className="group grid items-center gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-16">
            <div className="latest-print relative mx-auto w-full max-w-[460px] transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[14deg]">
              <SonarPrint participants={latest.participants} talk={latest.talk} duration={latest.duration} segments={latest.segments} chapterStarts={latest.chapterStarts} detail className="h-auto w-full" />
              <span className="display absolute inset-0 flex items-center justify-center text-[clamp(30px,4vw,46px)] tabular text-fg">{hm(latest.duration)}</span>
            </div>
            <div>
              <p className="text-[15px] text-fg-faint">
                Latest, {dateLabel(latest.startsAt, local)} with {latest.participants.length} people
              </p>
              <h2 className="display mt-3 text-[clamp(44px,5.6vw,80px)] text-fg">{latest.title}</h2>
              <p className="mt-6 max-w-[58ch] text-[17px] leading-[1.7] text-fg-soft">{latest.tldr}</p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <AvatarStack ids={latest.participants} colorOf={(id) => speakerColor(latest.participants, id)} size={34} max={8} />
                <span className="press ml-auto flex items-center gap-3 rounded-full border border-line-strong py-1.5 pl-5 pr-1.5 text-[15px] font-semibold text-fg group-hover:border-fg-faint">
                  Open the meeting
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-fg text-abyss transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
                    <ArrowRight size={15} weight="bold" />
                  </span>
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Everything before it: a ledger, not a card grid */}
      <section className="mx-auto max-w-[1320px] px-5 pb-28 sm:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <h2 className="display text-[clamp(40px,4.4vw,60px)] text-fg">The fortnight</h2>
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
          <p className="rounded-3xl border border-dashed border-line-strong px-8 py-14 text-center text-[16px] text-fg-soft">
            Nothing here matches. Clear the filter, or search inside every transcript.
          </p>
        )}

        {groups.map((g) => (
          <div key={g.label} className="mb-12">
            <h3 className="mb-3 text-[15px] font-semibold text-fg-faint">{g.label}</h3>
            <ul className="space-y-2">
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
        className="group grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-5 gap-y-2 rounded-[22px] px-3 py-3 transition-colors duration-300 hover:bg-surface sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:gap-x-7 sm:px-4"
      >
        <span className="block transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[24deg]">
          <SonarPrint participants={m.participants} talk={m.talk} duration={m.duration} segments={m.segments} className="h-auto w-full" title={`${m.title}: who spoke when`} />
        </span>
        <span className="min-w-0">
          <span className="block text-[13.5px] text-fg-faint">
            {dateLabel(m.startsAt, local)} · {m.type}
            {m.externalCompany ? ` with ${m.externalCompany}` : ''}
          </span>
          <span className="mt-0.5 block text-[20px] font-semibold leading-snug text-fg sm:text-[22px]">{m.title}</span>
          <span className="mt-1 block truncate text-[14.5px] text-fg-soft">{m.participants.map((p) => person(p).name.split(' ')[0]).join(', ')}</span>
        </span>
        <span className="col-start-2 sm:col-start-auto sm:text-right">
          <span className="display block text-[30px] tabular text-fg-soft transition-colors group-hover:text-signal sm:text-[44px]">{hm(m.duration)}</span>
          <span className="sr-only">{minutes(m.duration)}</span>
        </span>
      </Link>
    </li>
  );
}
