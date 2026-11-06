<script lang="ts">
  /**
   * Home-page hero. The résumé agent is the centrepiece: the ask box submits
   * to /api/chat?q=… (see README-redesign.md for the 5-line change that makes
   * the chat page pick the question up).
   */
  import "$lib/styles/hero.css";
  import { onMount } from "svelte";

  let { accent = "#f5b544" }: { accent?: string } = $props();

  const questions = [
    "What did Mohan ship for the London region?",
    "Walk me through his career so far.",
    "What RL work did he do at IIT Madras?",
    "Which parts of the 60k-user chat SaaS did he own?",
    "What does he do outside of work?",
  ];

  const chips = [
    "Career journey",
    "Technical skills",
    "RL research",
    "Proudest wins",
  ];
  const chipPrompts: Record<string, string> = {
    "Career journey": "Can you walk me through your career journey?",
    "Technical skills": "Show me your technical skills and expertise.",
    "RL research": "Tell me about your reinforcement learning research.",
    "Proudest wins": "Highlight achievements you’re most proud of.",
  };

  let q = $state("");
  let placeholder = $state("Ask my agent anything about my work…");

  function go(text: string) {
    const t = text.trim();
    if (!t) return;
    window.location.href = `/api/chat?q=${encodeURIComponent(t)}`;
  }

  onMount(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Type the example questions into the placeholder, one at a time.
    let qi = 0;
    let ci = 0;
    let deleting = false;
    let timer = 0;
    const tick = () => {
      const full = questions[qi];
      if (!deleting) {
        ci++;
        placeholder = full.slice(0, ci);
        if (ci >= full.length) {
          deleting = true;
          timer = window.setTimeout(tick, 1800);
          return;
        }
        timer = window.setTimeout(tick, 34 + Math.random() * 40);
      } else {
        ci -= 3;
        if (ci <= 0) {
          ci = 0;
          deleting = false;
          qi = (qi + 1) % questions.length;
          placeholder = "";
          timer = window.setTimeout(tick, 350);
          return;
        }
        placeholder = full.slice(0, ci);
        timer = window.setTimeout(tick, 18);
      }
    };
    timer = window.setTimeout(tick, 900);
    return () => clearTimeout(timer);
  });
</script>

<section class="hero" style="--accent: {accent}">
  <div class="hero__text">
    <p class="eyebrow">Member of Technical Staff · OCI Generative AI · Bengaluru</p>
    <h1 class="display">K&nbsp;S Mohan&nbsp;Kumar</h1>
    <p class="lede">
      I build and ship generative-AI services at Oracle: SDKs, agents, evals and
      the infrastructure under them. Before that I was at IIT Madras, training
      multi-agent RL policies to keep trains on schedule.
    </p>

    <form class="ask" onsubmit={(e) => { e.preventDefault(); go(q); }}>
      <span class="ask__icon" aria-hidden="true">✦</span>
      <input id="ask-agent" name="q" bind:value={q} {placeholder} autocomplete="off" aria-label="Ask my résumé agent" />
      <button type="submit">Ask</button>
    </form>

    <div class="chips" role="group" aria-label="Suggested questions">
      {#each chips as c}
        <button type="button" onclick={() => go(chipPrompts[c])}>{c}</button>
      {/each}
    </div>

    <dl class="facts">
      <div><dd>60,000+</dd><dt>Oracle employees on the GenAI chat SaaS we built</dt></div>
      <div><dd>London</dd><dt>OCI GenAI region brought up end to end, in Terraform</dt></div>
      <div><dd>9.17</dd><dt>CGPA · B.Tech Mechanical + M.Tech Data Science, IIT Madras</dt></div>
      <div><dd>INMO ’19</dd><dt>Top 6 in Tamil Nadu at RMO 2018</dt></div>
    </dl>
  </div>

  <figure class="hero__photo">
    <img src="/mohan_dp.png" alt="Mohan Kumar" width="880" height="1184" />
    <figcaption>Bengaluru, IN</figcaption>
  </figure>
</section>
