'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LinkSimple, MagnifyingGlass } from '@phosphor-icons/react';
import { personColor } from '@/lib/people';
import { clamp, easeInOut, easeOut, prefersReducedMotion, span, useScrub } from './progress';
import type { StreamLine } from './types';

const BEATS = [
  { word: 'Record', line: 'It joins your call as a named guest and writes down every word, with a name on each line.' },
  { word: 'Find', line: 'Search one word and land on the second it was said, in any call you’ve had.' },
  { word: 'Share', line: 'Clip the moment and send the link. They get those seconds and nothing else.' },
];

type Props = { lines: StreamLine[]; hit: number; clip: number[]; query: string; title: string; clipLength: string };

/**
 * How it works, told on a real transcript. The page pins while the call
 * streams past: first it is written down, then one word is caught by a
 * search, then two lines lift out as a clip someone else can open.
 */
export function Signal({ lines, hit, clip, query, title, clipLength }: Props) {
  const sec = useRef<HTMLElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const stream = useRef<HTMLOListElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const mark = useRef<HTMLSpanElement>(null);
  const searchBox = useRef<HTMLDivElement>(null);
  const typed = useRef<HTMLSpanElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const cardFoot = useRef<HTMLDivElement>(null);
  const bracket = useRef<HTMLSpanElement>(null);
  const rail = useRef<HTMLSpanElement>(null);
  const geo = useRef({ hitTop: 0, viewH: 0 });
  const beatRef = useRef(-1);
  const [beat, setBeat] = useState(0);

  const hitIndex = lines.findIndex((l) => l.id === hit);
  const clipLines = lines.filter((l) => clip.includes(l.id));

  const measure = useCallback(() => {
    const el = items.current[hitIndex];
    geo.current = { hitTop: el?.offsetTop ?? 0, viewH: view.current?.clientHeight ?? 0 };
  }, [hitIndex]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (view.current) ro.observe(view.current);
    return () => ro.disconnect();
  }, [measure]);

  useScrub(sec, (raw) => {
    const p = prefersReducedMotion() ? 0.82 : raw;
    const b1 = span(p, 0.02, 0.3);
    const b2 = span(p, 0.36, 0.62);
    const b3 = span(p, 0.7, 0.92);
    const now = p < 0.34 ? 0 : p < 0.68 ? 1 : 2;
    if (now !== beatRef.current) {
      beatRef.current = now;
      setBeat(now);
    }
    if (!geo.current.viewH) measure();
    const { hitTop, viewH } = geo.current;
    const yHit = -(hitTop - viewH * 0.34);
    const y = yHit * (0.55 * easeInOut(b1) + 0.45 * easeInOut(b2));
    if (stream.current) {
      stream.current.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      stream.current.style.filter = b3 > 0 ? `blur(${(b3 * 2.5).toFixed(2)}px)` : '';
    }
    const n = lines.length;
    items.current.forEach((li, i) => {
      if (!li) return;
      const written = clamp(b1 * (n + 3) - i);
      const isHit = i === hitIndex;
      const dim = isHit ? 1 - 0.3 * b3 : 1 - 0.74 * easeOut(b2) - 0.1 * b3;
      li.style.opacity = (written * dim).toFixed(3);
      li.style.transform = `translate3d(0, ${((1 - written) * 10).toFixed(1)}px, 0)`;
    });
    if (mark.current) {
      const m = easeOut(span(b2, 0.4, 0.75));
      mark.current.style.transform = `scaleX(${m.toFixed(3)})`;
      mark.current.parentElement?.classList.toggle('caught', m > 0.55);
    }
    if (searchBox.current) {
      const o = span(b2, 0, 0.18);
      searchBox.current.style.opacity = o.toFixed(3);
      searchBox.current.style.transform = `translate3d(0, ${((1 - o) * -8).toFixed(1)}px, 0)`;
    }
    if (typed.current) typed.current.textContent = query.slice(0, Math.round(span(b2, 0.08, 0.4) * query.length));
    if (card.current) {
      const e = easeOut(b3);
      card.current.style.opacity = b3 > 0.001 ? '1' : '0';
      card.current.style.top = `${(viewH * 0.34).toFixed(1)}px`;
      card.current.style.transform = `translate3d(${(e * 7).toFixed(2)}%, ${(e * -26).toFixed(1)}px, 0) rotate(${(e * -2.4).toFixed(2)}deg) scale(${(1 + e * 0.04).toFixed(3)})`;
      card.current.style.boxShadow = `0 ${Math.round(e * 40)}px ${Math.round(e * 80)}px -${Math.round(e * 30)}px rgba(0,0,0,${(e * 0.7).toFixed(2)})`;
    }
    if (cardFoot.current) cardFoot.current.style.opacity = span(b3, 0.45, 0.85).toFixed(3);
    if (bracket.current) bracket.current.style.transform = `scaleY(${easeOut(span(b3, 0, 0.35)).toFixed(3)})`;
    if (tilt.current) {
      const t = 1 - easeInOut(span(p, 0, 0.55));
      tilt.current.style.transform = `perspective(1500px) rotateY(${(-15 * t).toFixed(2)}deg) rotateX(${(7 * t).toFixed(2)}deg) scale(${(0.94 + 0.06 * (1 - t)).toFixed(3)})`;
    }
    if (rail.current) rail.current.style.transform = `scaleY(${p.toFixed(4)})`;
  });

  return (
    <section ref={sec} id="how" className="relative h-[360vh] scroll-mt-0 bg-abyss motion-reduce:h-auto">
      <div className="sticky top-0 flex h-[100dvh] min-h-[640px] items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_70%_50%,rgba(111,189,180,0.07),transparent_70%)]" />
        <div className="relative mx-auto grid w-full max-w-[1400px] gap-8 px-5 pt-20 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16 lg:pt-0">
          {/* the three words */}
          <div className="relative lg:pl-8">
            <span className="absolute inset-y-2 left-0 hidden w-px bg-line-strong lg:block">
              <span ref={rail} className="absolute inset-0 origin-top bg-signal" style={{ transform: 'scaleY(0)' }} />
            </span>
            <p className="mb-5 text-[14px] text-fg-faint lg:mb-8">How it works, on a real call</p>
            <ol className="flex gap-5 lg:block">
              {BEATS.map((b, i) => (
                <li key={b.word} aria-current={beat === i ? 'step' : undefined}>
                  <h3
                    className={`display text-[clamp(40px,7.2vw,124px)] uppercase leading-[0.86] transition-[opacity,color] duration-500 ${beat === i ? 'text-fg opacity-100' : 'text-fg opacity-[0.16]'}`}
                  >
                    {b.word}.
                  </h3>
                  <div className={`hidden transition-[grid-template-rows] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:grid ${beat === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <p className="max-w-[36ch] overflow-hidden text-[19px] leading-relaxed text-fg-soft">
                      <span className="block pb-6 pt-3">{b.line}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-3 min-h-[3.2em] max-w-[44ch] text-[16px] leading-relaxed text-fg-soft lg:hidden" aria-live="polite">
              {BEATS[beat].line}
            </p>
          </div>

          {/* the call, streaming past */}
          <div ref={tilt} className="origin-left will-change-transform">
            <div className="rounded-[30px] bg-white/[0.03] p-2 ring-1 ring-white/10">
              <div className="relative overflow-hidden rounded-[23px] bg-[#0c151c]/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="relative flex h-14 items-center gap-3 border-b border-line px-5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-signal/60" />
                    <span className="relative h-2.5 w-2.5 rounded-full bg-signal" />
                  </span>
                  <span className="truncate text-[14px] text-fg-soft">{title}</span>
                  <div
                    ref={searchBox}
                    className="absolute right-3 top-1/2 -mt-[18px] flex h-9 items-center gap-2 rounded-full border border-signal/40 bg-[#14212b] pl-3 pr-4 text-[14px] text-fg opacity-0"
                  >
                    <MagnifyingGlass size={15} className="text-signal" />
                    <span ref={typed} className="min-w-[5ch]" />
                    <span className="h-4 w-px animate-pulse bg-signal" />
                  </div>
                </div>

                <div ref={view} className="relative h-[min(470px,48dvh)] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_86%,transparent)]">
                  <ol ref={stream} className="px-5 pt-6 will-change-transform">
                    {lines.map((l, i) => (
                      <li
                        key={l.id}
                        ref={(el) => {
                          items.current[i] = el;
                        }}
                        className="grid grid-cols-[46px_minmax(0,1fr)] gap-3 py-2.5 opacity-0"
                      >
                        <span className="pt-0.5 text-[12.5px] tabular text-fg-faint">{l.at}</span>
                        <span>
                          <span className="text-[13px] font-semibold" style={{ color: personColor(l.speaker) }}>
                            {l.name}
                          </span>
                          <span className="mt-0.5 block text-[16px] leading-snug text-fg">{i === hitIndex ? <Hit text={l.text} query={query} markRef={mark} /> : l.text}</span>
                        </span>
                      </li>
                    ))}
                  </ol>

                  {/* the clip: the same lines, lifted out */}
                  <div ref={card} className="absolute inset-x-3 origin-left rounded-[18px] bg-[#16242e] px-2 opacity-0 ring-1 ring-white/10" style={{ top: 0 }}>
                    <span ref={bracket} className="absolute inset-y-3 left-0 w-[3px] origin-top rounded-full bg-signal" style={{ transform: 'scaleY(0)' }} />
                    <ol>
                      {clipLines.map((l) => (
                        <li key={l.id} className="grid grid-cols-[46px_minmax(0,1fr)] gap-3 py-2.5">
                          <span className="pt-0.5 text-[12.5px] tabular text-fg-faint">{l.at}</span>
                          <span>
                            <span className="text-[13px] font-semibold" style={{ color: personColor(l.speaker) }}>
                              {l.name}
                            </span>
                            <span className="mt-0.5 block text-[16px] leading-snug text-fg">{l.text}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                    <div ref={cardFoot} className="flex items-center gap-2 border-t border-line px-1 py-3 text-[13px] text-fg-soft opacity-0">
                      <LinkSimple size={15} className="text-signal" />
                      Link copied. They’ll see these {clipLength}, nothing else.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Hit({ text, query, markRef }: { text: string; query: string; markRef: React.RefObject<HTMLSpanElement | null> }) {
  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="relative inline-block">
        <span ref={markRef} className="absolute -inset-x-1 -inset-y-0.5 origin-left rounded-[5px] bg-signal" style={{ transform: 'scaleX(0)' }} />
        <span className="relative transition-colors duration-300 [.caught_&]:text-on-signal">{text.slice(at, at + query.length)}</span>
      </span>
      {text.slice(at + query.length)}
    </>
  );
}
