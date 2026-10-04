'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Scissors } from '@phosphor-icons/react';
import { clock } from '@/lib/format';
import { person } from '@/lib/people';
import type { Meeting } from '@/lib/types';
import { Wordmark } from './Brand';
import { MeetingView } from './meeting/MeetingView';

/** Reads ?from, ?to and ?title for clip links. */
export function SharedMeeting({ meeting }: { meeting: Meeting }) {
  const params = useSearchParams();
  const from = Number(params.get('from'));
  const to = Number(params.get('to'));
  const clip = params.has('from') && Number.isFinite(from) && Number.isFinite(to) && to > from ? { from, to, title: params.get('title') } : null;
  return <SharedView meeting={meeting} clip={clip} />;
}

/** What someone who wasn't on the call sees: no account, read-only, optionally one clip. */
export function SharedView({ meeting, clip }: { meeting: Meeting; clip: { from: number; to: number; title: string | null } | null }) {
  const bounds: [number, number] | null = clip ? [Math.max(0, clip.from), Math.min(meeting.duration, clip.to)] : null;

  const header = (
    <div className="mb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-4">
          <Wordmark />
          <span className="hidden text-[14px] text-fg-faint sm:inline">Shared with you by {person(meeting.host).name}</span>
        </span>
        {clip ? (
          <Link href={`/share/${meeting.id}/`} className="rounded-full border border-line px-4 py-2 text-[14px] font-semibold text-fg-soft hover:border-line-strong hover:text-fg">
            Watch the whole meeting
          </Link>
        ) : (
          <Link href="/" className="text-[14px] text-fg-faint underline-offset-4 hover:text-fg hover:underline">
            Explore the demo workspace
          </Link>
        )}
      </div>
      {clip && bounds && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-signal-soft px-4 py-3">
          <Scissors size={17} className="mt-0.5 shrink-0 text-signal" />
          <p className="text-[15px] text-fg">
            <b>{clip.title || 'A clip'}</b>
            <span className="text-fg-soft">
              {' '}
              · {clock(bounds[0])} to {clock(bounds[1])}. Press play to watch just this part.
            </span>
          </p>
        </div>
      )}
    </div>
  );

  return <MeetingView key={clip ? `${clip.from}-${clip.to}` : 'full'} meeting={meeting} readOnly bounds={bounds} header={header} />;
}
