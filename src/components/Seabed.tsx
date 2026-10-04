'use client';
import { useEffect, useRef } from 'react';
import type { MeetingIndex } from '@/lib/types';

/**
 * The home-page seabed: every ridge is one meeting, read left to right. Height
 * is how lively the talk was at that moment (speaker changes and overlap), so
 * debates rise into peaks and monologues lie flat. Rendered as a sonar point
 * cloud with three.js, loaded lazily so it never blocks the page.
 */
export function Seabed({ meetings }: { meetings: MeetingIndex[] }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    import('three').then((THREE) => {
      if (disposed) return;
      const COLS = 220;
      const ROWS_PER = 7;
      const rows = meetings.slice().reverse(); // oldest at the back
      const ROWS = rows.length * ROWS_PER + 6;

      // Liveliness curve per meeting, sampled across its own duration.
      const curves = rows.map((m) => {
        const out = new Float32Array(COLS);
        const win = m.duration / COLS;
        for (const [, s, e] of m.segments) {
          const c0 = Math.floor(s / win);
          out[Math.min(COLS - 1, c0)] += 1.2; // a new voice
          for (let c = c0; c <= Math.min(COLS - 1, Math.floor(e / win)); c++) out[c] += 0.12; // sustained talk
        }
        // smooth
        const sm = new Float32Array(COLS);
        for (let c = 0; c < COLS; c++) {
          let a = 0;
          let n = 0;
          for (let k = -4; k <= 4; k++) {
            const j = c + k;
            if (j >= 0 && j < COLS) {
              const w = 5 - Math.abs(k);
              a += out[j] * w;
              n += w;
            }
          }
          sm[c] = a / n;
        }
        const max = Math.max(...sm) || 1;
        return sm.map((v) => v / max);
      });

      const W = 34;
      const D = 26;
      const positions = new Float32Array(COLS * ROWS * 3);
      const colors = new Float32Array(COLS * ROWS * 3);
      const deep = new THREE.Color('#2b5a73');
      const mid = new THREE.Color('#8fd6cd');
      const hot = new THREE.Color('#ebc95c');
      const tmp = new THREE.Color();
      const hash = (x: number, y: number) => {
        const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        return s - Math.floor(s);
      };
      let p = 0;
      for (let r = 0; r < ROWS; r++) {
        const f = (r - 3) / ROWS_PER;
        const i0 = Math.max(0, Math.min(rows.length - 1, Math.floor(f)));
        const i1 = Math.max(0, Math.min(rows.length - 1, i0 + 1));
        const tt = Math.max(0, Math.min(1, f - Math.floor(f)));
        const ease = tt * tt * (3 - 2 * tt);
        const onRidge = Math.abs(f - Math.round(f)) < 0.5 / ROWS_PER;
        for (let c = 0; c < COLS; c++) {
          const v = curves[i0][c] * (1 - ease) + curves[i1][c] * ease;
          const swell = Math.sin(c * 0.045 + r * 0.31) * 0.18 + Math.sin(c * 0.013 - r * 0.07) * 0.35;
          const y = v * (onRidge ? 3.6 : 2.8) + swell + (hash(c, r) - 0.5) * 0.08;
          positions[p] = (c / (COLS - 1) - 0.5) * W;
          positions[p + 1] = y;
          positions[p + 2] = (r / (ROWS - 1) - 0.5) * D;
          const h = Math.max(0, Math.min(1, (y + 0.4) / 3.2));
          if (h < 0.55) tmp.copy(deep).lerp(mid, h / 0.55);
          else tmp.copy(mid).lerp(hot, (h - 0.55) / 0.45);
          if (onRidge) tmp.lerp(hot, 0.18);
          colors[p] = tmp.r;
          colors[p + 1] = tmp.g;
          colors[p + 2] = tmp.b;
          p += 3;
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 1, sizeAttenuation: true, depthWrite: false });
      const cloud = new THREE.Points(geo, mat);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x091017, 0.034);
      scene.add(cloud);

      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';

      const size = () => {
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      size();

      let px = 0;
      let py = 0;
      const onPointer = (e: PointerEvent) => {
        px = e.clientX / window.innerWidth - 0.5;
        py = e.clientY / window.innerHeight - 0.5;
      };
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const t0 = performance.now();
      const frame = () => {
        const t = reduce ? 0 : (performance.now() - t0) / 1000;
        camera.position.set(-3.5 + Math.sin(t * 0.05) * 2.5 + px * 2.5, 5.4 - py * 1.2, 12.5 - Math.sin(t * 0.04) * 1.5);
        camera.lookAt(3.5 + px * 1.5, 0.4, -3);
        cloud.rotation.y = Math.sin(t * 0.03) * 0.06;
        renderer.render(scene, camera);
      };
      frame(); // a still frame immediately, even if animation frames never come

      let visible = true;
      const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
      io.observe(el);
      if (!reduce) {
        renderer.setAnimationLoop(() => visible && !document.hidden && frame());
        window.addEventListener('pointermove', onPointer, { passive: true });
      }
      const ro = new ResizeObserver(() => {
        size();
        frame();
      });
      ro.observe(el);

      cleanup = () => {
        renderer.setAnimationLoop(null);
        window.removeEventListener('pointermove', onPointer);
        io.disconnect();
        ro.disconnect();
        geo.dispose();
        mat.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [meetings]);

  return <div ref={host} className="absolute inset-0" aria-hidden />;
}
