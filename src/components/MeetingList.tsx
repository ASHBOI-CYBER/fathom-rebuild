'use client';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { gsap, settle, useGSAP } from '@/lib/gsap';
import { CheckSquare, Scissors, Search } from 'lucide-react';
import { AvatarStack } from './Avatar';
import { TalkBar } from './TalkBar';
import { NextUp } from './NextUp';
import { dateLabel, dayGroup, minutes, timeLabel } from '@/lib/format';
import { ME, person, speakerColor } from '@/lib/people';
import type { MeetingIndex } from '@/lib/types';
import { useClient } from '@/lib/useClient';


type Filter = 'all' | 'external' | 'internal' | 'mine';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'external', label: 'With customers' },
  { id: 'internal', label: 'Internal' },
  { id: 'mine', label: 'I hosted' },
];

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
      const hay = [m.title, m.type, m.externalCompany ?? '', m.tldr, ...m.participants.map((p) => person(p).name)].join(' ').toLowerCase();
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

  // One orchestrated moment: talk bars sound out left-to-right as the list arrives.
  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        settle(gsap.from('.talk-seg', { scaleX: 0, duration: 0.7, ease: 'power3.out', stagger: { each: 0.012, from: 'start' } }));
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="mx-auto w-full max-w-[1080px] px-4 pb-24 pt-6 sm:px-8 sm:pt-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[40px] italic leading-none tracking-tight sm:text-[48px]">Meetings</h1>
          <p className="mt-2 text-[15px] text-ink-soft">
            {meetings.length} recorded calls, {Math.floor(totalMin / 60)} h {totalMin % 60} min in total. Every one is searchable down to the word.
          </p>
        </div>
      </div>

      <NextUp />

      <div className="sticky top-[57px] z-20 -mx-4 mb-2 flex flex-wrap items-center gap-2 bg-chart/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:top-0">
        <div className="flex gap-1 rounded-lg bg-shoal/70 p-1" role="tablist" aria-label="Filter meetings">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-md px-3 py-1 text-[14px] transition-colors ${filter === f.id ? 'bg-paper font-semibold text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="ml-auto flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-rule bg-paper px-3 py-1.5 sm:max-w-[300px]">
          <Search size={15} className="text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by title, person, company"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-ink-faint"
            aria-label="Filter meetings"
          />
        </label>
      </div>

      {!groups.length && (
        <div className="rounded-xl border border-dashed border-rule p-10 text-center text-ink-soft">
          No meetings match. Clear the filter, or press <kbd className="rounded border border-rule px-1">Ctrl K</kbd> to search inside transcripts.
        </div>
      )}

      {groups.map((g) => (
        <section key={g.label} className="mb-6">
          <h2 className="mb-1 px-1 text-[13px] font-semibold text-ink-faint">{g.label}</h2>
          <ul className="divide-y divide-rule-soft overflow-hidden rounded-xl border border-rule bg-paper">
            {g.items.map((m) => (
              <MeetingRow key={m.id} m={m} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function MeetingRow({ m }: { m: MeetingIndex }) {
  const local = useClient();
  const color = (id: string) => speakerColor(m.participants, id);
  return (
    <li>
      <Link href={`/meetings/${m.id}`} className="group grid grid-cols-[1fr] gap-x-6 gap-y-2 px-4 py-4 transition-colors hover:bg-shoal/40 sm:grid-cols-[88px_1fr_200px] sm:px-5">
        <div className="flex items-baseline gap-2 text-[13px] text-ink-soft sm:block">
          <div className="font-semibold text-ink">{dateLabel(m.startsAt, local)}</div>
          <div className="tabular">{timeLabel(m.startsAt, local)}</div>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-[16px] font-semibold leading-snug group-hover:underline group-hover:decoration-rule group-hover:underline-offset-4">{m.title}</h3>
            <span className="rounded-full border border-rule px-2 py-px text-[12px] text-ink-soft">{m.type}</span>
            {m.externalCompany && <span className="text-[12px] text-ink-faint">with {m.externalCompany}</span>}
          </div>
          <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-ink-soft">{m.tldr}</p>
          <div className="mt-2.5 flex items-center gap-3">
            <AvatarStack ids={m.participants} colorOf={color} size={22} max={6} />
            <span className="flex items-center gap-1 text-[12px] text-ink-faint tabular">
              <CheckSquare size={13} /> {m.actionCount}
            </span>
            <span className="flex items-center gap-1 text-[12px] text-ink-faint tabular">
              <Scissors size={13} /> {m.highlightCount}
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-2 sm:items-end">
          <span className="text-[13px] font-medium text-ink-soft tabular">{minutes(m.duration)}</span>
          <TalkBar talk={m.talk} participants={m.participants} className="sm:max-w-[200px]" />
          <span className="text-[12px] text-ink-faint">{m.participants.length} people</span>
        </div>
      </Link>
    </li>
  );
}
