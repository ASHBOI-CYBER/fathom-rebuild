'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play } from '@phosphor-icons/react';
import { clock } from '@/lib/format';
import { firstName, person } from '@/lib/people';
import { turnIndexAt, usePlayer } from '@/lib/player';
import { R_INNER, R_OUTER, angleAt, arcPath, ringLayout, speakerAtRadius, type Segment } from '@/lib/sonar';
import { SonarPrint } from '../SonarPrint';
import { useMeeting } from './context';

/**
 * Playback as a sonar sweep. The beam turns clockwise with the recording; the
 * arc being spoken lights up; the centre carries the live caption. Drag around
 * the dial to scrub, click any arc to hear it.
 */
export function SonarDial({ live = false }: { live?: boolean }) {
  const { meeting, player, starts, focus } = useMeeting();
  const box = useRef<HTMLDivElement>(null);
  const beam = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; t: number; who: string | null } | null>(null);
  const layout = useMemo(() => ringLayout(meeting.participants, meeting.talk), [meeting]);
  const idx = usePlayer(player, (s) => turnIndexAt(starts, s.time));
  // Live: the dial draws itself as people speak, one finished turn at a time.
  const segments = useMemo<Segment[]>(
    () => (live ? meeting.turns.slice(0, idx) : meeting.turns).map((t) => [meeting.participants.indexOf(t.s), t.start, t.end]),
    [meeting, live, idx],
  );
  const chapterStarts = useMemo(() => (live ? [] : meeting.chapters.map((c) => c.start)), [meeting.chapters, live]);
  const playing = usePlayer(player, (s) => s.playing);
  const bounds = usePlayer(player, (s) => s.bounds);
  const turn = meeting.turns[idx];

  // Rotate the beam outside React: one transform per frame.
  useEffect(() => {
    const place = () => {
      const deg = (360 * player.get().time) / meeting.duration;
      if (beam.current) beam.current.style.transform = `rotate(${deg}deg)`;
    };
    place();
    return player.subscribe(place);
  }, [player, meeting.duration]);

  const toDial = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 204 - 102;
    const y = ((e.clientY - r.top) / r.height) * 204 - 102;
    const ang = Math.atan2(y, x) + Math.PI / 2;
    const frac = (ang < 0 ? ang + 2 * Math.PI : ang) / (2 * Math.PI);
    return { x: e.clientX - r.left, y: e.clientY - r.top, rad: Math.hypot(x, y), t: frac * meeting.duration };
  };

  const onDown = (e: React.PointerEvent) => {
    if (live) return;
    const p = toDial(e);
    if (p.rad < R_INNER - 4) return; // the centre is the play button
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const who = speakerAtRadius(p.rad, layout);
    // Clicking on someone's arc starts from the beginning of what they were saying.
    const tn = meeting.turns[turnIndexAt(starts, p.t)];
    player.seek(who && tn && tn.s === who ? tn.start : p.t);
  };
  const onMove = (e: React.PointerEvent) => {
    if (live) return;
    const p = toDial(e);
    if (p.rad < R_INNER - 4 || p.rad > R_OUTER + 9) return setHover(null);
    if (e.buttons === 1) player.seek(p.t);
    setHover({ x: p.x, y: p.y, t: p.t, who: speakerAtRadius(p.rad, layout) });
  };

  const hoverTurn = hover && meeting.turns[turnIndexAt(starts, hover.t)];
  const hoverSpeaking = hover && hoverTurn && hover.t <= hoverTurn.end + 1 ? hoverTurn.s : null;
  const chapter = hover && (meeting.chapters.find((c) => hover.t >= c.start && hover.t < c.end) ?? meeting.chapters[meeting.chapters.length - 1]);

  const active = turn && layout.radius.get(turn.s);
  const sw = layout.band * (meeting.participants.length > 5 ? 0.58 : 0.5);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[600px] select-none">
      <div
        ref={box}
        className={`absolute inset-0 touch-none ${live ? '' : 'cursor-crosshair'}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="slider"
        tabIndex={0}
        aria-label="Seek around the dial"
        aria-valuemin={0}
        aria-valuemax={Math.round(meeting.duration)}
        aria-valuenow={Math.round(turn?.start ?? 0)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') player.skip(10);
          if (e.key === 'ArrowLeft') player.skip(-10);
        }}
      >
        <SonarPrint
          participants={meeting.participants}
          talk={meeting.talk}
          duration={meeting.duration}
          segments={segments}
          chapterStarts={chapterStarts}
          dim={focus}
          detail
          className="absolute inset-0 h-full w-full"
        />

        {/* the clip window on shared clips */}
        {bounds && (
          <svg viewBox="-102 -102 204 204" className="pointer-events-none absolute inset-0 h-full w-full">
            <path d={arcPath(R_OUTER + 5, angleAt(bounds[0], meeting.duration), angleAt(bounds[1], meeting.duration))} fill="none" stroke="var(--signal)" strokeWidth={2.2} strokeLinecap="round" />
          </svg>
        )}

        {/* the beam */}
        <div ref={beam} className="pointer-events-none absolute inset-0 will-change-transform" style={{ transform: 'rotate(0deg)' }}>
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from -38deg, rgba(235,201,92,0) 0deg, rgba(235,201,92,0.16) 37deg, rgba(235,201,92,0) 38deg)',
              WebkitMask: 'radial-gradient(circle, transparent 32%, black 33%, black 90%, transparent 91%)',
              mask: 'radial-gradient(circle, transparent 32%, black 33%, black 90%, transparent 91%)',
            }}
          />
          <div className="absolute left-1/2 top-[4%] h-[30%] w-[2px] -translate-x-1/2 rounded-full bg-gradient-to-b from-signal to-signal/0" />
        </div>

        {/* the line being spoken, lit */}
        {live && <LiveArc />}
        {!live && turn && active != null && (
          <svg viewBox="-102 -102 204 204" className="pointer-events-none absolute inset-0 h-full w-full">
            <path
              d={arcPath(active, angleAt(turn.start, meeting.duration), Math.max(angleAt(turn.end, meeting.duration), angleAt(turn.start, meeting.duration) + 0.03))}
              fill="none"
              stroke="var(--signal)"
              strokeWidth={sw + 1.4}
              style={{ filter: 'drop-shadow(0 0 2px rgba(235,201,92,0.8))' }}
            />
          </svg>
        )}
      </div>

      {/* centre: who is talking, what they're saying */}
      <button
        onClick={() => player.toggle()}
        aria-label={playing ? 'Pause' : 'Play'}
        className="group absolute left-1/2 top-1/2 flex aspect-square w-[31%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full px-[3%] text-center"
      >
        <CenterReadout playing={playing} />
      </button>

      {hover && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[130%] whitespace-nowrap rounded-xl border border-line-strong bg-raised/95 px-3 py-2 text-[12.5px] shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur"
          style={{ left: hover.x, top: hover.y }}
        >
          <span className="font-semibold text-fg tabular">{clock(hover.t)}</span>
          {(hover.who || hoverSpeaking) && <span className="text-fg-soft"> · {firstName((hover.who ?? hoverSpeaking)!)}</span>}
          <span className="block max-w-[240px] truncate text-fg-faint">{chapter?.title}</span>
        </div>
      )}
    </div>
  );
}

function CenterReadout({ playing }: { playing: boolean }) {
  const { meeting, player, starts } = useMeeting();
  const t = usePlayer(player, (s) => s.time);
  const turn = meeting.turns[turnIndexAt(starts, t)];
  const speaking = turn && t >= turn.start - 0.2 && t <= turn.end + 1.2;
  if (!speaking || t < 0.5) {
    return (
      <>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-fg text-abyss transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-active:scale-95">
          {playing ? <Pause size={22} weight="fill" /> : <Play size={22} weight="fill" className="ml-0.5" />}
        </span>
        <span className="display mt-3 text-[clamp(18px,2.4vw,28px)] tabular text-fg">{clock(t)}</span>
      </>
    );
  }
  const words = turn.t.split(/\s+/);
  const at = Math.floor(Math.min(1, Math.max(0, (t - turn.start) / (turn.end - turn.start))) * words.length);
  const from = Math.max(0, Math.min(at - 6, words.length - 11));
  return (
    <>
      <span className="text-[clamp(11px,1.1vw,13px)] font-semibold" style={{ color: `var(--sp-${meeting.participants.indexOf(turn.s) % 8})` }}>
        {person(turn.s).name}
      </span>
      <span className="mt-1 line-clamp-4 text-[clamp(11px,1.05vw,14px)] leading-snug">
        {words.slice(from, from + 11).map((w, i) => (
          <span key={i} className={from + i <= at ? 'text-fg' : 'text-fg-faint'}>
            {w}{' '}
          </span>
        ))}
      </span>
      <span className="mt-1.5 text-[11px] text-fg-faint tabular">{clock(t)}</span>
    </>
  );
}

/** While live, the arc being spoken grows with the clock. */
function LiveArc() {
  const { meeting, player, starts } = useMeeting();
  const t = usePlayer(player, (s) => s.time);
  const layout = useMemo(() => ringLayout(meeting.participants, meeting.talk), [meeting]);
  const turn = meeting.turns[turnIndexAt(starts, t)];
  if (!turn || t < turn.start) return null;
  const r = layout.radius.get(turn.s) ?? R_INNER;
  const a0 = angleAt(turn.start, meeting.duration);
  const a1 = Math.max(angleAt(Math.min(t, turn.end), meeting.duration), a0 + 0.02);
  const sw = layout.band * (meeting.participants.length > 5 ? 0.58 : 0.5);
  return (
    <svg viewBox="-102 -102 204 204" className="pointer-events-none absolute inset-0 h-full w-full">
      <path d={arcPath(r, a0, a1)} fill="none" stroke="var(--signal)" strokeWidth={sw + 1.4} style={{ filter: 'drop-shadow(0 0 2px rgba(235,201,92,0.8))' }} />
    </svg>
  );
}
