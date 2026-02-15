import { createBrowserClient as supabaseCreateBrowserClient } from '@supabase/ssr';

function internalCreateBrowserClient() {
  return supabaseCreateBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 🔥 Exportamos ambos nombres para no romper nada
export const createBrowserClient = internalCreateBrowserClient;
export const createClient = internalCreateBrowserClient;
