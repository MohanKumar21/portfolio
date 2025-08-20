<script lang="ts">
  import { onMount } from "svelte";

  let name = "";
  let email = "";
  let message = "";
  let busy = false;
  let success: string | null = null;
  let error: string | null = null;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    busy = true;
    success = null;
    error = null;

    try {
      // Example: POST to your FastAPI or backend endpoint
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message })
      });

      if (!res.ok) throw new Error("Failed to send");

      success = "Message sent successfully ✅";
      name = email = message = "";
    } catch (err) {
      error = "Something went wrong ❌";
      console.error(err);
    } finally {
      busy = false;
    }
  }
</script>

<form class="contact-form" on:submit|preventDefault={handleSubmit}>
  <h2>Contact Me</h2>

  <label>
    Name
    <input type="text" bind:value={name} required />
  </label>

  <label>
    Email
    <input type="email" bind:value={email} required />
  </label>

  <label>
    Message
    <textarea rows="5" bind:value={message} required></textarea>
  </label>

  <!-- Honeypot anti-spam field (hidden) -->
  <input
    type="text"
    name="hp_field"
    tabindex="-1"
    autocomplete="off"
    class="hp"
  />

  <div class="actions">
    <button class="btn" disabled={busy} type="submit">
      {busy ? "Sending…" : "Send message"}
    </button>
  </div>

  {#if success}<p class="success">{success}</p>{/if}
  {#if error}<p class="error">{error}</p>{/if}
</form>

<style>
  .contact-form {
    max-width: 500px;
    margin: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 2rem;
    background: #1a1a1a;
    border-radius: 1rem;
    box-shadow: 0 4px 10px rgba(0,0,0,.3);
  }
  h2 {
    margin-bottom: .5rem;
    text-align: center;
    color: #fff;
  }
  label {
    display: flex;
    flex-direction: column;
    font-size: 0.9rem;
    color: #ddd;
  }
  input, textarea {
    padding: 0.6rem;
    border-radius: 0.5rem;
    border: 1px solid #333;
    background: #222;
    color: #fff;
  }
  input:focus, textarea:focus {
    outline: none;
    border-color: #7aa2ff;
  }
  .actions {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
  }
  .btn {
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    background: linear-gradient(90deg, #7aa2ff, #b388ff);
    color: #0b0d12;
    cursor: pointer;
  }
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .hp {
    position: absolute;
    left: -5000px;
    opacity: 0;
    pointer-events: none;
  }
  .success { color: #4caf50; text-align: center; }
  .error { color: #f44336; text-align: center; }
</style>
