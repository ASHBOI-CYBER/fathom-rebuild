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
    <div className="flex min-h-full flex-col px-5 pb-6 pt-4">
      <div className="flex-1 space-y-5">
        {!thread.length && (
          <div className="pb-2">
            <p className="font-serif text-[21px] leading-snug">Ask anything about this call.</p>
            <p className="mt-1 text-[14px] text-ink-soft">Answers cite the exact moments they come from, so you can check them in a click.</p>
          </div>
        )}
        {thread.map((m, i) => (
          <div key={i} className="space-y-2.5">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-[15px] text-white">{m.q}</p>
            {!m.a && <p className="text-[14px] text-ink-faint">Reading the transcript…</p>}
            {m.a?.kind === 'prepared' && (
              <div className="text-[15px] leading-[1.6]">
                <p>{m.a.entry.a}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.a.entry.refs.map((r) => (
                    <TimeChip key={r.ref} ts={r.ts} />
                  ))}
                </div>
              </div>
            )}
            {m.a?.kind === 'quotes' && (
              <div className="text-[15px] leading-[1.6]">
                <p className="mb-2">{m.a.intro}</p>
                <ul className="space-y-2">
                  {m.a.turns.map((t) => (
                    <li key={t.id} className="border-l-2 pl-3" style={{ borderColor: colorOf(t.s) }}>
                      <span className="text-[13px] font-semibold" style={{ color: colorOf(t.s) }}>
                        {firstName(t.s)}
                      </span>{' '}
                      <TimeChip ts={t.start} />
                      <p className="text-[14px] text-ink-soft">“{t.t.length > 260 ? t.t.slice(0, 257) + '…' : t.t}”</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {m.a?.kind === 'none' && <p className="text-[15px] text-ink-soft">That doesn’t come up in this call. Try other words, or search all meetings with Ctrl K.</p>}
          </div>
        ))}
        <div ref={end} />
      </div>

      <div className="sticky bottom-0 -mx-5 mt-6 border-t border-rule-soft bg-paper px-5 pt-3">
        {unasked.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {unasked.slice(0, 4).map((e) => (
              <button key={e.q} onClick={() => ask(e.q)} className="flex items-center gap-1.5 rounded-full border border-rule px-3 py-1 text-left text-[13px] text-ink-soft hover:border-ink-faint hover:text-ink">
                <Sparkles size={12} className="text-magenta" /> {e.q}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
          className="flex items-center gap-2 rounded-xl border border-rule bg-paper py-1.5 pl-3.5 pr-1.5 focus-within:border-ink-faint"
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="What did Tom promise Harbor & Pine?" aria-label="Ask about this meeting" className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-faint" />
          <button type="submit" disabled={!draft.trim()} aria-label="Ask" className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white disabled:opacity-30">
            <ArrowUp size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
