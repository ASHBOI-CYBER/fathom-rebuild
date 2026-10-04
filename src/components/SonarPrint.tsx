import { useMemo } from 'react';
import { colorIndex } from '@/lib/people';
import { R_INNER, R_OUTER, angleAt, arcPath, polar, ringLayout, type Segment } from '@/lib/sonar';

type Props = {
  participants: string[];
  talk: Record<string, number>;
  duration: number;
  segments: Segment[];
  chapterStarts?: number[];
  /** Fine detail (minute ticks, chapter lines) for large renderings. */
  detail?: boolean;
  dim?: string[];
  /** Single-tone silhouette for small sizes, where eight hues turn to confetti. */
  mono?: boolean;
  className?: string;
  title?: string;
};

/**
 * A meeting's fingerprint. Each ring is one person (loudest outermost), each
 * arc is when they spoke, clockwise from twelve. No two meetings look alike,
 * because no two meetings went alike.
 */
export function SonarPrint({ participants, talk, duration, segments, chapterStarts = [], detail = false, dim = [], mono = false, className = '', title }: Props) {
  const layout = useMemo(() => ringLayout(participants, talk), [participants, talk]);

  const arcs = useMemo(() => {
    const minSweep = (Math.PI / 180) * 0.7;
    return segments.map(([sp, s, e], i) => {
      const id = participants[sp];
      const r = layout.radius.get(id) ?? R_INNER;
      const a0 = angleAt(s, duration);
      const a1 = Math.max(angleAt(e, duration), a0 + minSweep);
      const ring = layout.order.indexOf(id) / Math.max(1, layout.order.length - 1);
      return { key: i, id, sp, ring, d: arcPath(r, a0, a1) };
    });
  }, [segments, participants, duration, layout]);

  const ticks = useMemo(() => {
    const out: { d: string; major: boolean }[] = [];
    const minutes = Math.floor(duration / 60);
    const step = detail ? 1 : 5;
    for (let m = 0; m <= minutes; m += step) {
      const a = angleAt(m * 60, duration);
      const major = m % 15 === 0;
      const r0 = R_OUTER + 2.5;
      const r1 = R_OUTER + (major ? 7 : m % 5 === 0 ? 4.5 : 3.2);
      const [x0, y0] = polar(r0, a);
      const [x1, y1] = polar(r1, a);
      out.push({ d: `M${x0.toFixed(2)} ${y0.toFixed(2)}L${x1.toFixed(2)} ${y1.toFixed(2)}`, major });
    }
    return out;
  }, [duration, detail]);

  const sw = layout.band * (participants.length > 5 ? 0.58 : 0.5);

  return (
    <svg viewBox="-102 -102 204 204" className={className} role="img" aria-label={title ?? `Who spoke when, ${participants.length} people`}>
      {/* the empty tracks */}
      {layout.order.map((id) => (
        <circle key={id} r={layout.radius.get(id)} fill="none" stroke="var(--fg)" strokeOpacity={0.05} strokeWidth={sw} />
      ))}
      <circle r={R_INNER - 3} fill="none" stroke="var(--fg)" strokeOpacity={0.12} strokeWidth={0.4} />
      {/* minute ticks around the rim */}
      {ticks.map((t, i) => (
        <path key={i} d={t.d} stroke="var(--fg)" strokeOpacity={t.major ? 0.55 : 0.2} strokeWidth={t.major ? 0.9 : 0.5} strokeLinecap="round" />
      ))}
      {/* chapter boundaries */}
      {detail &&
        chapterStarts.slice(1).map((s) => {
          const a = angleAt(s, duration);
          const [x0, y0] = polar(R_INNER - 2, a);
          const [x1, y1] = polar(R_OUTER + 1.5, a);
          return <path key={s} d={`M${x0} ${y0}L${x1} ${y1}`} stroke="var(--fg)" strokeOpacity={0.16} strokeWidth={0.45} strokeDasharray="1.2 1.6" />;
        })}
      {/* speech */}
      {arcs.map((a) => (
        <path
          key={a.key}
          d={a.d}
          fill="none"
          stroke={mono ? (a.ring === 1 ? 'var(--signal)' : 'var(--fg)') : `var(--sp-${colorIndex(a.id)})`}
          strokeWidth={mono ? sw * 1.15 : sw}
          strokeLinecap="butt"
          opacity={dim.length && !dim.includes(a.id) ? 0.14 : mono ? (a.ring === 1 ? 0.95 : 0.16 + 0.3 * a.ring) : 0.92}
        />
      ))}
    </svg>
  );
}
