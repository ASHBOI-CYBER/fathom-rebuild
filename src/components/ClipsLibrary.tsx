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
    <div className="mx-auto w-full max-w-[1080px] px-4 pb-24 pt-6 sm:px-8 sm:pt-10">
      <h1 className="font-serif text-[40px] italic leading-none tracking-tight sm:text-[48px]">Clips</h1>
      <p className="mt-2 max-w-[60ch] text-[15px] text-ink-soft">
        Moments people saved from calls. Each one has its own link that opens for anyone, so you can send the 30 seconds that matter instead of the whole hour.
      </p>

      <div className="mb-4 mt-6 flex flex-wrap gap-1.5">
        <Filter on={!kind} onClick={() => setKind(null)}>
          All <span className="opacity-60">{rows.length}</span>
        </Filter>
        <Filter on={kind === 'mine'} onClick={() => setKind('mine')}>
          Saved by me
        </Filter>
        {kinds.map((k) => (
          <Filter key={k} on={kind === k} onClick={() => setKind(k)}>
            {KIND[k].label} <span className="opacity-60">{rows.filter((r) => r.h.kind === k).length}</span>
          </Filter>
        ))}
      </div>

      <ul className="grid gap-3 md:grid-cols-2">
        {shown.map(({ h, m }) => {
          const K = KIND[h.kind] ?? KIND.bookmark;
          return (
            <li key={`${m.id}-${h.id}`} className={`flex flex-col rounded-xl border bg-paper p-4 ${h.mine ? 'border-magenta/40' : 'border-rule'}`}>
              <div className="flex items-center gap-2 text-[12px] text-ink-faint">
                <K.icon size={13} /> {K.label}
                <span className="ml-auto tabular">
                  {clock(h.start)}–{clock(h.end)}
                </span>
              </div>
              <p className="mt-1.5 text-[16px] font-semibold leading-snug">{h.title}</p>
              <p className="mt-1 truncate text-[13px] text-ink-soft">
                {m.title} · {dateLabel(m.startsAt, local)}
              </p>
              <div className="mt-3 flex items-center gap-2 pt-1">
                <span className="flex items-center gap-1.5 text-[13px] text-ink-soft">
                  <Avatar id={h.by} color={speakerColor(m.participants, h.by)} size={20} />
                  {h.mine ? 'You' : firstName(h.by)}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(shareUrl(m, h));
                    toast('Clip link copied');
                  }}
                  className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[13px] text-ink-soft hover:bg-shoal hover:text-ink"
                >
                  <Link2 size={14} /> Copy link
                </button>
                <Link href={`/meetings/${m.id}?t=${Math.floor(h.start)}`} className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-[13px] font-semibold text-white hover:bg-magenta">
                  <Play size={12} fill="currentColor" /> Play
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
      {!shown.length && <p className="text-ink-soft">No clips of this kind yet. Open any meeting and select a few words in the transcript to make one.</p>}
      <Toaster />
    </div>
  );
}

function Filter({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`rounded-full px-3 py-1 text-[14px] tabular ${on ? 'bg-ink text-white' : 'bg-shoal text-ink-soft hover:text-ink'}`}>
      {children}
    </button>
  );
}
