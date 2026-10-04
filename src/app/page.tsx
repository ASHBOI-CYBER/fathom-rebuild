import type { Metadata } from 'next';
import { Calm } from '@/components/landing/Calm';
import { Faq } from '@/components/landing/Faq';
import { Hero } from '@/components/landing/Hero';
import { LandingNav } from '@/components/landing/LandingNav';
import { Metrics, Surfacing } from '@/components/landing/Metrics';
import { Pricing } from '@/components/landing/Pricing';
import { Product } from '@/components/landing/Product';
import { Quotes } from '@/components/landing/Quotes';
import { Signal } from '@/components/landing/Signal';
import type { Quote, StreamLine } from '@/components/landing/types';
import { getIndex, getMeeting } from '@/lib/data';
import { person } from '@/lib/people';
import type { Meeting } from '@/lib/types';

export const metadata: Metadata = {
  title: { absolute: 'Sounding · Nothing said gets lost' },
  description: 'Sounding sits in on your calls, writes down every word with a name on it, and draws the whole conversation as one picture.',
};

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** First sentence or two of a turn, kept under a line and a half. */
function trim(text: string, max = 118) {
  const parts = text.match(/[^.!?]+[.!?]+["”’]?\s*/g) ?? [text];
  let out = '';
  for (const p of parts) {
    if (out && (out + p).length > max) break;
    out += p;
  }
  return out.trim();
}

// Lines said in the demo calls, picked for the marquee. [meeting, words to find]
const PICKS: [string, string][] = [
  ['q4-planning', 'We decide on the default by end of January.'],
  ['harbor-pine-demo', 'Yes. Send that.'],
  ['incident-retro', 'Is there an alert on worker retry rate?'],
  ['harbor-pine-discovery', "That's the critical path, honestly."],
  ['brightside-qbr', 'My CFO will ask the exact same thing.'],
  ['onboarding-design-review', "Ghost driver. That's good, I'm stealing that."],
  ['launch-sync', "That number's real, right?"],
  ['harbor-pine-demo', 'He said two minutes, which means five.'],
  ['incident-retro', 'Anyone want to push back on an owner or a date?'],
  ['onboarding-design-review', 'Could the fleet decide?'],
  ['harbor-pine-discovery', 'Okay, October 30.'],
  ['q4-planning', "That's the slide I want in every deck."],
];

export default function Landing() {
  const index = getIndex();
  const meetings = index.map((m) => getMeeting(m.id)).filter(Boolean) as Meeting[];
  const byId = new Map(meetings.map((m) => [m.id, m]));
  const hero = index.find((m) => m.id === 'q4-planning') ?? index[0];
  const q4 = byId.get(hero.id)!;

  const quotes: Quote[] = PICKS.flatMap(([id, find]) => {
    const m = byId.get(id);
    const t = m?.turns.find((x) => x.t.includes(find));
    if (!m || !t) return [];
    const at = t.t.indexOf(find);
    // the sentence that holds the find, plus what follows it in the same breath
    const text = trim(t.t.slice(at), 96);
    return [{ text, speaker: t.s, name: person(t.s).name, meeting: m.title.split(':')[0], meetingId: m.id, start: Math.floor(t.start), at: mmss(t.start) }];
  });

  const lines: StreamLine[] = q4.turns
    .filter((t) => t.id >= 61 && t.id <= 80)
    .map((t) => ({ id: t.id, speaker: t.s, name: person(t.s).name.split(' ')[0], text: t.id === 72 ? 'Harbor & Pine is basically all loading docks. Regional freight. Every stop is a dock.' : trim(t.t), at: mmss(t.start) }));
  const clipTurns = q4.turns.filter((t) => t.id === 72 || t.id === 73);
  const clipSeconds = Math.round(clipTurns[clipTurns.length - 1].end - clipTurns[0].start);

  const stats = {
    words: meetings.reduce((a, m) => a + m.turns.reduce((b, t) => b + t.t.split(/\s+/).length, 0), 0),
    actions: meetings.reduce((a, m) => a + m.actionItems.length, 0),
    seconds: meetings.reduce((a, m) => a + m.duration, 0),
    turns: meetings.reduce((a, m) => a + m.turns.length, 0),
    calls: meetings.length,
  };

  return (
    <div className="landing" id="top">
      <LandingNav />
      <main className="overflow-x-clip">
        <Hero meeting={hero} />
        <Quotes quotes={quotes} />
        <Signal lines={lines} hit={72} clip={[72, 73]} query="docks" title={`${q4.title.split(':')[0]} · Tandem · ${q4.participants.length} people`} clipLength={`${clipSeconds} seconds`} />
        <Metrics stats={stats} />
        <Surfacing />
        <Product meetingId={hero.id} />
        <Pricing />
        <Faq />
        <Calm />
      </main>
    </div>
  );
}
