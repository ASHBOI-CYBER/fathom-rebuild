'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckSquare, CornerDownLeft, FileText, Search, X } from 'lucide-react';
import indexData from '@/data/generated/index.json';
import { clock, dateLabel } from '@/lib/format';
import { firstName, person } from '@/lib/people';
import { markParts, searchAll, snippet } from '@/lib/search';
import type { MeetingIndex, SearchDoc } from '@/lib/types';

const INDEX = indexData as unknown as MeetingIndex[];
const SUGGESTIONS = ['live ETA', 'RouteWise', 'status page', 'Sacramento', 'retry storm', 'onboarding drop-off'];

let docsPromise: Promise<SearchDoc[]> | null = null;
const loadDocs = () =>
  (docsPromise ??= import('@/data/generated/search.json').then((m) => m.default as unknown as SearchDoc[]));

export function Marked({ text, q }: { text: string; q: string }) {
  return (
    <>
      {markParts(text, q).map((p, i) =>
        p.m ? (
          <mark key={i} className="rounded-[3px] bg-magenta-wash px-0.5 text-magenta-deep">
            {p.t}
          </mark>
        ) : (
          <span key={i}>{p.t}</span>
        ),
      )}
    </>
  );
}

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQRaw] = useState('');
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [speaker, setSpeakerRaw] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const setQ = (v: string) => {
    setQRaw(v);
    setCursor(0);
  };
  const setSpeaker = (v: string | null) => {
    setSpeakerRaw(v);
    setCursor(0);
  };
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    loadDocs().then(setDocs);
    requestAnimationFrame(() => inputRef.current?.select());
  }, [open]);

  const groups = useMemo(() => (docs ? searchAll(q, docs, INDEX, speaker) : []), [q, docs, speaker]);
  const flat = useMemo(() => groups.flatMap((g) => g.hits.slice(0, 4).map((h) => ({ g, h }))), [groups]);
  const rowIndex = useMemo(() => new Map(flat.map((x, n) => [x.h, n])), [flat]);
  const total = groups.reduce((n, g) => n + g.hits.length, 0);
  const speakers = useMemo(() => {
    if (!docs || !q.trim()) return [];
    const counts = new Map<string, number>();
    for (const g of searchAll(q, docs, INDEX)) for (const h of g.hits) if (h.kind === 'said' && h.speaker) counts.set(h.speaker, (counts.get(h.speaker) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [q, docs]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${cursor}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) return null;

  const go = (meetingId: string, ts: number | null) => {
    onClose();
    const params = new URLSearchParams();
    if (ts != null) params.set('t', ts.toFixed(1));
    if (q.trim()) params.set('q', q.trim());
    router.push(`/meetings/${meetingId}?${params}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(flat.length - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === 'Enter' && flat[cursor]) go(flat[cursor].g.meeting.id, flat[cursor].h.ts);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-3 pt-[8vh] sm:pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search all meetings" onKeyDown={onKey}>
      <div className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex max-h-[76vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-rule bg-paper shadow-[0_24px_60px_-20px_rgba(15,34,54,0.45)]">
        <div className="flex items-center gap-3 border-b border-rule px-4">
          <Search size={18} className="text-ink-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search what anyone said, in any meeting"
            className="h-14 flex-1 bg-transparent text-[16px] outline-none placeholder:text-ink-faint"
            aria-label="Search query"
          />
          <button onClick={onClose} aria-label="Close search" className="rounded-md p-1 text-ink-faint hover:bg-shoal hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {q.trim() && speakers.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-rule-soft px-4 py-2 text-[13px]">
            <span className="text-ink-faint">Said by</span>
            <button onClick={() => setSpeaker(null)} className={`rounded-full px-2.5 py-0.5 ${!speaker ? 'bg-ink text-white' : 'bg-shoal text-ink-soft hover:text-ink'}`}>
              Anyone
            </button>
            {speakers.map(([id, n]) => (
              <button
                key={id}
                onClick={() => setSpeaker(speaker === id ? null : id)}
                className={`rounded-full px-2.5 py-0.5 ${speaker === id ? 'bg-ink text-white' : 'bg-shoal text-ink-soft hover:text-ink'}`}
              >
                {firstName(id)} <span className="tabular opacity-60">{n}</span>
              </button>
            ))}
          </div>
        )}

        <div ref={listRef} className="quiet-scroll flex-1 overflow-y-auto">
          {!q.trim() && (
            <div className="p-4">
              <p className="mb-3 text-[13px] text-ink-faint">Try a topic that came up across several calls</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => setQ(s)} className="rounded-full border border-rule px-3 py-1 text-[14px] text-ink-soft hover:border-ink-faint hover:text-ink">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {q.trim() && docs && !groups.length && (
            <p className="p-6 text-[15px] text-ink-soft">
              Nothing matches “{q}”. Try fewer words, or a name like “Marcus”.
            </p>
          )}
          {q.trim() && !docs && <p className="p-6 text-[15px] text-ink-faint">Loading transcripts…</p>}
          {groups.map((g) => (
            <section key={g.meeting.id} className="border-b border-rule-soft px-2 py-2 last:border-0">
              <header className="flex items-baseline justify-between gap-3 px-2 pb-1 pt-1">
                <h3 className="truncate text-[14px] font-semibold">{g.meeting.title}</h3>
                <span className="shrink-0 text-[12px] text-ink-faint">
                  {dateLabel(g.meeting.startsAt)} · {g.hits.length} {g.hits.length === 1 ? 'match' : 'matches'}
                </span>
              </header>
              {g.hits.slice(0, 4).map((h) => {
                const idx = rowIndex.get(h) ?? -1;
                const active = idx === cursor;
                return (
                  <button
                    key={`${h.kind}-${h.turnId ?? h.text}`}
                    data-i={idx}
                    onMouseMove={() => setCursor(idx)}
                    onClick={() => go(g.meeting.id, h.ts)}
                    className={`flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left ${active ? 'bg-shoal' : ''}`}
                  >
                    <span className="mt-0.5 w-12 shrink-0 text-right text-[12px] text-ink-faint tabular">{h.ts != null ? clock(h.ts) : ''}</span>
                    <span className="min-w-0 flex-1 text-[14px] leading-snug text-ink">
                      <span className="mb-0.5 flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft">
                        {h.kind === 'said' && person(h.speaker).name}
                        {h.kind === 'note' && (
                          <>
                            <FileText size={12} /> Meeting notes
                          </>
                        )}
                        {h.kind === 'action' && (
                          <>
                            <CheckSquare size={12} /> Action item{h.speaker ? ` · ${firstName(h.speaker)}` : ''}
                          </>
                        )}
                      </span>
                      <Marked text={snippet(h.text, q)} q={q} />
                    </span>
                    {active && <CornerDownLeft size={14} className="mt-1 shrink-0 text-ink-faint" />}
                  </button>
                );
              })}
              {g.hits.length > 4 && (
                <button onClick={() => go(g.meeting.id, g.hits[0].ts)} className="ml-16 mt-0.5 pb-1 text-[13px] font-medium text-magenta hover:underline">
                  Open all {g.hits.length} matches in this meeting
                </button>
              )}
            </section>
          ))}
        </div>
        {q.trim() && docs && groups.length > 0 && (
          <footer className="border-t border-rule-soft px-4 py-2 text-[12px] text-ink-faint">
            {total} matches in {groups.length} {groups.length === 1 ? 'meeting' : 'meetings'} · ↑↓ to move, Enter to open
          </footer>
        )}
      </div>
    </div>
  );
}
