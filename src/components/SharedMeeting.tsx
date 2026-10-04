'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Scissors } from 'lucide-react';
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
  const isClip = !!clip;
  const from = clip?.from ?? 0;
  const to = clip?.to ?? 0;
  const title = clip?.title;
  const bounds: [number, number] | null = isClip ? [Math.max(0, from), Math.min(meeting.duration, to)] : null;

  const header = (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <span className="flex items-center gap-3">
        <Wordmark />
        <span className="hidden text-[13px] text-ink-faint sm:inline">Shared by {person(meeting.host).name}</span>
      </span>
      {isClip ? (
        <Link href={`/share/${meeting.id}/`} className="rounded-lg border border-rule bg-paper px-3 py-1.5 text-[13px] font-semibold hover:border-ink-faint">
          Watch the whole meeting
        </Link>
      ) : (
        <Link href="/" className="text-[13px] font-medium text-ink-soft hover:text-ink hover:underline">
          Open the demo workspace
        </Link>
      )}
    </div>
  );

  return (
    <div className="min-h-dvh bg-chart">
      {isClip && bounds && (
        <div className="flex items-center gap-2 bg-ink px-4 py-2 text-[13px] text-white sm:px-6">
          <Scissors size={14} className="shrink-0 text-[#f2a5c9]" />
          <span className="truncate">
            <b>{title || 'A clip'}</b>
            <span className="text-white/65">
              {' '}
              · {clock(bounds[0])}–{clock(bounds[1])} of {meeting.title}
            </span>
          </span>
        </div>
      )}
      <MeetingView key={isClip ? `${from}-${to}` : 'full'} meeting={meeting} readOnly bounds={bounds} header={header} />
    </div>
  );
}
