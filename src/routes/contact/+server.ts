import { supabaseServer } from "$lib/supabaseServer.js";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { name, email, message, reason } = await request.json();

        const { error } = await supabaseServer.from("contacts").insert([
            {
                name,
                email,
                message,
                reason,
                created_at: new Date(),
            },
        ]);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ success: false }), { status: 500 });
    }
};