'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { CalendarCheck, Broadcast } from '@phosphor-icons/react';
import { RULE_LABEL, ruleRecords, upcomingEvents, type RecordRule } from '@/lib/calendar';
import { PLATFORM_LABEL } from '@/lib/format';
import { ME, person, personColor } from '@/lib/people';
import { userStore, useUserState } from '@/lib/store';
import { useClient } from '@/lib/useClient';
import { AvatarStack } from './Avatar';
import { RecordToggle } from './RecordToggle';
import { PageBand } from './PageBand';


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
    <div className="relative isolate mx-auto w-full max-w-[1320px] px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
      <PageBand />
      <h1 className="display text-[clamp(64px,8vw,112px)] text-fg">Upcoming</h1>
      <p className="mt-4 max-w-[56ch] text-[18px] text-fg-soft">
        {client ? `${recording} of your next ${events.length} meetings will be recorded.` : 'Your next meetings.'} Sounding joins them as “Asher’s notetaker” and has notes ready a few minutes after you hang up.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          {days.map((d) => (
            <section key={d.label} className="mb-8">
              <h2 className="mb-3 text-[15px] font-semibold text-fg-soft">{d.label}</h2>
              <ul className="space-y-2">
                {d.items.map((e) => {
                  const on = overrides[e.id] ?? ruleRecords(rule, e, ME);
                  return (
                    <li key={e.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-line bg-surface px-5 py-4">
                      <div className="w-[76px] shrink-0">
                        <div className="text-[16px] font-semibold tabular">{e.start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</div>
                        <div className="text-[13px] text-fg-faint">{e.minutes} min</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[16px] font-semibold leading-snug">{e.title}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-[13px] text-fg-faint">
                          <AvatarStack ids={e.attendees} colorOf={personColor} size={22} max={5} />
                          <span>
                            {PLATFORM_LABEL[e.platform]}
                            {e.external ? ' · external' : ''} · organized by {e.organizer === ME ? 'you' : person(e.organizer).name.split(' ')[0]}
                          </span>
                        </div>
                      </div>
                      <RecordToggle on={on} onChange={(v) => userStore.setRecord(e.id, v)} label={e.title} />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <aside className="space-y-4">
          <form
            className="rounded-2xl border border-line bg-surface p-5"
            onSubmit={(e) => {
              e.preventDefault();
              router.push('/live');
            }}
          >
            <label htmlFor="join-link" className="text-[16px] font-semibold">
              Record a call happening now
            </label>
            <input
              id="join-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Paste a Zoom, Meet or Teams link"
              className="mt-3 w-full rounded-full border border-line bg-abyss/50 px-4 py-2.5 text-[14px] text-fg outline-none placeholder:text-fg-faint focus:border-line-strong"
            />
            <button type="submit" className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-signal px-4 py-2.5 text-[15px] font-semibold text-on-signal hover:bg-signal-hover">
              <Broadcast size={16} /> Send the notetaker
            </button>
            <p className="mt-3 text-[13px] leading-relaxed text-fg-faint">
              The bot is simulated. This opens a replay of a real stand-up as if it were live, so you can highlight moments mid-call. <Link href="/live" className="text-fg-soft underline underline-offset-4">Try it</Link>
            </p>
          </form>

          <fieldset className="rounded-2xl border border-line bg-surface p-5">
            <legend className="sr-only">Record automatically</legend>
            <p className="mb-3 text-[16px] font-semibold">Record automatically</p>
            <div className="space-y-1">
              {(Object.keys(RULE_LABEL) as RecordRule[]).map((r) => (
                <label key={r} className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors ${rule === r ? 'bg-raised text-fg' : 'text-fg-soft hover:bg-raised/60'}`}>
                  <input type="radio" name="rule" checked={rule === r} onChange={() => userStore.setRule(r)} className="mt-1 accent-[var(--signal)]" />
                  {RULE_LABEL[r]}
                </label>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-fg-faint">The switch on any meeting overrides this.</p>
          </fieldset>

          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-4">
            <CalendarCheck size={20} className="shrink-0 text-ok" />
            <div>
              <div className="text-[15px] font-semibold">Google Calendar connected</div>
              <div className="text-[13px] text-fg-faint">asher@tandem.app · simulated for this demo</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
