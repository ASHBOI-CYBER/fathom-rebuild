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
    <div className="px-5 pb-16 pt-4">
      {!readOnly && (
        <p className="mb-4 rounded-lg bg-chart/70 px-3 py-2.5 text-[13px] leading-relaxed text-ink-soft">
          Make a clip three ways: select words in the transcript, press <b>+</b> on any line, or use <b>Clip last 30s</b> while it plays. Clips get their own link, so you can send one moment without the whole call.
        </p>
      )}
      <ul className="space-y-2">
        {sorted.map((h) => (
          <ClipRow key={h.id} h={h} onPlay={() => jump(h.start, true)} onShare={() => share(h)} onDelete={h.mine && !readOnly ? () => userStore.removeHighlight(meeting.id, h.id) : undefined} />
        ))}
      </ul>
      {!sorted.length && <p className="text-ink-soft">No clips yet.</p>}
    </div>
  );
}

function ClipRow({ h, onPlay, onShare, onDelete }: { h: Highlight; onPlay: () => void; onShare: () => void; onDelete?: () => void }) {
  const K = KIND[h.kind] ?? KIND.bookmark;
  return (
    <li className={`group rounded-xl border bg-paper p-3 transition-colors ${h.mine ? 'border-magenta/40' : 'border-rule'} hover:border-ink-faint`}>
      <div className="flex items-start gap-3">
        <button onClick={onPlay} aria-label={`Play clip ${h.title}`} className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-white hover:bg-magenta">
          <Play size={14} className="ml-0.5" fill="currentColor" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold leading-snug">{h.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-faint">
            <span className="flex items-center gap-1">
              <K.icon size={12} /> {K.label}
            </span>
            <span className="tabular">
              {clock(h.start)}–{clock(h.end)} · {Math.max(1, Math.round(h.end - h.start))}s
            </span>
            <span>{h.mine ? 'You, just now' : `by ${firstName(h.by)}`}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button onClick={onShare} className="flex items-center gap-1 rounded-md px-2 py-1 text-[13px] font-medium text-ink-soft hover:bg-shoal hover:text-ink">
            <Share2 size={14} /> Share
          </button>
          {onDelete && (
            <button onClick={onDelete} aria-label="Delete clip" className="rounded-md p-1.5 text-ink-faint hover:bg-shoal hover:text-ink">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
