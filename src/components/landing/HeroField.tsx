'use client';
import { useEffect, useRef, useState } from 'react';
import { R_INNER, R_OUTER, angleAt, ringLayout, type Segment } from '@/lib/sonar';
import { colorIndex } from '@/lib/people';
import { SonarPrint } from '../SonarPrint';
import { clamp, prefersReducedMotion, stickyProgress } from './progress';

// Mirrors --sp-0..7 in globals.css (WebGL can't read CSS variables).
const PALETTE = ['#6fbdb4', '#7f9fd6', '#a895d4', '#cf8f6c', '#93bd7f', '#d697ad', '#bdae8a', '#6fa7c4'];
const PRINT_R = 3; // world units at R_OUTER
const CAM_Z = 12;
const FOV = 38;

type Props = {
  section: React.RefObject<HTMLElement | null>;
  participants: string[];
  talk: Record<string, number>;
  duration: number;
  segments: Segment[];
  chapterStarts: number[];
};

const VERT = /* glsl */ `
attribute vec3 aStart;
attribute vec3 aColor;
attribute float aDelay;
attribute float aSize;
attribute float aKind; // 0 speech, 1 scaffold, 2 drifting dust
uniform float uP;
uniform float uTime;
uniform float uPR;
uniform float uScale;
uniform float uPulse;
uniform float uSolid;
varying vec3 vColor;
varying float vAlpha;

vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

void main() {
  float local = clamp((uP - aDelay * 0.55) / 0.45, 0.0, 1.0);
  float e = aKind > 1.5 ? 0.0 : local * local * (3.0 - 2.0 * local);

  vec3 s = aStart;
  s.xz = rot(s.xz, uTime * (0.045 + 0.02 * aSize));
  s += 0.14 * vec3(sin(uTime * 0.6 + aDelay * 41.0), cos(uTime * 0.5 + aDelay * 29.0), sin(uTime * 0.4 + aDelay * 13.0));

  vec3 t = position;
  t.xy *= 1.0 + uPulse * 0.016 * step(aKind, 0.5);
  vec3 p = mix(s, t, e);
  p.z += sin(e * 3.14159) * 1.4 * (aDelay - 0.45);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPR * uScale * (${CAM_Z.toFixed(1)} / -mv.z);

  vec3 cloud = vec3(0.62, 0.80, 0.86);
  vColor = mix(cloud, aColor, e) + vec3(0.92, 0.79, 0.36) * uPulse * 0.3 * e * step(aKind, 0.5);
  float a;
  if (aKind > 1.5) a = (0.22 + 0.16 * sin(uTime * 1.3 + aDelay * 50.0)) * (1.0 - 0.45 * uP);
  else if (aKind > 0.5) a = mix(0.16, 0.26, e);
  else a = mix(0.5, 0.8, e);
  vAlpha = aKind > 1.5 ? a : a * (1.0 - 0.72 * uSolid);
}`;

const FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  gl_FragColor = vec4(vColor, vAlpha * smoothstep(0.5, 0.05, d));
}`;

// The sweep and the heartbeat ping, drawn on one plane behind the print.
const BEAM_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const BEAM_FRAG = /* glsl */ `
varying vec2 vUv;
uniform float uAngle;
uniform float uOn;
uniform float uPing;
uniform float uRin;
uniform float uRout;
void main() {
  vec2 p = vUv - 0.5;
  float r = length(p);
  float a = atan(p.x, p.y);
  float behind = mod(uAngle - a, 6.28318);
  float inside = smoothstep(uRin * 0.85, uRin, r) * smoothstep(uRout * 1.04, uRout, r);
  float trail = exp(-behind * 2.4) * inside;
  float edge = smoothstep(0.035, 0.0, behind) * inside;
  float pr = mix(uRout * 1.02, uRout * 1.42, uPing);
  float ring = smoothstep(0.0045, 0.0, abs(r - pr)) * (1.0 - uPing) * (1.0 - uPing);
  vec3 col = vec3(0.92, 0.79, 0.36);
  gl_FragColor = vec4(col, (trail * 0.09 + edge * 0.4 + ring * 0.7) * uOn);
}`;

/** Two beats, then rest: the print's heartbeat once it has assembled. */
const PERIOD = 1.7;
const beat = (t: number) => {
  const ph = t % PERIOD;
  return Math.exp(-((ph - 0.04) ** 2) / 0.0025) + 0.55 * Math.exp(-((ph - 0.27) ** 2) / 0.0025);
};

/**
 * The hero: every word of a real call starts as drifting noise and settles,
 * as you scroll, into its sonar print: one ring per person, one arc per time
 * they spoke, clockwise from twelve. Then the sweep starts and the print beats.
 */
export function HeroField({ section, participants, talk, duration, segments, chapterStarts }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const el = host.current;
    const sec = section.current;
    if (!el || !sec) return;
    let disposed = false;
    let cleanup = () => {};

    import('three').then((THREE) => {
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
      } catch {
        setFallback(true);
        return;
      }
      const still = prefersReducedMotion();
      const small = window.innerWidth < 700;
      const N = small ? 6500 : 12000;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
      camera.position.set(0, 0, CAM_Z);

      const group = new THREE.Group();
      scene.add(group);

      // ---- where every point lands ----
      const k = PRINT_R / R_OUTER;
      const layout = ringLayout(participants, talk);
      const toWorld = (r: number, a: number): [number, number] => [r * Math.cos(a) * k, -r * Math.sin(a) * k];

      const nTrack = Math.round(N * 0.12);
      const nChapter = Math.round(N * 0.03);
      const nDust = Math.round(N * 0.13);
      const nSpeech = N - nTrack - nChapter - nDust;

      const pos = new Float32Array(N * 3);
      const start = new Float32Array(N * 3);
      const color = new Float32Array(N * 3);
      const delay = new Float32Array(N);
      const size = new Float32Array(N);
      const kind = new Float32Array(N);
      const c = new THREE.Color();

      // the starting swirl: a three-armed eddy, dense at the heart
      const cloudPoint = (i: number, spread = 1) => {
        const rr = (0.5 + Math.pow(Math.random(), 1.5) * 8) * spread;
        const th = (Math.floor(Math.random() * 3) / 3) * Math.PI * 2 + rr * 0.5 + (Math.random() - 0.5) * (0.5 + rr * 0.08);
        start[i * 3] = Math.cos(th) * rr;
        start[i * 3 + 1] = (Math.random() - 0.5) * (0.5 + rr * 0.22);
        start[i * 3 + 2] = Math.sin(th) * rr * 0.75;
      };

      // weighted pick of turns by length, so long speeches get more points
      const cum: number[] = [];
      let total = 0;
      for (const [, s, e] of segments) {
        total += Math.max(0.5, e - s);
        cum.push(total);
      }
      let i = 0;
      for (let n = 0; n < nSpeech; n++, i++) {
        const x = Math.random() * total;
        let lo = 0;
        let hi = cum.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (cum[mid] < x) lo = mid + 1;
          else hi = mid;
        }
        const [sp, s, e] = segments[lo];
        const id = participants[sp];
        const a0 = angleAt(s, duration);
        const a1 = Math.max(a0, angleAt(e, duration) - 0.004);
        const a = a0 + Math.random() * (a1 - a0);
        const r = (layout.radius.get(id) ?? R_INNER) + (Math.random() - 0.5) * layout.band * 0.46;
        const [wx, wy] = toWorld(r, a);
        pos.set([wx, wy, 0], i * 3);
        cloudPoint(i);
        c.set(PALETTE[colorIndex(id)]);
        color.set([c.r, c.g, c.b], i * 3);
        delay[i] = 0.08 + (s / duration) * 0.72 + Math.random() * 0.2;
        size[i] = 2.1 + Math.random() * 1.5;
        kind[i] = 0;
      }
      // scaffold: one faint track per person, plus the outer and inner bounds
      const tracks = [...layout.radius.values(), R_OUTER + 3, R_INNER - 3];
      for (let n = 0; n < nTrack; n++, i++) {
        const r = tracks[n % tracks.length];
        const a = Math.random() * Math.PI * 2;
        const [wx, wy] = toWorld(r, a);
        pos.set([wx, wy, -0.02], i * 3);
        cloudPoint(i, 1.15);
        c.set('#9db0ba');
        color.set([c.r, c.g, c.b], i * 3);
        delay[i] = Math.random() * 0.25;
        size[i] = 1.5;
        kind[i] = 1;
      }
      // chapter spokes
      const starts = chapterStarts.length ? chapterStarts : [0];
      for (let n = 0; n < nChapter; n++, i++) {
        const a = angleAt(starts[n % starts.length], duration);
        const r = R_INNER - 6 + Math.random() * (R_OUTER - R_INNER + 12);
        const [wx, wy] = toWorld(r, a);
        pos.set([wx, wy, -0.01], i * 3);
        cloudPoint(i, 1.1);
        c.set('#e4ecef');
        color.set([c.r, c.g, c.b], i * 3);
        delay[i] = 0.15 + Math.random() * 0.3;
        size[i] = 1.4;
        kind[i] = 1;
      }
      // dust that never settles: the rest of the sea
      for (; i < N; i++) {
        cloudPoint(i, 1.35);
        pos.set([start[i * 3], start[i * 3 + 1], start[i * 3 + 2]], i * 3);
        c.set(Math.random() < 0.08 ? '#ebc95c' : '#8fb7c4');
        color.set([c.r, c.g, c.b], i * 3);
        delay[i] = Math.random();
        size[i] = 1 + Math.random() * 1.8;
        kind[i] = 2;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
      geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
      geo.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1));
      geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
      geo.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uP: { value: 0 }, uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uScale: { value: 1 }, uPulse: { value: 0 }, uSolid: { value: 0 } },
      });
      const points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      group.add(points);

      const half = PRINT_R * 1.5;
      const beamMat = new THREE.ShaderMaterial({
        vertexShader: BEAM_VERT,
        fragmentShader: BEAM_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uAngle: { value: 0 },
          uOn: { value: 0 },
          uPing: { value: 0 },
          uRin: { value: (R_INNER / R_OUTER) * (0.5 * PRINT_R) / half },
          uRout: { value: (0.5 * PRINT_R) / half },
        },
      });
      const beam = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, half * 2), beamMat);
      beam.position.z = -0.05;
      group.add(beam);

      // ---- framing: the print sits right of the copy on wide screens, above it on tall ones ----
      let fitScale = 1;
      const resize = () => {
        const w = el.clientWidth || window.innerWidth;
        const h = el.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const wide = w >= 900 && w / h > 1.1;
        const sx = wide ? 0.44 : 0;
        const sy = wide ? 0.08 : 0.32;
        camera.projectionMatrix.elements[8] = -sx;
        camera.projectionMatrix.elements[9] = -sy;
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
        const halfH = Math.tan(((FOV / 2) * Math.PI) / 180) * CAM_Z;
        const halfW = halfH * camera.aspect;
        const fit = wide ? Math.min((1 - sx) * halfW * 0.86, halfH * 0.6) : Math.min(halfW * 0.84, (1 - sy) * halfH * 0.78);
        fitScale = fit / PRINT_R;
        // where the print lands on screen, so the crisp drawing can sit exactly on it
        el.style.setProperty('--cx', `${(((1 + sx) / 2) * w).toFixed(1)}px`);
        el.style.setProperty('--cy', `${(((1 - sy) / 2) * h).toFixed(1)}px`);
        el.style.setProperty('--r', `${((fit / halfH) * (h / 2)).toFixed(1)}px`);
        group.scale.setScalar(fitScale);
        mat.uniforms.uScale.value = Math.max(0.6, fitScale);
      };
      resize();

      // ---- motion ----
      let shown = 0; // eased progress, chasing the scroll
      let raf = 0;
      let visible = true;
      let last = performance.now();
      let clock = 0;

      const draw = (now: number, snap = false) => {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        if (!still) clock += dt;
        const target = still ? 1 : stickyProgress(sec) / 0.82; // fully built a little before the pin lets go
        const goal = clamp(target);
        shown = snap ? goal : shown + (goal - shown) * Math.min(1, dt * 5);
        const e = 1 - Math.pow(1 - shown, 3);
        mat.uniforms.uP.value = shown;
        mat.uniforms.uTime.value = clock;
        group.rotation.x = -1.02 * (1 - e);
        group.rotation.z = -0.55 * (1 - e);
        const on = clamp((shown - 0.88) / 0.1);
        const b = still ? 0 : beat(clock) * on;
        mat.uniforms.uPulse.value = b;
        mat.uniforms.uSolid.value = clamp((shown - 0.9) / 0.1);
        beamMat.uniforms.uOn.value = on;
        beamMat.uniforms.uAngle.value = still ? 2.2 : (clock * 0.9) % (Math.PI * 2);
        beamMat.uniforms.uPing.value = still ? 1 : (clock % PERIOD) / PERIOD;
        renderer.render(scene, camera);
      };

      const loop = (now: number) => {
        draw(now);
        raf = visible && !still ? requestAnimationFrame(loop) : 0;
      };
      const kick = () => {
        if (!raf && visible && !still) raf = requestAnimationFrame(loop);
      };
      // Scroll draws a frame directly too, so the scrub never waits on rAF.
      const onScroll = () => {
        if (!visible) return;
        draw(performance.now(), still || !raf);
        kick();
      };

      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) kick();
      });
      io.observe(el);
      const ro = new ResizeObserver(() => {
        resize();
        draw(performance.now(), true);
      });
      ro.observe(el);
      window.addEventListener('scroll', onScroll, { passive: true });
      draw(performance.now(), true);
      kick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener('scroll', onScroll);
        geo.dispose();
        mat.dispose();
        beam.geometry.dispose();
        beamMat.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [section, participants, talk, duration, segments, chapterStarts]);

  return (
    <div ref={host} className="absolute inset-0" aria-hidden>
      {/* the particles settle into this: the print as the app draws it, crisp */}
      {!fallback && (
        <div
          className="absolute"
          style={{
            left: 'calc(var(--cx, 70%) - var(--r, 0px) * 1.1087)',
            top: 'calc(var(--cy, 50%) - var(--r, 0px) * 1.1087)',
            width: 'calc(var(--r, 0px) * 2.2174)',
            opacity: 'clamp(0, calc((var(--p) - 0.88) * 9), 1)',
          }}
        >
          <SonarPrint participants={participants} talk={talk} duration={duration} segments={segments} chapterStarts={chapterStarts} detail className="h-auto w-full" />
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="display text-[clamp(28px,calc(var(--r,200px)*0.16),64px)] tabular leading-none text-fg">{Math.floor(duration / 60)}:{String(Math.round(duration % 60)).padStart(2, '0')}</span>
            <span className="mt-1.5 text-[clamp(11px,calc(var(--r,200px)*0.045),15px)] text-fg-soft">{participants.length} voices</span>
          </span>
        </div>
      )}
      {fallback && (
        <div className="absolute right-[6%] top-1/2 w-[min(42vw,620px)] -translate-y-1/2 max-[899px]:left-1/2 max-[899px]:right-auto max-[899px]:top-[34%] max-[899px]:w-[80vw] max-[899px]:-translate-x-1/2">
          <SonarPrint participants={participants} talk={talk} duration={duration} segments={segments} chapterStarts={chapterStarts} detail className="h-auto w-full" />
        </div>
      )}
    </div>
  );
}
