'use client';
// The capture layer is stubbed, so "playback" is a clock: a tiny external store
// that advances in requestAnimationFrame while playing. Components subscribe to
// just the slice they need (e.g. the active turn), so a 60fps clock doesn't
// re-render the whole transcript.
import { useSyncExternalStore } from 'react';

export type PlayerState = { time: number; playing: boolean; rate: number; duration: number; bounds: [number, number] | null };

export function createPlayer(duration: number, bounds: [number, number] | null = null) {
  let state: PlayerState = { time: bounds ? bounds[0] : 0, playing: false, rate: 1, duration, bounds };
  const listeners = new Set<() => void>();
  let raf = 0;
  let last = 0;

  const emit = () => listeners.forEach((l) => l());
  const set = (patch: Partial<PlayerState>) => {
    state = { ...state, ...patch };
    emit();
  };
  const lo = () => (state.bounds ? state.bounds[0] : 0);
  const hi = () => (state.bounds ? state.bounds[1] : state.duration);

  const tick = (now: number) => {
    const dt = (now - last) / 1000;
    last = now;
    const next = state.time + dt * state.rate;
    if (next >= hi()) {
      set({ time: hi(), playing: false });
      return;
    }
    set({ time: next });
    raf = requestAnimationFrame(tick);
  };

  const api = {
    get: () => state,
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    play() {
      if (state.playing) return;
      if (state.time >= hi() - 0.05) state = { ...state, time: lo() };
      last = performance.now();
      set({ playing: true });
      raf = requestAnimationFrame(tick);
    },
    pause() {
      cancelAnimationFrame(raf);
      set({ playing: false });
    },
    toggle() {
      if (state.playing) api.pause();
      else api.play();
    },
    seek(t: number, autoplay = false) {
      set({ time: Math.min(hi(), Math.max(lo(), t)) });
      if (autoplay) api.play();
    },
    skip(d: number) {
      api.seek(state.time + d);
    },
    setRate(rate: number) {
      set({ rate });
    },
    destroy() {
      cancelAnimationFrame(raf);
      listeners.clear();
    },
  };
  return api;
}

export type Player = ReturnType<typeof createPlayer>;

export function usePlayer<T>(player: Player, select: (s: PlayerState) => T): T {
  return useSyncExternalStore(
    player.subscribe,
    () => select(player.get()),
    () => select(player.get()),
  );
}

/** Index of the turn being spoken at time t (binary search on start times). */
export function turnIndexAt(starts: number[], t: number) {
  let lo = 0;
  let hi = starts.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= t) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}
