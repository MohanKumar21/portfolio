import { SUPABASE_URL, SUPABASE_KEY } from "$env/static/private";
import { createClient } from '@supabase/supabase-js';
export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_KEY);