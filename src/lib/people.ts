import peopleData from '@/data/generated/people.json';
import type { Person } from './types';

export const PEOPLE: Person[] = peopleData as Person[];
const byId = new Map(PEOPLE.map((p) => [p.id, p]));

/** The signed-in demo user. */
export const ME = 'asher';

export function person(id: string | undefined | null): Person {
  return (
    (id && byId.get(id)) || { id: id ?? '?', name: id ?? 'Unknown', title: '', company: '', email: '' }
  );
}

export const firstName = (id: string) => person(id).name.split(' ')[0];

export const initials = (id: string) =>
  person(id)
    .name.split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

/** Speaker colour by position in the meeting, so 8 people never collide. */
export function speakerColor(participants: string[], id: string) {
  const i = participants.indexOf(id);
  return `var(--sp-${(i < 0 ? 6 : i) % 8})`;
}
