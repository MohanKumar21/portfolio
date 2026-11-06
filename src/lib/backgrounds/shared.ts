/**
 * Shared runtime for the canvas backgrounds.
 *
 * A Scene only knows how to lay itself out for a given size and how to draw
 * one frame. `run()` owns the canvas: device-pixel-ratio scaling, resizing,
 * pointer tracking, the requestAnimationFrame loop, pausing when the tab or
 * the canvas is not visible, and honouring `prefers-reduced-motion`
 * (one static frame is drawn, then the loop stops).
 */

export interface Pointer {
  /** Pointer position in CSS pixels, relative to the canvas. */
  x: number;
  y: number;
  /** True while the pointer is over the canvas area. */
  active: boolean;
  /** True while a button is held down. */
  down: boolean;
}

export interface Scene {
  /** Called once at start and whenever the canvas changes size (CSS px). */
  resize(w: number, h: number, rng: () => number): void;
  /**
   * Draw one frame. `dt` is seconds since the previous frame (0 when motion
   * is reduced), `t` is total elapsed seconds.
   */
  frame(ctx: CanvasRenderingContext2D, dt: number, t: number, pointer: Pointer, w: number, h: number): void;
  /** Optional reaction to a click/tap at canvas coordinates. */
  click?(x: number, y: number): void;
}

export interface RunOptions {
  /** Deterministic layout; defaults to a random seed. */
  seed?: number;
  /** Cap the frame rate (e.g. 30). Defaults to the display rate. */
  fps?: number;
  /** Pause when the canvas scrolls out of view. Default true. */
  pauseOffscreen?: boolean;
}

export interface Controller {
  stop(): void;
  pause(): void;
  resume(): void;
  readonly paused: boolean;
  readonly reducedMotion: boolean;
}

/** Small, fast, seedable PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const TAU = Math.PI * 2;

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Parse "#rrggbb" into [r, g, b]. */
export function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

const INTERACTIVE = 'a,button,input,textarea,select,label,[role="button"]';

export function run(canvas: HTMLCanvasElement, scene: Scene, opts: RunOptions = {}): Controller {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31);
  const reduced = prefersReducedMotion();
  const pointer: Pointer = { x: -1e9, y: -1e9, active: false, down: false };

  let w = 1;
  let h = 1;
  let raf = 0;
  let running = false;
  let paused = false;
  let visible = true;
  let last = 0;
  let t = 0;
  let drewStatic = false;
  const minFrame = opts.fps ? 1000 / opts.fps : 0;
  let acc = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    scene.resize(w, h, mulberry32(seed));
    drewStatic = false;
    if (reduced) drawOnce();
  }

  function drawOnce() {
    ctx!.clearRect(0, 0, w, h);
    scene.frame(ctx!, 0, t, pointer, w, h);
    drewStatic = true;
  }

  function loop(now: number) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1; // tab was throttled; don't let agents teleport
    if (minFrame) {
      acc += dt * 1000;
      if (acc < minFrame) return;
      dt = acc / 1000;
      acc = 0;
    }
    t += dt;
    ctx!.clearRect(0, 0, w, h);
    scene.frame(ctx!, dt, t, pointer, w, h);
  }

  function start() {
    if (running || paused || !visible || reduced) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function halt() {
    running = false;
    cancelAnimationFrame(raf);
  }

  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas);
  resize();

  const io =
    opts.pauseOffscreen !== false && 'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            visible = entries.some((e) => e.isIntersecting);
            if (visible) start();
            else halt();
          },
          { threshold: 0.01 }
        )
      : null;
  io?.observe(canvas);

  const toLocal = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.active = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= w && pointer.y <= h;
  };
  const onMove = (e: PointerEvent) => toLocal(e);
  const onDown = (e: PointerEvent) => {
    toLocal(e);
    pointer.down = true;
    const target = e.target as Element | null;
    if (pointer.active && scene.click && !(target && target.closest(INTERACTIVE))) {
      scene.click(pointer.x, pointer.y);
      if (reduced) drawOnce();
    }
  };
  const onUp = () => {
    pointer.down = false;
  };
  const onLeave = () => {
    pointer.active = false;
    pointer.down = false;
  };
  const onVis = () => {
    if (document.hidden) halt();
    else start();
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointercancel', onUp, { passive: true });
  window.addEventListener('blur', onLeave);
  document.addEventListener('visibilitychange', onVis);

  if (reduced && !drewStatic) drawOnce();
  else start();

  return {
    stop() {
      halt();
      ro.disconnect();
      io?.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', onLeave);
      document.removeEventListener('visibilitychange', onVis);
    },
    pause() {
      paused = true;
      halt();
    },
    resume() {
      paused = false;
      start();
    },
    get paused() {
      return paused;
    },
    get reducedMotion() {
      return reduced;
    }
  };
}
