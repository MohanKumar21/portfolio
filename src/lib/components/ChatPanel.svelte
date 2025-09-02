<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import SuggestionQuestions from "./SuggestionQuestions.svelte";
  import { fade } from "svelte/transition";
  import { marked } from "marked";

  export let suggestions: string[] = [];
  export let transparent: boolean = true;

  const dispatch = createEventDispatcher();

  let input = "";
  let showSuggestions = suggestions.length > 0;
  let loading = false;
  let messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "assistant", content: "Hi! Ask me something about my CV." },
  ];

  async function send(userInput?: string) {
    if (loading) return;
    const text = typeof userInput === "string" ? userInput : input.trim();
    if (!text) return;
    input = "";
    messages = [
      ...messages,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ];
    loading = true;

    // Hide suggestions after sending (fade handled in DOM)
    // showSuggestions = false;

    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: "portfolio",
        stream: true,
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!resp.ok || !resp.body) {
      loading = false;
      messages = [
        ...messages.slice(0, -1),
        { role: "assistant", content: "Error from server" },
      ];
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = "";
    const patchAssistant = () => {
      messages = [
        ...messages.slice(0, -1),
        { role: "assistant", content: assistantText },
      ];
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });

      for (const line of chunk.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") continue;

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

  // Allow parent to trigger a suggestion (imperatively)
  export function sendSuggestion(suggestion: string) {
    send(suggestion);
  }

  function handleSuggestionPick(e: CustomEvent<{ suggestion: string }>) {
    send(e.detail.suggestion);
  }

  // For accessibility, focus input on mount
  let inputRef: HTMLInputElement | null = null;
  onMount(() => {
    inputRef?.focus();
  });
</script>

<div class="chat-root {transparent ? 'transparent' : ''}">
  <div class="chat-history">
    {#each messages as m, i}
      {#if i < messages.length - 1}
        <div class="bubble {m.role}">
          {#if m.content !== ""}
            <span class="msg-content">{@html marked(m.content)}</span>
          {/if}
        </div>
      {/if}
    {/each}

    {#if loading}
      <div class="bubble assistant typing">
        <span class="msg-content typing-indicator">
          <span></span><span></span><span></span>
        </span>
      </div>
    {:else if messages.length > 0}
      <div class="bubble {messages[messages.length - 1].role}">
        {#if messages[messages.length - 1].content !== ""}
          <span class="msg-content">
            {@html marked(messages[messages.length - 1].content)}
          </span>
        {/if}
      </div>
    {/if}
  </div>
  <form class="chat-inputbar" on:submit|preventDefault={() => send()}>
    <input
      bind:this={inputRef}
      class="input"
      bind:value={input}
      autocomplete="off"
      placeholder="Ask about my CV…"
      disabled={loading}
    />
    <button type="submit" class="send-btn" disabled={loading || !input.trim()}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 10L16 4L12 16L10 12L4 10Z" fill="currentColor" />
      </svg>
      <span class="sr-only">Send</span>
    </button>
  </form>
  {#if showSuggestions && suggestions.length}
    <div style="margin-top: 0.3em;" transition:fade>
      <SuggestionQuestions
        {suggestions}
        disabled={loading}
        on:pick={handleSuggestionPick}
      />
    </div>
  {/if}
</div>

<style>
  .bubble {
    border-radius: 12px;
    padding: 0.7em 1.17em;
    background: rgba(255, 255, 255, 0.08);
    display: flex;
    gap: 0.6em;
    align-items: flex-start;
    color: #fff;
    font-size: 1.06em;
    border: 1.7px solid rgba(255, 255, 255, 0.15);
    font-weight: bold;
  }

  .bubble.user {
    align-self: flex-end; /* push user messages to the right */
    background: rgba(0, 200, 255, 0.18);
    border: 2px solid rgba(0, 255, 255, 0.4);
    filter: drop-shadow(0 2px 6px rgba(0, 255, 255, 0.6));
    text-align: right; /* align text inside to right */
  }

  .bubble.assistant {
    align-self: flex-start; /* assistant stays left */
    background: rgba(255, 0, 180, 0.18);
    border: 2px solid rgba(255, 0, 200, 0.4);
    filter: drop-shadow(0 2px 7px rgba(255, 0, 200, 0.6));
    text-align: left; /* keep assistant text left */
  }

  .bubble.typing .msg-content {
    color: #bbb;
    font-style: italic;
  }

  .role {
    font-weight: bold;
    margin-right: 0.17em;
    color: #fff;
  }

  .msg-content {
    white-space: pre-wrap;
    word-break: break-word;
    flex: 1 1 auto;
    color: #fff;
    font-weight: bold;
  }

  .chat-inputbar {
    display: flex;
    gap: 0.6em;
    margin-top: 0.7em;
    align-items: stretch;
  }

  .input {
    flex: 1 1 auto;
    border-radius: 7px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    font-size: 1.08em;
    padding: 0.7em 1.1em;
    outline: none;
    font-weight: bold;
  }
  .input:focus {
    border: 1.3px solid #7ed0fc;
    background: rgba(255, 255, 255, 0.18);
  }

  .send-btn {
    border: none;
    border-radius: 6px;
    background: linear-gradient(110deg, #c682fc 40%, #7ed0fc 100%);
    color: #fff;
    font-size: 1.04em;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0 0.95em;
  }
  .send-btn:disabled {
    background: #444;
    color: #aaa;
    cursor: not-allowed;
  }

  .sr-only {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(1px, 1px, 1px, 1px);
  }
  .chat-root {
    width: 80vw;
    height: 90vh;
    max-width: 100vw;
    max-height: 100vh;
    margin: 0;
    padding: 1rem;
    border-radius: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    color: #fff;
    font-weight: bold;
    /* background: #0a0a0a;  */
  }

  /* Chat history fills available space */
  .chat-history {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    overflow-y: auto;
    margin-bottom: 0.7rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.45);
    border-radius: 16px;
    box-shadow: 0 1.5px 7px rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  /* Typing dots animation */
  .typing-indicator {
    display: inline-flex;
    gap: 0.3em;
    align-items: center;
  }

  .typing-indicator span {
    width: 0.5em;
    height: 0.5em;
    background: #fff;
    border-radius: 50%;
    display: inline-block;
    animation: blink 1.4s infinite both;
  }

  .typing-indicator span:nth-child(1) {
    animation-delay: 0s;
  }
  .typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
  }
  .typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes blink {
    0%,
    80%,
    100% {
      transform: scale(0.6);
      opacity: 0.4;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
