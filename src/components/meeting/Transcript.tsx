'use client';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ChevronDown, ChevronUp, Plus, Scissors, Search, X } from 'lucide-react';
import { clock } from '@/lib/format';
import { firstName, person } from '@/lib/people';
import { turnIndexAt, usePlayer } from '@/lib/player';
import { terms } from '@/lib/search';
import type { Turn } from '@/lib/types';
import { Marked } from '../SearchPalette';
import { toast } from '../Toast';
import { useMeeting } from './context';

export function Transcript() {
  const { meeting, player, starts, focus, setFocus, query, setQuery, createClip, readOnly, colorOf } = useMeeting();
  const activeIdx = usePlayer(player, (s) => turnIndexAt(starts, s.time));
  const playing = usePlayer(player, (s) => s.playing);
  const bounds = usePlayer(player, (s) => s.bounds);
  const scroller = useRef<HTMLDivElement>(null);
  const [follow, setFollow] = useState(true);
  const [hitState, setHitState] = useState({ q: query, i: 0 });
  const hitCursor = hitState.q === query ? hitState.i : 0;
  const setHitCursor = (fn: (c: number) => number) => setHitState({ q: query, i: fn(hitCursor) });
  const [selection, setSelection] = useState<{ from: number; to: number; x: number; y: number } | null>(null);
  const programmatic = useRef(false);

  const visible = useMemo(() => {
    let list = meeting.turns;
    if (bounds) list = list.filter((t) => t.end >= bounds[0] && t.start <= bounds[1]);
    if (focus.length) list = list.filter((t) => focus.includes(t.s));
    return list;
  }, [meeting.turns, focus, bounds]);

  const hitIds = useMemo(() => {
    const ts = terms(query);
    if (!ts.length) return [];
    return visible.filter((t) => ts.every((w) => t.t.toLowerCase().includes(w))).map((t) => t.id);
  }, [query, visible]);

  const scrollToTurn = useCallback((id: number, smooth = true) => {
    const el = scroller.current?.querySelector<HTMLElement>(`[data-turn="${id}"]`);
    if (!el || !scroller.current) return;
    programmatic.current = true;
    const box = scroller.current;
    const top = el.offsetTop - box.clientHeight * 0.3;
    box.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    window.setTimeout(() => (programmatic.current = false), smooth ? 600 : 50);
  }, []);

  // Follow the playhead while playing, unless the reader has scrolled away.
  const activeId = meeting.turns[activeIdx]?.id;
  useEffect(() => {
    if (follow && activeId != null) scrollToTurn(activeId);
  }, [activeId, follow, scrollToTurn]);

  // When jumping to a search hit, centre it.
  useEffect(() => {
    if (hitIds.length) scrollToTurn(hitIds[Math.min(hitCursor, hitIds.length - 1)]);
  }, [hitIds, hitCursor, scrollToTurn]);

  const onScroll = () => {
    if (!programmatic.current && playing) setFollow(false);
  };

  const onMouseUp = () => {
    if (readOnly) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !scroller.current) return setSelection(null);
    const turnOf = (n: Node | null) => (n instanceof Element ? n : n?.parentElement)?.closest<HTMLElement>('[data-turn]');
    const a = turnOf(sel.anchorNode);
    const b = turnOf(sel.focusNode);
    if (!a || !b) return setSelection(null);
    const ids = [Number(a.dataset.turn), Number(b.dataset.turn)].sort((x, y) => x - y);
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    const box = scroller.current.getBoundingClientRect();
    setSelection({ from: ids[0], to: ids[1], x: rect.left + rect.width / 2 - box.left, y: rect.top - box.top + scroller.current.scrollTop });
  };

  const clipSelection = () => {
    if (!selection) return;
    const byId = new Map(meeting.turns.map((t) => [t.id, t]));
    const a = byId.get(selection.from)!;
    const b = byId.get(selection.to)!;
    const text = window.getSelection()?.toString().trim() ?? '';
    const title = text.length > 4 ? (text.length > 70 ? text.slice(0, 67).trimEnd() + '…' : text) : undefined;
    const h = createClip(a.start, b.end, title ? `“${title}”` : undefined, 'quote');
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    toast(`Clip saved · ${clock(h.start)}–${clock(h.end)}`);
  };

  const clipTurn = useCallback(
    (t: Turn) => {
      const h = createClip(t.start, t.end, `${firstName(t.s)}: “${t.t.split(/\s+/).slice(0, 9).join(' ')}…”`, 'bookmark');
      toast(`Clip saved · ${clock(h.start)}–${clock(h.end)}`);
    },
    [createClip],
  );

  const chapterStarts = useMemo(() => new Map(meeting.chapters.map((c) => [c.firstTurn, c])), [meeting.chapters]);
  const hitSet = useMemo(() => new Set(hitIds), [hitIds]);
  const currentHit = hitIds[Math.min(hitCursor, hitIds.length - 1)];

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-rule-soft px-4 py-2.5">
        <label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-rule bg-paper px-2.5 py-1.5">
          <Search size={15} className="text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && hitIds.length) setHitCursor((c) => (e.shiftKey ? (c - 1 + hitIds.length) % hitIds.length : (c + 1) % hitIds.length));
            }}
            placeholder="Find in transcript"
            aria-label="Find in transcript"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-ink-faint"
          />
          {query && (
            <>
              <span className="shrink-0 text-[12px] text-ink-faint tabular">{hitIds.length ? `${Math.min(hitCursor, hitIds.length - 1) + 1}/${hitIds.length}` : '0'}</span>
              <button aria-label="Previous match" onClick={() => setHitCursor((c) => (c - 1 + hitIds.length) % Math.max(1, hitIds.length))} className="text-ink-faint hover:text-ink">
                <ChevronUp size={16} />
              </button>
              <button aria-label="Next match" onClick={() => setHitCursor((c) => (c + 1) % Math.max(1, hitIds.length))} className="text-ink-faint hover:text-ink">
                <ChevronDown size={16} />
              </button>
              <button aria-label="Clear search" onClick={() => setQuery('')} className="text-ink-faint hover:text-ink">
                <X size={15} />
              </button>
            </>
          )}
        </label>
        {focus.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
            <span className="text-ink-faint">Only</span>
            {focus.map((id) => (
              <button key={id} onClick={() => setFocus(focus.filter((f) => f !== id))} className="flex items-center gap-1 rounded-full py-0.5 pl-2 pr-1.5 text-white" style={{ background: colorOf(id) }}>
                {firstName(id)} <X size={12} />
              </button>
            ))}
            <button onClick={() => setFocus([])} className="text-ink-soft underline-offset-2 hover:underline">
              Everyone
            </button>
          </div>
        )}
      </div>

      <div ref={scroller} onScroll={onScroll} onMouseUp={onMouseUp} className="quiet-scroll relative min-h-0 flex-1 overflow-y-auto px-2 pb-24 pt-2 sm:px-3">
        {visible.length === 0 && <p className="p-6 text-ink-soft">No lines in this range.</p>}
        {visible.map((t) => (
          <div key={t.id}>
            {!focus.length && chapterStarts.has(t.id) && <ChapterRule title={chapterStarts.get(t.id)!.title} gist={chapterStarts.get(t.id)!.gist} start={chapterStarts.get(t.id)!.start} />}
            <TurnRow turn={t} active={t.id === activeId} hit={hitSet.has(t.id)} current={t.id === currentHit} query={query} onClip={readOnly ? undefined : clipTurn} />
          </div>
        ))}
        {selection && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={clipSelection}
            className="absolute z-10 flex -translate-x-1/2 -translate-y-[130%] items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-white shadow-lg"
            style={{ left: selection.x, top: selection.y }}
          >
            <Scissors size={13} /> Clip this
          </button>
        )}
      </div>
      {!follow && playing && (
        <button
          onClick={() => setFollow(true)}
          className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[13px] font-semibold text-white shadow-lg"
        >
          <ArrowDownToLine size={14} /> Back to now
        </button>
      )}
    </div>
  );
}

function ChapterRule({ title, gist, start }: { title: string; gist: string; start: number }) {
  const { jump } = useMeeting();
  return (
    <div className="mx-2 mb-2 mt-5 border-t border-rule pt-3 first:mt-1">
      <button onClick={() => jump(start)} className="group flex items-baseline gap-2 text-left">
        <span className="text-[12px] text-ink-faint tabular">{clock(start)}</span>
        <span className="font-serif text-[19px] italic leading-tight text-ink group-hover:underline group-hover:underline-offset-4">{title}</span>
      </button>
      <p className="mt-0.5 pl-[46px] text-[13px] leading-snug text-ink-soft">{gist}</p>
    </div>
  );
}

const TurnRow = memo(function TurnRow({
  turn,
  active,
  hit,
  current,
  query,
  onClip,
}: {
  turn: Turn;
  active: boolean;
  hit: boolean;
  current: boolean;
  query: string;
  onClip?: (t: Turn) => void;
}) {
  const { colorOf, jump } = useMeeting();
  return (
    <div
      data-turn={turn.id}
      className={`group relative grid grid-cols-[44px_1fr] gap-x-2 rounded-lg py-1.5 pl-1 pr-8 transition-colors ${
        active ? 'bg-magenta-wash/70' : current ? 'bg-[#fbf1dc]' : 'hover:bg-shoal/40'
      }`}
    >
      {active && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-magenta" />}
      <button onClick={() => jump(turn.start, true)} className="pt-[3px] text-right text-[12px] text-ink-faint tabular hover:text-magenta" aria-label={`Play from ${clock(turn.start)}`}>
        {clock(turn.start)}
      </button>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold" style={{ color: colorOf(turn.s) }}>
          {person(turn.s).name}
        </div>
        <p className="text-[15px] leading-[1.6] text-ink">{hit ? <Marked text={turn.t} q={query} /> : turn.t}</p>
      </div>
      {onClip && (
        <button
          onClick={() => onClip(turn)}
          title="Clip this line"
          aria-label="Clip this line"
          className="absolute right-1.5 top-1.5 rounded-md p-1 text-ink-faint opacity-0 transition-opacity hover:bg-paper hover:text-magenta focus:opacity-100 group-hover:opacity-100"
        >
          <Plus size={16} />
        </button>
      )}
    </div>
  );
});
