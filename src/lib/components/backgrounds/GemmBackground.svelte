<script lang="ts">
  /**
   * Full-bleed tiled matrix-multiply animation. Sits behind the page
   * (z-index 0); pauses when the tab is hidden; draws one static frame under
   * prefers-reduced-motion. Render it in +layout.svelte next to the header.
   */
  import { run, gemm, type Controller } from "$lib/backgrounds/index.js";

  let { seed }: { seed?: number } = $props();
  let canvas = $state<HTMLCanvasElement>();

  $effect(() => {
    const el = canvas;
    const s = seed;
    if (!el) return;
    const ctl: Controller = run(el, gemm(), { seed: s, pauseOffscreen: false });
    return () => ctl.stop();
  });
</script>

<div class="bg" aria-hidden="true">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    background: radial-gradient(1200px 800px at 70% 20%, #0f1526 0%, #080b14 60%, #06080f 100%);
  }
  .bg canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
