/**
 * "Flatland" — a sparse rail network with a handful of agents routing to
 * randomly chosen goals. Agents re-plan with BFS, never share a node (one
 * yields while the other passes), and ring when they arrive. Tracks near the
 * pointer light up; a click adds an agent at the nearest junction.
 *
 * A nod to the Flatland multi-agent RL challenge (dual-degree project).
 */
import { TAU, clamp, rgba, type Pointer, type Scene } from './shared.js';

export interface RailsOptions {
  /** Approximate grid cell size in CSS px. */
  cell?: number;
  /** Agents at start. */
  agents?: number;
  /** Max agents (clicks add more). */
  maxAgents?: number;
  /** Agent colours. */
  colors?: string[];
  /** Track colour. */
  track?: string;
  /** Base track opacity. */
  trackAlpha?: number;
  /** Cells per second. */
  speed?: number;
}

interface Node {
  id: number;
  gx: number;
  gy: number;
  x: number;
  y: number;
  alive: boolean;
  edges: number[];
  comp: number;
}

interface Edge {
  a: number;
  b: number;
  glow: number;
}

interface Pt {
  x: number;
  y: number;
}

interface Agent {
  node: number; // last node reached
  next: number; // node we are moving towards (-1 when idle)
  t: number; // 0..1 progress along the edge
  speed: number; // cells / s
  color: string;
  path: number[];
  trail: Pt[];
  wait: number;
  pulse: number; // >0 while the arrival ring plays
  blocked: number; // seconds spent waiting
}

interface Pulse {
  x: number;
  y: number;
  t: number;
  color: string;
}

export function rails(o: RailsOptions = {}): Scene {
  const colors = o.colors ?? ['#f5b544', '#5fd3e8', '#b48cff', '#6fe3b1'];
  const track = o.track ?? '#9fb4d4';
  const trackAlpha = o.trackAlpha ?? 0.17;
  const baseSpeed = o.speed ?? 0.9;
  const maxAgents = o.maxAgents ?? 16;

  let cell = 90;
  let cols = 0;
  let rows = 0;
  let ox = 0;
  let oy = 0;
  let nodes: Node[] = [];
  let edges: Edge[] = [];
  let agents: Agent[] = [];
  let pulses: Pulse[] = [];
  let mainComp = 0;
  let mainNodes: number[] = [];
  let rngRef: () => number = Math.random;

  // ---------- network generation ----------

  function edgeKey(a: number, b: number) {
    return a < b ? a * 100000 + b : b * 100000 + a;
  }

  function build(w: number, h: number, rng: () => number) {
    rngRef = rng;
    cell = o.cell ?? clamp(Math.round(Math.min(w, h) / 9), 64, 112);
    cols = Math.ceil(w / cell) + 1;
    rows = Math.ceil(h / cell) + 1;
    ox = (w - (cols - 1) * cell) / 2;
    oy = (h - (rows - 1) * cell) / 2;

    nodes = [];
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        nodes.push({
          id: gy * cols + gx,
          gx,
          gy,
          x: ox + gx * cell,
          y: oy + gy * cell,
          alive: rng() > 0.3,
          edges: [],
          comp: -1
        });
      }
    }
    const at = (gx: number, gy: number) =>
      gx >= 0 && gy >= 0 && gx < cols && gy < rows ? nodes[gy * cols + gx] : null;

    // Candidate edges between alive 4-neighbours, plus rare diagonals.
    type Cand = { a: number; b: number; diag: boolean; r: number };
    const cands: Cand[] = [];
    const diagCells = new Set<number>();
    for (const n of nodes) {
      if (!n.alive) continue;
      const right = at(n.gx + 1, n.gy);
      const down = at(n.gx, n.gy + 1);
      if (right?.alive) cands.push({ a: n.id, b: right.id, diag: false, r: rng() });
      if (down?.alive) cands.push({ a: n.id, b: down.id, diag: false, r: rng() });
      // one diagonal per cell at most, low probability
      const dr = at(n.gx + 1, n.gy + 1);
      const dl = at(n.gx - 1, n.gy + 1);
      const cellId = n.gy * cols + n.gx;
      if (rng() < 0.07 && dr?.alive && !diagCells.has(cellId)) {
        diagCells.add(cellId);
        cands.push({ a: n.id, b: dr.id, diag: true, r: rng() + 0.5 });
      } else if (rng() < 0.07 && dl?.alive && n.gx > 0 && !diagCells.has(cellId - 1)) {
        diagCells.add(cellId - 1);
        cands.push({ a: n.id, b: dl.id, diag: true, r: rng() + 0.5 });
      }
    }
    cands.sort((p, q) => p.r - q.r);

    // Randomised Kruskal for a spanning forest, then a few extra edges for loops.
    const parent = nodes.map((n) => n.id);
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const used = new Set<number>();
    edges = [];
    const addEdge = (c: Cand) => {
      const k = edgeKey(c.a, c.b);
      if (used.has(k)) return;
      used.add(k);
      const id = edges.length;
      edges.push({ a: c.a, b: c.b, glow: 0 });
      nodes[c.a].edges.push(id);
      nodes[c.b].edges.push(id);
    };
    for (const c of cands) {
      const ra = find(c.a);
      const rb = find(c.b);
      if (ra !== rb) {
        parent[ra] = rb;
        addEdge(c);
      }
    }
    for (const c of cands) {
      if (!c.diag && rng() < 0.22) addEdge(c);
    }

    // Components; keep agents on the largest one and hide tiny fragments.
    let compId = 0;
    const sizes: number[] = [];
    for (const n of nodes) {
      if (!n.alive || n.comp >= 0) continue;
      let size = 0;
      const stack = [n.id];
      n.comp = compId;
      while (stack.length) {
        const id = stack.pop()!;
        size++;
        for (const e of nodes[id].edges) {
          const ed = edges[e];
          const other = ed.a === id ? ed.b : ed.a;
          if (nodes[other].comp < 0) {
            nodes[other].comp = compId;
            stack.push(other);
          }
        }
      }
      sizes.push(size);
      compId++;
    }
    mainComp = sizes.indexOf(Math.max(...sizes, 0));
    for (const n of nodes) {
      if (n.alive && sizes[n.comp] < 5) n.alive = false; // orphan fragments
    }
    edges = edges.filter((e) => nodes[e.a].alive && nodes[e.b].alive);
    for (const n of nodes) n.edges = [];
    edges.forEach((e, i) => {
      nodes[e.a].edges.push(i);
      nodes[e.b].edges.push(i);
    });
    mainNodes = nodes.filter((n) => n.alive && n.comp === mainComp).map((n) => n.id);

    // (Re)seed agents.
    const want = Math.min(o.agents ?? clamp(Math.round((w * h) / 150000), 6, 12), maxAgents);
    agents = [];
    for (let i = 0; i < want && mainNodes.length > 1; i++) spawn(mainNodes[Math.floor(rng() * mainNodes.length)], i);
    pulses = [];
  }

  function spawn(nodeId: number, i: number) {
    const a: Agent = {
      node: nodeId,
      next: -1,
      t: 0,
      speed: baseSpeed * (0.8 + rngRef() * 0.5),
      color: colors[i % colors.length],
      path: [],
      trail: [],
      wait: 0,
      pulse: 0,
      blocked: 0
    };
    agents.push(a);
  }

  function neighbours(id: number): number[] {
    return nodes[id].edges.map((e) => (edges[e].a === id ? edges[e].b : edges[e].a));
  }

  function bfs(from: number, to: number, avoid: number = -1): number[] | null {
    if (from === to) return [];
    const prev = new Int32Array(nodes.length).fill(-2);
    prev[from] = -1;
    const q = [from];
    let qi = 0;
    while (qi < q.length) {
      const u = q[qi++];
      for (const v of neighbours(u)) {
        if (prev[v] !== -2 || v === avoid) continue;
        prev[v] = u;
        if (v === to) {
          const path = [v];
          let cur = u;
          while (cur !== from) {
            path.push(cur);
            cur = prev[cur];
          }
          return path.reverse();
        }
        q.push(v);
      }
    }
    return null;
  }

  function retarget(a: Agent, avoid = -1) {
    if (mainNodes.length < 2) return;
    for (let tries = 0; tries < 6; tries++) {
      const goal = mainNodes[Math.floor(rngRef() * mainNodes.length)];
      if (goal === a.node) continue;
      const p = bfs(a.node, goal, avoid);
      if (p && p.length) {
        a.path = p;
        return;
      }
    }
    a.path = [];
  }

  function nodeReserved(v: number, self: Agent): boolean {
    for (const b of agents) {
      if (b === self) continue;
      if (b.next === v) return true; // somebody is heading there
      if (b.next === -1 && b.node === v) return true; // somebody is standing there
      if (b.next === self.node && b.node === v) return true; // head-on
    }
    return false;
  }

  function agentPos(a: Agent): Pt {
    const n = nodes[a.node];
    if (a.next < 0) return { x: n.x, y: n.y };
    const m = nodes[a.next];
    return { x: n.x + (m.x - n.x) * a.t, y: n.y + (m.y - n.y) * a.t };
  }

  // ---------- simulation ----------

  function step(dt: number) {
    for (const a of agents) {
      a.pulse = Math.max(0, a.pulse - dt * 1.4);
      if (a.next < 0) {
        if (a.wait > 0) {
          a.wait -= dt;
          continue;
        }
        if (!a.path.length) retarget(a);
        if (!a.path.length) {
          a.wait = 1;
          continue;
        }
        const v = a.path[0];
        if (nodeReserved(v, a)) {
          a.blocked += dt;
          if (a.blocked > 2.5) {
            a.blocked = 0;
            retarget(a, v); // deadlock breaker: route around the blocker
          }
          continue;
        }
        a.blocked = 0;
        a.path.shift();
        a.next = v;
        a.t = 0;
        const e = nodes[a.node].edges.find((id) => edges[id].a === v || edges[id].b === v);
        if (e !== undefined) edges[e].glow = 1;
      } else {
        const n = nodes[a.node];
        const m = nodes[a.next];
        const len = Math.hypot(m.x - n.x, m.y - n.y) / cell;
        a.t += (a.speed * dt) / len;
        if (a.t >= 1) {
          a.node = a.next;
          a.next = -1;
          a.t = 0;
          if (!a.path.length) {
            // arrived at goal
            a.pulse = 1;
            pulses.push({ x: nodes[a.node].x, y: nodes[a.node].y, t: 0, color: a.color });
            a.wait = 0.6 + rngRef() * 0.8;
          }
        }
      }
      const p = agentPos(a);
      const lastP = a.trail[a.trail.length - 1];
      if (!lastP || Math.hypot(lastP.x - p.x, lastP.y - p.y) > 2) {
        a.trail.push(p);
        if (a.trail.length > 18) a.trail.shift();
      }
    }
    for (const e of edges) e.glow = Math.max(0, e.glow - dt * 0.5);
    for (const p of pulses) p.t += dt * 1.1;
    pulses = pulses.filter((p) => p.t < 1);
  }

  // ---------- drawing ----------

  function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1;
    const u = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1);
    return Math.hypot(px - (ax + dx * u), py - (ay + dy * u));
  }

  function draw(ctx: CanvasRenderingContext2D, pointer: Pointer) {
    const hoverR = cell * 2.2;
    ctx.lineCap = 'round';
    ctx.lineWidth = 1;
    // tracks
    for (const e of edges) {
      const a = nodes[e.a];
      const b = nodes[e.b];
      let alpha = trackAlpha + e.glow * 0.35;
      if (pointer.active) {
        const d = segDist(pointer.x, pointer.y, a.x, a.y, b.x, b.y);
        if (d < hoverR) alpha += (1 - d / hoverR) * 0.45;
      }
      ctx.strokeStyle = rgba(track, Math.min(alpha, 0.85));
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    // junctions
    for (const n of nodes) {
      if (!n.alive || n.edges.length === 0) continue;
      let alpha = trackAlpha * 2.2;
      if (pointer.active) {
        const d = Math.hypot(pointer.x - n.x, pointer.y - n.y);
        if (d < hoverR) alpha += (1 - d / hoverR) * 0.5;
      }
      ctx.fillStyle = rgba(track, Math.min(alpha, 0.9));
      const s = n.edges.length > 2 ? 2.4 : 1.6;
      ctx.fillRect(n.x - s, n.y - s, s * 2, s * 2);
    }
    // arrival rings
    for (const p of pulses) {
      const r = 4 + p.t * cell * 0.45;
      ctx.strokeStyle = rgba(p.color, (1 - p.t) * 0.7);
      ctx.lineWidth = 1.5 - p.t;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, TAU);
      ctx.stroke();
    }
    // trails + agents
    ctx.lineWidth = 2;
    for (const a of agents) {
      const tr = a.trail;
      for (let i = 1; i < tr.length; i++) {
        const f = i / tr.length;
        ctx.strokeStyle = rgba(a.color, f * f * 0.55);
        ctx.beginPath();
        ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
        ctx.lineTo(tr[i].x, tr[i].y);
        ctx.stroke();
      }
      const p = agentPos(a);
      // soft halo
      ctx.fillStyle = rgba(a.color, 0.18);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, TAU);
      ctx.fill();
      // body: a waiting agent dims slightly (it is yielding)
      const waiting = a.next < 0 && a.blocked > 0;
      ctx.fillStyle = rgba(a.color, waiting ? 0.6 : 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.2, 0, TAU);
      ctx.fill();
    }
  }

  return {
    resize(w, h, rng) {
      build(w, h, rng);
    },
    frame(ctx, dt, _t, pointer) {
      if (dt > 0) step(dt);
      draw(ctx, pointer);
    },
    click(x, y) {
      if (agents.length >= maxAgents || !mainNodes.length) return;
      let best = mainNodes[0];
      let bd = Infinity;
      for (const id of mainNodes) {
        const d = Math.hypot(nodes[id].x - x, nodes[id].y - y);
        if (d < bd) {
          bd = d;
          best = id;
        }
      }
      if (agents.some((a) => a.next < 0 && a.node === best)) return;
      spawn(best, agents.length);
      pulses.push({ x: nodes[best].x, y: nodes[best].y, t: 0, color: agents[agents.length - 1].color });
    }
  };
}
