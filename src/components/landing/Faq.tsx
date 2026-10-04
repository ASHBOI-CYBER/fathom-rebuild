'use client';
import { useId, useState } from 'react';
import { Plus } from '@phosphor-icons/react';

const REPO = 'https://github.com/ASHBOI-CYBER/fathom-rebuild';

const QA: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Does a bot join my call?',
    a: 'Yes, as a guest called “Sounding notetaker”, so everyone on the call can see it is being recorded. You can switch it off for any meeting on the Upcoming page, or remove it from the call like any other guest.',
  },
  {
    q: 'Who can see a clip I share?',
    a: 'Only what is inside it: that stretch of the recording and the words said in it. The rest of the meeting, its notes and its action items stay with your team.',
  },
  {
    q: 'Can I search across every call?',
    a: 'Yes. Type a word or a name and every place it was said shows up, across all your calls. Pick one and the recording opens at that second.',
  },
  {
    q: 'What is the ring picture?',
    a: 'A sonar print. Each ring is one person, loudest on the outside, and each arc is a time they spoke, clockwise from the top. A one-sided pitch and a real debate look nothing alike, so you can tell calls apart at a glance.',
  },
  {
    q: 'Does it hold up with eight people for an hour?',
    a: 'That is the call at the top of this page: Q4 planning, eight people, 66 minutes, 298 turns. Every voice keeps its own colour and ring, and the notes split into chapters you can jump between.',
  },
  {
    q: 'What in this demo is real?',
    a: (
      <>
        Everything you can click: playback, the transcript, search, note templates, clips and share links all work in your browser. The capture is simulated: the
        ten calls are written scripts timed like real speech, and no bot joins a real meeting from here.{' '}
        <a href={REPO} className="font-semibold text-fg underline decoration-[rgba(11,26,34,0.3)] underline-offset-4 hover:decoration-current">
          Read how it was built
        </a>
        .
      </>
    ),
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);
  const id = useId();
  return (
    <section id="questions" data-tone="light" className="tone-light scroll-mt-24 bg-[linear-gradient(to_bottom,#e8eff1,#f1f6f7)] py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <h2 className="display text-[clamp(52px,6vw,96px)] uppercase leading-[0.86] text-fg">Plain answers.</h2>
          <p className="mt-5 max-w-[34ch] text-[17px] leading-relaxed text-fg-soft">The things people ask before they let something sit in on their calls.</p>
        </div>
        <ul className="border-t border-line">
          {QA.map((item, i) => {
            const on = open === i;
            return (
              <li key={item.q} className="border-b border-line">
                <h3>
                  <button
                    id={`${id}-q${i}`}
                    aria-expanded={on}
                    aria-controls={`${id}-a${i}`}
                    onClick={() => setOpen(on ? -1 : i)}
                    className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className="text-[20px] font-semibold leading-snug text-fg sm:text-[22px]">{item.q}</span>
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                        on ? 'rotate-45 bg-[#0b1a22] text-[#e4ecef] ring-[#0b1a22]' : 'text-fg ring-[rgba(11,26,34,0.18)] group-hover:bg-white'
                      }`}
                    >
                      <Plus size={16} weight="bold" />
                    </span>
                  </button>
                </h3>
                <div
                  id={`${id}-a${i}`}
                  role="region"
                  aria-labelledby={`${id}-q${i}`}
                  className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${on ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden" inert={!on}>
                    <p className="max-w-[62ch] pb-7 pr-14 text-[17px] leading-relaxed text-fg-soft">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
