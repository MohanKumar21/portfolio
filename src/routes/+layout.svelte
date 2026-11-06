<script lang="ts">
  import Footer from "$lib/components/Footer.svelte";
  import GemmBackground from "$lib/components/backgrounds/GemmBackground.svelte";
  import "../app.css";
</script>

<!-- full-screen animated background; stays behind header and content -->
<GemmBackground />

<header class="site-header">
  <a href="/" class="brand" data-sveltekit-preload-data="hover">Mohan Kumar</a>
  <nav class="nav">
    <a href="/about" data-sveltekit-preload-data="hover">About</a>
    <a href="/api/chat" data-sveltekit-preload-data="hover">Chat</a>
    <a href="/contact" data-sveltekit-preload-data="hover">Contact</a>
    <a href="/resume.pdf" class="cta" target="_blank" rel="noopener">Resume</a>
  </nav>
</header>

<main class="page-wrap">
  <slot />
</main>
<Footer></Footer>
