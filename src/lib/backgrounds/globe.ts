/**
 * "Region expansion" — a dotted globe that rotates slowly, with great-circle
 * arcs carrying traffic pulses between the places on the résumé: IIT Madras
 * (Chennai), Oracle Bengaluru, and the London region that was brought up for
 * OCI Generative AI. Faint secondary markers are other OCI regions, labelled
 * with their region identifiers. Drag to spin.
 */
import { TAU, clamp, lerp, rgba, type Pointer, type Scene } from './shared.js';

export interface Place {
  lat: number;
  lon: number;
  label: string;
  /** Primary places get a bright marker and a label that is always drawn. */
  primary?: boolean;
}

export interface Arc {
  from: number;
  to: number;
  /** Pulses per arc. */
  pulses?: number;
  /** Visual weight 0..1 */
  weight?: number;
}

export interface GlobeOptions {
  dot?: string;
  accent?: string;
  label?: string;
  places?: Place[];
  arcs?: Arc[];
  /** Where the globe sits: hero text usually goes on the left. */
  anchor?: 'right' | 'center' | 'left';
  /** Radians per second. */
  spin?: number;
  /** Dot count; defaults from area. */
  points?: number;
  /** Font for labels. */
  font?: string;
}

export const DEFAULT_PLACES: Place[] = [
  { lat: 12.97, lon: 77.59, label: 'Bengaluru · Oracle, OCI Generative AI', primary: true },
  { lat: 13.08, lon: 80.27, label: 'Chennai · IIT Madras', primary: true },
  { lat: 51.51, lon: -0.13, label: 'uk-london-1 · region brought up', primary: true },
  { lat: 19.08, lon: 72.88, label: 'ap-mumbai-1' },
  { lat: 17.39, lon: 78.49, label: 'ap-hyderabad-1' },
  { lat: 50.11, lon: 8.68, label: 'eu-frankfurt-1' },
  { lat: 52.37, lon: 4.9, label: 'eu-amsterdam-1' },
  { lat: 39.04, lon: -77.49, label: 'us-ashburn-1' },
  { lat: 33.45, lon: -112.07, label: 'us-phoenix-1' },
  { lat: 43.65, lon: -79.38, label: 'ca-toronto-1' },
  { lat: -23.55, lon: -46.63, label: 'sa-saopaulo-1' },
  { lat: 35.68, lon: 139.69, label: 'ap-tokyo-1' },
  { lat: 37.57, lon: 126.98, label: 'ap-seoul-1' },
  { lat: 1.35, lon: 103.82, label: 'ap-singapore-1' },
  { lat: -33.87, lon: 151.21, label: 'ap-sydney-1' },
  { lat: 25.2, lon: 55.27, label: 'me-dubai-1' },
  { lat: -26.2, lon: 28.04, label: 'af-johannesburg-1' }
];

export const DEFAULT_ARCS: Arc[] = [
  { from: 0, to: 2, pulses: 3, weight: 1 }, // Bengaluru -> London
  { from: 1, to: 0, pulses: 1, weight: 0.7 }, // Chennai -> Bengaluru
  { from: 0, to: 5, pulses: 1, weight: 0.35 },
  { from: 0, to: 7, pulses: 1, weight: 0.35 },
  { from: 0, to: 11, pulses: 1, weight: 0.3 },
  { from: 0, to: 14, pulses: 1, weight: 0.3 }
];

type V3 = [number, number, number];

function toV3(lat: number, lon: number): V3 {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
}

function slerp(a: V3, b: V3, t: number): V3 {
  const dot = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1);
  const om = Math.acos(dot);
  if (om < 1e-5) return a;
  const s = Math.sin(om);
  const wa = Math.sin((1 - t) * om) / s;
  const wb = Math.sin(t * om) / s;
  return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb];
}

export function globe(o: GlobeOptions = {}): Scene {
  const dotC = o.dot ?? '#8fb0d8';
  const accent = o.accent ?? '#4fd1c5';
  const labelC = o.label ?? '#dfe8f5';
  const places = o.places ?? DEFAULT_PLACES;
  const arcs = o.arcs ?? DEFAULT_ARCS;
  const anchor = o.anchor ?? 'right';
  const spin = o.spin ?? 0.06;
  const font = o.font ?? '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  const tilt = (23.4 * Math.PI) / 180;

  let pts: Float32Array = new Float32Array(0);
  let R = 100;
  let cx = 0;
  let cy = 0;
  let W = 1;
  let H = 1;
  let theta = 0.6; // extra rotation from drag
  let omega = 0; // drag velocity
  let dragging = false;
  let lastPX = 0;
  let placeV: V3[] = places.map((p) => toV3(p.lat, p.lon));
  let arcPts: V3[][] = [];

  function build(w: number, h: number) {
    W = w;
    H = h;
    const m = Math.min(w, h);
    R = anchor === 'center' ? m * 0.42 : Math.min(h * 0.5, w * 0.3);
    cy = h * 0.52;
    cx = anchor === 'center' ? w / 2 : anchor === 'right' ? w - R * 1.05 : R * 1.05;
    if (w < 640) {
      // phones: centre it and let it bleed off the bottom
      cx = w / 2;
      cy = h * 0.72;
      R = w * 0.62;
    }
    const n = o.points ?? clamp(Math.round((R * R) / 150), 900, 3200);
    pts = new Float32Array(n * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      pts[i * 3] = Math.cos(th) * r;
      pts[i * 3 + 1] = y;
      pts[i * 3 + 2] = Math.sin(th) * r;
    }
    placeV = places.map((p) => toV3(p.lat, p.lon));
    arcPts = arcs.map((a) => {
      const A = placeV[a.from];
      const B = placeV[a.to];
      const out: V3[] = [];
      const N = 48;
      for (let i = 0; i <= N; i++) {
        const s = i / N;
        const v = slerp(A, B, s);
        const lift = 1 + 0.16 * Math.sin(Math.PI * s) * (a.weight ?? 0.5);
        out.push([v[0] * lift, v[1] * lift, v[2] * lift]);
      }
      return out;
    });
  }

  // rotate about Y by ang, then tilt about X; return screen x, y, depth z
  let cA = 1;
  let sA = 0;
  const cT = Math.cos(tilt);
  const sT = Math.sin(tilt);
  function project(x: number, y: number, z: number): [number, number, number] {
    const x1 = x * cA + z * sA;
    const z1 = -x * sA + z * cA;
    const y2 = y * cT - z1 * sT;
    const z2 = y * sT + z1 * cT;
    return [cx + x1 * R, cy - y2 * R, z2];
  }

  /** Draw a label beside a marker, flipping sides so it stays on the canvas. */
  function label(ctx: CanvasRenderingContext2D, text: string, sx: number, sy: number, gap: number) {
    const tw = ctx.measureText(text).width;
    let right = sx > cx;
    if (right && sx + gap + tw > W - 12) right = false;
    if (!right && sx - gap - tw < 12) right = true;
    ctx.textAlign = right ? 'left' : 'right';
    ctx.fillText(text, sx + (right ? gap : -gap), sy);
  }

  function draw(ctx: CanvasRenderingContext2D, t: number, pointer: Pointer) {
    const ang = theta + t * spin;
    cA = Math.cos(ang);
    sA = Math.sin(ang);

    // rim
    ctx.strokeStyle = rgba(dotC, 0.12);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.stroke();

    // dots (front hemisphere only)
    const n = pts.length / 3;
    for (let i = 0; i < n; i++) {
      const [sx, sy, z] = project(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
      if (z <= 0.02) continue;
      if (sx < -4 || sy < -4 || sx > W + 4 || sy > H + 4) continue;
      ctx.fillStyle = rgba(dotC, 0.14 + z * 0.55);
      ctx.beginPath();
      ctx.arc(sx, sy, 0.8 + z * 0.9, 0, TAU);
      ctx.fill();
    }

    // arcs
    ctx.lineCap = 'round';
    arcs.forEach((a, ai) => {
      const pp = arcPts[ai];
      const wgt = a.weight ?? 0.5;
      ctx.lineWidth = 0.8 + wgt * 0.8;
      let prev: [number, number, number] | null = null;
      for (const v of pp) {
        const q = project(v[0], v[1], v[2]);
        if (prev) {
          const z = (prev[2] + q[2]) / 2;
          if (z > -0.15) {
            ctx.strokeStyle = rgba(accent, clamp(0.08 + z * 0.5, 0.02, 0.6) * wgt);
            ctx.beginPath();
            ctx.moveTo(prev[0], prev[1]);
            ctx.lineTo(q[0], q[1]);
            ctx.stroke();
          }
        }
        prev = q;
      }
      // pulses
      const np = a.pulses ?? 1;
      for (let k = 0; k < np; k++) {
        const s = ((t * (0.14 + wgt * 0.1) + k / np + ai * 0.17) % 1 + 1) % 1;
        const idx = s * (pp.length - 1);
        const i0 = Math.floor(idx);
        const f = idx - i0;
        const v0 = pp[i0];
        const v1 = pp[Math.min(i0 + 1, pp.length - 1)];
        const [sx, sy, z] = project(lerp(v0[0], v1[0], f), lerp(v0[1], v1[1], f), lerp(v0[2], v1[2], f));
        if (z < -0.05) continue;
        const al = clamp(0.3 + z * 0.7, 0, 1) * (0.5 + wgt * 0.5);
        ctx.fillStyle = rgba(accent, al * 0.25);
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba('#ffffff', al);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.8, 0, TAU);
        ctx.fill();
      }
    });

    // markers + labels
    ctx.font = font;
    ctx.textBaseline = 'middle';
    places.forEach((p, i) => {
      const v = placeV[i];
      const [sx, sy, z] = project(v[0], v[1], v[2]);
      if (z <= 0.05) return;
      const near = pointer.active && Math.hypot(pointer.x - sx, pointer.y - sy) < 28;
      if (p.primary) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 2 + i);
        ctx.strokeStyle = rgba(accent, (0.25 + 0.35 * pulse) * z);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx, sy, 5 + pulse * 4, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = rgba(accent, 0.9);
        ctx.beginPath();
        ctx.arc(sx, sy, 2.6, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(labelC, clamp(z * 1.3, 0, 1) * (near ? 1 : 0.85));
        label(ctx, p.label, sx, sy, 12);
      } else {
        ctx.fillStyle = rgba(accent, 0.35 + z * 0.35);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.8, 0, TAU);
        ctx.fill();
        if (near || z > 0.93) {
          ctx.fillStyle = rgba(labelC, near ? 0.9 : clamp((z - 0.93) * 10, 0, 0.55));
          label(ctx, p.label, sx, sy, 9);
        }
      }
    });
  }

  return {
    resize(w, h) {
      build(w, h);
    },
    frame(ctx, dt, t, pointer) {
      // drag to spin, with inertia
      if (pointer.down && pointer.active) {
        if (!dragging) {
          dragging = true;
          lastPX = pointer.x;
        }
        const dx = pointer.x - lastPX;
        lastPX = pointer.x;
        if (dt > 0) {
          const d = dx / R;
          theta += d;
          omega = d / dt;
        }
      } else {
        dragging = false;
        if (dt > 0) {
          theta += omega * dt;
          omega *= Math.exp(-3 * dt);
        }
      }
      draw(ctx, t, pointer);
    }
  };
}
