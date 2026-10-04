'use client';
import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/** False during prerender and hydration, true after — for viewer-local dates. */
export function useClient() {
  return useSyncExternalStore(noop, () => true, () => false);
}
