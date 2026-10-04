import Link from 'next/link';
import { personColor } from '@/lib/people';
import type { Quote } from './types';

/**
 * Proof, in the product's own currency: lines actually said in the demo calls.
 * Each one is a link that opens the recording at the second it was said.
 */
export function Quotes({ quotes }: { quotes: Quote[] }) {
  const rows = [quotes.filter((_, i) => i % 2 === 0), quotes.filter((_, i) => i % 2 === 1)];
  return (
    <section className="relative overflow-hidden bg-abyss pb-24 pt-10 sm:pb-32">
      <div className="mx-auto mb-10 flex max-w-[1400px] flex-wrap items-end justify-between gap-4 px-5 sm:px-8">
        <h2 className="max-w-[30ch] text-[22px] font-semibold leading-snug text-fg sm:text-[26px]">Said in the demo calls this fortnight.</h2>
        <p className="max-w-[44ch] text-[15px] text-fg-faint">Click any line and the recording opens on the second it was said.</p>
      </div>
      <div className="marquee-host space-y-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        {rows.map((row, r) => (
          <div key={r} className="flex w-max">
            {[0, 1].map((copy) => (
              <ul
                key={copy}
                aria-hidden={copy === 1}
                className={`marquee flex shrink-0 gap-4 pr-4 ${r ? 'marquee-rev' : ''}`}
                style={{ '--marquee-dur': `${r ? 92 : 80}s` } as React.CSSProperties}
              >
                {row.map((q) => (
                  <li key={q.meetingId + q.start}>
                    <Link
                      href={`/meetings/${q.meetingId}/?t=${q.start}`}
                      tabIndex={copy ? -1 : undefined}
                      className="group block w-[min(440px,82vw)] rounded-[22px] border border-line bg-surface/60 px-6 py-5 transition-colors duration-300 hover:border-line-strong hover:bg-raised"
                    >
                      <span className="block text-[18px] leading-snug text-fg">“{q.text}”</span>
                      <span className="mt-3 flex items-center gap-2 text-[13px] text-fg-faint">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: personColor(q.speaker) }} />
                        <span className="truncate">
                          {q.name}, {q.meeting}
                        </span>
                        <span className="ml-auto shrink-0 tabular text-fg-soft transition-colors group-hover:text-signal">{q.at}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
