'use client';
import { createContext, useContext } from 'react';
import type { Player } from '@/lib/player';
import type { Highlight, Meeting } from '@/lib/types';

export type Tab = 'notes' | 'transcript' | 'actions' | 'clips' | 'ask';

export type MeetingCtx = {
  meeting: Meeting;
  player: Player;
  starts: number[];
  colorOf: (id: string) => string;
  /** Speakers the transcript is narrowed to (empty = everyone). */
  focus: string[];
  setFocus: (f: string[]) => void;
  query: string;
  setQuery: (q: string) => void;
  tab: Tab;
  setTab: (t: Tab) => void;
  highlights: Highlight[];
  createClip: (from: number, to: number, title?: string, kind?: Highlight['kind']) => Highlight;
  share: (clip?: Highlight) => void;
  /** Seek and reveal the moment in the transcript. */
  jump: (t: number, play?: boolean) => void;
  readOnly: boolean;
};

export const Ctx = createContext<MeetingCtx | null>(null);

export function useMeeting() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useMeeting outside MeetingView');
  return c;
}
