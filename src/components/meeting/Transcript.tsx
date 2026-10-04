'use client';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLineDown, CaretDown, CaretUp, Plus, Scissors, MagnifyingGlass, X } from '@phosphor-icons/react';
import { clock } from '@/lib/format';
import { firstName, person } from '@/lib/people';
import { turnIndexAt, usePlayer } from '@/lib/player';
import { matchesAll, terms } from '@/lib/search';
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
    return visible.filter((t) => matchesAll(t.t, ts)).map((t) => t.id);
  }, [query, visible]);

  // Start on the match at (or just after) the playhead, e.g. when arriving from search.
  const [hitState, setHitState] = useState(() => {
    const t = player.get().time;
    const byId = new Map(meeting.turns.map((x) => [x.id, x]));
    const i = hitIds.findIndex((id) => (byId.get(id)?.end ?? 0) >= t);
    return { q: query, i: Math.max(0, i) };
  });
  const hitCursor = hitState.q === query ? hitState.i : 0;
  const setHitCursor = (fn: (c: number) => number) => setHitState({ q: query, i: fn(hitCursor) });

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
    // Glide while playing; jump instantly on seeks and first load.
    if (follow && activeId != null) scrollToTurn(activeId, player.get().playing);
  }, [activeId, follow, scrollToTurn, player]);

  // When stepping through matches, centre the current one. On first mount the
  // playhead wins, so a deep link from search lands on the exact line.
  const firstHitScroll = useRef(true);
  useEffect(() => {
    if (firstHitScroll.current) {
      firstHitScroll.current = false;
      if (player.get().time > 0) return;
    }
    if (hitIds.length) scrollToTurn(hitIds[Math.min(hitCursor, hitIds.length - 1)]);
  }, [hitIds, hitCursor, scrollToTurn, player]);

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
    toast(`Clip saved, ${clock(h.start)} to ${clock(h.end)}`);
  };

  const clipTurn = useCallback(
    (t: Turn) => {
      const h = createClip(t.start, t.end, `${firstName(t.s)}: “${t.t.split(/\s+/).slice(0, 9).join(' ')}…”`, 'bookmark');
      toast(`Clip saved, ${clock(h.start)} to ${clock(h.end)}`);
    },
    [createClip],
  );

  const chapterStarts = useMemo(() => new Map(meeting.chapters.map((c) => [c.firstTurn, c])), [meeting.chapters]);
  const hitSet = useMemo(() => new Set(hitIds), [hitIds]);
  const currentHit = hitIds[Math.min(hitCursor, hitIds.length - 1)];

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-full border border-line bg-abyss/50 px-3.5 py-2 focus-within:border-line-strong">
          <MagnifyingGlass size={15} className="text-fg-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && hitIds.length) setHitCursor((c) => (e.shiftKey ? (c - 1 + hitIds.length) % hitIds.length : (c + 1) % hitIds.length));
            }}
            placeholder="Find in this transcript"
            aria-label="Find in this transcript"
            className="w-full bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-faint"
          />
          {query && (
            <>
              <span className="shrink-0 text-[13px] text-fg-faint tabular">{hitIds.length ? `${Math.min(hitCursor, hitIds.length - 1) + 1} of ${hitIds.length}` : 'No matches'}</span>
              <button aria-label="Previous match" onClick={() => setHitCursor((c) => (c - 1 + hitIds.length) % Math.max(1, hitIds.length))} className="text-fg-faint hover:text-fg">
                <CaretUp size={17} />
              </button>
              <button aria-label="Next match" onClick={() => setHitCursor((c) => (c + 1) % Math.max(1, hitIds.length))} className="text-fg-faint hover:text-fg">
                <CaretDown size={17} />
              </button>
              <button aria-label="Clear search" onClick={() => setQuery('')} className="text-fg-faint hover:text-fg">
                <X size={16} />
              </button>
            </>
          )}
        </label>
        {focus.length > 0 && (
          <div className="flex w-full flex-wrap items-center gap-2 text-[14px]">
            <span className="text-fg-faint">Showing only</span>
            {focus.map((id) => (
              <button key={id} onClick={() => setFocus(focus.filter((f) => f !== id))} className="flex items-center gap-1 rounded-full py-0.5 pl-2.5 pr-2 font-semibold" style={{ background: colorOf(id), color: 'var(--abyss)' }}>
                {firstName(id)} <X size={13} />
              </button>
            ))}
            <button onClick={() => setFocus([])} className="text-fg-soft underline-offset-4 hover:text-fg hover:underline">
              Show everyone
            </button>
          </div>
        )}
      </div>

      <div ref={scroller} onScroll={onScroll} onMouseUp={onMouseUp} className="quiet-scroll relative min-h-0 flex-1 overflow-y-auto px-3 pb-28 pt-2 sm:px-4">
        {visible.length === 0 && <p className="p-6 text-fg-soft">Nothing was said in this range.</p>}
        {visible.map((t, i) => {
          const chapter = !focus.length ? chapterStarts.get(t.id) : undefined;
          const showHeader = !!chapter || i === 0 || visible[i - 1].s !== t.s;
          return (
            <div key={t.id}>
              {chapter && <ChapterRule title={chapter.title} start={chapter.start} />}
              <TurnRow turn={t} showHeader={showHeader} active={t.id === activeId} hit={hitSet.has(t.id)} current={t.id === currentHit} query={query} onClip={readOnly ? undefined : clipTurn} />
            </div>
          );
        })}
        {selection && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={clipSelection}
            className="absolute z-10 flex -translate-x-1/2 -translate-y-[130%] items-center gap-1.5 rounded-full bg-signal px-3.5 py-2 text-[14px] font-semibold text-on-signal shadow-xl"
            style={{ left: selection.x, top: selection.y }}
          >
            <Scissors size={14} /> Clip this
          </button>
        )}
      </div>
      {!follow && playing && (
        <button
          onClick={() => setFollow(true)}
          className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-fg px-4 py-2 text-[14px] font-semibold text-abyss shadow-xl"
        >
          <ArrowLineDown size={15} /> Back to now
        </button>
      )}
    </div>
  );
}

function ChapterRule({ title, start }: { title: string; start: number }) {
  const { jump } = useMeeting();
  return (
    <div className="mb-1 mt-7 flex items-center gap-3 px-2 first:mt-3">
      <button onClick={() => jump(start)} className="flex shrink-0 items-baseline gap-2 text-left hover:text-signal">
        <span className="text-[13px] text-fg-faint tabular">{clock(start)}</span>
        <span className="text-[14px] font-semibold text-fg">{title}</span>
      </button>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

const TurnRow = memo(function TurnRow({
  turn,
  showHeader,
  active,
  hit,
  current,
  query,
  onClip,
}: {
  turn: Turn;
  showHeader: boolean;
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
      className={`group relative rounded-xl px-3 transition-colors ${showHeader ? 'mt-3 pb-1.5 pt-2' : 'py-1'} ${
        active ? 'bg-signal-soft' : current ? 'bg-[#f0b54a]/10' : 'hover:bg-raised/60'
      }`}
    >
      {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-signal" />}
      {showHeader && (
        <div className="mb-0.5 flex items-baseline gap-2.5">
          <span className="text-[14px] font-semibold" style={{ color: colorOf(turn.s) }}>
            {person(turn.s).name}
          </span>
          <button onClick={() => jump(turn.start, true)} className="text-[13px] text-fg-faint tabular hover:text-signal" aria-label={`Play from ${clock(turn.start)}`}>
            {clock(turn.start)}
          </button>
        </div>
      )}
      <p
        className={`pr-7 text-[16px] leading-[1.65] ${active ? 'text-fg' : 'text-fg-soft'}`}
        onDoubleClick={() => jump(turn.start, true)}
        title={showHeader ? undefined : `${clock(turn.start)} · double-click to play`}
      >
        {hit ? <Marked text={turn.t} q={query} /> : turn.t}
      </p>
      {onClip && (
        <button
          onClick={() => onClip(turn)}
          title="Clip this line"
          aria-label="Clip this line"
          className="absolute right-2 top-2 rounded-lg p-1 text-fg-faint opacity-0 transition-opacity hover:bg-hover hover:text-signal focus:opacity-100 group-hover:opacity-100"
        >
          <Plus size={17} />
        </button>
      )}
    </div>
  );
});
