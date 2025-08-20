<script lang="ts">
  import { onMount } from 'svelte';

  let input = '';
  let messages: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'assistant', content: 'Ask me anything about my CV!' }
  ];
  let loading = false;

  async function send() {
    if (!input.trim() || loading) return;
    const userText = input;
    input = '';
    messages = [...messages, { role: 'user', content: userText }, { role: 'assistant', content: '' }];
    loading = true;

    // OpenAI-compatible request shape
    const payload = {
      thread_id: 'portfolio',
      messages: [
        // you can include prior context if you want multi-turn (here we just send the last user msg)
        { role: 'user', content: userText }
      ],
      stream: true
    };

    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok || !resp.body) {
      loading = false;
      messages = [...messages, { role: 'assistant', content: 'Server error.' }];
      return;
    }

    // Read SSE chunks
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();

    let assistantText = '';
    const patchAssistant = () => {
      // replace last assistant message with updated text
      messages = [...messages.slice(0, -1), { role: 'assistant', content: assistantText }];
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });

      // SSE may contain multiple lines
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;

        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta;
          if (delta?.content) {
            assistantText += delta.content;
            patchAssistant();
          }
        } catch {
          // ignore malformed lines
        }
      }
    }

    loading = false;
  }
</script>

<div class="max-w-2xl mx-auto p-4 space-y-4">
  <div class="space-y-3">
    {#each messages as m, i}
      <div class="rounded-xl p-3 shadow-sm border bg-white">
        <strong>{m.role === 'user' ? 'You' : 'Assistant'}</strong>
        <div class="mt-1 whitespace-pre-wrap">{m.content}</div>
      </div>
    {/each}
    {#if loading}
      <div class="italic opacity-60">Thinking…</div>
    {/if}
  </div>

  <form on:submit|preventDefault={send} class="flex gap-2">
    <input
      class="flex-1 border rounded-lg p-2"
      bind:value={input}
      placeholder="Ask about my CV…"
    />
    <button class="px-4 py-2 rounded-lg bg-black text-white" disabled={loading || !input.trim()}>
      Send
    </button>
  </form>
</div>
