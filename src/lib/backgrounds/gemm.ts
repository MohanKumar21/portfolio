/**
 * Tiled matrix multiply. The viewport is the output matrix cut into tiles;
 * simulated SMs each claim a tile, sweep its k-loop, and the result fills in
 * as a muted heat map. Tiles are claimed in a column-group swizzle so
 * neighbouring blocks share a strip of B, as CUTLASS does. Hover a tile for
 * its block index; click to relaunch the kernel.
 */
import { clamp, rgb, rgba, type Pointer, type Scene } from './shared.js';

export interface GemmOptions {
  /** Colour of the lowest output values. */
  cold?: string;
  /** Colour of the highest output values. */
  hot?: string;
  /** Grid and HUD colour. */
  grid?: string;
  /** Simulated streaming multiprocessors. */
  sms?: number;
  /** Seconds of simulation to run before the first frame. */
  prewarm?: number;
  /** Show the one-line HUD at the bottom left. */
  hud?: boolean;
}

interface Tile {
  i: number;
  j: number;
  val: number;
  prog: number;
  done: boolean;
  flash: number;
  sm: number;
}

interface Sm {
  tile: number;
  speed: number;
  idle: number;
}

const K = 8;
const MONO = '11px ui-monospace, SFMono-Regular, Menlo, monospace';

function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

export function gemm(o: GemmOptions = {}): Scene {
  const cold = o.cold ?? '#1e3470';
  const hot = o.hot ?? '#ffb454';
  const grid = o.grid ?? '#8fa3c7';
  const nSM = o.sms ?? 32;
  const prewarm = o.prewarm ?? 7;
  const hud = o.hud ?? true;

  let T = 28;
  let cols = 0;
  let rows = 0;
  let W = 1;
  let H = 1;
  let tiles: Tile[] = [];
  let order: number[] = [];
  let sms: Sm[] = [];
  let cursor = 0;
  let done = 0;
  let hold = 0;
  let fade = 1;
  let launches = 0;
  let rng: () => number = Math.random;

  function launch() {
    launches++;
    for (const tl of tiles) {
      tl.prog = 0;
      tl.done = false;
      tl.flash = 0;
      tl.sm = -1;
    }
    const g = 6 + (launches % 3) * 2;
    order = [];
    for (let gx = 0; gx < cols; gx += g)
      for (let j = 0; j < rows; j++)
        for (let i = gx; i < Math.min(gx + g, cols); i++) order.push(j * cols + i);
    cursor = 0;
    done = 0;
    hold = 0;
    fade = 1;
    sms = Array.from({ length: nSM }, () => ({ tile: -1, speed: 0.9 + rng() * 0.6, idle: rng() * 0.3 }));
  }

  function step(dt: number) {
    if (done >= tiles.length) {
      hold += dt;
      if (hold > 2.4) fade = Math.max(0, fade - dt * 1.4);
      if (fade <= 0) launch();
    } else {
      for (let s = 0; s < sms.length; s++) {
        const sm = sms[s];
        if (sm.tile < 0) {
          sm.idle -= dt;
          if (sm.idle <= 0 && cursor < order.length) {
            sm.tile = order[cursor++];
            tiles[sm.tile].sm = s;
            tiles[sm.tile].prog = 0;
          }
        } else {
          const tl = tiles[sm.tile];
          tl.prog += dt * sm.speed * 1.8;
          if (tl.prog >= 1) {
            tl.prog = 1;
            tl.done = true;
            tl.flash = 1;
            done++;
            sm.tile = -1;
            sm.idle = 0.05 + rng() * 0.15;
          }
        }
      }
    }
    for (const tl of tiles) tl.flash = Math.max(0, tl.flash - dt * 2);
  }

  function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
    ctx.font = MONO;
    ctx.textBaseline = 'middle';
    const tw = ctx.measureText(text).width + 14;
    let lx = x + 14;
    if (lx + tw > W - 8) lx = x - 14 - tw;
    ctx.fillStyle = 'rgba(6,8,14,0.85)';
    ctx.fillRect(lx, y - 11, tw, 22);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(text, lx + 7, y);
  }

  function draw(ctx: CanvasRenderingContext2D, p: Pointer) {
    let hi = -1;
    if (p.active) {
      const i = Math.floor(p.x / T);
      const j = Math.floor(p.y / T);
      if (i >= 0 && j >= 0 && i < cols && j < rows) hi = j * cols + i;
    }
    ctx.globalAlpha = fade;
    // strips of A (row) and B (column) feeding active tiles
    ctx.fillStyle = rgba(grid, 0.035);
    for (const sm of sms) {
      if (sm.tile < 0) continue;
      const tl = tiles[sm.tile];
      ctx.fillRect(0, tl.j * T, W, T);
      ctx.fillRect(tl.i * T, 0, T, H);
    }
    // grid
    ctx.strokeStyle = rgba(grid, 0.07);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= cols; i++) {
      ctx.moveTo(i * T + 0.5, 0);
      ctx.lineTo(i * T + 0.5, H);
    }
    for (let j = 0; j <= rows; j++) {
      ctx.moveTo(0, j * T + 0.5);
      ctx.lineTo(W, j * T + 0.5);
    }
    ctx.stroke();
    // tiles
    for (const tl of tiles) {
      const x = tl.i * T;
      const y = tl.j * T;
      if (tl.done) {
        ctx.fillStyle = mix(cold, hot, tl.val);
        ctx.globalAlpha = fade * (0.3 + tl.flash * 0.45);
        ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
        ctx.globalAlpha = fade;
      } else if (tl.sm >= 0) {
        ctx.fillStyle = rgba(hot, 0.85);
        ctx.fillRect(x + 1, y + 1, (T - 2) * tl.prog, T - 2);
        ctx.strokeStyle = rgba(hot, 0.6);
        ctx.strokeRect(x + 1.5, y + 1.5, T - 3, T - 3);
      }
    }
    if (hi >= 0) {
      const tl = tiles[hi];
      ctx.strokeStyle = rgba('#ffffff', 0.9);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tl.i * T + 1.5, tl.j * T + 1.5, T - 3, T - 3);
      const st = tl.done ? 'done' : tl.sm >= 0 ? `SM ${tl.sm} · k ${Math.min(K, Math.floor(tl.prog * K) + 1)}/${K}` : 'queued';
      label(ctx, `blockIdx (${tl.i}, ${tl.j}) · ${st}`, tl.i * T + T, tl.j * T + T / 2);
    }
    ctx.globalAlpha = 1;
    if (hud) {
      ctx.font = MONO;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = rgba(grid, 0.75);
      ctx.fillText(`gemm · ${cols}×${rows} tiles · ${nSM} SMs · ${done}/${tiles.length} done`, 16, H - 16);
    }
  }

  return {
    resize(w, h, r) {
      rng = r;
      W = w;
      H = h;
      T = clamp(Math.round(Math.min(w, h) / 24), 18, 34);
      cols = Math.ceil(w / T);
      rows = Math.ceil(h / T);
      tiles = [];
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++)
          tiles.push({ i, j, val: 0.5 + 0.5 * Math.sin(i / 4.2 + 0.8) * Math.cos(j / 3.6 - 0.4), prog: 0, done: false, flash: 0, sm: -1 });
      launch();
      for (let k = 0; k < prewarm * 30; k++) step(1 / 30);
    },
    frame(ctx, dt, _t, pointer) {
      if (dt > 0) step(dt);
      draw(ctx, pointer);
    },
    click() {
      launch();
    }
  };
}
