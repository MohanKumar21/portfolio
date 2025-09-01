<script lang="ts">
  import { global_links } from "$lib/stores/global.js";
  import { onMount } from "svelte";

  let name = "";
  let email = "";
  let message = "";
  let reason = "General"; // default reason
  let other_reason = "";
  let busy = false;
  let success: string | null = null;
  let error: string | null = null;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    busy = true;
    success = null;
    error = null;

    const final_reason = reason === "Other" ? other_reason : reason;

    try {
      const res = await fetch("contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message,
          reason: final_reason,
        }),
      });

      const data = await res.json();

      if (!data.success) throw new Error("DB insert failed");

      success = "Message saved successfully ✅";
      name = email = message = reason = other_reason = "";
      reason = "General"; // reset dropdown
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
    Reason
    <select bind:value={reason} required>
      <option value="General">General</option>
      <option value="Collaboration">Collaboration</option>
      <option value="Job Opportunity">Job Opportunity</option>
      <option value="Other">Other</option>
    </select>
  </label>

  {#if reason === "Other"}
    <label>
      Please specify
      <input type="text" bind:value={other_reason} required />
    </label>
  {/if}

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

<!-- Contact Links -->
<div class="contact-links">
  <a href={$global_links.linkedin} target="_blank">LinkedIn</a>
  <a href={$global_links.github} target="_blank">GitHub</a>
  <a href={"mailto:" + $global_links.email}>Email</a>
</div>

<style>
  .contact-form {
    max-width: 800px;
    margin: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 2rem;
    background: #1a1a1a;
    border-radius: 1rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  }
  h2 {
    margin-bottom: 0.5rem;
    text-align: center;
    color: #fff;
  }
  label {
    display: flex;
    flex-direction: column;
    font-size: 0.9rem;
    color: #ddd;
  }
  input,
  textarea,
  select {
    padding: 0.6rem;
    border-radius: 0.5rem;
    border: 1px solid #333;
    background: #222;
    color: #fff;
  }
  input:focus,
  textarea:focus,
  select:focus {
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
  .success {
    color: #4caf50;
    text-align: center;
  }
  .error {
    color: #f44336;
    text-align: center;
  }

  .contact-links {
    margin-top: 2rem;
    text-align: center;
    display: flex;
    justify-content: center;
    gap: 1.5rem;
  }
  .contact-links a {
    color: #7aa2ff;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
  }
  .contact-links a:hover {
    color: #b388ff;
  }
</style>
