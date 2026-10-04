'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Link2, Share2 } from 'lucide-react';
import { createPlayer } from '@/lib/player';
import { clock, dateLabel, minutes, PLATFORM_LABEL, timeLabel } from '@/lib/format';
import { ME, speakerColor } from '@/lib/people';
import { selectHighlights, userStore, useUserState } from '@/lib/store';
import type { Highlight, Meeting } from '@/lib/types';
import { useClient } from '@/lib/useClient';
import { AvatarStack } from '../Avatar';
import { ShareDialog, shareUrl } from '../ShareDialog';
import { toast, Toaster } from '../Toast';
import { Ctx, type MeetingCtx, type Tab } from './context';
import { Stage } from './Stage';
import { PlayerBar } from './PlayerBar';
import { Outline } from './Outline';
import { Transcript } from './Transcript';
import { NotesPanel } from './NotesPanel';
import { ActionsPanel } from './ActionsPanel';
import { ClipsPanel } from './ClipsPanel';
import { AskPanel } from './AskPanel';

export type Initial = { t?: number; q?: string; tab?: Tab };

/** Reads ?t, ?q and ?tab. Kept separate so the static HTML can render MeetingView without them. */
export function MeetingFromParams(props: Omit<Parameters<typeof MeetingView>[0], 'initial'>) {
  const params = useSearchParams();
  const initial: Initial = { t: Number(params.get('t')) || undefined, q: params.get('q') ?? undefined, tab: (params.get('tab') as Tab) || undefined };
  return <MeetingView {...props} initial={initial} />;
}

export function MeetingView({
  meeting,
  readOnly = false,
  bounds = null,
  header,
  initial = {},
}: {
  meeting: Meeting;
  readOnly?: boolean;
  bounds?: [number, number] | null;
  header?: React.ReactNode;
  initial?: Initial;
}) {
  // Deep link: /meetings/x?t=754.2 opens at that moment (seeked before first render).
  const [player] = useState(() => {
    const p = createPlayer(meeting.duration, bounds);
    if (!readOnly && initial.t) p.seek(initial.t);
    return p;
  });
  const [focus, setFocus] = useState<string[]>([]);
  const [query, setQuery] = useState(() => (readOnly ? '' : initial.q ?? ''));
  const [tab, setTab] = useState<Tab>(() => initial.tab || (bounds || initial.q || initial.t ? 'transcript' : 'notes'));
  const [sharing, setSharing] = useState<{ clip?: Highlight } | null>(null);
  const mine = useUserState(selectHighlights(meeting.id));
  const local = useClient();

  useEffect(() => () => player.destroy(), [player]);

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

  const ctx: MeetingCtx = { meeting, player, starts, colorOf, focus, setFocus, query, setQuery, tab, setTab, highlights, createClip, share: (clip) => setSharing({ clip }), jump, readOnly };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'notes', label: 'Summary' },
    { id: 'transcript', label: 'Transcript' },
    { id: 'actions', label: 'Action items', count: meeting.actionItems.length },
    { id: 'clips', label: 'Clips', count: highlights.length },
    ...(readOnly ? [] : [{ id: 'ask' as Tab, label: 'Ask' }]),
  ];

  return (
    <Ctx.Provider value={ctx}>
      <div className={`mx-auto flex w-full max-w-[1480px] flex-col px-4 sm:px-6 ${readOnly ? 'lg:h-dvh' : 'lg:h-[calc(100dvh-4rem)]'}`}>
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pb-5 pt-6">
          <div className="min-w-0">
            {header ??
              (!readOnly && (
                <Link href="/" className="mb-3 inline-flex items-center gap-1.5 text-[14px] text-fg-faint hover:text-fg">
                  <ArrowLeft size={15} /> All meetings
                </Link>
              ))}
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.015em] sm:text-[30px]">{meeting.title}</h1>
            <p className="mt-1.5 text-[15px] text-fg-soft">
              {dateLabel(meeting.startsAt, local)} at {timeLabel(meeting.startsAt, local)} · {minutes(meeting.duration)} · {PLATFORM_LABEL[meeting.platform]}
              {meeting.externalCompany ? ` · with ${meeting.externalCompany}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <AvatarStack ids={meeting.participants} colorOf={colorOf} size={32} max={6} />
            {!readOnly && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(shareUrl(meeting));
                    toast('Meeting link copied');
                  }}
                  aria-label="Copy meeting link"
                  title="Copy link"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-fg-soft transition-colors hover:border-line-strong hover:text-fg"
                >
                  <Link2 size={17} />
                </button>
                <button onClick={() => setSharing({})} className="flex h-10 items-center gap-2 rounded-full bg-coral px-5 text-[15px] font-semibold text-on-coral transition-colors hover:bg-coral-hover">
                  <Share2 size={16} /> Share
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] gap-6 pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,40%)]">
          <div className="quiet-scroll min-h-0 space-y-5 lg:overflow-y-auto lg:pr-1">
            <Stage />
            <PlayerBar />
            <Outline />
          </div>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface" aria-label="Meeting details">
            <div className="quiet-scroll flex shrink-0 gap-1 overflow-x-auto border-b border-line px-4 pt-2" role="tablist" aria-label="Meeting views">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative shrink-0 px-3 pb-3 pt-2.5 text-[15px] transition-colors ${tab === t.id ? 'font-semibold text-fg' : 'text-fg-faint hover:text-fg-soft'}`}
                >
                  {t.label}
                  {t.count != null && t.count > 0 && <span className="ml-1.5 text-[13px] font-normal text-fg-faint tabular">{t.count}</span>}
                  {tab === t.id && <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-coral" />}
                </button>
              ))}
            </div>
            <div className={`min-h-0 ${tab === 'transcript' ? 'h-[72vh] flex-none lg:h-auto lg:flex-1' : 'quiet-scroll max-h-[80vh] flex-1 overflow-y-auto lg:max-h-none'}`} role="tabpanel">
              {tab === 'notes' && <NotesPanel />}
              {tab === 'transcript' && <Transcript />}
              {tab === 'actions' && <ActionsPanel />}
              {tab === 'clips' && <ClipsPanel />}
              {tab === 'ask' && <AskPanel />}
            </div>
          </section>
        </div>
      </div>
      {sharing && <ShareDialog meeting={meeting} clip={sharing.clip} onClose={() => setSharing(null)} />}
      <Toaster />
    </Ctx.Provider>
  );
}
