export function clock(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? h + ':' : ''}${mm}:${String(r).padStart(2, '0')}`;
}

export function minutes(sec: number) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min`;
}

const DAY = 86400000;

/** Groups for the meetings list, relative to `now`. */
export function dayGroup(iso: string, now: Date, local = true) {
  if (!local) return 'Recent';
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(now) - start(d)) / DAY);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return 'Earlier this week';
  if (diff < 14) return 'Last week';
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

// Before hydration we format in UTC/en-US so the static HTML matches; after, in the viewer's locale and zone.
export function dateLabel(iso: string, local = true) {
  return new Date(iso).toLocaleDateString(local ? undefined : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', ...(local ? {} : { timeZone: 'UTC' }) });
}

export function timeLabel(iso: string, local = true) {
  return new Date(iso).toLocaleTimeString(local ? undefined : 'en-US', { hour: 'numeric', minute: '2-digit', ...(local ? {} : { timeZone: 'UTC' }) });
}

export const PLATFORM_LABEL = { meet: 'Google Meet', zoom: 'Zoom', teams: 'Microsoft Teams' } as const;
