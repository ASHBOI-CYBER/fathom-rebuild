import type { Metadata } from 'next';
import { ClipsLibrary } from '@/components/ClipsLibrary';
import { getIndex } from '@/lib/data';

export const metadata: Metadata = { title: 'Clips' };

export default function ClipsPage() {
  return <ClipsLibrary meetings={getIndex()} />;
}
