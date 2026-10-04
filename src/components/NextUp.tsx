'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { useClient } from '@/lib/useClient';
import { upcomingEvents, ruleRecords, type CalEvent } from '@/lib/calendar';
import { ME } from '@/lib/people';
import { PLATFORM_LABEL } from '@/lib/format';
import { userStore, useUserState } from '@/lib/store';
import { RecordToggle } from './RecordToggle';

function when(d: Date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const day = same(d, today) ? 'Today' : same(d, tomorrow) ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'long' });
  return `${day}, ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

export function NextUp() {
  // Dates are relative to the viewer's clock, so render after mount.
  const client = useClient();
  const events = useMemo<CalEvent[] | null>(() => (client ? upcomingEvents().slice(0, 3) : null), [client]);
  const overrides = useUserState((s) => s.record);

  return (
    <section className="mb-8" aria-labelledby="next-up">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 id="next-up" className="text-[13px] font-semibold text-ink-faint">
          Coming up on your calendar
        </h2>
        <Link href="/upcoming" className="text-[13px] font-medium text-ink-soft hover:text-ink hover:underline">
          Recording rules and full week
        </Link>
      </div>
      <div className="grid min-h-[104px] gap-2 sm:grid-cols-3">
        {events?.map((e) => {
          const on = overrides[e.id] ?? (ruleRecords('external', e, ME) || e.organizer === ME);
          return (
            <div key={e.id} className="flex flex-col justify-between gap-3 rounded-xl border border-rule bg-paper/60 p-3.5">
              <div>
                <div className="text-[12px] text-ink-faint">
                  {when(e.start)} · {PLATFORM_LABEL[e.platform]}
                </div>
                <div className="mt-0.5 line-clamp-2 text-[14px] font-semibold leading-snug">{e.title}</div>
              </div>
              <RecordToggle on={on} onChange={(v) => userStore.setRecord(e.id, v)} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
