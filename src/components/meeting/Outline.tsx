'use client';
import { memo, useMemo, useRef, useState } from 'react';
import { gsap, settle, useGSAP } from '@/lib/gsap';
import { clock, minutes } from '@/lib/format';
import { person } from '@/lib/people';
import { usePlayer } from '@/lib/player';
import { Avatar } from '../Avatar';
import { useMeeting } from './context';

/**
 * How to get around a long call: chapters, or who spoke. "Speakers" is the
 * view built for the eight-person hour — one lane per person, click a name to
 * read only what they said.
 */
export function Outline() {
  const { meeting } = useMeeting();
  const [view, setView] = useState<'chapters' | 'speakers'>('chapters');
  return (
    <div className="rounded-2xl border border-line bg-surface p-2">
      <div className="flex items-center gap-1 p-1" role="tablist" aria-label="Navigate the meeting">
        {(['chapters', 'speakers'] as const).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`rounded-full px-4 py-1.5 text-[14px] transition-colors ${view === v ? 'bg-raised font-semibold text-fg' : 'text-fg-faint hover:text-fg-soft'}`}
          >
            {v === 'chapters' ? `Chapters · ${meeting.chapters.length}` : `Speakers · ${meeting.participants.length}`}
          </button>
        ))}
      </div>
      {view === 'chapters' ? <Chapters /> : <Speakers />}
    </div>
  );
}

function Chapters() {
  const { meeting, player, jump } = useMeeting();
  // Re-render only when the playhead crosses into another chapter.
  const current = usePlayer(player, (s) => meeting.chapters.findIndex((c) => s.time >= c.start && s.time < c.end));
  return (
    <ol className="mt-1">
      {meeting.chapters.map((c, i) => {
        const active = i === current;
        return (
          <li key={c.start}>
            <button
              onClick={() => jump(c.start)}
              aria-current={active ? 'step' : undefined}
              className={`group relative grid w-full grid-cols-[64px_1fr] gap-3 rounded-xl px-3 py-3 text-left transition-colors ${active ? 'bg-raised' : 'hover:bg-raised/60'}`}
            >
              {active && <span className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-coral" />}
              <span className={`pt-px text-[14px] tabular ${active ? 'text-coral' : 'text-fg-faint'}`}>{clock(c.start)}</span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-fg">{c.title}</span>
                <span className={`mt-0.5 block text-[14px] leading-relaxed text-fg-soft ${active ? '' : 'line-clamp-1'}`}>{c.gist}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Speakers() {
  const { meeting, colorOf, focus, setFocus, setTab } = useMeeting();
  const root = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => {
    const total = Object.values(meeting.talk).reduce((a, b) => a + b, 0) || 1;
    return [...meeting.participants].sort((a, b) => (meeting.talk[b] || 0) - (meeting.talk[a] || 0)).map((id) => ({ id, share: (meeting.talk[id] || 0) / total }));
  }, [meeting]);

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        settle(gsap.fromTo('.lane', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power2.inOut', stagger: 0.04 }));
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="mt-1">
      <p className="px-3 pb-2 pt-1 text-[14px] text-fg-faint">When each person spoke across {minutes(meeting.duration)}. Select someone to read only their lines.</p>
      <ul>
        {rows.map(({ id, share }) => {
          const on = focus.length === 1 && focus[0] === id;
          return (
            <li key={id}>
              <button
                onClick={() => {
                  setFocus(on ? [] : [id]);
                  setTab('transcript');
                }}
                aria-pressed={on}
                className={`grid w-full grid-cols-[minmax(0,180px)_1fr_44px] items-center gap-4 rounded-xl px-3 py-2.5 text-left transition-colors ${on ? 'bg-raised' : 'hover:bg-raised/60'}`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Avatar id={id} color={colorOf(id)} size={28} />
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold text-fg">{person(id).name}</span>
                    <span className="block truncate text-[12px] text-fg-faint">{person(id).title}</span>
                  </span>
                </span>
                <Lane id={id} />
                <span className="text-right text-[14px] font-semibold text-fg-soft tabular">{Math.round(share * 100)}%</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const Lane = memo(function Lane({ id }: { id: string }) {
  const { meeting, colorOf } = useMeeting();
  const d = meeting.duration;
  return (
    <span className="relative block h-[18px] overflow-hidden rounded-md bg-abyss/60">
      <svg className="lane absolute inset-0 h-full w-full" viewBox={`0 0 ${d} 10`} preserveAspectRatio="none" aria-hidden>
        {meeting.turns
          .filter((t) => t.s === id)
          .map((t) => (
            <rect key={t.id} x={t.start} y={1.5} width={Math.max(t.end - t.start, d / 600)} height={7} rx={0} fill={colorOf(id)} />
          ))}
      </svg>
    </span>
  );
});
