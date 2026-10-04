import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { MeetingFromParams, MeetingView } from '@/components/meeting/MeetingView';
import { getMeeting, meetingIds } from '@/lib/data';

export const dynamicParams = false;

export function generateStaticParams() {
  return meetingIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: getMeeting(id)?.title ?? 'Meeting' };
}

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = getMeeting(id);
  if (!meeting) notFound();
  return (
    // The fallback is the full meeting, so the static HTML has real content;
    // the param-aware version (deep links like ?t=&q=) takes over on the client.
    <Suspense fallback={<MeetingView meeting={meeting} />}>
      <MeetingFromParams meeting={meeting} />
    </Suspense>
  );
}
