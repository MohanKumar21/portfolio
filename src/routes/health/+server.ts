import type { RequestHandler } from './$types';

// Point this to your FastAPI server
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export const GET: RequestHandler = async ({ fetch }) => {
  const backendResp = await fetch(`${BACKEND_URL}/health`);

  if (!backendResp.ok) {
    const text = await backendResp.text();
    return new Response(JSON.stringify({ error: text || 'backend error' }), {
      status: backendResp.status || 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const data = await backendResp.json();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
};
