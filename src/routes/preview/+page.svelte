<script lang="ts">
  /**
   * Side-by-side preview of the home-page redesign. Visit /preview?bg=rails,
   * /preview?bg=contours or /preview?bg=globe. The old particles background is
   * hidden while this page is mounted; nothing else on the site changes.
   */
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import Background from "$lib/components/backgrounds/Background.svelte";
  import HomeHero from "$lib/components/HomeHero.svelte";

  type Kind = "rails" | "contours" | "globe";
  const kinds: { id: Kind; name: string; accent: string }[] = [
    { id: "rails", name: "Flatland rails", accent: "#f5b544" },
    { id: "contours", name: "Loss landscape", accent: "#e9c46a" },
    { id: "globe", name: "Region globe", accent: "#4fd1c5" },
  ];

  const current = $derived.by<Kind>(() => {
    const k = page.url.searchParams.get("bg");
    return (kinds.find((x) => x.id === k)?.id ?? "rails") as Kind;
  });
  const accent = $derived(kinds.find((k) => k.id === current)!.accent);

  function pick(k: Kind) {
    const u = new URL(page.url);
    u.searchParams.set("bg", k);
    goto(u, { replaceState: true, keepFocus: true, noScroll: true });
  }

  onMount(() => {
    document.body.classList.add("preview-mode");
    return () => document.body.classList.remove("preview-mode");
  });
</script>

<svelte:head>
  <title>Home preview · Mohan Kumar</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..700,0..100,0..1;1,9..144,300..700,0..100,0..1&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<Background kind={current} portal />
<HomeHero {accent} />

<nav class="switcher" aria-label="Background variant">
  {#each kinds as k}
    <button type="button" class:active={k.id === current} onclick={() => pick(k.id)} style="--dot: {k.accent}">
      <span class="dot"></span>{k.name}
    </button>
  {/each}
</nav>

<style>
  :global(body.preview-mode #particles-js) {
    display: none;
  }
  @media (max-width: 820px) {
    :global(body.preview-mode .hero) {
      padding-bottom: 96px; /* clear the switcher */
    }
  }
  .switcher {
    position: fixed;
    right: max(16px, env(safe-area-inset-right, 0px));
    bottom: max(16px, env(safe-area-inset-bottom, 0px));
    z-index: 5;
    display: flex;
    gap: 4px;
    padding: 4px;
    border-radius: 999px;
    background: rgba(10, 14, 22, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(8px);
  }
  .switcher button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 0;
    border-radius: 999px;
    padding: 8px 12px;
    background: transparent;
    color: #c9d4e5;
    font: 500 0.8rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    cursor: pointer;
  }
  .switcher button.active {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  .switcher .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--dot);
  }
</style>
