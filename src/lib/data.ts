// Build-time data access (server components only). Static export reads these at `next build`.
import fs from 'node:fs';
import path from 'node:path';
import type { Meeting, MeetingIndex } from './types';

const DIR = path.join(process.cwd(), 'src', 'data', 'generated');

export function getIndex(): MeetingIndex[] {
  return JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
}

export function getMeeting(id: string): Meeting | null {
  const file = path.join(DIR, 'meetings', `${id}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function meetingIds() {
  return getIndex().map((m) => m.id);
}
