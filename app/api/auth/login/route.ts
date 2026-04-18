import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { createSession, setSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Correo y contraseña requeridos' }, { status: 400 })
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, password_hash, is_active')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Usuario inactivo. Contacta al administrador.' }, { status: 403 })
    }

    if (!user.password_hash) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    let passwordMatch = false

    if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
      passwordMatch = await bcrypt.compare(password, user.password_hash)
    } else {
      // plain-text password — compare directly then migrate to hash
      passwordMatch = password === user.password_hash
      if (passwordMatch) {
        const newHash = await bcrypt.hash(password, 12)
        await supabaseAdmin
          .from('users')
          .update({ password_hash: newHash })
          .eq('id', user.id)
      }
    }

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    const { data: agent } = await supabaseAdmin
      .from('agents')
      .select('phone')
      .eq('email', user.email.toLowerCase().trim())
      .maybeSingle()

    const token = await createSession({
      id: user.id,
      email: user.email,
      name: user.name ?? '',
      role: user.role ?? 'usuario',
      phone: agent?.phone ?? undefined,
    })

    const response = NextResponse.json({ role: user.role }, { status: 200 })
    const cookie = setSessionCookie(token)
    response.cookies.set(cookie)

    return response
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
