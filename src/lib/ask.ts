import type { AskEntry, Meeting, Turn } from './types';
import { person } from './people';

const STOP = new Set(
  'a an the and or but if of to in on at for with about from by is are was were be been being do does did what who whom which when where why how this that these those it its we our you your they their he she him her them i me my there here have has had will would should could can just so than then any all some into over under up down out not no yes say said tell told meeting call'.split(
    ' ',
  ),
);

const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, '');
const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9$%\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map(stem);

export type Answer =
  | { kind: 'prepared'; entry: AskEntry }
  | { kind: 'quotes'; intro: string; turns: Turn[] }
  | { kind: 'none' };

/**
 * Answer a question about one meeting. Prepared answers (written by an AI model
 * at seed time) win when the question is close to one; otherwise fall back to
 * retrieving the most relevant lines from the transcript, quoted with timestamps.
 */
export function answer(q: string, meeting: Meeting): Answer {
  const qw = new Set(words(q));
  if (!qw.size) return { kind: 'none' };

  let best: AskEntry | null = null;
  let bestScore = 0;
  for (const e of meeting.ask) {
    const ew = new Set(words(e.q));
    const inter = [...qw].filter((w) => ew.has(w)).length;
    const score = inter / Math.max(2, Math.min(qw.size, ew.size));
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  if (best && bestScore >= 0.6) return { kind: 'prepared', entry: best };

  // Person-scoped question: "what did Tom say about pricing?"
  const named = meeting.participants.find((p) => qw.has(stem(person(p).name.split(' ')[0].toLowerCase())));
  const topic = [...qw].filter((w) => !named || w !== stem(person(named).name.split(' ')[0].toLowerCase()));

  const scored = meeting.turns
    .filter((t) => !named || t.s === named)
    .map((t) => {
      const tw = words(t.t);
      const set = new Set(tw);
      const hits = topic.filter((w) => set.has(w)).length;
      return { t, score: hits + (hits ? Math.min(tw.length, 80) / 400 : 0) };
    })
    .filter((x) => x.score >= (topic.length > 1 ? 1 : 0.9) || (named && !topic.length))
    .sort((a, b) => b.score - a.score);

  // Keep the top lines but avoid three quotes from the same exchange.
  const picked: Turn[] = [];
  for (const { t } of scored) {
    if (picked.every((p) => Math.abs(p.start - t.start) > 45)) picked.push(t);
    if (picked.length === 3) break;
  }
  if (!picked.length) return { kind: 'none' };
  picked.sort((a, b) => a.start - b.start);
  const intro = named
    ? `Here is what ${person(named).name.split(' ')[0]} said that matches your question:`
    : `This came up ${picked.length === 1 ? 'once' : `in ${picked.length} places`} in the call:`;
  return { kind: 'quotes', intro, turns: picked };
}
