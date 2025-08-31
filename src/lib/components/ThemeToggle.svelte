<script>
import { onMount } from 'svelte';
let theme = 'dark';
onMount(() => {
const saved = localStorage.getItem('theme');
theme = saved || 'dark';
document.documentElement.classList.toggle('light', theme === 'light');
});
function toggle() {
theme = theme === 'dark' ? 'light' : 'dark';
document.documentElement.classList.toggle('light', theme === 'light');
localStorage.setItem('theme', theme);
}
</script>
<button class="btn ghost" on:click={toggle} aria-label="Toggle theme">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
<path d="M12 3a9 9 0 1 0 9 9 7.5 7.5 0 0 1-9-9Z" stroke="currentColor" stroke-width="1.6"/>
</svg>
<span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
</button>