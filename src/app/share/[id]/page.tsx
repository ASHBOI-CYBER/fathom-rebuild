import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { SharedMeeting } from '@/components/SharedMeeting';
import { getMeeting, meetingIds } from '@/lib/data';

export const dynamicParams = false;

export function generateStaticParams() {
  return meetingIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = getMeeting(id);
  return { title: m ? `Shared: ${m.title}` : 'Shared meeting', description: m?.summaries.general?.tldr };
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = getMeeting(id);
  if (!meeting) notFound();
  return (
    <Suspense>
      <SharedMeeting meeting={meeting} />
    </Suspense>
  );
}
