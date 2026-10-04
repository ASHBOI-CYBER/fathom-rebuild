'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BookmarkSimple, CheckSquare, FastForward, PhoneDisconnect, Warning } from '@phosphor-icons/react';
import { gsap } from '@/lib/gsap';
import { clock } from '@/lib/format';
import { ME, firstName, speakerColor } from '@/lib/people';
import { createPlayer, turnIndexAt, usePlayer } from '@/lib/player';
import { userStore } from '@/lib/store';
import type { Highlight, HighlightKind, Meeting } from '@/lib/types';
import { Wordmark } from './Brand';
import { Ctx, type MeetingCtx } from './meeting/context';
import { SonarDial } from './meeting/SonarDial';
import { person } from '@/lib/people';
import { toast, Toaster } from './Toast';

const CAPTURE: { kind: HighlightKind; label: string; key: string; icon: typeof BookmarkSimple }[] = [
  { kind: 'bookmark', label: 'Highlight', key: 'h', icon: BookmarkSimple },
  { kind: 'action', label: 'Action item', key: 'a', icon: CheckSquare },
  { kind: 'concern', label: 'Concern', key: 'x', icon: Warning },
];

/**
 * A replay of a real stand-up presented as a live call, standing in for the
 * recording bot. Moments you capture here are filed into the meeting when it ends.
 */
export function LiveCall({ meeting }: { meeting: Meeting }) {
  const router = useRouter();
  const [player] = useState(() => createPlayer(meeting.duration));
  const starts = useMemo(() => meeting.turns.map((t) => t.start), [meeting.turns]);
  const colorOf = (id: string) => speakerColor(meeting.participants, id);
  const time = usePlayer(player, (s) => s.time);
  const rate = usePlayer(player, (s) => s.rate);
  const idx = turnIndexAt(starts, time);
  const [captured, setCaptured] = useState<Highlight[]>([]);
  const [ending, setEnding] = useState(false);
  const feed = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);

  useEffect(() => {
    player.play();
    return () => player.destroy();
  }, [player]);

  useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight, behavior: 'smooth' });
  }, [idx]);

  const capture = (kind: HighlightKind) => {
    const t = player.get().time;
    const turn = meeting.turns[turnIndexAt(starts, t)];
    // Like a good notetaker: reach back to when the current speaker started.
    const from = Math.max(turn ? Math.max(turn.start, t - 40) : t - 20, 0);
    const words = turn ? turn.t.split(/\s+/).slice(0, 8).join(' ') : '';
    const h: Highlight = {
      id: `mine-live-${Date.now()}`,
      title: turn ? `${firstName(turn.s)}: “${words}…”` : `Moment at ${clock(t)}`,
      kind,
      by: ME,
      start: from,
      end: Math.max(t, from + 6),
      mine: true,
      createdAt: new Date().toISOString(),
    };
    setCaptured((c) => [...c, h]);
    toast(`${CAPTURE.find((c) => c.kind === kind)!.label} saved at ${clock(t)}`);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea')) return;
      const c = CAPTURE.find((x) => x.key === e.key.toLowerCase());
      if (c && !ending) capture(c.kind);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const end = () => {
    player.pause();
    setEnding(true);
    for (const h of captured) userStore.addHighlight(meeting.id, h);
    let gone = false;
    const go = () => {
      if (gone) return;
      gone = true;
      router.push(`/meetings/${meeting.id}/?tab=clips${captured[0] ? `&t=${Math.floor(captured[0].start)}` : ''}`);
    };
    requestAnimationFrame(() => {
      if (!overlay.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return void window.setTimeout(go, 1200);
      const steps = overlay.current.querySelectorAll('.step');
      const tl = gsap.timeline({ onComplete: go });
      tl.from(overlay.current, { opacity: 0, duration: 0.25 });
      steps.forEach((s) => tl.fromTo(s, { opacity: 0.25 }, { opacity: 1, duration: 0.25 }, '+=0.45').to(s.querySelector('.tick'), { scale: 1, duration: 0.2, ease: 'back.out(3)' }, '<'));
      // Backstop if animation frames are throttled.
      window.setTimeout(go, 4500);
    });
  };

  const ctx = { meeting, player, starts, colorOf, focus: [], setFocus: () => {}, query: '', setQuery: () => {}, tab: 'notes', setTab: () => {}, highlights: [], createClip: () => captured[0], share: () => {}, jump: () => {}, readOnly: true } as unknown as MeetingCtx;

  const shown = meeting.turns.slice(Math.max(0, idx - 30), idx + 1);
  const current = meeting.turns[idx];

  return (
    <Ctx.Provider value={ctx}>
      <div className="flex min-h-dvh flex-col text-fg">
        <header className="flex flex-wrap items-center gap-5 border-b border-line px-4 py-3.5 sm:px-6">
          <Wordmark />
          <div className="min-w-0">
            <div className="display truncate text-[26px] text-fg">{meeting.title}</div>
            <div className="flex items-center gap-2 text-[13px] text-fg-faint">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff4d6d]" /> Recording · {clock(time)} · Google Meet
            </div>
          </div>
          <button
            onClick={() => player.setRate(rate === 1 ? 4 : 1)}
            className={`ml-auto flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] ${rate > 1 ? 'border-signal/60 bg-signal-soft text-signal' : 'border-line text-fg-soft hover:border-line-strong hover:text-fg'}`}
          >
            <FastForward size={14} /> {rate > 1 ? 'Fast-forwarding 4×' : 'Fast-forward the demo'}
          </button>
        </header>

        <div className="mx-auto grid w-full max-w-[1480px] flex-1 gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex flex-col gap-5">
            <div className="rounded-[28px] border border-line bg-surface/60 px-4 py-6 sm:px-8">
              <SonarDial live />
              <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2" aria-label="On the call">
                {meeting.participants.map((id) => (
                  <li key={id} className="flex items-center gap-2 text-[14px] text-fg-soft">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorOf(id) }} />
                    {person(id).name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {CAPTURE.map((c) => (
                <button
                  key={c.kind}
                  disabled={ending}
                  onClick={() => capture(c.kind)}
                  className="flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-3 text-[15px] font-semibold text-fg hover:border-line-strong hover:bg-raised disabled:opacity-40"
                >
                  <c.icon size={16} /> {c.label}
                  <kbd className="rounded-md border border-line px-1.5 text-[11px] font-normal text-fg-faint">{c.key.toUpperCase()}</kbd>
                </button>
              ))}
              <button onClick={end} disabled={ending} className="flex items-center gap-2 rounded-full bg-[#ff4d6d] px-5 py-3 text-[15px] font-semibold text-white hover:bg-[#ff6b85] disabled:opacity-40">
                <PhoneDisconnect size={16} /> End call and get notes
              </button>
            </div>
            <p className="mx-auto max-w-[60ch] text-center text-[13px] text-fg-faint">
              Simulated: a replay of a recorded stand-up standing in for the recording bot. Highlights reach back to when the speaker started.
            </p>
          </div>

          <aside className="flex min-h-[380px] flex-col overflow-hidden rounded-2xl border border-line bg-surface lg:max-h-[calc(100dvh-120px)]">
            <div className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-[15px] font-semibold">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff4d6d]" /> Live transcript
            </div>
            <div ref={feed} className="quiet-scroll flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {shown
                .filter((t) => t.start <= time)
                .map((t) => {
                  const isNow = t.id === current?.id;
                  const words = t.t.split(/\s+/);
                  const upto = isNow ? Math.max(1, Math.ceil(((time - t.start) / (t.end - t.start)) * words.length)) : words.length;
                  return (
                    <div key={t.id}>
                      <span className="text-[14px] font-semibold" style={{ color: colorOf(t.s) }}>
                        {firstName(t.s)} <span className="ml-1 text-[13px] font-normal text-fg-faint tabular">{clock(t.start)}</span>
                      </span>
                      <p className="text-[15px] leading-relaxed text-fg-soft">{words.slice(0, upto).join(' ')}</p>
                    </div>
                  );
                })}
            </div>
            <div className="border-t border-line px-5 py-4">
              <div className="mb-2 text-[14px] font-semibold">Captured during the call · {captured.length}</div>
              {captured.length ? (
                <ul className="max-h-36 space-y-1.5 overflow-y-auto">
                  {captured.map((h) => (
                    <li key={h.id} className="flex items-baseline gap-2.5 text-[14px] text-fg-soft">
                      <span className="text-fg-faint tabular">{clock(h.start)}</span>
                      <span className="truncate">{h.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] leading-relaxed text-fg-faint">Press Highlight when something matters. It lands in the meeting’s clips when you hang up.</p>
              )}
            </div>
          </aside>
        </div>

        {ending && (
          <div ref={overlay} className="fixed inset-0 z-50 flex items-center justify-center bg-abyss/95 px-6 backdrop-blur">
            <div className="w-full max-w-[360px]">
              <p className="mb-6 text-[26px] font-semibold">Wrapping up your call</p>
              {[
                'Saving the recording',
                `Transcribing ${meeting.participants.length} speakers`,
                'Writing notes and action items',
                `Filing your ${captured.length} ${captured.length === 1 ? 'highlight' : 'highlights'}`,
              ].map((s) => (
                <div key={s} className="step flex items-center gap-3.5 py-2 text-[17px] opacity-25">
                  <span className="tick flex h-6 w-6 scale-0 items-center justify-center rounded-full bg-signal text-[13px] font-bold text-on-signal">✓</span>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}
        <Toaster />
      </div>
    </Ctx.Provider>
  );
}
