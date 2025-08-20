<script lang="ts">
  import { onMount } from 'svelte';
  let typedText = '';
  const words = ['> npm run build', '> git commit -m "Hello World"', '> ./portfolio.sh'];

  let i = 0, j = 0, current = words[0];

  onMount(() => {
    const interval = setInterval(() => {
      if (j < current.length) {
        typedText += current[j++];
      } else {
        setTimeout(() => {
          j = 0;
          typedText = '';
          i = (i + 1) % words.length;
          current = words[i];
        }, 1200);
      }
    }, 100);
    return () => clearInterval(interval);
  });
</script>

<style>
  :global(body) {
    margin: 0;
    background: black;
    color: #00ff00;
    font-family: "Fira Code", monospace;
  }

  .matrix-bg {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: repeating-linear-gradient(
      0deg,
      rgba(0,255,0,0.05) 0px,
      rgba(0,255,0,0.05) 2px,
      transparent 2px,
      transparent 4px
    );
    pointer-events: none;
  }

  .terminal {
    padding: 2rem;
  }

  .cursor {
    display: inline-block;
    width: 10px;
    background: #00ff00;
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
</style>

<div class="matrix-bg"></div>

<div class="terminal">
  <h1>{typedText}<span class="cursor"></span></h1>
  <slot />
</div>
