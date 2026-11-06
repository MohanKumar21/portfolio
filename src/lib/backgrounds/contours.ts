/**
 * "Loss landscape" — contour lines (marching squares) of a slowly morphing
 * scalar field, with a few optimisers rolling downhill by gradient descent
 * with momentum. Every fifth contour is an index contour (bolder), as on a
 * topographic map. The pointer raises a hill, so lines bulge away from it and
 * optimisers flee. A click drops a new optimiser.
 *
 * A nod to Non-Linear Optimisation / ML coursework and to the engineering
 * drawings of a mechanical degree.
 */
import { TAU, clamp, rgba, type Pointer, type Scene } from './shared.js';

export interface ContoursOptions {
  /** Grid sample spacing in CSS px (smaller = smoother, slower). */
  step?: number;
  /** Line colour. */
  ink?: string;
  /** Optimiser colour. */
  accent?: string;
  /** Number of optimisers. */
  optimisers?: number;
  maxOptimisers?: number;
  /** Contour spacing in field units. */
  interval?: number;
  /** Speed of the field drift (1 = default). */
  drift?: number;
}

interface Bump {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  wx: number;
  wy: number;
  px: number;
  py: number;
  amp: number;
  sig: number;
}

interface Opt {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
  still: number;
  age: number;
  glow: number;
}

export function contours(o: ContoursOptions = {}): Scene {
  const ink = o.ink ?? '#b4c4de';
  const accent = o.accent ?? '#e9c46a';
  const interval = o.interval ?? 0.16;
  const drift = o.drift ?? 1;
  const maxOpt = o.maxOptimisers ?? 10;

  let step = 12;
  let nx = 0;
  let ny = 0;
  let field = new Float32Array(0);
  let bumps: Bump[] = [];
  let opts: Opt[] = [];
  let rngRef: () => number = Math.random;
  let W = 1;
  let H = 1;
  let pointerAmp = 0;

  function build(w: number, h: number, rng: () => number) {
    rngRef = rng;
    W = w;
    H = h;
    step = o.step ?? clamp(Math.round(Math.max(w, h) / 120), 10, 16);
    nx = Math.ceil(w / step) + 2;
    ny = Math.ceil(h / step) + 2;
    field = new Float32Array(nx * ny);
    bumps = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
      bumps.push({
        ax: 0.5 + (rng() - 0.5) * 0.2,
        ay: 0.5 + (rng() - 0.5) * 0.2,
        bx: 0.25 + rng() * 0.25,
        by: 0.25 + rng() * 0.25,
        wx: (0.05 + rng() * 0.07) * drift,
        wy: (0.05 + rng() * 0.07) * drift,
        px: rng() * TAU,
        py: rng() * TAU,
        amp: (i % 2 === 0 ? 1 : -1) * (0.7 + rng() * 0.6),
        sig: 0.16 + rng() * 0.14
      });
    }
    const want = Math.min(o.optimisers ?? clamp(Math.round((w * h) / 220000), 4, 7), maxOpt);
    opts = [];
    for (let i = 0; i < want; i++) opts.push(newOpt(rng() * w, rng() * h));
  }

  function newOpt(x: number, y: number): Opt {
    return { x, y, vx: 0, vy: 0, trail: [], still: 0, age: 0, glow: 0 };
  }

  // Field is evaluated in normalised coordinates with aspect preserved.
  function evalField(t: number, pointer: Pointer) {
    const aspect = W / H;
    const bx: number[] = [];
    const by: number[] = [];
    const inv2: number[] = [];
    for (let i = 0; i < bumps.length; i++) {
      const b = bumps[i];
      bx[i] = (b.ax + b.bx * Math.sin(b.wx * t + b.px)) * aspect;
      by[i] = b.ay + b.by * Math.cos(b.wy * t + b.py);
      inv2[i] = 1 / (2 * b.sig * b.sig);
    }
    const px = (pointer.x / H) ;
    const py = pointer.y / H;
    const pInv = 1 / (2 * 0.11 * 0.11);
    for (let j = 0; j < ny; j++) {
      const v = ((j - 1) * step) / H;
      for (let i = 0; i < nx; i++) {
        const u = ((i - 1) * step) / H; // divide by H so units match in both axes
        let f = 0.25 * Math.sin(u * 1.7 + t * 0.03 * drift) * Math.cos(v * 2.1 - t * 0.02 * drift);
        for (let k = 0; k < bumps.length; k++) {
          const dx = u - bx[k];
          const dy = v - by[k];
          f += bumps[k].amp * Math.exp(-(dx * dx + dy * dy) * inv2[k]);
        }
        if (pointerAmp > 0.001) {
          const dx = u - px;
          const dy = v - py;
          f += pointerAmp * Math.exp(-(dx * dx + dy * dy) * pInv);
        }
        field[j * nx + i] = f;
      }
    }
  }

  /** Bilinear sample + gradient of the field at CSS px. */
  function sample(x: number, y: number): [number, number, number] {
    const gx = clamp(x / step + 1, 0, nx - 2.001);
    const gy = clamp(y / step + 1, 0, ny - 2.001);
    const i = Math.floor(gx);
    const j = Math.floor(gy);
    const fx = gx - i;
    const fy = gy - j;
    const f00 = field[j * nx + i];
    const f10 = field[j * nx + i + 1];
    const f01 = field[(j + 1) * nx + i];
    const f11 = field[(j + 1) * nx + i + 1];
    const f = f00 * (1 - fx) * (1 - fy) + f10 * fx * (1 - fy) + f01 * (1 - fx) * fy + f11 * fx * fy;
    const dfx = ((f10 - f00) * (1 - fy) + (f11 - f01) * fy) / step;
    const dfy = ((f01 - f00) * (1 - fx) + (f11 - f10) * fx) / step;
    return [f, dfx, dfy];
  }

  function stepOpts(dt: number) {
    const lr = 2600; // px^2 / (field unit * s^2): tuned for a visible roll
    for (let k = 0; k < opts.length; k++) {
      const p = opts[k];
      p.age += dt;
      const [, gx, gy] = sample(p.x, p.y);
      p.vx = p.vx * Math.exp(-2.2 * dt) - gx * lr * dt;
      p.vy = p.vy * Math.exp(-2.2 * dt) - gy * lr * dt;
      const sp = Math.hypot(p.vx, p.vy);
      const cap = 160;
      if (sp > cap) {
        p.vx *= cap / sp;
        p.vy *= cap / sp;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
        opts[k] = newOpt(rngRef() * W, rngRef() * H);
        continue;
      }
      const last = p.trail[p.trail.length - 1];
      if (!last || Math.hypot(last.x - p.x, last.y - p.y) > 1.5) {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 48) p.trail.shift();
      } else if (p.trail.length) {
        // fade the trail while sitting still
        if (rngRef() < 0.3) p.trail.shift();
      }
      if (sp < 6) {
        p.still += dt;
        p.glow = Math.min(1, p.glow + dt * 0.8);
      } else {
        p.still = 0;
        p.glow = Math.max(0, p.glow - dt * 1.5);
      }
      // converged for a while: respawn somewhere high so the story repeats
      if (p.still > 7 + rngRef() * 4 && p.age > 10) {
        let bx = rngRef() * W;
        let by = rngRef() * H;
        let bf = -Infinity;
        for (let s = 0; s < 24; s++) {
          const x = rngRef() * W;
          const y = rngRef() * H;
          const [f] = sample(x, y);
          if (f > bf) {
            bf = f;
            bx = x;
            by = y;
          }
        }
        opts[k] = newOpt(bx, by);
      }
    }
  }

  // Marching squares for one iso level; appends line segments.
  function marching(level: number, ctx: CanvasRenderingContext2D) {
    const X = (i: number) => (i - 1) * step;
    const Y = (j: number) => (j - 1) * step;
    ctx.beginPath();
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = field[j * nx + i];
        const b = field[j * nx + i + 1];
        const c = field[(j + 1) * nx + i + 1];
        const d = field[(j + 1) * nx + i];
        let idx = 0;
        if (a > level) idx |= 8;
        if (b > level) idx |= 4;
        if (c > level) idx |= 2;
        if (d > level) idx |= 1;
        if (idx === 0 || idx === 15) continue;
        const x0 = X(i);
        const x1 = X(i + 1);
        const y0 = Y(j);
        const y1 = Y(j + 1);
        // interpolated crossing points on each edge
        const top = () => [x0 + ((level - a) / (b - a)) * step, y0];
        const right = () => [x1, y0 + ((level - b) / (c - b)) * step];
        const bottom = () => [x0 + ((level - d) / (c - d)) * step, y1];
        const left = () => [x0, y0 + ((level - a) / (d - a)) * step];
        const seg = (p: number[], q: number[]) => {
          ctx.moveTo(p[0], p[1]);
          ctx.lineTo(q[0], q[1]);
        };
        switch (idx) {
          case 1:
          case 14:
            seg(left(), bottom());
            break;
          case 2:
          case 13:
            seg(bottom(), right());
            break;
          case 3:
          case 12:
            seg(left(), right());
            break;
          case 4:
          case 11:
            seg(top(), right());
            break;
          case 5: {
            // saddle: resolve by centre value
            const m = (a + b + c + d) / 4;
            if (m > level) {
              seg(left(), top());
              seg(bottom(), right());
            } else {
              seg(left(), bottom());
              seg(top(), right());
            }
            break;
          }
          case 6:
          case 9:
            seg(top(), bottom());
            break;
          case 7:
          case 8:
            seg(left(), top());
            break;
          case 10: {
            const m = (a + b + c + d) / 4;
            if (m > level) {
              seg(left(), bottom());
              seg(top(), right());
            } else {
              seg(left(), top());
              seg(bottom(), right());
            }
            break;
          }
        }
      }
    }
    ctx.stroke();
  }

  function draw(ctx: CanvasRenderingContext2D) {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < field.length; i++) {
      const f = field[i];
      if (f < lo) lo = f;
      if (f > hi) hi = f;
    }
    const first = Math.ceil(lo / interval);
    const lastL = Math.floor(hi / interval);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let k = first; k <= lastL; k++) {
      const index = k % 5 === 0; // index contour, as on a topo map
      ctx.lineWidth = index ? 1.25 : 0.75;
      ctx.strokeStyle = rgba(ink, index ? 0.34 : 0.17);
      marching(k * interval, ctx);
    }
    // optimisers
    for (const p of opts) {
      const tr = p.trail;
      ctx.lineWidth = 1.5;
      for (let i = 1; i < tr.length; i++) {
        const f = i / tr.length;
        ctx.strokeStyle = rgba(accent, f * f * 0.6);
        ctx.beginPath();
        ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
        ctx.lineTo(tr[i].x, tr[i].y);
        ctx.stroke();
      }
      if (p.glow > 0) {
        ctx.strokeStyle = rgba(accent, p.glow * 0.5);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7 + p.glow * 4, 0, TAU);
        ctx.stroke();
      }
      ctx.fillStyle = rgba(accent, 0.2);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(accent, 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.8, 0, TAU);
      ctx.fill();
    }
  }

  return {
    resize(w, h, rng) {
      build(w, h, rng);
    },
    frame(ctx, dt, t, pointer) {
      const target = pointer.active ? 1.1 : 0;
      pointerAmp += (target - pointerAmp) * Math.min(1, dt * 6);
      evalField(t, pointer);
      if (dt > 0) stepOpts(dt);
      draw(ctx);
    },
    click(x, y) {
      if (opts.length < maxOpt) opts.push(newOpt(x, y));
      else opts[Math.floor(rngRef() * opts.length)] = newOpt(x, y);
    }
  };
}
