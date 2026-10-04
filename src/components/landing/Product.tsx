'use client';
import { useEffect, useRef, useState } from 'react';
import { CursorClick, LockSimple } from '@phosphor-icons/react';
import { easeOut, enterProgress, useScrub } from './progress';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * Not a screenshot: the real meeting page, running inside a browser frame.
 * It stays a picture until you ask to use it, so scrolling past never gets
 * caught inside it.
 */
export function Product({ meetingId }: { meetingId: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1440, h: 880, scale: 0, cw: 0 });
  const [live, setLive] = useState(false);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const cw = el.clientWidth;
      const narrow = cw < 640;
      const w = narrow ? 400 : 1440;
      const h = narrow ? 780 : 880;
      setSize({ w, h, scale: cw / w, cw });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: '900px 0px' },
    );
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  useScrub(
    frame,
    (p) => {
      const e = easeOut(p);
      if (frame.current) frame.current.style.transform = `perspective(1800px) rotateX(${((1 - e) * 26).toFixed(2)}deg) scale(${(0.9 + 0.1 * e).toFixed(3)})`;
    },
    (el) => enterProgress(el, 0.85),
  );

  const path = `/meetings/${meetingId}/`;

  return (
    <section data-tone="light" className="tone-light relative overflow-x-clip bg-[#dfeaee] pb-28 sm:pb-36">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-6 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-end lg:pb-16">
          <h2 className="display text-[clamp(56px,7.6vw,124px)] uppercase leading-[0.86] text-fg">This isn’t a screenshot.</h2>
          <p className="text-[18px] leading-relaxed text-fg-soft">
            It’s the meeting page from the demo, running inside this one. Press play, click any line to jump there, or select a few words to clip them.
          </p>
        </div>

        <div ref={frame} className="origin-[50%_0%] will-change-transform">
          <div className="rounded-[34px] bg-white/55 p-2 shadow-[0_90px_140px_-70px_rgba(11,42,58,0.6),0_30px_60px_-40px_rgba(11,42,58,0.3)] ring-1 ring-[rgba(11,26,34,0.08)]">
            <div className="tone-dark overflow-hidden rounded-[27px] bg-abyss ring-1 ring-black/30">
              <div className="flex h-11 items-center gap-3 border-b border-white/5 bg-[#0e1820] px-4">
                <span className="flex gap-1.5" aria-hidden>
                  <span className="h-3 w-3 rounded-full bg-[#2a3a45]" />
                  <span className="h-3 w-3 rounded-full bg-[#2a3a45]" />
                  <span className="h-3 w-3 rounded-full bg-[#2a3a45]" />
                </span>
                <span className="mx-auto flex min-w-0 items-center gap-2 rounded-full bg-[#14212b] px-4 py-1 text-[12.5px] text-fg-faint">
                  <LockSimple size={12} weight="bold" />
                  <span className="truncate">sounding.app{path}</span>
                </span>
                <span className="hidden rounded-md bg-signal-soft px-2 py-0.5 text-[12px] font-semibold text-signal sm:inline">Live demo</span>
              </div>
              <div ref={box} className="relative w-full overflow-hidden" style={{ height: size.scale ? size.h * size.scale : undefined, aspectRatio: size.scale ? undefined : '1440 / 880' }}>
                {load && size.scale > 0 && (
                  <iframe
                    src={`${BASE}${path}`}
                    title="The Sounding meeting page, running live"
                    className="absolute left-0 top-0 origin-top-left border-0"
                    style={{ width: size.w, height: size.h, transform: `scale(${size.scale})` }}
                    tabIndex={live ? 0 : -1}
                  />
                )}
                {!live && (
                  <button
                    onClick={() => setLive(true)}
                    className="group absolute inset-0 flex items-center justify-center bg-[rgba(9,16,23,0.12)] transition-colors duration-500 hover:bg-[rgba(9,16,23,0.32)]"
                    aria-label="Use the live demo here"
                  >
                    <span className="press flex items-center gap-2.5 rounded-full bg-signal py-3 pl-5 pr-6 text-[15px] font-semibold text-on-signal shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
                      <CursorClick size={18} weight="bold" />
                      Try it right here
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
