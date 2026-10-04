'use client';
// Per-viewer state that the seed data can't hold: highlights you create, action
// items you check off or add, and your template choice per meeting. Kept in
// localStorage (this is a static demo with no backend).
import { useSyncExternalStore } from 'react';
import type { ActionItem, Highlight } from './types';
import type { RecordRule } from './calendar';

type UserState = {
  highlights: Record<string, Highlight[]>;
  done: Record<string, boolean>;
  actions: Record<string, ActionItem[]>;
  template: Record<string, string>;
  record: Record<string, boolean>;
  rule: RecordRule;
};

const KEY = 'sounding:v1';
const EMPTY: UserState = { highlights: {}, done: {}, actions: {}, template: {}, record: {}, rule: 'external' };

let state: UserState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    /* storage blocked — run in memory */
  }
}

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function update(fn: (s: UserState) => UserState) {
  load();
  state = fn(state);
  save();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  // Pick up state written before this component mounted.
  queueMicrotask(l);
  return () => {
    listeners.delete(l);
  };
}

export function useUserState<T>(select: (s: UserState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(EMPTY),
  );
}

export const userStore = {
  addHighlight(meetingId: string, h: Highlight) {
    update((s) => ({ ...s, highlights: { ...s.highlights, [meetingId]: [...(s.highlights[meetingId] || []), h] } }));
  },
  removeHighlight(meetingId: string, id: string) {
    update((s) => ({
      ...s,
      highlights: { ...s.highlights, [meetingId]: (s.highlights[meetingId] || []).filter((h) => h.id !== id) },
    }));
  },
  toggleDone(actionId: string) {
    update((s) => ({ ...s, done: { ...s.done, [actionId]: !s.done[actionId] } }));
  },
  addAction(meetingId: string, a: ActionItem) {
    update((s) => ({ ...s, actions: { ...s.actions, [meetingId]: [...(s.actions[meetingId] || []), a] } }));
  },
  setTemplate(meetingId: string, template: string) {
    update((s) => ({ ...s, template: { ...s.template, [meetingId]: template } }));
  },
  setRule(rule: RecordRule) {
    update((s) => ({ ...s, rule, record: {} }));
  },
  setRecord(eventId: string, on: boolean) {
    update((s) => ({ ...s, record: { ...s.record, [eventId]: on } }));
  },
};

const NO_HIGHLIGHTS: Highlight[] = [];
const NO_ACTIONS: ActionItem[] = [];
export const selectHighlights = (id: string) => (s: UserState) => s.highlights[id] || NO_HIGHLIGHTS;
export const selectActions = (id: string) => (s: UserState) => s.actions[id] || NO_ACTIONS;
