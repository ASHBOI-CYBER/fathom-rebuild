'use client';
import { useMemo } from 'react';
import { minutes } from '@/lib/format';
import { person } from '@/lib/people';
import { Avatar } from '../Avatar';
import { useMeeting } from './context';

/** Who talked, how much, and how — the view Fathom doesn't give you on a long call. */
export function PeoplePanel() {
  const { meeting, colorOf, focus, setFocus, setTab } = useMeeting();
  const rows = useMemo(() => {
    const total = Object.values(meeting.talk).reduce((a, b) => a + b, 0) || 1;
    return meeting.participants
      .map((id) => {
        const turns = meeting.turns.filter((t) => t.s === id);
        const longest = turns.reduce((m, t) => Math.max(m, t.end - t.start), 0);
        const questions = turns.filter((t) => /\?\s*$|\?\s/.test(t.t)).length;
        const owns = meeting.actionItems.filter((a) => a.owner === id).length;
        return { id, secs: meeting.talk[id] || 0, share: (meeting.talk[id] || 0) / total, turns: turns.length, longest, questions, owns };
      })
      .sort((a, b) => b.secs - a.secs);
  }, [meeting]);
  const max = rows[0]?.share || 1;

  return (
    <div className="px-5 pb-16 pt-4">
      <p className="mb-4 text-[14px] text-ink-soft">Talk time across {minutes(meeting.duration)}. Select a person to read only what they said.</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.id}>
            <button
              onClick={() => {
                setFocus(focus.length === 1 && focus[0] === r.id ? [] : [r.id]);
                setTab('transcript');
              }}
              className="w-full rounded-xl p-2.5 text-left hover:bg-shoal/50"
            >
              <div className="flex items-center gap-3">
                <Avatar id={r.id} color={colorOf(r.id)} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[15px] font-semibold">{person(r.id).name}</span>
                    <span className="shrink-0 text-[14px] font-semibold tabular">{Math.round(r.share * 100)}%</span>
                  </div>
                  <div className="truncate text-[12px] text-ink-faint">
                    {person(r.id).title}
                    {person(r.id).company !== 'Tandem' && person(r.id).company !== 'Candidate' ? `, ${person(r.id).company}` : ''}
                  </div>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-rule-soft">
                <div className="h-full rounded-full" style={{ width: `${(100 * r.share) / max}%`, background: colorOf(r.id) }} />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 text-[12px] text-ink-soft tabular">
                <span>{minutes(r.secs)} speaking</span>
                <span>{r.turns} turns</span>
                <span>longest {Math.round(r.longest)}s</span>
                <span>{r.questions} questions</span>
                {r.owns > 0 && <span>owns {r.owns} action{r.owns > 1 ? 's' : ''}</span>}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
