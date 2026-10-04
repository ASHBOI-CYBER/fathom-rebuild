#!/usr/bin/env node
// Validate authored seed meetings in data/source/meetings/<id>/.
// Usage: node scripts/validate-source.mjs [meeting-id ...]   (no args = all)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'data', 'source');
const people = JSON.parse(fs.readFileSync(path.join(SRC, 'people.json'), 'utf8'));
const personIds = new Set(people.map((p) => p.id));
const TEMPLATES = new Set(['general', 'decisions', 'project_update', 'sales_meddpicc', 'sales_bant', 'demo', 'customer_success', 'one_on_one', 'standup', 'interview', 'retrospective']);
const KINDS = new Set(['bookmark', 'action', 'quote', 'concern']);

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

export function loadMeeting(id) {
  const dir = path.join(SRC, 'meetings', id);
  const meeting = JSON.parse(fs.readFileSync(path.join(dir, 'meeting.json'), 'utf8'));
  const chapters = [];
  for (const f of meeting.transcriptFiles || []) {
    const chunk = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    chapters.push(...chunk);
  }
  return { meeting, chapters };
}

function validate(id) {
  const errors = [];
  const warn = [];
  let meeting, chapters;
  try {
    ({ meeting, chapters } = loadMeeting(id));
  } catch (e) {
    return { errors: [`cannot load: ${e.message}`], warn };
  }
  if (meeting.id !== id) errors.push(`meeting.id "${meeting.id}" != folder "${id}"`);
  for (const k of ['title', 'startsAt', 'platform', 'kind', 'type', 'host', 'participants']) if (!meeting[k]) errors.push(`missing ${k}`);
  if (isNaN(Date.parse(meeting.startsAt))) errors.push('startsAt is not a date');
  const parts = new Set(meeting.participants || []);
  for (const p of parts) if (!personIds.has(p)) errors.push(`unknown participant ${p}`);
  if (!parts.has(meeting.host)) errors.push('host not in participants');

  const turnIds = new Set();
  let last = 0;
  let total = 0;
  const talk = {};
  for (const ch of chapters) {
    if (!ch.title || !ch.gist) errors.push(`chapter missing title/gist: ${ch.title}`);
    if (!Array.isArray(ch.turns) || !ch.turns.length) errors.push(`chapter has no turns: ${ch.title}`);
    for (const t of ch.turns || []) {
      if (typeof t.id !== 'number') errors.push(`turn without numeric id near ${last}`);
      if (t.id <= last) errors.push(`turn id ${t.id} not increasing (prev ${last})`);
      last = t.id;
      turnIds.add(t.id);
      if (!parts.has(t.s)) errors.push(`turn ${t.id}: speaker "${t.s}" not a participant`);
      if (!t.t || !t.t.trim()) errors.push(`turn ${t.id}: empty text`);
      const w = words(t.t || '');
      total += w;
      talk[t.s] = (talk[t.s] || 0) + w;
    }
  }
  for (const p of parts) if (!talk[p]) warn.push(`participant ${p} never speaks`);

  const checkRef = (r, where) => {
    if (r == null) warn.push(`${where}: no ref`);
    else if (!turnIds.has(r)) errors.push(`${where}: ref ${r} is not a turn id`);
  };
  const sums = meeting.summaries || {};
  if (!sums.general) errors.push('summaries.general missing');
  for (const [tid, s] of Object.entries(sums)) {
    if (!TEMPLATES.has(tid)) errors.push(`unknown template ${tid}`);
    if (!s.tldr) errors.push(`${tid}: missing tldr`);
    if (!Array.isArray(s.sections) || !s.sections.length) errors.push(`${tid}: no sections`);
    for (const sec of s.sections || []) {
      if (!sec.heading) errors.push(`${tid}: section without heading`);
      for (const it of sec.items || []) {
        if (!it.text) errors.push(`${tid}/${sec.heading}: item without text`);
        checkRef(it.ref, `${tid}/${sec.heading}`);
        if (it.owner && !personIds.has(it.owner)) errors.push(`${tid}: unknown owner ${it.owner}`);
      }
    }
  }
  for (const [i, a] of (meeting.actionItems || []).entries()) {
    if (!a.text) errors.push(`actionItems[${i}] no text`);
    if (a.owner && !personIds.has(a.owner)) errors.push(`actionItems[${i}] unknown owner ${a.owner}`);
    checkRef(a.ref, `actionItems[${i}]`);
  }
  for (const [i, h] of (meeting.highlights || []).entries()) {
    if (!KINDS.has(h.kind)) errors.push(`highlights[${i}] bad kind ${h.kind}`);
    if (!turnIds.has(h.from) || !turnIds.has(h.to) || h.to < h.from) errors.push(`highlights[${i}] bad from/to ${h.from}-${h.to}`);
    if (h.by && !personIds.has(h.by)) errors.push(`highlights[${i}] unknown by ${h.by}`);
  }
  for (const [i, q] of (meeting.ask || []).entries()) {
    if (!q.q || !q.a) errors.push(`ask[${i}] missing q/a`);
    for (const r of q.refs || []) checkRef(r, `ask[${i}]`);
  }

  const mins = total / 150;
  const share = Object.entries(talk)
    .sort((a, b) => b[1] - a[1])
    .map(([p, w]) => `${p} ${Math.round((100 * w) / total)}%`)
    .join(', ');
  return { errors, warn, info: `${chapters.length} chapters, ${turnIds.size} turns, ${total} words ≈ ${mins.toFixed(1)} min | talk: ${share}` };
}

const dir = path.join(SRC, 'meetings');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(dir).filter((d) => fs.statSync(path.join(dir, d)).isDirectory());
let failed = false;
for (const id of ids) {
  const r = validate(id);
  console.log(`\n${r.errors.length ? '✗' : '✓'} ${id}${r.info ? '  ' + r.info : ''}`);
  for (const e of r.errors) console.log('  ERROR ' + e);
  for (const w of r.warn) console.log('  warn  ' + w);
  if (r.errors.length) failed = true;
}
process.exit(failed ? 1 : 0);
