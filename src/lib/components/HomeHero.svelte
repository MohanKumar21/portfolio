<script lang="ts">
  /**
   * Home hero. Text only. The lede "generates" itself the way a speculative
   * decoder does: a draft proposes four words, the verifier accepts them or
   * strikes one and corrects it. The ask box sends the question to /api/chat.
   */
  import "$lib/styles/hero.css";
  import { onMount } from "svelte";

  const SENTENCE =
    "I build the services under OCI Generative AI: SDKs, agents, evals and the infrastructure that serves the models. Next, the layer beneath: inference engines and the kernels they run on.";
  const WRONG = ["the", "a", "and", "systems", "that", "which", "with", "for", "models", "code", "to", "our"];
  const words = SENTENCE.split(" ");

  const chips: { label: string; prompt: string }[] = [
    { label: "Serving work", prompt: "What has Mohan built and operated for LLM serving at Oracle?" },
    { label: "RL research", prompt: "Tell me about your reinforcement learning research." },
    { label: "Career journey", prompt: "Can you walk me through your career journey?" },
    { label: "Proudest wins", prompt: "Highlight achievements you’re most proud of." },
  ];

  type Tok = { text: string; cls: "draft" | "ok" | "rej"; shown: boolean };
  let toks = $state<Tok[]>(words.map((w) => ({ text: w, cls: "draft", shown: false })));
  let meta = $state("speculative decoding · warming up");
  let q = $state("");

  function go(text: string) {
    const t = text.trim();
    if (!t) return;
    window.location.href = `/api/chat?q=${encodeURIComponent(t)}`;
  }

  onMount(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      toks = words.map((w) => ({ text: w, cls: "ok", shown: true }));
      meta = "speculative decoding · shown complete";
      return;
    }
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    let pos = 0, accepted = 0, proposed = 0, rejected = 0;

    const reset = () => {
      pos = accepted = proposed = rejected = 0;
      toks = words.map((w) => ({ text: w, cls: "draft", shown: false }));
    };
    const round = () => {
      if (pos >= words.length) {
        meta = `speculative decoding · ${accepted}/${proposed} draft tokens accepted · ${rejected} rejected`;
        later(() => { reset(); round(); }, 30000);
        return;
      }
      const k = Math.min(4, words.length - pos);
      const rejectAt = Math.random() < 0.35 ? Math.floor(Math.random() * k) : -1;
      const base = pos;
      for (let i = 0; i < k; i++) {
        later(() => {
          const t = toks[base + i];
          t.shown = true;
          t.cls = "draft";
          if (i === rejectAt) t.text = WRONG[Math.floor(Math.random() * WRONG.length)];
        }, 55 * i);
      }
      later(() => {
        const acc = rejectAt < 0 ? k : rejectAt;
        proposed += k;
        accepted += acc;
        for (let i = 0; i < acc; i++) toks[base + i].cls = "ok";
        if (rejectAt >= 0) {
          rejected++;
          const ri = base + rejectAt;
          toks[ri].cls = "rej";
          for (let j = rejectAt + 1; j < k; j++) toks[base + j].shown = false;
          later(() => { toks[ri].text = words[ri]; toks[ri].cls = "ok"; }, 260);
          pos = base + acc + 1;
        } else pos = base + k;
        meta = `speculative decoding · ${accepted}/${proposed} draft tokens accepted · ${rejected} rejected`;
        later(round, rejectAt >= 0 ? 420 : 160);
      }, 55 * k + 120);
    };
    later(round, 700);
    return () => timers.forEach(clearTimeout);
  });
</script>

<section class="hero">
  <div class="hero__text">
    <p class="eyebrow">Software Engineer · OCI Generative AI · Bengaluru</p>
    <h1 class="display">K&nbsp;S Mohan&nbsp;Kumar</h1>
    <p class="lede" aria-label={SENTENCE}>
      {#each toks as t}{#if t.shown}<span class="tok {t.cls}">{t.text + " "}</span>{/if}{/each}
    </p>
    <p class="gen-meta" aria-hidden="true">{meta}</p>

    <form class="ask" onsubmit={(e) => { e.preventDefault(); go(q); }}>
      <span class="ask__icon" aria-hidden="true">✦</span>
      <label for="ask-agent" class="sr-only">Ask my résumé agent</label>
      <input id="ask-agent" name="q" bind:value={q} placeholder="Ask my agent anything about my work…" autocomplete="off" />
      <button type="submit">Ask</button>
    </form>

    <div class="chips" role="group" aria-label="Suggested questions">
      {#each chips as c}
        <button type="button" onclick={() => go(c.prompt)}>{c.label}</button>
      {/each}
    </div>

    <dl class="facts">
      <div><dd>London</dd><dt>LLM serving brought up end to end: node pools to model endpoints</dt></div>
      <div><dd>60,000+</dd><dt>users on the GenAI service whose load tests and canaries I own</dt></div>
      <div><dd>48→61%</dd><dt>control-plane test coverage</dt></div>
      <div><dd>9.17</dd><dt>CGPA · Mechanical + Data Science, IIT Madras</dt></div>
    </dl>
  </div>
</section>
