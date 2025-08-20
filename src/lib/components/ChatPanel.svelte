<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  type Message = {
    role: "user" | "assistant";
    content: string;
  };

  const messages = writable<Message[]>([
    { role: "assistant", content: "Hello! How can I help you?" }
  ]);
  let input = "";
  let loading = false;

  async function sendMessage() {
    if (!input.trim()) return;
    messages.update(msgs => [
      ...msgs,
      { role: "user", content: input.trim() }
    ]);
    const userInput = input.trim();
    input = "";
    loading = true;

    // Call backend API (to be implemented!)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput })
      });
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      messages.update(msgs => [
        ...msgs,
        { role: "assistant", content: data.completion || 'No response.' }
      ]);
    } catch (err) {
      messages.update(msgs => [
        ...msgs,
        { role: "assistant", content: "Sorry, something went wrong with the chat API." }
      ]);
    }
    loading = false;
  }
</script>

<section class="panel chat-panel">
  <h2>Chat</h2>
  <div class="chat-history">
    {#each $messages as msg, i}
      <div class="message {msg.role}">
        <span class="role">{msg.role === "user" ? "You" : "Assistant"}:</span>
        <span class="content">{msg.content}</span>
      </div>
    {/each}
    {#if loading}
      <div class="message assistant typing">
        <span class="role">Assistant:</span>
        <span class="content">...</span>
      </div>
    {/if}
  </div>
  <form class="chat-input" on:submit|preventDefault={sendMessage}>
    <input
      type="text"
      bind:value={input}
      autocomplete="off"
      placeholder="Type a message..."
      required
      disabled={loading}
    />
    <button type="submit" disabled={loading || !input.trim()}>Send</button>
  </form>
</section>

<style>
.panel {
  padding: 2rem;
  background: var(--chat-bg, #fff4fa);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
h2 {
  margin-top: 0;
}
.chat-history {
  background: #fffefd;
  border-radius: 8px;
  padding: 1rem;
  height: 220px;
  overflow-y: auto;
  margin-bottom: 1rem;
  border: 1px solid #eee4ea;
  font-size: 0.97em;
}
.message {
  margin-bottom: 0.7em;
  display: flex;
  gap: 0.5em;
}
.message.user .role {
  color: #467fcf;
  font-weight: bold;
}
.message.assistant .role {
  color: #d953a6;
  font-weight: bold;
}
.message.typing .content {
  font-style: italic;
  color: #bbb;
}
.chat-input {
  display: flex;
  gap: 0.5em;
}
input[type="text"] {
  flex: 1;
  padding: 0.7em;
  border-radius: 6px;
  border: 1px solid #d6bcd6;
  font-size: 1em;
}
button[type="submit"] {
  padding: 0.7em 1.2em;
  border: none;
  border-radius: 6px;
  background: #d953a6;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.1s;
}
button[type="submit"]:disabled {
  background: #e9bfdd;
  cursor: wait;
}
</style>
