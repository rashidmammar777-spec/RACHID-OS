import { createBrowserClient as createBrowserClientBase } from '@supabase/ssr'

export function createClient() {
  return createBrowserClientBase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
