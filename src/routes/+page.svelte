<section class="prose text-center space-y-4">
  <!-- Profile Picture -->
  <div
    style="display: flex; justify-content: center; align-items: center; margin: 1rem 0;"
  >
    <img
      src="/mohan21.jpeg"
      alt="Mohan Kumar"
      style="
      width: 250px;
      height: 250px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    "
    />
  </div>

  <!-- Title -->
  <h1 class="text-3xl font-bold">Mohan Kumar</h1>
  <p class="text-lg text-gray-600">Software Engineer</p>

  <!-- 3-line description -->
  <p>I’m a passionate developer who loves building things.</p>
  <p>
    I experiment with <strong>LLMs</strong>, <strong>RAG pipelines</strong>, and
    AI infrastructure.
  </p>
  <p>
    Always curious about how things work — from frontend polish to backend
    scale.
  </p>

  <!-- Quote -->
  <blockquote class="italic text-gray-500 border-l-4 border-gray-400 pl-4">
    “Code is like humor. When you have to explain it, it’s bad.”
  </blockquote>
</section>
<div class="mt-10 flex justify-center">
  <button
    on:click={() => (window.location.href = "/api/chat")}
    class="button-73"
  >
    💬 Talk with my AI Agent
  </button>
</div>

<style>
  .button-73 {
    appearance: none;
    background-color: #ffffff;
    border-radius: 40em;
    border-style: none;
    box-shadow: #adcfff 0 -12px 6px inset;
    box-sizing: border-box;
    color: #000000;
    cursor: pointer;
    display: inline-block;
    font-family: -apple-system, sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    letter-spacing: -0.24px;
    margin: 0;
    outline: none;
    padding: 1rem 1.3rem;
    quotes: auto;
    text-align: center;
    text-decoration: none;
    transition: all 0.15s;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
  }

  .button-73:hover {
    background-color: #ffc229;
    box-shadow: #ff6314 0 -6px 8px inset;
    transform: scale(1.125);
  }

  .button-73:active {
    transform: scale(1.025);
  }

  @media (min-width: 768px) {
    .button-73 {
      font-size: 1.5rem;
      padding: 0.75rem 2rem;
    }
  }
</style>
