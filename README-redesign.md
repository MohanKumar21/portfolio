# Home page redesign

Three animated backgrounds drawn from the résumé, and a new hero that puts the
résumé agent on the home page. Nothing in the live site is wired up yet; the
files below are additive and the old home page is untouched.

## Try it

```bash
npm run dev
# then open
#   http://localhost:5173/preview?bg=rails      01 Flatland rails (recommended)
#   http://localhost:5173/preview?bg=contours   02 Loss landscape
#   http://localhost:5173/preview?bg=globe      03 Region expansion
```

Hover, click and (on the globe) drag. All three honour `prefers-reduced-motion`
and pause when the tab is hidden or the canvas is off screen.

## What was added

| File | Purpose |
| --- | --- |
| `src/lib/backgrounds/shared.ts` | Canvas runtime: DPR, resize, pointer, pause, reduced motion, seedable RNG |
| `src/lib/backgrounds/rails.ts` | 01: rail network with routing agents (Flatland, multi-agent RL) |
| `src/lib/backgrounds/contours.ts` | 02: contour sheet of a morphing loss landscape with optimisers |
| `src/lib/backgrounds/globe.ts` | 03: dotted globe, Bengaluru / Chennai / uk-london-1 arcs, OCI region ids |
| `src/lib/backgrounds/index.ts` | Barrel |
| `src/lib/components/backgrounds/Background.svelte` | `<Background kind="rails" \| "contours" \| "globe" />` |
| `src/lib/components/HomeHero.svelte` | New hero: eyebrow, name, lede, ask box, chips, facts, tinted photo |
| `src/lib/styles/hero.css` | Hero styles (plain CSS so they can be reused outside Svelte) |
| `src/routes/preview/+page.svelte` | Side-by-side preview with a switcher; delete when done |

## Wiring it in

1. **Background.** In `src/routes/+layout.svelte` remove the `#particles-js`
   div and the `onMount` block, import the component and render
   `<Background kind="rails" />` where the div was. Because it sits next to the
   header (not inside `.page-wrap`) it needs no `portal` prop.
2. **Remove particles.js.** Delete the CDN `<script>` tag, the
   `#particles-js` div and the inline `particlesJS.load(...)` script from
   `src/app.html`, then `npm uninstall particles.js`. `static/particles.json`
   can go too.
3. **Fonts.** Move the Google Fonts `<link>` from `src/routes/preview/+page.svelte`
   into the `<head>` of `src/app.html` (Fraunces, IBM Plex Sans, IBM Plex Mono).
4. **Home page.** Replace the body of `src/routes/+page.svelte` with:

   ```svelte
   <script lang="ts">
     import HomeHero from "$lib/components/HomeHero.svelte";
   </script>
   <HomeHero accent="#f5b544" />
   ```

   Accents used by the previews: rails `#f5b544`, contours `#e9c46a`,
   globe `#4fd1c5`. The nav `Resume` button in `app.css` can take the same
   colour so the chrome matches the scene.
5. **Chat picks up the question.** The ask box navigates to `/api/chat?q=…`.
   In `src/routes/api/chat/+page.svelte` add:

   ```ts
   import { page } from "$app/state";
   import { onMount } from "svelte";
   onMount(() => {
     const q = page.url.searchParams.get("q");
     if (q) chatPanelRef?.sendSuggestion(q);
   });
   ```
6. Delete `src/routes/preview` and this file.

## Tuning knobs

- `rails({ cell, agents, maxAgents, colors, track, trackAlpha, speed })`
- `contours({ step, ink, accent, optimisers, interval, drift })`; pass
  `fps: 30` to `run()` on low-end devices
- `globe({ places, arcs, anchor, spin, accent })`; the region list is
  `DEFAULT_PLACES` in `globe.ts`, trim it to what you want public

`Background.svelte` currently calls each scene with defaults; add props there
if you want to expose these.
