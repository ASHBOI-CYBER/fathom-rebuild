export type Person = {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
};

export type Turn = { id: number; s: string; t: string; start: number; end: number };

export type Chapter = { title: string; gist: string; start: number; end: number; firstTurn: number };

export type SummaryItem = { text: string; ref?: number; ts: number | null; owner?: string };
export type Summary = { tldr: string; sections: { heading: string; items: SummaryItem[] }[] };

export type ActionItem = {
  id: string;
  text: string;
  owner?: string;
  ref?: number;
  ts: number | null;
  due?: string;
};

export type HighlightKind = 'bookmark' | 'action' | 'quote' | 'concern';

export type Highlight = {
  id: string;
  title: string;
  kind: HighlightKind;
  by: string;
  start: number;
  end: number;
  from?: number;
  to?: number;
  createdAt?: string;
  mine?: boolean;
};

export type AskEntry = { q: string; a: string; refs: { ref: number; ts: number | null }[] };

export type Meeting = {
  id: string;
  title: string;
  startsAt: string;
  platform: 'meet' | 'zoom' | 'teams';
  kind: 'internal' | 'external';
  type: string;
  host: string;
  participants: string[];
  externalCompany: string | null;
  duration: number;
  chapters: Chapter[];
  turns: Turn[];
  talk: Record<string, number>;
  summaries: Record<string, Summary>;
  actionItems: ActionItem[];
  highlights: Highlight[];
  ask: AskEntry[];
};

export type MeetingIndex = {
  id: string;
  title: string;
  startsAt: string;
  platform: Meeting['platform'];
  kind: Meeting['kind'];
  type: string;
  host: string;
  participants: string[];
  externalCompany: string | null;
  duration: number;
  tldr: string;
  chapters: string[];
  actionCount: number;
  highlightCount: number;
  talk: Record<string, number>;
  templates: string[];
  highlights: Highlight[];
  segments: [number, number, number][];
  chapterStarts: number[];
};

/** Compact search records: turns are [id, speaker, start, text]. */
export type SearchDoc = {
  id: string;
  turns: [number, string, number, string][];
  notes: [string, number | null][];
  actions: [string, string | null, number | null][];
};
