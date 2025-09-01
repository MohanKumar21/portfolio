<script lang="ts">
    export let suggestions: string[] = [];
    export let disabled: boolean = false;

    import { createEventDispatcher } from "svelte";
    import { fade } from "svelte/transition";
    const dispatch = createEventDispatcher();

    function handleClick(suggestion: string) {
        if (!disabled) dispatch("pick", { suggestion });
    }
</script>

<div class="suggestions-container" transition:fade>
    {#each suggestions as suggestion}
        <button
            type="button"
            class="suggestion-btn"
            on:click={() => handleClick(suggestion)}
            {disabled}
        >
            {suggestion}
        </button>
    {/each}
</div>

<style>
    .suggestions-container {
        display: flex;
        flex-direction: column;
        gap: 0.38rem;
        align-items: stretch;
        justify-content: flex-start;
        margin: 0.2rem 0 0 0;
        background: transparent;
        border-radius: 0;
        padding: 0.09rem 0.11rem 0.21rem 0.13rem;
        width: 100%;
        backdrop-filter: none;
        overflow-x: hidden;
        overflow-y: auto;
        min-height: 38px;
        max-width: 100vw;
    }
    .suggestion-btn {
        background: rgba(32, 32, 32, 0.16);
        color: #fff;
        font-weight: 600;
        border: none;
        border-radius: 1em;
        padding: 0.4em 1.02em;
        margin: 0;
        box-shadow: 0 1px 4px rgba(15, 20, 40, 0.1);
        cursor: pointer;
        font-size: 1em;
        transition:
            background 0.13s,
            color 0.13s,
            transform 0.13s;
        backdrop-filter: blur(0.5px);
        outline: none;
        opacity: 0.94;
        width: 100%;
        text-align: left;
        text-shadow:
            0 1px 4px #0008,
            0 0px 0 #fff9;
        letter-spacing: 0.01em;
        word-break: break-word;
        white-space: normal;
    }
    .suggestion-btn:hover:enabled {
        background: rgba(255, 255, 255, 0.25);
        color: #fff;
        opacity: 1;
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 2px 12px #513fff80;
    }
    .suggestion-btn:disabled {
        opacity: 0.38;
        cursor: not-allowed;
    }
</style>
