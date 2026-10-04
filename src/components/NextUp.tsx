'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { useClient } from '@/lib/useClient';
import { upcomingEvents, ruleRecords } from '@/lib/calendar';
import { ME } from '@/lib/people';
import { userStore, useUserState } from '@/lib/store';
import { RecordToggle } from './RecordToggle';

export function when(d: Date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const day = same(d, today) ? 'today' : same(d, tomorrow) ? 'tomorrow' : d.toLocaleDateString(undefined, { weekday: 'long' });
  return `${day} at ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

/** The next meeting on the calendar, and whether Sounding will join it. */
export function NextUp() {
  // Dates are relative to the viewer's clock, so render after hydration.
  const client = useClient();
  const next = useMemo(() => (client ? upcomingEvents()[0] : null), [client]);
  const overrides = useUserState((s) => s.record);
  const rule = useUserState((s) => s.rule);
  if (!next) return <span className="h-10" />;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px]">
      <Link href="/upcoming" className="text-fg-soft underline-offset-4 hover:text-fg hover:underline">
        Next: <span className="font-semibold text-fg">{next.title}</span>, {when(next.start)}
      </Link>
      <RecordToggle on={overrides[next.id] ?? ruleRecords(rule, next, ME)} onChange={(v) => userStore.setRecord(next.id, v)} label={next.title} />
    </div>
  );
}
