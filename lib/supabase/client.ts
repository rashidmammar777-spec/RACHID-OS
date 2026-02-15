import { createBrowserClient } from '@supabase/ssr';

export function createBrowserClientWrapper() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 🔥 Exportamos también con el nombre antiguo para no romper frontend
export const createBrowserClient = createBrowserClientWrapper;
