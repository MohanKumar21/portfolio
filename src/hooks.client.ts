// import type { RequestHandler } from './$types';
// let interval: ReturnType<typeof setInterval> | null = null;


// export const handle = async ({ event, resolve }) => {
//     const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';
//     interval = setInterval(async () =>{
//         try{
//             const resp= await fetch(`${BACKEND_URL}/health`);
//             if (!resp.ok) {
//             console.error("Backend health check failed:", await resp.text());
//             } else {
//             const json = await resp.json();
//             console.log("Backend healthy:", json);
//             }
//         } catch (err) {
//             console.error("Error pinging backend:", err);
//         }
//         }, 30000);
//     return resolve(event);
// } 