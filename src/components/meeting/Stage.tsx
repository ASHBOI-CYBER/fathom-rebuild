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
  const t = usePlayer(player, (s) => s.time);
  const speaking = turn && t >= turn.start && t <= turn.end + 0.4 ? turn.s : null;
  const n = meeting.participants.length;
  const cols = n <= 2 ? 2 : n <= 4 ? 2 : n <= 6 ? 3 : 4;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#0b1a2a] select-none" onClick={() => player.toggle()}>
      <div className="grid h-full gap-1.5 p-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {meeting.participants.map((id) => (
          <Tile key={id} id={id} active={speaking === id} playing={playing} color={`var(--sp-${meeting.participants.indexOf(id) % 8})`} />
        ))}
      </div>
      <Captions idx={idx} />
      {!playing && t < 0.5 && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0b1a2a]/40">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-ink shadow-xl">
            <Play size={26} className="ml-1" fill="currentColor" />
          </span>
        </div>
      )}
      <span className="absolute left-2.5 top-2.5 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white/75">Simulated playback</span>
    </div>
  );
}

const Tile = memo(function Tile({ id, active, playing, color }: { id: string; active: boolean; playing: boolean; color: string }) {
  return (
    <div
      className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-lg transition-shadow duration-200"
      style={{
        background: `radial-gradient(120% 90% at 50% 30%, color-mix(in oklab, ${color} 38%, #13283d), #0f2033)`,
        boxShadow: active ? 'inset 0 0 0 3px #e0569a' : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <span
        className="flex aspect-square w-[34%] max-w-[84px] items-center justify-center rounded-full font-semibold text-white"
        style={{ background: color, fontSize: 'clamp(11px, 2.2vw, 26px)' }}
      >
        {initials(id)}
      </span>
      <span className="absolute bottom-1.5 left-2 flex max-w-[85%] items-center gap-1.5 truncate rounded bg-black/35 px-1.5 py-0.5 text-[11px] text-white/90">
        {active && playing && (
          <span className="flex h-2.5 items-end gap-[2px]" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="voice-bar w-[2px] rounded-full bg-[#f2a5c9]" style={{ animationDelay: `${i * 120}ms` }} />
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
  // Show a rolling window of about two caption lines.
  const from = Math.max(0, Math.min(at - 9, words.length - 18));
  const shown = words.slice(from, from + 18);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[12%] flex justify-center px-4">
      <p className="max-w-[86%] rounded-md bg-black/65 px-3 py-1.5 text-center text-[clamp(11px,1.5vw,16px)] leading-snug text-white">
        <span className="mr-1.5 font-semibold text-[#f2a5c9]">{person(turn.s).name.split(' ')[0]}</span>
        {shown.map((w, i) => (
          <span key={i} className={from + i <= at ? 'text-white' : 'text-white/45'}>
            {w}{' '}
          </span>
        ))}
      </p>
    </div>
  );
}
