import { createBrowserClient as createClient } from '@supabase/ssr';

let cachedClient: ReturnType<typeof createClient> | null = null;

export function createBrowserClient() {
  if (typeof window === 'undefined') {
    return null as any;
  }

  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return null as any;
  }

  cachedClient = createClient(supabaseUrl, supabaseKey);
  return cachedClient;
}
