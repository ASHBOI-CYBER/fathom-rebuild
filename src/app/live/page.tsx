import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LiveCall } from '@/components/LiveCall';
import { getMeeting } from '@/lib/data';

export const metadata: Metadata = { title: 'Live call' };

export default function LivePage() {
  const meeting = getMeeting('routing-standup');
  if (!meeting) notFound();
  return <LiveCall meeting={meeting} />;
}
