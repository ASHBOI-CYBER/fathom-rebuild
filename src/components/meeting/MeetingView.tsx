'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, LinkSimple, ShareNetwork } from '@phosphor-icons/react';
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
import { SonarDial } from './SonarDial';
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
  heading,
  initial = {},
}: {
  meeting: Meeting;
  readOnly?: boolean;
  bounds?: [number, number] | null;
  header?: React.ReactNode;
  /** Override the page title (shared clips lead with the clip, not the meeting). */
  heading?: { title: string; byline: string };
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
      const said = meeting.turns.find((t) => t.end >= from + 1) ?? meeting.turns[0];
      const auto = said ? `${said.s === ME ? 'You' : person(said.s).name.split(' ')[0]}: “${said.t.split(/s+/).slice(0, 9).join(' ')}…”` : `Clip at ${clock(from)}`;
      const h: Highlight = { id: `mine-${Date.now()}`, title: title ?? auto, kind, by: ME, start: from, end: Math.max(to, from + 3), mine: true, createdAt: new Date().toISOString() };
      userStore.addHighlight(meeting.id, h);
      return h;
    },
    [meeting.id, meeting.turns],
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

  const clipOnly = readOnly && !!bounds;
  const tabs: { id: Tab; label: string; count?: number }[] = clipOnly
    ? [{ id: 'transcript', label: 'What was said' }]
    : [
    { id: 'notes', label: 'Summary' },
    { id: 'transcript', label: 'Transcript' },
    { id: 'actions', label: 'Action items', count: meeting.actionItems.length },
    { id: 'clips', label: 'Clips', count: highlights.length },
    ...(readOnly ? [] : [{ id: 'ask' as Tab, label: 'Ask' }]),
      ];

  return (
    <Ctx.Provider value={ctx}>
      <div className={`mx-auto flex w-full max-w-[1480px] flex-col px-4 sm:px-6 ${readOnly ? 'lg:h-dvh' : 'lg:h-[calc(100dvh-4rem)]'}`}>
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 pb-6 pt-7">
          <div className="min-w-0">
            {header ??
              (!readOnly && (
                <Link href="/" className="mb-3 inline-flex items-center gap-1.5 text-[14px] text-fg-faint hover:text-fg">
                  <ArrowLeft size={15} /> All meetings
                </Link>
              ))}
            <h1 className="display max-w-[30ch] text-[clamp(36px,3.7vw,54px)] text-fg">{heading?.title ?? meeting.title}</h1>
            <p className="mt-3 text-[15px] text-fg-soft">
              {heading?.byline ?? (
                <>
                  {dateLabel(meeting.startsAt, local)} at {timeLabel(meeting.startsAt, local)} · {minutes(meeting.duration)} · {PLATFORM_LABEL[meeting.platform]}
                  {meeting.externalCompany ? ` · with ${meeting.externalCompany}` : ''}
                </>
              )}
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
                  <LinkSimple size={17} />
                </button>
                <button onClick={() => setSharing({})} className="press flex h-11 items-center gap-2 rounded-full bg-signal px-5 text-[15px] font-semibold text-on-signal hover:bg-signal-hover">
                  <ShareNetwork size={16} /> Share
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] gap-6 pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,40%)]">
          <div className="quiet-scroll relative min-h-0 space-y-5 lg:overflow-y-auto lg:pr-1">
            <div className="rounded-[20px] border border-line bg-surface/50 px-4 py-6 sm:px-8">
              <SonarDial />
            </div>
            <div className="sticky bottom-0 z-10 -mx-1 bg-abyss/85 px-1 pb-1 pt-1 backdrop-blur-md">
              <PlayerBar />
            </div>
            {!clipOnly && <Outline />}
          </div>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-line bg-surface" aria-label="Meeting details">
            <div className="quiet-scroll flex shrink-0 gap-1 overflow-x-auto border-b border-line px-4 pt-2 [mask-image:linear-gradient(to_right,black_82%,transparent)] sm:[mask-image:none]" role="tablist" aria-label="Meeting views">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative shrink-0 px-3 pb-3.5 pt-3 text-[15px] transition-colors ${tab === t.id ? 'font-semibold text-fg' : 'text-fg-soft hover:text-fg'}`}
                >
                  {t.label}
                  {t.count != null && t.count > 0 && <span className="ml-1.5 text-[13px] font-normal text-fg-faint tabular">{' '}{t.count}</span>}
                  {tab === t.id && <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-signal" />}
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
