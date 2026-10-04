'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
import { useClient } from '@/lib/useClient';
import { upcomingEvents, ruleRecords } from '@/lib/calendar';
import { ME } from '@/lib/people';
import { PLATFORM_LABEL } from '@/lib/format';
import { userStore, useUserState } from '@/lib/store';
import { RecordToggle } from './RecordToggle';

export function when(d: Date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const day = same(d, today) ? 'Today' : same(d, tomorrow) ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'long' });
  return `${day} at ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

/** The single next meeting on the calendar, and whether Sounding will join it. */
export function NextUp() {
  // Dates are relative to the viewer's clock, so render after hydration.
  const client = useClient();
  const next = useMemo(() => (client ? upcomingEvents()[0] : null), [client]);
  const overrides = useUserState((s) => s.record);
  const rule = useUserState((s) => s.rule);

  return (
    <section aria-label="Next meeting" className="mt-8 flex min-h-[76px] flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-line bg-surface px-5 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral-soft text-coral">
        <CalendarClock size={19} />
      </span>
      {next && (
        <>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] text-fg-faint">
              Up next · {when(next.start)} · {PLATFORM_LABEL[next.platform]}
            </div>
            <div className="truncate text-[16px] font-semibold">{next.title}</div>
          </div>
          <RecordToggle on={overrides[next.id] ?? ruleRecords(rule, next, ME)} onChange={(v) => userStore.setRecord(next.id, v)} />
          <Link href="/upcoming" className="text-[14px] font-medium text-fg-soft underline-offset-4 hover:text-fg hover:underline">
            Your week
          </Link>
        </>
      )}
    </section>
  );
}
