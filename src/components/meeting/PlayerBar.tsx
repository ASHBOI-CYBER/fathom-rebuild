'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, RotateCw, Scissors } from 'lucide-react';
import { clock } from '@/lib/format';
import { firstName } from '@/lib/people';
import { turnIndexAt, usePlayer } from '@/lib/player';
import { matchesAll, terms } from '@/lib/search';
import { toast } from '../Toast';
import { useMeeting } from './context';

const RATES = [1, 1.25, 1.5, 2];

/** Scrubber on top (coloured by who is speaking), plain controls beneath. */
export function PlayerBar() {
  const { meeting, player, createClip, readOnly, setTab } = useMeeting();
  const playing = usePlayer(player, (s) => s.playing);
  const time = usePlayer(player, (s) => Math.floor(s.time));
  const rate = usePlayer(player, (s) => s.rate);
  const bounds = usePlayer(player, (s) => s.bounds);

  const clipLast = () => {
    const t = player.get().time;
    const h = createClip(Math.max(0, t - 30), Math.max(t, 5));
    toast(`Clip saved, ${clock(h.start)} to ${clock(h.end)}`);
    setTab('clips');
  };

  return (
    <div className="rounded-2xl border border-line bg-surface px-4 pb-3 pt-4 sm:px-5">
      <Scrubber />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => player.toggle()}
          aria-label={playing ? 'Pause' : 'Play'}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-fg text-abyss transition-transform hover:scale-105"
        >
          {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-0.5" fill="currentColor" />}
        </button>
        <button onClick={() => player.skip(-10)} aria-label="Back 10 seconds" className="rounded-full p-2.5 text-fg-soft hover:bg-raised hover:text-fg">
          <RotateCcw size={18} />
        </button>
        <button onClick={() => player.skip(10)} aria-label="Forward 10 seconds" className="rounded-full p-2.5 text-fg-soft hover:bg-raised hover:text-fg">
          <RotateCw size={18} />
        </button>
        <span className="ml-1 text-[15px] text-fg-faint tabular">
          <span className="font-semibold text-fg">{clock(time)}</span> / {clock(bounds ? bounds[1] : meeting.duration)}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => player.setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])}
            aria-label={`Playback speed ${rate}x`}
            className="min-w-[54px] rounded-full border border-line px-3 py-1.5 text-[14px] font-semibold text-fg-soft tabular hover:border-line-strong hover:text-fg"
          >
            {rate}×
          </button>
          {!readOnly && (
            <button onClick={clipLast} title="Save the last 30 seconds as a clip" className="flex items-center gap-2 rounded-full bg-coral-soft px-3.5 py-1.5 text-[14px] font-semibold text-coral hover:bg-coral hover:text-on-coral">
              <Scissors size={15} /> Clip last 30s
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Scrubber() {
  const { meeting, player, starts, colorOf, highlights, query, jump } = useMeeting();
  const { duration, turns, chapters } = meeting;
  const track = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const played = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; t: number; w: number } | null>(null);
  const bounds = usePlayer(player, (s) => s.bounds);

  const hits = useMemo(() => {
    const ts = terms(query);
    return ts.length ? turns.filter((t) => matchesAll(t.t, ts)).map((t) => t.start) : [];
  }, [query, turns]);

  // Move the playhead without re-rendering on every frame.
  useEffect(() => {
    const place = () => {
      const t = player.get().time;
      const pct = `${(100 * t) / duration}%`;
      if (head.current) head.current.style.left = pct;
      if (played.current) played.current.style.width = pct;
      track.current?.setAttribute('aria-valuenow', String(Math.round(t)));
      track.current?.setAttribute('aria-valuetext', clock(t));
    };
    place();
    return player.subscribe(place);
  }, [player, duration]);

  const timeAt = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    return Math.min(duration, Math.max(0, ((clientX - r.left) / r.width) * duration));
  };
  const info = hover && (() => {
    const ch = chapters.find((c) => hover.t >= c.start && hover.t < c.end) ?? chapters[chapters.length - 1];
    const tn = turns[turnIndexAt(starts, hover.t)];
    return { ch, speaker: tn && hover.t <= tn.end + 0.5 ? tn.s : null };
  })();
  const pct = (t: number) => `${(100 * t) / duration}%`;

  return (
    <div
      ref={track}
      className="relative h-9 cursor-pointer touch-none select-none"
      role="slider"
      tabIndex={0}
      aria-label="Seek through the meeting"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={0}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        player.seek(timeAt(e.clientX));
      }}
      onPointerMove={(e) => {
        const r = track.current!.getBoundingClientRect();
        setHover({ x: e.clientX - r.left, t: timeAt(e.clientX), w: r.width });
        if (e.buttons === 1) player.seek(timeAt(e.clientX));
      }}
      onPointerLeave={() => setHover(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') player.skip(10);
        if (e.key === 'ArrowLeft') player.skip(-10);
      }}
    >
      {/* clips sit above the track */}
      {highlights.map((h) => (
        <button
          key={h.id}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => jump(h.start, true)}
          title={`${clock(h.start)} · ${h.title}`}
          aria-label={`Play clip: ${h.title}`}
          className="absolute top-0 h-[5px] min-w-[6px] rounded-full bg-coral/80 hover:bg-coral"
          style={{ left: pct(h.start), width: pct(h.end - h.start) }}
        />
      ))}
      {/* the track: who spoke when */}
      <div className="absolute inset-x-0 top-[11px] h-[10px] overflow-hidden rounded-full bg-raised">
        <svg className="absolute inset-0 h-full w-full opacity-55" viewBox={`0 0 ${duration} 10`} preserveAspectRatio="none" aria-hidden>
          {turns.map((t) => (
            <rect key={t.id} x={t.start} y={0} width={Math.max(t.end - t.start, duration / 700)} height={10} fill={colorOf(t.s)} />
          ))}
        </svg>
        <div ref={played} className="absolute inset-y-0 left-0 bg-white/10" />
        {chapters.slice(1).map((c) => (
          <span key={c.start} className="absolute inset-y-0 w-[3px] -translate-x-1/2 bg-surface" style={{ left: pct(c.start) }} />
        ))}
        {bounds && (
          <>
            <span className="absolute inset-y-0 left-0 bg-surface/80" style={{ width: pct(bounds[0]) }} />
            <span className="absolute inset-y-0 right-0 bg-surface/80" style={{ width: `${100 - (100 * bounds[1]) / duration}%` }} />
          </>
        )}
      </div>
      {hits.map((t, i) => (
        <span key={i} className="absolute top-[24px] h-[8px] w-[2px] rounded-full bg-[#f0b54a]" style={{ left: pct(t) }} />
      ))}
      {hover && <span className="pointer-events-none absolute top-[7px] h-[18px] w-px bg-white/40" style={{ left: hover.x }} />}
      <div ref={head} className="pointer-events-none absolute top-[8px] h-4 w-4 -translate-x-1/2 rounded-full border-[3px] border-surface bg-coral shadow-[0_0_0_1px_rgba(255,122,98,0.5)]" />
      {hover && info && (
        <div
          className="pointer-events-none absolute bottom-full z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line-strong bg-raised px-2.5 py-1.5 text-[12px] shadow-xl"
          style={{ left: Math.min(Math.max(hover.x, 90), hover.w - 90) }}
        >
          <span className="font-semibold text-fg tabular">{clock(hover.t)}</span>
          {info.speaker && <span className="text-fg-soft"> · {firstName(info.speaker)}</span>}
          <span className="block max-w-[220px] truncate text-fg-faint">{info.ch?.title}</span>
        </div>
      )}
    </div>
  );
}
