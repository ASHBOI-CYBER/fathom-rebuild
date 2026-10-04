'use client';
import { memo } from 'react';
import { Play } from 'lucide-react';
import { initials, person } from '@/lib/people';
import { turnIndexAt, usePlayer } from '@/lib/player';
import { useMeeting } from './context';

/**
 * Stand-in for the recording. The capture layer is stubbed, so instead of video
 * we render the call the way it looked: participant tiles, the active speaker
 * lit, and live captions driven by the transcript timings.
 */
export function Stage() {
  const { meeting, player, starts } = useMeeting();
  const idx = usePlayer(player, (s) => turnIndexAt(starts, s.time));
  const playing = usePlayer(player, (s) => s.playing);
  const turn = meeting.turns[idx];
  const speaking = usePlayer(player, (s) => (turn && s.time >= turn.start && s.time <= turn.end + 0.4 ? turn.s : null));
  const atStart = usePlayer(player, (s) => s.time < 0.5);
  const n = meeting.participants.length;
  const cols = n <= 2 ? 2 : n <= 4 ? 2 : n <= 6 ? 3 : 4;

  return (
    <div
      className="relative aspect-video w-full cursor-pointer select-none overflow-hidden rounded-2xl bg-[#050c14] ring-1 ring-line"
      onClick={() => player.toggle()}
      role="button"
      aria-label={playing ? 'Pause recording' : 'Play recording'}
    >
      <div className="grid h-full gap-1.5 p-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {meeting.participants.map((id, i) => (
          <Tile key={id} id={id} active={speaking === id} playing={playing} color={`var(--sp-${i % 8})`} />
        ))}
      </div>
      <Captions idx={idx} />
      {!playing && atStart && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white text-abyss shadow-2xl">
            <Play size={28} className="ml-1" fill="currentColor" />
          </span>
        </div>
      )}
      <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white/70 backdrop-blur">Simulated playback</span>
    </div>
  );
}

const Tile = memo(function Tile({ id, active, playing, color }: { id: string; active: boolean; playing: boolean; color: string }) {
  return (
    <div
      className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-xl transition-shadow duration-200"
      style={{
        background: `radial-gradient(120% 95% at 50% 25%, color-mix(in oklab, ${color} 26%, #0f1d2c), #0a1521)`,
        boxShadow: active ? 'inset 0 0 0 3px var(--coral)' : 'inset 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      <span
        className="flex aspect-square w-[32%] max-w-[88px] items-center justify-center rounded-full font-semibold"
        style={{ background: color, color: 'var(--abyss)', fontSize: 'clamp(11px, 2vw, 26px)' }}
      >
        {initials(id)}
      </span>
      <span className="absolute bottom-2 left-2 flex max-w-[85%] items-center gap-1.5 truncate rounded-md bg-black/45 px-2 py-0.5 text-[12px] text-white/90">
        {active && playing && (
          <span className="flex h-2.5 items-end gap-[2px]" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="voice-bar w-[2px] rounded-full bg-coral" style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </span>
        )}
        <span className="truncate">{person(id).name}</span>
      </span>
    </div>
  );
});

function Captions({ idx }: { idx: number }) {
  const { meeting, player } = useMeeting();
  const turn = meeting.turns[idx];
  const t = usePlayer(player, (s) => s.time);
  if (!turn || t < turn.start - 0.2 || t > turn.end + 1.2) return null;
  const words = turn.t.split(/\s+/);
  const progress = Math.min(1, Math.max(0, (t - turn.start) / (turn.end - turn.start)));
  const at = Math.floor(progress * words.length);
  // A rolling window of about two caption lines.
  const from = Math.max(0, Math.min(at - 9, words.length - 18));
  const shown = words.slice(from, from + 18);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[9%] flex justify-center px-4">
      <p className="max-w-[86%] rounded-lg bg-black/75 px-3.5 py-2 text-center text-[clamp(12px,1.5vw,17px)] leading-snug text-white">
        <span className="mr-1.5 font-semibold text-coral">{person(turn.s).name.split(' ')[0]}</span>
        {shown.map((w, i) => (
          <span key={i} className={from + i <= at ? 'text-white' : 'text-white/40'}>
            {w}{' '}
          </span>
        ))}
      </p>
    </div>
  );
}
