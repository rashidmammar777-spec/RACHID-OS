import { createClient } from '@supabase/supabase-js'

// ¡OJO! Esta llave es secreta y debe estar en las variables de entorno de Vercel.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export const createServiceClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey)
}

