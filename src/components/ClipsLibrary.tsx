'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { LinkSimple, Play } from '@phosphor-icons/react';
import { clock, dateLabel } from '@/lib/format';
import { ME, firstName, speakerColor } from '@/lib/people';
import { useUserState } from '@/lib/store';
import type { Highlight, HighlightKind, MeetingIndex } from '@/lib/types';
import { useClient } from '@/lib/useClient';
import { Avatar } from './Avatar';
import { SonarPrint } from './SonarPrint';
import { PageBand } from './PageBand';
import { R_OUTER, angleAt, arcPath } from '@/lib/sonar';
import { KIND } from './meeting/ClipsPanel';
import { shareUrl } from './ShareDialog';
import { toast, Toaster } from './Toast';

type Row = { h: Highlight; m: MeetingIndex };

export function ClipsLibrary({ meetings }: { meetings: MeetingIndex[] }) {
  const mine = useUserState((s) => s.highlights);
  const local = useClient();
  const [kind, setKind] = useState<HighlightKind | 'mine' | null>(null);

  const rows = useMemo(() => {
    const out: Row[] = [];
    for (const m of meetings) {
      for (const h of m.highlights) out.push({ h, m });
      for (const h of mine[m.id] || []) out.push({ h, m });
    }
    return out.sort((a, b) => (b.h.createdAt ?? b.m.startsAt).localeCompare(a.h.createdAt ?? a.m.startsAt) || a.h.start - b.h.start);
  }, [meetings, mine]);

  const shown = rows.filter(({ h }) => (kind === 'mine' ? h.mine || h.by === ME : kind ? h.kind === kind : true));
  const kinds = Object.keys(KIND) as HighlightKind[];

  return (
    <div className="relative isolate mx-auto w-full max-w-[1320px] px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
      <PageBand />
      <h1 className="display text-[clamp(64px,8vw,112px)] text-fg">Clips</h1>
      <p className="mt-4 max-w-[52ch] text-[18px] text-fg-soft">The moments worth keeping. Send someone the 30 seconds that matter instead of the whole hour.</p>

      <div className="mb-8 mt-10 flex flex-wrap gap-1" role="group" aria-label="Filter clips">
        <Filter on={kind !== 'mine'} onClick={() => setKind(null)}>
          Everyone’s
        </Filter>
        <Filter on={kind === 'mine'} onClick={() => setKind('mine')}>
          Saved by me
        </Filter>
        <label className="ml-2 flex items-center gap-2 text-[14px] text-fg-soft">
          <span className="sr-only">Clip type</span>
          <select
            value={kind && kind !== 'mine' ? kind : ''}
            onChange={(e) => setKind((e.target.value as HighlightKind) || null)}
            className="rounded-full border border-line bg-surface px-4 py-2 text-[14px] text-fg-soft hover:border-line-strong"
          >
            <option value="">Any type</option>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {KIND[k].label}s
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
        {shown.map(({ h, m }) => {
          const K = KIND[h.kind] ?? KIND.bookmark;
          return (
            <li key={`${m.id}-${h.id}`} className={`group grid min-w-0 grid-cols-[88px_minmax(0,1fr)] gap-5 rounded-[24px] border p-5 transition-colors border-line bg-surface hover:border-line-strong`}>
              <span className="relative block self-start">
                <SonarPrint participants={m.participants} talk={m.talk} duration={m.duration} segments={m.segments} className="h-auto w-full opacity-70" title={`Where this clip sits in ${m.title}`} />
                <svg viewBox="-102 -102 204 204" className="absolute inset-0 h-full w-full" aria-hidden>
                  <path d={arcPath(R_OUTER + 5, angleAt(h.start, m.duration), Math.max(angleAt(h.end, m.duration), angleAt(h.start, m.duration) + 0.12))} fill="none" stroke="var(--signal)" strokeWidth={7} strokeLinecap="round" />
                </svg>
              </span>
              <div className="flex min-w-0 flex-col">
              <p className="flex items-center gap-2 text-[13px] text-fg-faint">
                {h.mine && <span className="mr-1 rounded-md bg-signal-soft px-1.5 py-px text-[12px] font-semibold text-signal">Yours</span>}
                <K.icon size={14} /> {K.label} · <span className="tabular">{clock(h.start)}</span> · {Math.max(1, Math.round(h.end - h.start))} sec
              </p>
              <p className="mt-2 text-[19px] font-semibold leading-snug text-fg">{h.title}</p>
              <p className="mt-1 truncate text-[14px] text-fg-soft">
                From {m.title}, {dateLabel(m.startsAt, local)}
              </p>
              <div className="mt-5 flex items-center gap-2">
                <span className="flex items-center gap-2 text-[14px] text-fg-soft">
                  <Avatar id={h.by} color={speakerColor(m.participants, h.by)} size={24} />
                  {h.mine ? 'You' : firstName(h.by)}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(shareUrl(m, h));
                    toast('Clip link copied');
                  }}
                  aria-label={`Copy link to ${h.title}`}
                  className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] text-fg-soft hover:bg-raised hover:text-fg"
                >
                  <LinkSimple size={15} /> Copy link
                </button>
                <Link href={`/meetings/${m.id}?t=${h.start.toFixed(1)}`} aria-label={`Play ${h.title}`} className="flex items-center gap-1.5 rounded-full bg-fg px-4 py-1.5 text-[14px] font-semibold text-abyss hover:bg-white">
                  <Play size={13} weight="fill" /> Play
                </Link>
              </div>
              </div>
            </li>
          );
        })}
      </ul>
      {!shown.length && <p className="text-[16px] text-fg-soft">No clips like that yet. Open a meeting and select a few words in the transcript to make one.</p>}
      <Toaster />
    </div>
  );
}

function Filter({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button aria-pressed={on} onClick={onClick} className={`rounded-full px-4 py-2 text-[14px] transition-colors ${on ? 'bg-fg font-semibold text-abyss' : 'text-fg-soft hover:bg-raised hover:text-fg'}`}>
      {children}
    </button>
  );
}
