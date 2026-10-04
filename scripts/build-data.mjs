#!/usr/bin/env node
// Compile authored meetings (data/source) into timed app data (src/data/generated).
// The "capture layer" is stubbed: instead of a recording, each turn gets timing from
// its word count and a per-speaker speaking rate, which drives the synthetic player.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'data', 'source');
const OUT = path.join(ROOT, 'src', 'data', 'generated');

const people = JSON.parse(fs.readFileSync(path.join(SRC, 'people.json'), 'utf8'));

// Stable small hash so timing is deterministic between builds.
const hash = (s) => {
  let h = 2166136261;
  for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967295;
};
const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const round = (n) => Math.round(n * 10) / 10;
// Display copy uses plain punctuation: em/en dashes become a colon in titles
// and a comma in prose. Ranges keep their meaning ("8–8.5%" -> "8-8.5%",
// "14:12–14:59" -> "14:12-14:59"). Transcripts stay verbatim.
const ranges = (s) => s.replace(/([0-9][0-9%.:]*[a-zA-Z%]*)\s*[–—]\s*(?=[$~0-9])/g, '$1-');
const title = (s) => ranges(s).replace(/\s*[—–]\s*/g, s.includes(':') ? ', ' : ': ');
const prose = (s) => ranges(s).replace(/\s+[—–]\s+/g, ', ').replace(/\s*[—–]\s*/g, ', ');

function compile(id) {
  const dir = path.join(SRC, 'meetings', id);
  const meeting = JSON.parse(fs.readFileSync(path.join(dir, 'meeting.json'), 'utf8'));
  const rawChapters = meeting.transcriptFiles.flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));

  let clock = 2.5; // a beat of silence before the first words
  const turns = [];
  const chapters = [];
  for (const ch of rawChapters) {
    const start = clock;
    for (const t of ch.turns) {
      const wps = 2.3 + hash(t.s) * 0.45; // 138–165 wpm per speaker
      const w = wordCount(t.t);
      const dur = Math.max(0.9, w / wps);
      const gap = 0.25 + hash(`${id}:${t.id}`) * 0.75;
      turns.push({ id: t.id, s: t.s, t: t.t, start: round(clock), end: round(clock + dur) });
      clock += dur + gap;
    }
    chapters.push({ title: title(ch.title), gist: prose(ch.gist), start: round(start), end: round(clock), firstTurn: ch.turns[0].id });
  }
  const duration = Math.ceil(clock + 2);
  const byId = new Map(turns.map((t) => [t.id, t]));
  const at = (ref) => (byId.has(ref) ? byId.get(ref).start : null);

  const talk = {};
  for (const t of turns) talk[t.s] = round((talk[t.s] || 0) + (t.end - t.start));

  const summaries = {};
  for (const [tid, s] of Object.entries(meeting.summaries)) {
    summaries[tid] = {
      tldr: prose(s.tldr),
      sections: s.sections.map((sec) => ({
        heading: title(sec.heading),
        items: sec.items.map((it) => ({ ...it, text: prose(it.text), ts: at(it.ref) })),
      })),
    };
  }

  const full = {
    id,
    title: title(meeting.title),
    startsAt: meeting.startsAt,
    platform: meeting.platform,
    kind: meeting.kind,
    type: meeting.type,
    host: meeting.host,
    participants: meeting.participants,
    externalCompany: meeting.externalCompany ?? null,
    duration,
    chapters,
    turns,
    talk,
    summaries,
    actionItems: (meeting.actionItems || []).map((a, i) => ({ id: `${id}-a${i + 1}`, ...a, text: prose(a.text), ts: at(a.ref) })),
    highlights: (meeting.highlights || []).map((h, i) => ({
      id: `${id}-h${i + 1}`,
      title: title(h.title),
      kind: h.kind,
      by: h.by ?? meeting.host,
      start: byId.get(h.from).start,
      end: byId.get(h.to).end,
      from: h.from,
      to: h.to,
    })),
    ask: (meeting.ask || []).map((q) => ({ ...q, a: prose(q.a), refs: (q.refs || []).map((r) => ({ ref: r, ts: at(r) })) })),
  };

  const index = {
    id,
    title: full.title,
    startsAt: full.startsAt,
    platform: full.platform,
    kind: full.kind,
    type: full.type,
    host: full.host,
    participants: full.participants,
    externalCompany: full.externalCompany,
    duration,
    tldr: summaries.general?.tldr ?? '',
    chapters: chapters.map((c) => c.title),
    actionCount: full.actionItems.length,
    highlightCount: full.highlights.length,
    talk,
    templates: Object.keys(summaries),
    highlights: full.highlights.map(({ id, title, kind, by, start, end }) => ({ id, title, kind, by, start, end })),
    // Compact speech segments for the sonar prints and the seabed: [speaker index, start, end] in seconds.
    segments: turns.map((t) => [full.participants.indexOf(t.s), Math.round(t.start), Math.round(t.end)]),
    chapterStarts: chapters.map((c) => Math.round(c.start)),
  };

  const search = {
    id,
    turns: turns.map((t) => [t.id, t.s, t.start, t.t]),
    notes: Object.values(summaries).flatMap((s) => s.sections.flatMap((sec) => sec.items.map((it) => [it.text, it.ts]))),
    actions: full.actionItems.map((a) => [a.text, a.owner ?? null, a.ts]),
  };
  return { full, index, search };
}

const meetingsDir = path.join(SRC, 'meetings');
const ids = fs
  .readdirSync(meetingsDir)
  .filter((d) => fs.existsSync(path.join(meetingsDir, d, 'meeting.json')));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'meetings'), { recursive: true });

const index = [];
const search = [];
for (const id of ids) {
  try {
    const r = compile(id);
    fs.writeFileSync(path.join(OUT, 'meetings', `${id}.json`), JSON.stringify(r.full));
    index.push(r.index);
    search.push(r.search);
    console.log(`✓ ${id}  ${Math.round(r.full.duration / 60)} min, ${r.full.turns.length} turns`);
  } catch (e) {
    console.log(`✗ ${id}  skipped: ${e.message}`);
  }
}
index.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
fs.writeFileSync(path.join(OUT, 'search.json'), JSON.stringify(search));
fs.writeFileSync(path.join(OUT, 'people.json'), JSON.stringify(people, null, 1));
fs.writeFileSync(
  path.join(OUT, 'registry.ts'),
  `// Generated by scripts/build-data.mjs — do not edit.\nexport const MEETING_IDS = ${JSON.stringify(index.map((m) => m.id))} as const;\n` +
    `export const loaders: Record<string, () => Promise<unknown>> = {\n` +
    index.map((m) => `  ${JSON.stringify(m.id)}: () => import('./meetings/${m.id}.json').then((m) => m.default),`).join('\n') +
    `\n};\n`,
);
console.log(`\n${index.length} meetings → src/data/generated`);
