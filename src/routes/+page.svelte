<section class="prose text-center space-y-5">
  <!-- Profile Picture -->
  <div
    style="display: flex; justify-content: center; align-items: center; margin: 1rem 0;"
  >
    <img
      src="/mohan_dp.png"
      alt="Mohan Kumar"
      style="
      width: 250px;
      height: 250px;
      border-radius: 50%;
      object-fit: cover;
      object-position: center 30%;
      display: block;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    "
    />
  </div>
  <div class="space-y-5 text-center">
    <h1 class="text-5xl font-extrabold tracking-tight font-serif">
      K S Mohan Kumar
    </h1>
    <h2 class="text-3xl font-medium font-serif">Software Engineer · Oracle</h2>
    <h3 class="text-xl mx-auto leading-loose font-serif">
      Interdisciplinary Dual Degree (B.Tech Mechanical · M.Tech Data Science),
      <span class="whitespace-nowrap">IIT Madras</span>
    </h3>
    <blockquote class="italic text-lg mx-auto text-center">
      “Code is like humor. When you have to explain it, it’s bad.”
    </blockquote>
  </div>
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
  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  .delay-200 {
    animation-delay: 0.5s;
  }
</style>
