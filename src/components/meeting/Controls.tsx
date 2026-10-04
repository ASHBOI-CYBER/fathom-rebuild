'use client';
import { Pause, Play, RotateCcw, RotateCw, Scissors } from 'lucide-react';
import { clock } from '@/lib/format';
import { usePlayer } from '@/lib/player';
import { toast } from '../Toast';
import { useMeeting } from './context';

const RATES = [1, 1.25, 1.5, 2];

export function Controls() {
  const { player, createClip, readOnly, setTab } = useMeeting();
  const playing = usePlayer(player, (s) => s.playing);
  const time = usePlayer(player, (s) => Math.floor(s.time));
  const duration = usePlayer(player, (s) => s.duration);
  const bounds = usePlayer(player, (s) => s.bounds);
  const rate = usePlayer(player, (s) => s.rate);

  const clipLast = () => {
    const t = player.get().time;
    const h = createClip(Math.max(0, t - 30), Math.max(t, 5));
    toast(`Clipped ${clock(h.start)}–${clock(h.end)}`);
    setTab('clips');
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={() => player.toggle()}
        aria-label={playing ? 'Pause' : 'Play'}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white transition-transform hover:scale-105"
      >
        {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-0.5" fill="currentColor" />}
      </button>
      <button onClick={() => player.skip(-10)} aria-label="Back 10 seconds" className="rounded-full p-2 text-ink-soft hover:bg-shoal hover:text-ink">
        <RotateCcw size={18} />
      </button>
      <button onClick={() => player.skip(10)} aria-label="Forward 10 seconds" className="rounded-full p-2 text-ink-soft hover:bg-shoal hover:text-ink">
        <RotateCw size={18} />
      </button>
      <span className="ml-1 text-[14px] text-ink-soft tabular">
        <span className="font-semibold text-ink">{clock(time)}</span> / {clock(bounds ? bounds[1] : duration)}
      </span>
      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => player.setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])}
          aria-label={`Playback speed ${rate}x`}
          className="min-w-[52px] rounded-full border border-rule px-2.5 py-1 text-[13px] font-semibold tabular hover:border-ink-faint"
        >
          {rate}×
        </button>
        {!readOnly && (
          <button
            onClick={clipLast}
            title="Save the last 30 seconds as a clip (C)"
            className="flex items-center gap-1.5 rounded-full border border-magenta/40 bg-magenta-wash px-3 py-1 text-[13px] font-semibold text-magenta-deep hover:border-magenta"
          >
            <Scissors size={14} /> Clip last 30s
          </button>
        )}
      </div>
    </div>
  );
}
