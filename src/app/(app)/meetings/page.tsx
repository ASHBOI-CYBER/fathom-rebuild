import type { Metadata } from 'next';
import { MeetingList } from '@/components/MeetingList';
import { getIndex } from '@/lib/data';

export const metadata: Metadata = { title: 'Meetings' };

export default function Meetings() {
  return <MeetingList meetings={getIndex()} />;
}
