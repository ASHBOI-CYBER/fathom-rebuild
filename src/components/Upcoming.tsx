'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { CalendarCheck2, Radio } from 'lucide-react';
import { RULE_LABEL, ruleRecords, upcomingEvents, type RecordRule } from '@/lib/calendar';
import { PLATFORM_LABEL } from '@/lib/format';
import { ME, person } from '@/lib/people';
import { userStore, useUserState } from '@/lib/store';
import { useClient } from '@/lib/useClient';
import { AvatarStack } from './Avatar';
import { RecordToggle } from './RecordToggle';

const COLORS = ['var(--sp-0)', 'var(--sp-1)', 'var(--sp-2)', 'var(--sp-3)', 'var(--sp-4)', 'var(--sp-5)', 'var(--sp-6)', 'var(--sp-7)'];

export function Upcoming() {
  const client = useClient();
  const router = useRouter();
  const rule = useUserState((s) => s.rule);
  const overrides = useUserState((s) => s.record);
  const [link, setLink] = useState('');
  const events = useMemo(() => (client ? upcomingEvents() : []), [client]);

  const days = useMemo(() => {
    const out: { label: string; items: typeof events }[] = [];
    for (const e of events) {
      const label = e.start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      const g = out.find((x) => x.label === label);
      if (g) g.items.push(e);
      else out.push({ label, items: [e] });
    }
    return out;
  }, [events]);

  const recording = events.filter((e) => overrides[e.id] ?? ruleRecords(rule, e, ME)).length;

  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 pb-24 pt-6 sm:px-8 sm:pt-10">
      <h1 className="font-serif text-[40px] italic leading-none tracking-tight sm:text-[48px]">Upcoming</h1>
      <p className="mt-2 max-w-[62ch] text-[15px] text-ink-soft">
        Sounding joins the calls on your calendar as a participant named “Asher’s notetaker”, records, and has notes ready a few minutes after you hang up.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="order-2 lg:order-1">
          <h2 className="mb-2 px-1 text-[13px] font-semibold text-ink-faint">
            This week · {recording} of {events.length} will be recorded
          </h2>
          {days.map((d) => (
            <section key={d.label} className="mb-5">
              <h3 className="mb-1.5 px-1 text-[15px] font-semibold">{d.label}</h3>
              <ul className="divide-y divide-rule-soft overflow-hidden rounded-xl border border-rule bg-paper">
                {d.items.map((e) => {
                  const on = overrides[e.id] ?? ruleRecords(rule, e, ME);
                  return (
                    <li key={e.id} className="grid grid-cols-[64px_1fr] gap-x-4 gap-y-2 px-4 py-3.5 sm:grid-cols-[72px_1fr_auto] sm:items-center">
                      <div className="text-[14px] font-semibold tabular">
                        {e.start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        <div className="text-[12px] font-normal text-ink-faint">{e.minutes} min</div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-semibold leading-snug">{e.title}</span>
                          {e.external && <span className="rounded-full bg-shoal px-2 py-px text-[11px] font-semibold text-ink-soft">External</span>}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 text-[12px] text-ink-faint">
                          <AvatarStack ids={e.attendees} colorOf={(id) => COLORS[e.attendees.indexOf(id) % 8]} size={20} />
                          {PLATFORM_LABEL[e.platform]} · organized by {e.organizer === ME ? 'you' : person(e.organizer).name.split(' ')[0]}
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <RecordToggle on={on} onChange={(v) => userStore.setRecord(e.id, v)} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <aside className="order-1 space-y-4 lg:order-2">
          <div className="rounded-xl border border-rule bg-paper p-4">
            <div className="flex items-center gap-2 text-[14px] font-semibold">
              <CalendarCheck2 size={17} className="text-ok" /> Google Calendar connected
            </div>
            <p className="mt-1 text-[13px] text-ink-soft">asher@tandem.app · simulated for this demo</p>
          </div>

          <fieldset className="rounded-xl border border-rule bg-paper p-4">
            <legend className="px-1 text-[14px] font-semibold">Record automatically</legend>
            <div className="mt-1 space-y-1">
              {(Object.keys(RULE_LABEL) as RecordRule[]).map((r) => (
                <label key={r} className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1.5 py-1.5 text-[14px] hover:bg-shoal/50">
                  <input type="radio" name="rule" checked={rule === r} onChange={() => userStore.setRule(r)} className="mt-1 accent-[var(--magenta)]" />
                  {RULE_LABEL[r]}
                </label>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-ink-faint">Switches on a single meeting override this rule.</p>
          </fieldset>

          <form
            className="rounded-xl border border-rule bg-paper p-4"
            onSubmit={(e) => {
              e.preventDefault();
              router.push('/live');
            }}
          >
            <label htmlFor="join-link" className="text-[14px] font-semibold">
              Record a call that’s happening now
            </label>
            <input
              id="join-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Paste a Zoom, Meet or Teams link"
              className="mt-2 w-full rounded-lg border border-rule px-3 py-1.5 text-[14px] outline-none focus:border-ink-faint"
            />
            <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-magenta px-3 py-2 text-[14px] font-semibold text-white hover:bg-magenta-deep">
              <Radio size={15} /> Send the notetaker
            </button>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-faint">
              The recording bot is simulated: this opens a replay of a real stand-up as if it were live, so you can highlight moments mid-call and see where they land. <Link href="/live" className="underline">Open it directly</Link>.
            </p>
          </form>
        </aside>
      </div>
    </div>
  );
}
