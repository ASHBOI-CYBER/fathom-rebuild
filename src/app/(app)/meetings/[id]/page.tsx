import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { MeetingView } from '@/components/meeting/MeetingView';
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
    <Suspense>
      <MeetingView meeting={meeting} />
    </Suspense>
  );
}
