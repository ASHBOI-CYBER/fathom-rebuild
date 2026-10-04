'use client';
import { useMemo, useState } from 'react';
import { Check, Copy, Plus } from 'lucide-react';
import { clock } from '@/lib/format';
import { ME, firstName, person } from '@/lib/people';
import { usePlayer } from '@/lib/player';
import { selectActions, userStore, useUserState } from '@/lib/store';
import { toast } from '../Toast';
import { useMeeting } from './context';
import { OwnerTag, TimeChip } from './NotesPanel';

export function ActionsPanel() {
  const { meeting, player, readOnly } = useMeeting();
  const added = useUserState(selectActions(meeting.id));
  const done = useUserState((s) => s.done);
  const [who, setWho] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [owner, setOwner] = useState(ME);
  const time = usePlayer(player, (s) => Math.floor(s.time));

  const all = useMemo(() => [...meeting.actionItems, ...added], [meeting.actionItems, added]);
  const owners = useMemo(() => [...new Set(all.map((a) => a.owner).filter(Boolean))] as string[], [all]);
  const shown = who ? all.filter((a) => a.owner === who) : all;
  const open = shown.filter((a) => !done[a.id]);
  const closed = shown.filter((a) => done[a.id]);

  const add = () => {
    if (!draft.trim()) return;
    userStore.addAction(meeting.id, { id: `${meeting.id}-u${Date.now()}`, text: draft.trim(), owner, ts: time });
    setDraft('');
    setAdding(false);
    toast(`Action item added for ${firstName(owner)}`);
  };

  const copy = () => {
    const text = open.map((a) => `- [ ] ${a.text}${a.owner ? ` (${person(a.owner).name})` : ''}${a.due ? `, due ${a.due}` : ''}`).join('\n');
    navigator.clipboard?.writeText(text);
    toast(`${open.length} open items copied`);
  };

  return (
    <div className="px-6 pb-16 pt-5">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="owner-filter">
          Show items for
        </label>
        <select
          id="owner-filter"
          value={who ?? ''}
          onChange={(e) => setWho(e.target.value || null)}
          className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[14px] text-fg-soft hover:border-line-strong"
        >
          <option value="">Everyone · {all.length}</option>
          {owners.map((o) => (
            <option key={o} value={o}>
              {o === ME ? 'Me' : person(o).name} · {all.filter((a) => a.owner === o).length}
            </option>
          ))}
        </select>
        <span className="text-[14px] text-fg-faint">{open.length} open</span>
        <button onClick={copy} className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] text-fg-soft hover:bg-raised hover:text-fg">
          <Copy size={15} /> Copy open items
        </button>
      </div>

      <ul className="space-y-1">
        {[...open, ...closed].map((a) => {
          const isDone = !!done[a.id];
          return (
            <li key={a.id} className="flex gap-3.5 rounded-xl px-2 py-3 hover:bg-raised/50">
              <button
                role="checkbox"
                aria-checked={isDone}
                disabled={readOnly}
                onClick={() => userStore.toggleDone(a.id)}
                aria-label={`Mark “${a.text}” ${isDone ? 'not done' : 'done'}`}
                className={`mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-2 transition-colors ${isDone ? 'border-coral bg-coral text-on-coral' : 'border-line-strong hover:border-coral'}`}
              >
                {isDone && <Check size={14} strokeWidth={3} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-[16px] leading-snug ${isDone ? 'text-fg-faint line-through' : 'text-fg'}`}>{a.text}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <OwnerTag id={a.owner} />
                  {a.due && <span className="text-[13px] text-fg-faint">Due {new Date(a.due + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                  <TimeChip ts={a.ts} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {!readOnly &&
        (adding ? (
          <div className="mt-4 rounded-2xl border border-line bg-raised p-4">
            <label className="text-[13px] text-fg-faint" htmlFor="new-action">
              New action item at {clock(time)}
            </label>
            <input
              id="new-action"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add();
                if (e.key === 'Escape') setAdding(false);
              }}
              placeholder="e.g. Send Marcus the pilot proposal"
              className="mt-2 w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-[15px] text-fg outline-none placeholder:text-fg-faint focus:border-line-strong"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Owner" className="rounded-full border border-line bg-surface px-3 py-1.5 text-[14px] text-fg-soft">
                {meeting.participants.map((p) => (
                  <option key={p} value={p}>
                    {person(p).name}
                  </option>
                ))}
              </select>
              <button onClick={() => setAdding(false)} className="ml-auto rounded-full px-3.5 py-1.5 text-[14px] text-fg-soft hover:text-fg">
                Cancel
              </button>
              <button onClick={add} disabled={!draft.trim()} className="rounded-full bg-coral px-4 py-1.5 text-[14px] font-semibold text-on-coral disabled:opacity-40">
                Add item
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="mt-3 flex items-center gap-2 rounded-xl px-2 py-2 text-[15px] text-fg-soft hover:text-fg">
            <Plus size={17} /> Add an action item
          </button>
        ))}
    </div>
  );
}
