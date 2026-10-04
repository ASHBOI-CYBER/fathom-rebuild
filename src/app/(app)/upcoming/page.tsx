import type { Metadata } from 'next';
import { Upcoming } from '@/components/Upcoming';

export const metadata: Metadata = { title: 'Upcoming' };

export default function UpcomingPage() {
  return <Upcoming />;
}
