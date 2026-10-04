import { initials, person } from '@/lib/people';

export function Avatar({ id, color, size = 28, ring = false }: { id: string; color: string; size?: number; ring?: boolean }) {
  return (
    <span
      title={person(id).name}
      className="inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: Math.round(size * 0.38),
        boxShadow: ring ? '0 0 0 2px var(--paper)' : undefined,
      }}
    >
      {initials(id)}
    </span>
  );
}

export function AvatarStack({ ids, colorOf, size = 24, max = 5 }: { ids: string[]; colorOf: (id: string) => string; size?: number; max?: number }) {
  const shown = ids.slice(0, max);
  const extra = ids.length - shown.length;
  return (
    <span className="flex items-center">
      {shown.map((id, i) => (
        <span key={id} style={{ marginLeft: i ? -size * 0.3 : 0 }}>
          <Avatar id={id} color={colorOf(id)} size={size} ring />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="ml-1 text-xs font-medium text-ink-soft tabular"
          aria-label={`and ${extra} more`}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
