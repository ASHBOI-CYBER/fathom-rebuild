import { initials, speakerColor } from '@/lib/people';
import { minutes } from '@/lib/format';

/** A still of the call: participant tiles the way the recording would look. */
export function Thumbnail({ participants, duration, label }: { participants: string[]; duration: number; label?: string }) {
  const shown = participants.slice(0, 8);
  const cols = shown.length <= 2 ? 2 : shown.length <= 4 ? 2 : shown.length <= 6 ? 3 : 4;
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[#050c14] ring-1 ring-line">
      <div className="grid h-full gap-1 p-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {shown.map((id) => {
          const c = speakerColor(participants, id);
          return (
            <div
              key={id}
              className="flex min-h-0 items-center justify-center rounded-md"
              style={{ background: `radial-gradient(110% 90% at 50% 25%, color-mix(in oklab, ${c} 30%, #0f1d2c), #0a1521)` }}
            >
              <span
                className="flex aspect-square w-[38%] max-w-[44px] items-center justify-center rounded-full text-[11px] font-semibold"
                style={{ background: c, color: 'var(--abyss)' }}
              >
                {initials(id)}
              </span>
            </div>
          );
        })}
      </div>
      {label && <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white/85 backdrop-blur">{label}</span>}
      <span className="absolute bottom-2 right-2 rounded-md bg-black/65 px-1.5 py-0.5 text-[12px] font-semibold text-white tabular backdrop-blur">{minutes(duration)}</span>
    </div>
  );
}
