import { firstName, speakerColor } from '@/lib/people';

/** Share of talk time as one segmented bar, ordered loudest first. */
export function TalkBar({ talk, participants, height = 6, className = '' }: { talk: Record<string, number>; participants: string[]; height?: number; className?: string }) {
  const total = Object.values(talk).reduce((a, b) => a + b, 0) || 1;
  const rows = Object.entries(talk).sort((a, b) => b[1] - a[1]);
  return (
    <div
      className={`flex w-full overflow-hidden rounded-full bg-rule-soft ${className}`}
      style={{ height }}
      role="img"
      aria-label={`Talk time: ${rows.map(([id, s]) => `${firstName(id)} ${Math.round((100 * s) / total)}%`).join(', ')}`}
    >
      {rows.map(([id, s]) => (
        <span key={id} className="talk-seg block h-full origin-left" style={{ width: `${(100 * s) / total}%`, background: speakerColor(participants, id) }} />
      ))}
    </div>
  );
}
