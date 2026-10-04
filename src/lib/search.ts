import type { MeetingIndex, SearchDoc } from './types';

export type Hit = {
  meetingId: string;
  kind: 'said' | 'note' | 'action';
  speaker: string | null;
  ts: number | null;
  text: string;
  turnId?: number;
  score: number;
};

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

export function terms(q: string) {
  return norm(q)
    .split(/[^a-z0-9$%.:&'-]+/)
    .map((t) => t.replace(/^[^a-z0-9$]+|[^a-z0-9%]+$/g, ''))
    .filter((t) => t.length > 1);
}

const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Terms match at the start of a word: "eta" finds "ETAs", "live" doesn't find "delivery".
const wordStart = (t: string) => new RegExp(`(^|[^a-z0-9])${esc(t)}`);

/** True when every query term starts a word in `text`. */
export function matchesAll(text: string, ts: string[]) {
  const n = norm(text);
  return ts.every((t) => wordStart(t).test(n));
}

function scoreText(text: string, phrase: string, ts: string[]) {
  const n = norm(text);
  if (!matchesAll(text, ts)) return 0;
  let s = 1;
  if (phrase.length > 2 && n.includes(phrase)) s += 3;
  // Prefer whole-word matches over prefixes.
  for (const t of ts) if (new RegExp(`(^|[^a-z0-9])${esc(t)}($|[^a-z0-9])`).test(n)) s += 0.5;
  return s;
}

/** Full-text search across every meeting; returns hits grouped and ranked per meeting. */
export function searchAll(q: string, docs: SearchDoc[], index: MeetingIndex[], speaker?: string | null) {
  const ts = terms(q);
  if (!ts.length) return [];
  const phrase = norm(q.trim());
  const byMeeting = new Map<string, Hit[]>();
  for (const d of docs) {
    const hits: Hit[] = [];
    for (const [id, s, start, text] of d.turns) {
      if (speaker && s !== speaker) continue;
      const sc = scoreText(text, phrase, ts);
      if (sc) hits.push({ meetingId: d.id, kind: 'said', speaker: s, ts: start, text, turnId: id, score: sc });
    }
    if (!speaker) {
      for (const [text, t] of d.notes) {
        const sc = scoreText(text, phrase, ts);
        if (sc) hits.push({ meetingId: d.id, kind: 'note', speaker: null, ts: t, text, score: sc + 0.75 });
      }
      for (const [text, owner, t] of d.actions) {
        const sc = scoreText(text, phrase, ts);
        if (sc) hits.push({ meetingId: d.id, kind: 'action', speaker: owner, ts: t, text, score: sc + 1 });
      }
    }
    // Same note text appears in several templates; keep one.
    const seen = new Set<string>();
    const unique = hits.filter((h) => (seen.has(h.kind + h.text) ? false : (seen.add(h.kind + h.text), true)));
    if (unique.length) byMeeting.set(d.id, unique.sort((a, b) => b.score - a.score || (a.ts ?? 0) - (b.ts ?? 0)));
  }
  const meta = new Map(index.map((m) => [m.id, m]));
  return [...byMeeting.entries()]
    .map(([id, hits]) => ({ meeting: meta.get(id)!, hits, top: hits[0].score * 2 + Math.min(hits.length, 8) / 4 }))
    .filter((g) => g.meeting)
    .sort((a, b) => b.top - a.top || b.meeting.startsAt.localeCompare(a.meeting.startsAt));
}

/** Split text into parts with matched terms flagged, for <mark> rendering. */
export function markParts(text: string, q: string) {
  const ts = terms(q);
  if (!ts.length) return [{ t: text, m: false }];
  const re = new RegExp(`(?<![A-Za-z0-9])(${ts.map(esc).join('|')})`, 'gi');
  return text.split(re).filter(Boolean).map((t) => ({ t, m: ts.includes(norm(t)) }));
}

/** Trim long text to a window around the first match. */
export function snippet(text: string, q: string, radius = 90) {
  const ts = terms(q);
  const n = norm(text);
  const i = ts.length ? Math.max(0, Math.min(...ts.map((t) => (n.indexOf(t) < 0 ? Infinity : n.indexOf(t))))) : 0;
  if (!isFinite(i) || text.length <= radius * 2) return text;
  const start = Math.max(0, i - radius);
  const end = Math.min(text.length, i + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}
