'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import { answer, type Answer } from '@/lib/ask';
import { firstName } from '@/lib/people';
import { useMeeting } from './context';
import { TimeChip } from './NotesPanel';

type Msg = { q: string; a: Answer | null };

export function AskPanel() {
  const { meeting, colorOf } = useMeeting();
  const [thread, setThread] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [thread]);

  const ask = (q: string) => {
    if (!q.trim()) return;
    setDraft('');
    setThread((t) => [...t, { q, a: null }]);
    // A short beat so the answer reads as considered rather than instant.
    window.setTimeout(() => setThread((t) => t.map((m, i) => (i === t.length - 1 ? { ...m, a: answer(q, meeting) } : m))), 450);
  };

  const unasked = meeting.ask.filter((e) => !thread.some((m) => m.q === e.q));

  return (
    <div className="flex min-h-full flex-col px-6 pb-5 pt-5">
      <div className="flex-1 space-y-6">
        {!thread.length && (
          <div className="pb-2 pt-4 text-center">
            <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-coral-soft text-coral">
              <Sparkles size={20} />
            </span>
            <p className="text-[19px] font-semibold">Ask anything about this call</p>
            <p className="mx-auto mt-1 max-w-[34ch] text-[15px] text-fg-soft">Every answer points to the moment it came from, so you can check it in a click.</p>
          </div>
        )}
        {thread.map((m, i) => (
          <div key={i} className="space-y-3">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-fg px-4 py-2.5 text-[15px] text-abyss">{m.q}</p>
            {!m.a && <p className="text-[15px] text-fg-faint">Reading the transcript…</p>}
            {m.a?.kind === 'prepared' && (
              <div className="text-[15px] leading-[1.65] text-fg-soft">
                <p className="text-fg">{m.a.entry.a}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.a.entry.refs.map((r) => (
                    <TimeChip key={r.ref} ts={r.ts} className="bg-raised" />
                  ))}
                </div>
              </div>
            )}
            {m.a?.kind === 'quotes' && (
              <div className="text-[15px] leading-[1.65]">
                <p className="mb-3 text-fg">{m.a.intro}</p>
                <ul className="space-y-3">
                  {m.a.turns.map((t) => (
                    <li key={t.id} className="border-l-2 pl-3.5" style={{ borderColor: colorOf(t.s) }}>
                      <span className="text-[14px] font-semibold" style={{ color: colorOf(t.s) }}>
                        {firstName(t.s)}
                      </span>{' '}
                      <TimeChip ts={t.start} />
                      <p className="text-[15px] text-fg-soft">“{t.t.length > 260 ? t.t.slice(0, 257) + '…' : t.t}”</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {m.a?.kind === 'none' && <p className="text-[15px] text-fg-soft">That doesn’t come up in this call. Try other words, or search every meeting with Ctrl K.</p>}
          </div>
        ))}
        <div ref={end} />
      </div>

      <div className="sticky bottom-0 -mx-6 mt-6 bg-surface px-6 pt-3">
        {unasked.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {unasked.slice(0, 3).map((e) => (
              <button key={e.q} onClick={() => ask(e.q)} className="rounded-full border border-line px-3.5 py-1.5 text-left text-[14px] text-fg-soft transition-colors hover:border-line-strong hover:text-fg">
                {e.q}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
          className="flex items-center gap-2 rounded-full border border-line-strong bg-abyss/50 py-1.5 pl-5 pr-1.5 focus-within:border-fg-faint"
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about this meeting" aria-label="Ask about this meeting" className="flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-faint" />
          <button type="submit" disabled={!draft.trim()} aria-label="Ask" className="flex h-9 w-9 items-center justify-center rounded-full bg-coral text-on-coral disabled:opacity-30">
            <ArrowUp size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}
