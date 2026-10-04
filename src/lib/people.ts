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

/**
 * One colour per person, everywhere. The eight Tandem regulars each own a hue;
 * guests borrow one that nobody else in their meetings is using.
 */
const COLOR: Record<string, number> = {
  asher: 0, maya: 1, daniel: 2, tom: 3, priya: 4, sofia: 5, kenji: 6, ravi: 7,
  marcus: 5, elena: 7, jordan: 3, aisha: 1, sam: 2, leah: 5, hannah: 6,
};
export const colorIndex = (id: string) => COLOR[id] ?? 6;
export const personColor = (id: string) => `var(--sp-${colorIndex(id)})`;

/** Kept for call sites that pass the meeting's participants; colour no longer depends on them. */
export function speakerColor(_participants: string[], id: string) {
  return personColor(id);
}
