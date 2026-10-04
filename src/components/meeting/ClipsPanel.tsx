'use client';
import { Bookmark, CheckSquare, Play, Quote, Share2, Trash2, TriangleAlert } from 'lucide-react';
import { clock } from '@/lib/format';
import { firstName } from '@/lib/people';
import { userStore } from '@/lib/store';
import type { Highlight } from '@/lib/types';
import { useMeeting } from './context';

export const KIND = {
  bookmark: { label: 'Bookmark', icon: Bookmark },
  action: { label: 'Action', icon: CheckSquare },
  quote: { label: 'Quote', icon: Quote },
  concern: { label: 'Concern', icon: TriangleAlert },
} as const;

export function ClipsPanel() {
  const { meeting, highlights, jump, share, readOnly } = useMeeting();
  const sorted = [...highlights].sort((a, b) => a.start - b.start);

  return (
    <div className="px-6 pb-16 pt-5">
      {!readOnly && (
        <p className="mb-5 text-[14px] leading-relaxed text-fg-faint">
          Select words in the transcript, press <b className="text-fg-soft">+</b> on a line, or use <b className="text-fg-soft">Clip last 30s</b> while it plays. Every clip gets a link anyone can open.
        </p>
      )}
      <ul className="space-y-2.5">
        {sorted.map((h) => (
          <ClipRow key={h.id} h={h} onPlay={() => jump(h.start, true)} onShare={() => share(h)} onDelete={h.mine && !readOnly ? () => userStore.removeHighlight(meeting.id, h.id) : undefined} />
        ))}
      </ul>
      {!sorted.length && <p className="text-fg-soft">No clips yet.</p>}
    </div>
  );
}

function ClipRow({ h, onPlay, onShare, onDelete }: { h: Highlight; onPlay: () => void; onShare: () => void; onDelete?: () => void }) {
  const K = KIND[h.kind] ?? KIND.bookmark;
  return (
    <li className={`group flex items-start gap-3.5 rounded-2xl border p-4 transition-colors ${h.mine ? 'border-coral/35 bg-coral-soft' : 'border-line bg-raised/40 hover:bg-raised'}`}>
      <button onClick={onPlay} aria-label={`Play clip: ${h.title}`} className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg text-abyss transition-transform hover:scale-105">
        <Play size={14} className="ml-0.5" fill="currentColor" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-snug text-fg">{h.title}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-fg-faint">
          <K.icon size={13} /> {K.label} · <span className="tabular">{clock(h.start)}</span> · {Math.max(1, Math.round(h.end - h.start))} sec · {h.mine ? 'saved by you' : firstName(h.by)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button onClick={onShare} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] text-fg-soft hover:bg-hover hover:text-fg">
          <Share2 size={14} /> Share
        </button>
        {onDelete && (
          <button onClick={onDelete} aria-label="Delete clip" className="rounded-full p-2 text-fg-faint hover:bg-hover hover:text-fg">
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </li>
  );
}
