<script lang="ts">
  import AboutPanel from '$lib/components/AboutPanel.svelte';
  import BlogPanel from '$lib/components/BlogPanel.svelte';
  import ProjectsPanel from '$lib/components/ProjectsPanel.svelte';
  import ChatPanel from '$lib/components/ChatPanel.svelte';

  let activeTab = 0;
  const tabs = [
    { name: 'About', component: AboutPanel },
    { name: 'Blog', component: BlogPanel },
    { name: 'Projects', component: ProjectsPanel },
    { name: 'Chat', component: ChatPanel }
  ];
</script>

<h1 class="title">My Portfolio</h1>
<nav class="tabs">
  {#each tabs as tab, i}
    <button
      class:selected={activeTab === i}
      on:click={() => (activeTab = i)}
    >
      {tab.name}
    </button>
  {/each}
</nav>

<div class="panel-wrapper">
  <svelte:component this={tabs[activeTab].component} />
</div>

<style>
.title {
  text-align: center;
  font-size: 2.3em;
  margin-bottom: 1.7rem;
  font-weight: 700;
  letter-spacing: -1px;
}
.tabs {
  display: flex;
  justify-content: center;
  gap: 0.2em;
  margin-bottom: 2rem;
}
.tabs button {
  font: inherit;
  font-size: 1.12em;
  cursor: pointer;
  background: #f0ecff;
  border: 1px solid #babade;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  padding: 0.75em 1.75em;
  color: #6c42c2;
  margin-right: 0.3em;
  transition: background 0.15s;
  font-weight: 600;
  outline: none;
}
.tabs button.selected,
.tabs button:hover {
  background: #fff;
  color: #37098b;
  border-bottom: 2px solid #fff;
}
.panel-wrapper {
  max-width: 700px;
  margin: 0 auto;
}
</style>
