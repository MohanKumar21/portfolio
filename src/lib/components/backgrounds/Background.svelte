<script lang="ts">
  /**
   * Full-bleed animated background. Drop it anywhere; it stays behind the
   * page (z-index 0) and pauses when hidden. Swap `kind` to change scenes.
   */
  import { run, rails, contours, globe, type Controller } from "$lib/backgrounds/index.js";

  type Kind = "rails" | "contours" | "globe";

  let {
    kind = "rails",
    seed,
    fixed = true,
    portal = false,
  }: {
    kind?: Kind;
    seed?: number;
    fixed?: boolean;
    /**
     * Move the element to <body>. Needed only when the component is rendered
     * inside an element that creates a stacking context (e.g. the site's
     * `.page-wrap`), which would otherwise paint the canvas over the header.
     * In +layout.svelte, next to the header, leave it off.
     */
    portal?: boolean;
  } = $props();

  let canvas = $state<HTMLCanvasElement>();
  let root = $state<HTMLDivElement>();

  $effect(() => {
    const el = root;
    if (!el || !portal) return;
    document.body.appendChild(el);
    return () => el.remove();
  });

  $effect(() => {
    const el = canvas;
    const k = kind;
    const s = seed;
    if (!el) return;
    const scene = k === "rails" ? rails() : k === "contours" ? contours() : globe();
    const ctl: Controller = run(el, scene, { seed: s });
    return () => ctl.stop();
  });
</script>

<div bind:this={root} class="bg bg--{kind}" class:bg--fixed={fixed} aria-hidden="true">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .bg--fixed {
    position: fixed;
  }
  .bg canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
  /* Each scene brings its own ground colour so the ink reads well. */
  .bg--rails {
    background: radial-gradient(1200px 800px at 70% 10%, #141c2e 0%, #0a0f1a 60%, #06080f 100%);
  }
  .bg--contours {
    background: radial-gradient(1100px 900px at 30% 20%, #171b24 0%, #0c0f15 60%, #080a0e 100%);
  }
  .bg--globe {
    background: radial-gradient(900px 700px at 74% 55%, #0b1b2b 0%, #080d17 55%, #05080e 100%);
  }
</style>
