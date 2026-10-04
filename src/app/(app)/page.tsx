import { MeetingList } from '@/components/MeetingList';
import { getIndex } from '@/lib/data';

export default function Home() {
  return <MeetingList meetings={getIndex()} />;
}
