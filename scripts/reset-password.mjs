import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Leer .env manualmente
const env = readFileSync('.env', 'utf8')
const get = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim()

const supabase = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const EMAIL = 'admin@alcampo.com'
const NEW_PASSWORD = 'Admin2025'   // ← cambia esta contraseña

const hash = await bcrypt.hash(NEW_PASSWORD, 12)

const { error } = await supabase
  .from('users')
  .update({ password_hash: hash })
  .eq('email', EMAIL)

if (error) {
  console.error('Error:', error.message)
} else {
  console.log(`✓ Contraseña actualizada para ${EMAIL}`)
  console.log(`  Nueva contraseña: ${NEW_PASSWORD}`)
}
