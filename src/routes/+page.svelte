<section class="prose text-center space-y-4">
  <!-- Profile Picture -->
  <div>
    <img
      src="/mohan.jpeg"
      alt="Mohan Kumar"
      style="width: 250px; height: 150px; border-radius: 80%; display: block; margin: 0 auto; box-shadow: 0 4px 8px rgba(0,0,0,0.2);"
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

  <div class="mt-6">
    <button
      onclick={(window.location.href = "/api/chat")}
      class="px-100 py-3 bg-blue-600 text-white text-lg font-medium rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition transform hover:-translate-y-0.5"
    >
      💬 Talk with my AI Agent
    </button>
  </div>
</section>
