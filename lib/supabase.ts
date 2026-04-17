import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente para el servidor (service role — acceso total)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Cliente para el navegador (anon key)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
