<script lang="ts">
  import ChatPanel from "$lib/components/ChatPanel.svelte";
  import SuggestionQuestions from "$lib/components/SuggestionQuestions.svelte";

  const suggestions = [
    "What projects have you worked on?",
    "Tell me about your experience.",
    "Show me highlights from your resume.",
    "List your strongest skills.",
    "What are your recent achievements?",
    "How do you keep learning?",
    "Show AI skills",
    "What tech do you love?",
    "Recent certifications?",
    "Share a fun fact",
  ];

  let chatPanelRef: typeof ChatPanel | null = null;

  function handleSuggestionPick(e: CustomEvent<{ suggestion: string }>) {
    chatPanelRef?.sendSuggestion(e.detail.suggestion);
  }
</script>

<div class="api-chat-page">
  <ChatPanel bind:this={chatPanelRef} transparent={true} />
  <div class="suggestions-vertical-panel">
    <SuggestionQuestions
      {suggestions}
      disabled={false}
      on:pick={handleSuggestionPick}
    />
  </div>
</div>

<style>
  .api-chat-page {
    min-height: 93vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: none;
    z-index: 1;
    position: relative;
  }
  .suggestions-vertical-panel {
    width: 100vw;
    max-width: 100vw;
    position: fixed;
    left: 0;
    bottom: 0;
    z-index: 50;
    background: rgba(26, 22, 40, 0.92);
    box-shadow: 0 -2px 18px 0 #2105432a;
    backdrop-filter: blur(8px);
    padding: 0.4em 1em 0.4em 1em;

    display: flex;
    flex-direction: column;
    align-items: stretch;
    overflow-y: auto;
    max-height: 38vh;
    min-height: 64px;
    scrollbar-width: thin;
    scrollbar-color: #d078fe #222;
  }
  .suggestions-vertical-panel::-webkit-scrollbar {
    width: 8px;
    background: #201840;
  }
  .suggestions-vertical-panel::-webkit-scrollbar-thumb {
    background: #bb69fe;
    border-radius: 5px;
  }
</style>
