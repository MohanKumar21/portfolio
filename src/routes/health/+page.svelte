<script lang="ts">
  import { onMount } from "svelte";
  let healthData: any = null;
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      const res = await fetch("/health");
      if (!res.ok) throw new Error("Failed to fetch health status");
      healthData = await res.json();
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<h1>Health Check</h1>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <p style="color: red;">Error: {error}</p>
{:else}
  <pre>{JSON.stringify(healthData, null, 2)}</pre>
{/if}
