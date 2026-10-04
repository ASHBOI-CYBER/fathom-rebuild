'use client';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { gsap, settle, useGSAP } from '@/lib/gsap';
import { clock } from '@/lib/format';
import { firstName, person } from '@/lib/people';
import { turnIndexAt, usePlayer } from '@/lib/player';
import { matchesAll, terms } from '@/lib/search';
import { useMeeting } from './context';


/**
 * The sounding chart: one lane per speaker showing exactly when each person
 * talked, with chapters above and clips below. Built for the 8-person hour —
 * you can see the shape of the meeting before you press play.
 */
export function SoundingChart() {
  const { meeting, player, starts, colorOf, focus, setFocus, highlights, query, jump } = useMeeting();
  const { duration, turns, chapters } = meeting;
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const bounds = usePlayer(player, (s) => s.bounds);
  const [hover, setHover] = useState<{ x: number; t: number; w: number } | null>(null);

  const lanes = useMemo(
    () => [...meeting.participants].sort((a, b) => (meeting.talk[b] || 0) - (meeting.talk[a] || 0)),
    [meeting],
  );
  const totalTalk = Object.values(meeting.talk).reduce((a, b) => a + b, 0) || 1;
  const laneH = lanes.length <= 2 ? 18 : lanes.length <= 4 ? 14 : 11;

  const hits = useMemo(() => {
    const ts = terms(query);
    if (!ts.length) return [];
    return turns.filter((t) => matchesAll(t.t, ts)).map((t) => t.start);
  }, [query, turns]);

  // Move the playhead without re-rendering React on every frame.
  useEffect(() => {
    const place = () => {
      const t = player.get().time;
      if (head.current) head.current.style.left = `${(100 * t) / duration}%`;
      track.current?.setAttribute('aria-valuenow', String(Math.round(t)));
      track.current?.setAttribute('aria-valuetext', clock(t));
    };
    place();
    return player.subscribe(place);
  }, [player, duration]);

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        settle(gsap.fromTo('.lane-bars', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power2.inOut', stagger: 0.05 }));
      });
    },
    { scope: root },
  );

  const timeAt = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    return Math.min(duration, Math.max(0, ((clientX - r.left) / r.width) * duration));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    player.seek(timeAt(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const r = track.current!.getBoundingClientRect();
    setHover({ x: e.clientX - r.left, t: timeAt(e.clientX), w: r.width });
    if (e.buttons === 1) player.seek(timeAt(e.clientX));
  };

  const hoverInfo = hover && (() => {
    const ch = chapters.find((c) => hover.t >= c.start && hover.t < c.end) ?? chapters[chapters.length - 1];
    const tn = turns[turnIndexAt(starts, hover.t)];
    return { ch, speaker: tn && hover.t <= tn.end + 0.5 ? tn.s : null };
  })();

  const toggleFocus = (id: string) => setFocus(focus.includes(id) ? focus.filter((f) => f !== id) : [...focus, id]);

  return (
    <div ref={root} className="select-none">
      <div className="grid grid-cols-[92px_1fr] gap-x-3 sm:grid-cols-[124px_1fr]">
        {/* chapter band */}
        <div className="flex items-end pb-1 text-[11px] font-semibold text-ink-faint">Chapters</div>
        <div className="relative mb-1 flex h-7 overflow-hidden rounded-md">
          {chapters.map((c, i) => (
            <button
              key={c.start}
              onClick={() => jump(c.start)}
              title={`${clock(c.start)} · ${c.title}`}
              className={`group relative h-full min-w-0 border-r border-paper px-1.5 text-left text-[11px] leading-7 transition-colors last:border-0 ${
                i % 2 ? 'bg-shoal-strong/70 hover:bg-shoal-strong' : 'bg-shoal hover:bg-shoal-strong'
              }`}
              style={{ width: `${(100 * (c.end - c.start)) / duration}%` }}
            >
              <span className="block truncate text-ink-soft group-hover:text-ink">{c.title}</span>
            </button>
          ))}
        </div>

        {/* lanes */}
        <div className="flex flex-col">
          {lanes.map((id) => {
            const on = !focus.length || focus.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleFocus(id)}
                aria-pressed={focus.includes(id)}
                title={`Show only ${person(id).name} in the transcript`}
                className={`flex items-center gap-1.5 truncate text-left text-[12px] transition-opacity ${on ? '' : 'opacity-40'}`}
                style={{ height: laneH + 4 }}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colorOf(id) }} />
                <span className={`truncate ${focus.includes(id) ? 'font-semibold text-ink' : 'text-ink-soft'}`}>{firstName(id)}</span>
                <span className="ml-auto text-[11px] text-ink-faint tabular">{Math.round((100 * (meeting.talk[id] || 0)) / totalTalk)}%</span>
              </button>
            );
          })}
        </div>
        <div
          ref={track}
          className="relative cursor-pointer touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
          role="slider"
          aria-label="Seek through the meeting"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={0}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') player.skip(10);
            if (e.key === 'ArrowLeft') player.skip(-10);
          }}
        >
          {/* chapter boundaries */}
          {chapters.slice(1).map((c) => (
            <span key={c.start} className="absolute inset-y-0 w-px bg-rule" style={{ left: `${(100 * c.start) / duration}%` }} />
          ))}
          {bounds && (
            <>
              <span className="pointer-events-none absolute inset-y-0 left-0 z-[1] bg-paper/75" style={{ width: `${(100 * bounds[0]) / duration}%` }} />
              <span className="pointer-events-none absolute inset-y-0 right-0 z-[1] bg-paper/75" style={{ width: `${100 - (100 * bounds[1]) / duration}%` }} />
            </>
          )}
          {lanes.map((id) => (
            <Lane key={id} id={id} h={laneH} dim={!!focus.length && !focus.includes(id)} />
          ))}
          {hover && (
            <span className="pointer-events-none absolute inset-y-0 w-px bg-ink/30" style={{ left: hover.x }} />
          )}
          <div ref={head} className="pointer-events-none absolute -inset-y-1 w-[2px] -translate-x-1/2 rounded-full bg-magenta shadow-[0_0_0_2px_rgba(255,255,255,0.7)]">
            <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-magenta" />
          </div>
          {hover && hoverInfo && (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] text-white shadow-lg"
              style={{ left: Math.min(Math.max(hover.x, 60), hover.w - 60) }}
            >
              <span className="font-semibold tabular">{clock(hover.t)}</span>
              {hoverInfo.speaker && <span className="text-white/75"> · {firstName(hoverInfo.speaker)}</span>}
              <span className="block max-w-[220px] truncate text-white/60">{hoverInfo.ch?.title}</span>
            </div>
          )}
        </div>

        {/* clips + search hits */}
        <div className="pt-1 text-[11px] font-semibold text-ink-faint">{hits.length ? `“${query}”` : 'Clips'}</div>
        <div className="relative mt-1 h-5">
          {highlights.map((h) => (
            <button
              key={h.id}
              onClick={() => jump(h.start)}
              title={`${clock(h.start)} · ${h.title}`}
              className="absolute top-0 h-3.5 min-w-[6px] rounded-sm bg-magenta/80 hover:bg-magenta"
              style={{ left: `${(100 * h.start) / duration}%`, width: `${(100 * (h.end - h.start)) / duration}%` }}
            />
          ))}
          {hits.map((t, i) => (
            <span key={i} className="absolute top-0 h-5 w-[2px] rounded-full bg-[#d99a1e]" style={{ left: `${(100 * t) / duration}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

const Lane = memo(function Lane({ id, h, dim }: { id: string; h: number; dim: boolean }) {
  const { meeting, colorOf } = useMeeting();
  const d = meeting.duration;
  const mine = meeting.turns.filter((t) => t.s === id);
  return (
    <div className="relative" style={{ height: h + 4 }}>
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-rule-soft" />
      <svg className="lane-bars absolute inset-0 h-full w-full" viewBox={`0 0 ${d} 10`} preserveAspectRatio="none" style={{ opacity: dim ? 0.18 : 1, transition: 'opacity .2s' }}>
        {mine.map((t) => (
          <rect key={t.id} x={t.start} y={1} width={Math.max(t.end - t.start, d / 900)} height={8} rx={0} fill={colorOf(id)} />
        ))}
      </svg>
    </div>
  );
});
