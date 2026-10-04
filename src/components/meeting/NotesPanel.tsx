'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap, settle } from '@/lib/gsap';
import { Check, ChevronDown, Copy, Sparkles } from 'lucide-react';
import { clock } from '@/lib/format';
import { firstName } from '@/lib/people';
import { userStore, useUserState } from '@/lib/store';
import { TEMPLATES, suggestedTemplate, templateName } from '@/lib/templates';
import type { Summary } from '@/lib/types';
import { Avatar } from '../Avatar';
import { toast } from '../Toast';
import { useMeeting } from './context';

export function TimeChip({ ts, className = '' }: { ts: number | null | undefined; className?: string }) {
  const { jump } = useMeeting();
  if (ts == null) return null;
  return (
    <button
      onClick={() => jump(ts, true)}
      className={`inline-flex shrink-0 items-center rounded-md bg-shoal px-1.5 py-px align-baseline text-[12px] font-medium text-ink-soft tabular transition-colors hover:bg-magenta hover:text-white ${className}`}
      aria-label={`Play from ${clock(ts)}`}
    >
      {clock(ts)}
    </button>
  );
}

function toMarkdown(title: string, s: Summary) {
  return [`# ${title}`, '', `_${s.tldr}_`, '', ...s.sections.flatMap((sec) => [`## ${sec.heading}`, ...sec.items.map((i) => `- ${i.text}${i.ts != null ? ` (${clock(i.ts)})` : ''}`), ''])].join('\n');
}

export function NotesPanel() {
  const { meeting, readOnly } = useMeeting();
  const available = Object.keys(meeting.summaries);
  const suggested = suggestedTemplate(meeting.type, available);
  const saved = useUserState((s) => s.template[meeting.id]);
  const current = saved && available.includes(saved) ? saved : suggested;
  const summary = meeting.summaries[current];
  const [open, setOpen] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  // Show what changed when switching templates (not on first render).
  const shownTemplate = useRef(current);
  useEffect(() => {
    if (shownTemplate.current === current) return;
    shownTemplate.current = current;
    if (!body.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    settle(gsap.fromTo(body.current.children, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' }));
  }, [current]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !menu.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const pick = (id: string) => {
    userStore.setTemplate(meeting.id, id);
    setOpen(false);
  };

  return (
    <div className="px-5 pb-16 pt-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div ref={menu} className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-haspopup="listbox"
            className="flex items-center gap-2 rounded-lg border border-rule bg-paper px-3 py-1.5 text-[14px] font-semibold hover:border-ink-faint"
          >
            <Sparkles size={15} className="text-magenta" />
            {templateName(current)}
            <ChevronDown size={15} className="text-ink-faint" />
          </button>
          {open && (
            <div role="listbox" className="absolute left-0 top-full z-30 mt-1.5 w-[320px] overflow-hidden rounded-xl border border-rule bg-paper py-1 shadow-[0_18px_40px_-16px_rgba(15,34,54,0.4)]">
              {TEMPLATES.filter((t) => available.includes(t.id)).map((t) => (
                <button key={t.id} role="option" aria-selected={t.id === current} onClick={() => pick(t.id)} className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-shoal/60">
                  <span className="mt-0.5 w-4 shrink-0 text-magenta">{t.id === current && <Check size={15} />}</span>
                  <span>
                    <span className="flex items-center gap-2 text-[14px] font-semibold">
                      {t.name}
                      {t.id === suggested && <span className="rounded-full bg-magenta-wash px-1.5 text-[11px] font-semibold text-magenta-deep">Best fit</span>}
                    </span>
                    <span className="block text-[13px] text-ink-soft">{t.blurb}</span>
                  </span>
                </button>
              ))}
              <div className="mt-1 border-t border-rule-soft px-3 pb-1.5 pt-2 text-[12px] text-ink-faint">
                Not written for a {meeting.type.toLowerCase()} call:{' '}
                {TEMPLATES.filter((t) => !available.includes(t.id))
                  .map((t) => t.name)
                  .join(', ')}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(toMarkdown(meeting.title, summary));
            toast('Notes copied as Markdown');
          }}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-ink-soft hover:bg-shoal hover:text-ink"
        >
          <Copy size={14} /> Copy
        </button>
      </div>

      <div ref={body}>
        <p className="mb-6 font-serif text-[21px] leading-[1.4] text-ink">{summary.tldr}</p>
        {summary.sections.map((sec) => (
          <section key={sec.heading} className="mb-6">
            <h3 className="mb-2 text-[15px] font-semibold text-ink">{sec.heading}</h3>
            <ul className="space-y-2">
              {sec.items.map((it, i) => (
                <li key={i} className="flex gap-2.5 text-[15px] leading-[1.55] text-ink">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                  <span className="min-w-0">
                    {it.owner && <span className="mr-1 font-semibold">{firstName(it.owner)}:</span>}
                    {it.text} <TimeChip ts={it.ts} className="ml-0.5" />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!readOnly && (
          <p className="mt-8 border-t border-rule-soft pt-4 text-[12px] leading-relaxed text-ink-faint">
            Notes were written by an AI model from the transcript when this demo was seeded. Every point links to the moment it came from. Check before you forward.
          </p>
        )}
      </div>
    </div>
  );
}

export function OwnerTag({ id }: { id?: string }) {
  const { colorOf } = useMeeting();
  if (!id) return <span className="text-[12px] text-ink-faint">Unassigned</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft">
      <Avatar id={id} color={colorOf(id)} size={18} />
      {firstName(id)}
    </span>
  );
}
