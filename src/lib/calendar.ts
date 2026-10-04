// Stubbed calendar connection: upcoming events are generated relative to today so the
// demo always has a future. The record rule mirrors Fathom's auto-record setting.
export type CalEvent = {
  id: string;
  title: string;
  start: Date;
  minutes: number;
  platform: 'meet' | 'zoom' | 'teams';
  attendees: string[];
  external: boolean;
  organizer: string;
};

export type RecordRule = 'all' | 'external' | 'hosted' | 'none';

export const RULE_LABEL: Record<RecordRule, string> = {
  all: 'All meetings with a video link',
  external: 'Meetings with people outside Tandem, plus ones I organize',
  hosted: 'Only meetings I organize',
  none: 'Nothing automatically',
};

function at(daysFromNow: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  // Skip weekends so the calendar looks like a work week.
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function upcomingEvents(): CalEvent[] {
  const events: CalEvent[] = [
    { id: 'ev-standup', title: 'Routing squad — daily stand-up', start: at(1, 9, 30), minutes: 15, platform: 'meet', attendees: ['maya', 'daniel', 'kenji', 'ravi', 'priya'], external: false, organizer: 'maya' },
    { id: 'ev-tom', title: 'Asher / Tom — Harbor & Pine scope reset', start: at(1, 11), minutes: 30, platform: 'meet', attendees: ['asher', 'tom'], external: false, organizer: 'asher' },
    { id: 'ev-hp-pilot', title: 'Harbor & Pine — Pilot proposal review', start: at(1, 14), minutes: 45, platform: 'zoom', attendees: ['tom', 'asher', 'marcus', 'elena'], external: true, organizer: 'tom' },
    { id: 'ev-sam', title: 'Final round: Sam Rivera', start: at(2, 10), minutes: 45, platform: 'zoom', attendees: ['asher', 'maya', 'sam'], external: true, organizer: 'hannah' },
    { id: 'ev-brightside', title: 'Brightside — Q4 roadmap & live ETA date', start: at(3, 12), minutes: 30, platform: 'teams', attendees: ['sofia', 'asher', 'jordan'], external: true, organizer: 'sofia' },
    { id: 'ev-v0', title: 'Live ETA v0 — tech design review', start: at(3, 15), minutes: 60, platform: 'meet', attendees: ['asher', 'maya', 'daniel', 'priya', 'kenji', 'ravi'], external: false, organizer: 'daniel' },
  ];
  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function ruleRecords(rule: RecordRule, e: CalEvent, me: string) {
  if (rule === 'all') return true;
  if (rule === 'external') return e.external || e.organizer === me;
  if (rule === 'hosted') return e.organizer === me;
  return false;
}
