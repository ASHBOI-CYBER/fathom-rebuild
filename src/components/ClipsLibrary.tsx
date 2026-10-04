'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Link2, Play } from 'lucide-react';
import { clock, dateLabel } from '@/lib/format';
import { ME, firstName, speakerColor } from '@/lib/people';
import { useUserState } from '@/lib/store';
import type { Highlight, HighlightKind, MeetingIndex } from '@/lib/types';
import { useClient } from '@/lib/useClient';
import { Avatar } from './Avatar';
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
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.02em] sm:text-[40px]">Clips</h1>
      <p className="mt-2 max-w-[62ch] text-[17px] text-fg-soft">The moments worth keeping. Send someone the 30 seconds that matter instead of the whole hour.</p>

      <div className="mb-8 mt-10 flex flex-wrap gap-1" role="tablist" aria-label="Filter clips">
        <Filter on={!kind} onClick={() => setKind(null)}>
          All
        </Filter>
        <Filter on={kind === 'mine'} onClick={() => setKind('mine')}>
          Saved by me
        </Filter>
        {kinds.map((k) => (
          <Filter key={k} on={kind === k} onClick={() => setKind(k)}>
            {KIND[k].label}s
          </Filter>
        ))}
      </div>

      <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
        {shown.map(({ h, m }) => {
          const K = KIND[h.kind] ?? KIND.bookmark;
          return (
            <li key={`${m.id}-${h.id}`} className={`group flex min-w-0 flex-col rounded-2xl border p-5 transition-colors ${h.mine ? 'border-coral/35 bg-coral-soft' : 'border-line bg-surface hover:border-line-strong'}`}>
              <p className="flex items-center gap-2 text-[13px] text-fg-faint">
                <K.icon size={14} /> {K.label} · <span className="tabular">{clock(h.start)}</span> · {Math.max(1, Math.round(h.end - h.start))} sec
              </p>
              <p className="mt-2 text-[17px] font-semibold leading-snug text-fg">{h.title}</p>
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
                  className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] text-fg-soft hover:bg-raised hover:text-fg"
                >
                  <Link2 size={15} /> Copy link
                </button>
                <Link href={`/meetings/${m.id}?t=${h.start.toFixed(1)}`} className="flex items-center gap-1.5 rounded-full bg-fg px-4 py-1.5 text-[14px] font-semibold text-abyss hover:bg-white">
                  <Play size={13} fill="currentColor" /> Play
                </Link>
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
    <button role="tab" aria-selected={on} onClick={onClick} className={`rounded-full px-4 py-2 text-[14px] transition-colors ${on ? 'bg-fg font-semibold text-abyss' : 'text-fg-soft hover:bg-raised hover:text-fg'}`}>
      {children}
    </button>
  );
}
