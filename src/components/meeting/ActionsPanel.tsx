'use client';
import { useMemo, useState } from 'react';
import { Copy, Plus } from 'lucide-react';
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
    toast(`Action item added for ${firstName(owner)}`);
  };

  const copy = () => {
    const text = open.map((a) => `- [ ] ${a.text}${a.owner ? ` — ${person(a.owner).name}` : ''}${a.due ? ` (due ${a.due})` : ''}`).join('\n');
    navigator.clipboard?.writeText(text);
    toast(`${open.length} open items copied`);
  };

  return (
    <div className="px-5 pb-16 pt-4">
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <Chip on={!who} onClick={() => setWho(null)}>
          Everyone <span className="opacity-60">{all.length}</span>
        </Chip>
        {owners.map((o) => (
          <Chip key={o} on={who === o} onClick={() => setWho(who === o ? null : o)}>
            {o === ME ? 'Mine' : firstName(o)} <span className="opacity-60">{all.filter((a) => a.owner === o).length}</span>
          </Chip>
        ))}
        <button onClick={copy} className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-ink-soft hover:bg-shoal hover:text-ink">
          <Copy size={14} /> Copy open
        </button>
      </div>

      <ul className="divide-y divide-rule-soft">
        {[...open, ...closed].map((a) => (
          <li key={a.id} className="flex gap-3 py-3">
            <input
              type="checkbox"
              checked={!!done[a.id]}
              onChange={() => userStore.toggleDone(a.id)}
              disabled={readOnly}
              aria-label={`Mark "${a.text}" done`}
              className="mt-1 h-[17px] w-[17px] shrink-0 cursor-pointer accent-[var(--magenta)]"
            />
            <div className="min-w-0 flex-1">
              <p className={`text-[15px] leading-snug ${done[a.id] ? 'text-ink-faint line-through' : 'text-ink'}`}>{a.text}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                <OwnerTag id={a.owner} />
                {a.due && <span className="text-[12px] text-ink-faint">Due {new Date(a.due + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                <TimeChip ts={a.ts} />
              </div>
            </div>
          </li>
        ))}
      </ul>

      {!readOnly && (
        <div className="mt-4 rounded-xl border border-rule bg-chart/60 p-3">
          <label className="text-[12px] font-semibold text-ink-faint" htmlFor="new-action">
            Add an action item at {clock(time)}
          </label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <input
              id="new-action"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="e.g. Send Marcus the pilot proposal"
              className="min-w-[180px] flex-1 rounded-lg border border-rule bg-paper px-3 py-1.5 text-[14px] outline-none focus:border-ink-faint"
            />
            <select value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Owner" className="rounded-lg border border-rule bg-paper px-2 py-1.5 text-[14px]">
              {meeting.participants.map((p) => (
                <option key={p} value={p}>
                  {person(p).name}
                </option>
              ))}
            </select>
            <button onClick={add} className="flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-[14px] font-semibold text-white disabled:opacity-40" disabled={!draft.trim()}>
              <Plus size={15} /> Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`rounded-full px-2.5 py-1 text-[13px] tabular transition-colors ${on ? 'bg-ink text-white' : 'bg-shoal text-ink-soft hover:text-ink'}`}>
      {children}
    </button>
  );
}
