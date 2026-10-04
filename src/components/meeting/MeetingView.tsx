'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Link2, Share2 } from 'lucide-react';
import { createPlayer } from '@/lib/player';
import { clock, dateLabel, minutes, PLATFORM_LABEL, timeLabel } from '@/lib/format';
import { ME, person, speakerColor } from '@/lib/people';
import { selectHighlights, userStore, useUserState } from '@/lib/store';
import type { Highlight, Meeting } from '@/lib/types';
import { useClient } from '@/lib/useClient';
import { AvatarStack } from '../Avatar';
import { ShareDialog, shareUrl } from '../ShareDialog';
import { toast, Toaster } from '../Toast';
import { Ctx, type MeetingCtx, type Tab } from './context';
import { Stage } from './Stage';
import { Controls } from './Controls';
import { SoundingChart } from './SoundingChart';
import { Transcript } from './Transcript';
import { NotesPanel } from './NotesPanel';
import { ActionsPanel } from './ActionsPanel';
import { ClipsPanel } from './ClipsPanel';
import { AskPanel } from './AskPanel';
import { PeoplePanel } from './PeoplePanel';

export function MeetingView({ meeting, readOnly = false, bounds = null, header }: { meeting: Meeting; readOnly?: boolean; bounds?: [number, number] | null; header?: React.ReactNode }) {
  const params = useSearchParams();
  const [player] = useState(() => createPlayer(meeting.duration, bounds));
  const [focus, setFocus] = useState<string[]>([]);
  const [query, setQuery] = useState(() => (readOnly ? '' : params.get('q') ?? ''));
  const [tab, setTab] = useState<Tab>(() => (bounds || params.get('q') || params.get('t') ? 'transcript' : 'notes'));
  const [sharing, setSharing] = useState<{ clip?: Highlight } | null>(null);
  const mine = useUserState(selectHighlights(meeting.id));
  const local = useClient();

  useEffect(() => () => player.destroy(), [player]);

  // Deep link: /meetings/x?t=754 opens at that moment.
  useEffect(() => {
    const t = Number(params.get('t'));
    if (!readOnly && t > 0) player.seek(t);
  }, [params, player, readOnly]);

  const starts = useMemo(() => meeting.turns.map((t) => t.start), [meeting.turns]);
  const colorOf = useCallback((id: string) => speakerColor(meeting.participants, id), [meeting.participants]);
  const highlights = useMemo(() => (readOnly ? meeting.highlights : [...meeting.highlights, ...mine]), [meeting.highlights, mine, readOnly]);

  const createClip = useCallback(
    (from: number, to: number, title?: string, kind: Highlight['kind'] = 'bookmark') => {
      const h: Highlight = { id: `mine-${Date.now()}`, title: title ?? `Clip at ${clock(from)}`, kind, by: ME, start: from, end: Math.max(to, from + 3), mine: true, createdAt: new Date().toISOString() };
      userStore.addHighlight(meeting.id, h);
      return h;
    },
    [meeting.id],
  );

  const jump = useCallback(
    (t: number, play = false) => {
      player.seek(t);
      if (play) player.play();
    },
    [player],
  );

  // Space plays/pauses, arrows skip — unless typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select, [contenteditable], button, [role=slider]')) return;
      if (e.key === ' ') {
        e.preventDefault();
        player.toggle();
      } else if (e.key === 'ArrowRight') player.skip(10);
      else if (e.key === 'ArrowLeft') player.skip(-10);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [player]);

  const ctx: MeetingCtx = {
    meeting,
    player,
    starts,
    colorOf,
    focus,
    setFocus,
    query,
    setQuery,
    tab,
    setTab,
    highlights,
    createClip,
    share: (clip) => setSharing({ clip }),
    jump,
    readOnly,
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'notes', label: 'Notes' },
    { id: 'transcript', label: 'Transcript' },
    { id: 'actions', label: 'Actions', count: meeting.actionItems.length },
    { id: 'clips', label: 'Clips', count: highlights.length },
    ...(readOnly ? [] : [{ id: 'ask' as Tab, label: 'Ask' }]),
    { id: 'people', label: 'People', count: meeting.participants.length },
  ];

  return (
    <Ctx.Provider value={ctx}>
      <div className="flex flex-col lg:h-dvh">
        <header className="border-b border-rule px-4 pb-4 pt-4 sm:px-6">
          {header ??
            (!readOnly && (
              <Link href="/" className="mb-2 inline-flex items-center gap-1 text-[13px] text-ink-soft hover:text-ink">
                <ChevronLeft size={15} /> Meetings
              </Link>
            ))}
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <h1 className="font-serif text-[26px] leading-tight tracking-tight sm:text-[30px]">{meeting.title}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-soft">
                <span>
                  {dateLabel(meeting.startsAt, local)}, {timeLabel(meeting.startsAt, local)}
                </span>
                <span className="text-rule">|</span>
                <span className="tabular">{minutes(meeting.duration)}</span>
                <span className="text-rule">|</span>
                <span>{PLATFORM_LABEL[meeting.platform]}</span>
                <span className="rounded-full border border-rule px-2 py-px text-[12px]">{meeting.type}</span>
                {meeting.externalCompany && <span className="text-ink-faint">with {meeting.externalCompany}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AvatarStack ids={meeting.participants} colorOf={colorOf} size={28} max={8} />
              {!readOnly && (
                <div className="flex overflow-hidden rounded-lg">
                  <button onClick={() => setSharing({})} className="flex items-center gap-1.5 bg-magenta px-3.5 py-2 text-[14px] font-semibold text-white hover:bg-magenta-deep">
                    <Share2 size={15} /> Share
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(shareUrl(meeting));
                      toast('Meeting link copied');
                    }}
                    aria-label="Copy meeting link"
                    className="border-l border-white/25 bg-magenta px-2.5 text-white hover:bg-magenta-deep"
                  >
                    <Link2 size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
          {readOnly && (
            <p className="mt-2 text-[13px] text-ink-faint">
              With {meeting.participants.map((p) => person(p).name).join(', ')}
            </p>
          )}
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(400px,44%)]">
          <div className="quiet-scroll min-h-0 space-y-4 px-4 py-4 sm:px-6 lg:overflow-y-auto">
            <div className="mx-auto max-w-[880px] space-y-3">
              <Stage />
              <Controls />
            </div>
            <div className="mx-auto max-w-[880px] rounded-xl border border-rule bg-paper px-4 pb-3 pt-4">
              <SoundingChart />
            </div>
          </div>

          <div className="flex min-h-0 flex-col border-t border-rule bg-paper lg:border-l lg:border-t-0">
            <div className="quiet-scroll flex shrink-0 gap-1 overflow-x-auto border-b border-rule px-3" role="tablist" aria-label="Meeting views">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative shrink-0 px-2.5 py-3 text-[14px] transition-colors ${tab === t.id ? 'font-semibold text-ink' : 'text-ink-soft hover:text-ink'}`}
                >
                  {t.label}
                  {t.count != null && <span className="ml-1 text-[12px] text-ink-faint tabular">{t.count}</span>}
                  {tab === t.id && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-magenta" />}
                </button>
              ))}
            </div>
            <div className={`min-h-0 flex-1 ${tab === 'transcript' ? 'h-[72vh] lg:h-auto' : 'quiet-scroll overflow-y-auto'}`} role="tabpanel">
              {tab === 'notes' && <NotesPanel />}
              {tab === 'transcript' && <Transcript />}
              {tab === 'actions' && <ActionsPanel />}
              {tab === 'clips' && <ClipsPanel />}
              {tab === 'ask' && <AskPanel />}
              {tab === 'people' && <PeoplePanel />}
            </div>
          </div>
        </div>
      </div>
      {sharing && <ShareDialog meeting={meeting} clip={sharing.clip} onClose={() => setSharing(null)} />}
      <Toaster />
    </Ctx.Provider>
  );
}
