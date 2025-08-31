// src/routes/api/chat/+server.ts
import type { RequestHandler } from './$types';

// Point this to your FastAPI server
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export const POST: RequestHandler = async ({ request, fetch }) => {
  const body = await request.json();

  const backendResp = await fetch(`${BACKEND_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Ask backend to stream OpenAI-style chunks
    body: JSON.stringify({ ...body, stream: true })
  });

  if (!backendResp.ok || !backendResp.body) {
    const text = await backendResp.text();
    return new Response(JSON.stringify({ error: text || 'backend error' }), {
      status: backendResp.status || 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Re-emit the exact streamed bytes so the browser gets SSE
  const readable = new ReadableStream({
    start(controller) {
      const reader = backendResp.body!.getReader();
      const pump = (): any =>
        reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }
          controller.enqueue(value);
          return pump();
        });
      return pump();
    }
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
};
