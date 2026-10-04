'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap, settle } from '@/lib/gsap';
import { Check, CaretDown, Copy, Sparkle } from '@phosphor-icons/react';
import { clock } from '@/lib/format';
import { firstName, personColor } from '@/lib/people';
import { userStore, useUserState } from '@/lib/store';
import { TEMPLATES, suggestedTemplate, templateName } from '@/lib/templates';
import type { Summary } from '@/lib/types';
import { Avatar } from '../Avatar';
import { toast } from '../Toast';
import { useMeeting } from './context';

/** A quiet timestamp that becomes a play button on hover. */
export function TimeChip({ ts, className = '' }: { ts: number | null | undefined; className?: string }) {
  const { jump } = useMeeting();
  if (ts == null) return null;
  return (
    <button
      onClick={() => jump(ts, true)}
      className={`inline-flex min-h-6 shrink-0 items-center rounded-md px-1.5 align-baseline text-[13px] text-fg-faint tabular transition-colors hover:bg-signal-soft hover:text-signal ${className}`}
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
    settle(gsap.fromTo(body.current.children, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }));
  }, [current]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !menu.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const pick = (id: string) => {
    userStore.setTemplate(meeting.id, id);
    setOpen(false);
  };

  return (
    <div className="px-7 pb-16 pt-6">
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <div ref={menu} className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={`Summary template: ${templateName(current)}`}
            className="flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-[14px] text-fg-soft transition-colors hover:border-line-strong hover:text-fg"
          >
            <Sparkle size={15} className="text-signal" />
            <span>
              Template: <span className="font-semibold text-fg">{templateName(current)}</span>
            </span>
            <CaretDown size={15} className="text-fg-faint" />
          </button>
          {open && (
            <div role="listbox" className="absolute left-0 top-full z-30 mt-2 w-[min(340px,calc(100vw-56px))] overflow-hidden rounded-2xl border border-line-strong bg-raised py-1.5 shadow-2xl">
              {TEMPLATES.filter((t) => available.includes(t.id)).map((t) => (
                <button key={t.id} role="option" aria-selected={t.id === current} onClick={() => pick(t.id)} className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-hover">
                  <span className="mt-0.5 w-4 shrink-0 text-signal">{t.id === current && <Check size={16} />}</span>
                  <span>
                    <span className="flex items-center gap-2 text-[15px] font-semibold text-fg">
                      {t.name}
                      {t.id === suggested && <span className="rounded-full bg-signal-soft px-2 text-[11px] font-semibold text-signal">Best fit</span>}
                    </span>
                    <span className="block text-[13px] text-fg-soft">{t.blurb}</span>
                  </span>
                </button>
              ))}
              <p className="mx-4 mt-1.5 border-t border-line pb-1.5 pt-2.5 text-[12px] leading-relaxed text-fg-faint">
                Other templates (sales, interview, stand-up…) aren’t written for a {meeting.type.toLowerCase()} call.
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(toMarkdown(meeting.title, summary));
            toast('Summary copied');
          }}
          className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] text-fg-soft hover:bg-raised hover:text-fg"
        >
          <Copy size={15} /> Copy
        </button>
      </div>

      <div ref={body}>
        <p className="mb-10 max-w-[60ch] text-[19px] leading-[1.6] text-fg">{summary.tldr}</p>
        {summary.sections.map((sec) => (
          <section key={sec.heading} className="mb-10">
            <h2 className="display mb-4 text-[24px] uppercase tracking-[0.04em] text-fg">{sec.heading}</h2>
            <ul className="space-y-3">
              {sec.items.map((it, i) => (
                <li key={i} className="flex max-w-[64ch] gap-3 text-[15.5px] leading-[1.65] text-fg-soft">
                  <span className="mt-[12px] h-px w-3 shrink-0 bg-fg-faint" />
                  <span className="min-w-0">
                    {it.owner && (
                      <span className="mr-1.5 inline-flex items-center rounded-md px-1.5 py-px align-[1px] text-[12.5px] font-semibold" style={{ background: `color-mix(in oklab, ${personColor(it.owner)} 20%, transparent)`, color: personColor(it.owner) }}>
                        {firstName(it.owner)}
                      </span>
                    )}
                    {it.text} <TimeChip ts={it.ts} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!readOnly && (
          <p className="mt-10 border-t border-line pt-5 text-[13px] leading-relaxed text-fg-faint">
            Written by an AI model from the transcript when this demo was set up. Each point links to the moment it came from, so you can check it before you forward it.
          </p>
        )}
      </div>
    </div>
  );
}

export function OwnerTag({ id }: { id?: string }) {
  const { colorOf } = useMeeting();
  if (!id) return <span className="text-[13px] text-fg-faint">Unassigned</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-[14px] text-fg-soft">
      <Avatar id={id} color={colorOf(id)} size={20} />
      {firstName(id)}
    </span>
  );
}
