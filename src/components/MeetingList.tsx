'use client';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { gsap, settle, useGSAP } from '@/lib/gsap';
import { NextUp } from './NextUp';
import { Thumbnail } from './Thumbnail';
import { dateLabel, dayGroup } from '@/lib/format';
import { ME, person } from '@/lib/people';
import type { MeetingIndex } from '@/lib/types';
import { useClient } from '@/lib/useClient';

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

export function MeetingList({ meetings }: { meetings: MeetingIndex[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const local = useClient();

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return meetings.filter((m) => {
      if (filter === 'external' && m.kind !== 'external') return false;
      if (filter === 'internal' && m.kind !== 'internal') return false;
      if (filter === 'mine' && m.host !== ME) return false;
      if (!needle) return true;
      const hay = [m.title, m.type, m.externalCompany ?? '', ...m.participants.map((p) => person(p).name)].join(' ').toLowerCase();
      return hay.includes(needle);
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

  // One orchestrated moment: the cards surface in reading order.
  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        settle(gsap.from('.meeting-card', { y: 14, opacity: 0, duration: 0.5, ease: 'power3.out', stagger: 0.045 }));
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="mx-auto w-full max-w-[1240px] px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.02em] sm:text-[40px]">
        {greeting(local)}, {person(ME).name.split(' ')[0]}
      </h1>
      <p className="mt-2 text-[17px] text-fg-soft">
        {meetings.length} meetings recorded, {Math.floor(totalMin / 60)} hours {totalMin % 60} minutes in all. Every word is searchable.
      </p>

      <NextUp />

      <div className="mb-8 mt-12 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter meetings">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-2 text-[14px] transition-colors ${filter === f.id ? 'bg-fg font-semibold text-abyss' : 'text-fg-soft hover:bg-raised hover:text-fg'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="flex w-full items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 focus-within:border-line-strong sm:ml-auto sm:w-[280px]">
          <Search size={15} className="text-fg-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by title or person"
            className="w-full bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-faint"
            aria-label="Filter meetings by title or person"
          />
        </label>
      </div>

      {!groups.length && (
        <div className="rounded-2xl border border-dashed border-line-strong p-12 text-center text-fg-soft">
          No meetings match that filter. Clear it, or press Ctrl K to search inside every transcript.
        </div>
      )}

      {groups.map((g) => (
        <section key={g.label} className="mb-12">
          <h2 className="mb-4 text-[15px] font-semibold text-fg-soft">{g.label}</h2>
          <ul className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((m) => (
              <MeetingCard key={m.id} m={m} local={local} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function MeetingCard({ m, local }: { m: MeetingIndex; local: boolean }) {
  return (
    <li className="meeting-card">
      <Link href={`/meetings/${m.id}`} className="group block rounded-2xl outline-offset-4">
        <div className="transition-transform duration-300 group-hover:-translate-y-1">
          <Thumbnail participants={m.participants} duration={m.duration} label={m.type} />
        </div>
        <h3 className="mt-3.5 line-clamp-2 text-[17px] font-semibold leading-snug text-fg group-hover:text-white">{m.title}</h3>
        <p className="mt-1 text-[14px] text-fg-faint">
          {dateLabel(m.startsAt, local)} · {m.participants.length} people
          {m.externalCompany ? ` · ${m.externalCompany}` : ''}
        </p>
      </Link>
    </li>
  );
}
