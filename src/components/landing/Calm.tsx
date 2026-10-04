import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { Wordmark } from '../Brand';

const REPO = 'https://github.com/ASHBOI-CYBER/fathom-rebuild';
const BX = 980; // where the line meets the water
const BY = 700;

/**
 * The surface, at last: calm water, one sounding line, rings spreading from it.
 * Under the surface, faintly, the same print the page opened with.
 */
export function Calm() {
  const rings = [64, 96, 128, 160, 192, 224, 256, 288];
  return (
    <section data-tone="light" className="tone-light relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#e9f1f3]">
      <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="calm-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6f9fa" />
            <stop offset="1" stopColor="#e1ecef" />
          </linearGradient>
          <linearGradient id="calm-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c6dbe0" />
            <stop offset="0.55" stopColor="#a6c4cd" />
            <stop offset="1" stopColor="#89adb9" />
          </linearGradient>
          <radialGradient id="calm-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1600" height="560" fill="url(#calm-sky)" />
        <ellipse cx={BX} cy="560" rx="520" ry="140" fill="url(#calm-sun)" opacity="0.7" />
        <rect y="560" width="1600" height="440" fill="url(#calm-sea)" />
        <rect y="559" width="1600" height="1.5" fill="#fff" opacity="0.8" />
        {/* glints */}
        {[
          [BX - 180, 600, 90],
          [BX + 140, 618, 60],
          [BX - 40, 640, 140],
          [BX + 260, 660, 80],
          [BX - 320, 676, 70],
        ].map(([x, y, w], i) => (
          <rect key={i} x={x} y={y} width={w} height="1.4" rx="0.7" fill="#fff" opacity="0.55" />
        ))}
        {/* the print, seen through still water */}
        <g opacity="0.16" fill="none" stroke="#0b1a22">
          {rings.map((r, i) => (
            <ellipse key={r} cx={BX} cy={BY + 4} rx={r * 1.6} ry={r * 0.27} strokeWidth={i % 3 === 0 ? 3.2 : 2} strokeDasharray={`${18 + ((i * 37) % 70)} ${8 + ((i * 23) % 30)}`} />
          ))}
        </g>
        {/* rings spreading out */}
        {[0, 1, 2, 3, 4].map((i) => (
          <ellipse key={i} className="ripple" cx={BX} cy={BY} rx="640" ry="104" fill="none" stroke="#0b1a22" strokeWidth="1.3" style={{ animationDelay: `${i * 1.8}s` }} />
        ))}
        {/* the sounding line and its weight, bobbing */}
        <g className="bob">
          <line x1={BX} y1="0" x2={BX} y2={BY - 6} stroke="#0b1a22" strokeWidth="1.4" opacity="0.7" />
          <path d={`M${BX} ${BY - 14} L${BX + 9} ${BY} L${BX} ${BY + 14} L${BX - 9} ${BY} Z`} fill="#ebc95c" stroke="#0b1a22" strokeWidth="1" />
        </g>
        <path d={`M${BX} ${BY + 18} L${BX + 8} ${BY + 30} L${BX} ${BY + 42} L${BX - 8} ${BY + 30} Z`} fill="#ebc95c" opacity="0.25" />
      </svg>

      <div className="relative mx-auto w-full max-w-[1400px] flex-1 px-5 pt-32 sm:px-8 sm:pt-40">
        <h2 className="display text-[clamp(72px,12vw,212px)] uppercase leading-[0.84] text-fg">
          Just talk.
          <br />
          We’ll keep it.
        </h2>
        <p className="mt-7 max-w-[40ch] text-[18px] leading-relaxed text-fg-soft sm:text-[20px]">Go into your next call with nothing to write down. Afterwards, everything said is one search away.</p>
        <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
          <Link href="/meetings" className="press group inline-flex items-center gap-3 rounded-full bg-[#0b1a22] py-2 pl-6 pr-2 text-[16px] font-semibold text-[#e4ecef] hover:bg-[#16303b]">
            Open the demo
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-signal text-on-signal transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-105">
              <ArrowRight size={16} weight="bold" />
            </span>
          </Link>
          <span className="text-[14px] text-fg-soft">No sign-up. Ten calls inside, ready to play.</span>
        </div>
      </div>

      <footer className="relative mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-x-8 gap-y-4 px-5 pb-8 pt-24 text-[14px] text-fg sm:px-8">
        <Wordmark />
        <p className="max-w-[52ch] opacity-80">A rebuild of Fathom, made for the 8x take-home. Not affiliated with Fathom.</p>
        <nav aria-label="Footer" className="ml-auto flex gap-5 font-semibold">
          <Link href="/meetings" className="underline-offset-4 hover:underline">
            Demo
          </Link>
          <a href={REPO} className="underline-offset-4 hover:underline">
            Source
          </a>
          <a href="#top" className="underline-offset-4 hover:underline">
            Back to the top
          </a>
        </nav>
      </footer>
    </section>
  );
}
