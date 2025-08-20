<script lang="ts">
  import Footer from "$lib/components/Footer.svelte";
import "../app.css"
  import { onMount } from 'svelte';
  // particles.js does not ship ESM types; import via any
  let particlesJS: any;

  onMount(async () => {
    // Dynamically import so SSR doesn't choke on `window`
    // particles.js attaches to window; get the global
    particlesJS = (window as any).particlesJS;

    // load config from /particles.json (served from /static)
    particlesJS.load('particles-js', '/particles.json', () => {
      console.log('particles.js config loaded');
    });
  });
</script>

<!-- full-screen background canvas target -->
<div id="particles-js" aria-hidden="true"></div>

<header class="site-header">
  <div class="brand">Mohan Kumar</div>
  <nav class="nav">
    <a href="/" data-sveltekit-preload-data="hover">About</a>
    <a href="/resume.pdf" class="cta" data-sveltekit-preload-data="hover" target="_blank" rel="noopener">
    Resume
  </a>
    <a href="/api/chat" data-sveltekit-preload-data="hover">Chat</a>
    <a href="/contact" data-sveltekit-preload-data="hover" class="cta">Contact</a>
  </nav>
</header>

<main class="page-wrap">
  <slot />
</main>
<Footer></Footer>
<!-- <footer class="site-footer">
  <span>© {new Date().getFullYear()} Mohan Kumar</span>
  <a href="https://github.com/VincentGarreau/particles.js" target="_blank" rel="noreferrer">particles.js</a>
</footer> -->
