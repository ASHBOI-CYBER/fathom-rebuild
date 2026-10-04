// Geometry for the sonar print: a meeting drawn as a dial. Time runs clockwise
// from twelve o'clock; each ring is one person; each arc is a stretch of speech.

export const R_OUTER = 92;
export const R_INNER = 34;

export type Segment = [speaker: number, start: number, end: number];

export const angleAt = (t: number, duration: number) => -Math.PI / 2 + (2 * Math.PI * t) / duration;

export function polar(r: number, a: number): [number, number] {
  return [r * Math.cos(a), r * Math.sin(a)];
}

export function arcPath(r: number, a0: number, a1: number) {
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/** Rings ordered loudest-outermost, so the dial's silhouette is its dominant voices. */
export function ringLayout(participants: string[], talk: Record<string, number>) {
  const order = [...participants].sort((a, b) => (talk[a] || 0) - (talk[b] || 0));
  const band = (R_OUTER - R_INNER) / Math.max(order.length, 1);
  const radius = new Map(order.map((id, i) => [id, R_INNER + band * (i + 0.5)]));
  return { radius, band, order };
}

/** Which ring (speaker) sits at radius r, or null between/outside rings. */
export function speakerAtRadius(r: number, layout: ReturnType<typeof ringLayout>) {
  if (r < R_INNER || r > R_OUTER) return null;
  const i = Math.floor((r - R_INNER) / layout.band);
  return layout.order[Math.min(i, layout.order.length - 1)] ?? null;
}
