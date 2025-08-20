<script lang="ts">
  let input = '';
  let messages: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'assistant', content: 'Hi! Ask me something about my CV.' }
  ];
  let loading = false;

  async function send() {
    if (!input.trim() || loading) return;

    const userText = input;
    input = '';
    messages = [...messages, { role: 'user', content: userText }, { role: 'assistant', content: '' }];
    loading = true;

    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thread_id: 'portfolio',
        stream: true,
        messages: [{ role: 'user', content: userText }]
      })
    });

    if (!resp.ok || !resp.body) {
      loading = false;
      messages = [...messages, { role: 'assistant', content: 'Error from server' }];
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = '';
    const patchAssistant = () => {
      messages = [...messages.slice(0, -1), { role: 'assistant', content: assistantText }];
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });

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
        } catch {}
      }
    }

    loading = false;
  }
</script>

<div class="max-w-2xl mx-auto p-4 space-y-4">
  <div class="space-y-2">
    {#each messages as m}
      <div class="p-3 rounded-lg shadow-sm border {m.role === 'user' ? 'bg-blue-50' : 'bg-gray-50'}">
        <strong>{m.role === 'user' ? 'You' : 'Assistant'}:</strong>
        <div class="mt-1 whitespace-pre-wrap">{m.content}</div>
      </div>
    {/each}
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
