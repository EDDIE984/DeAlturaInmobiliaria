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

    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    const token = await createSession({
      id: user.id,
      email: user.email,
      name: user.name ?? '',
      role: user.role ?? 'user',
    })

    const response = NextResponse.json({ role: user.role }, { status: 200 })
    const cookie = setSessionCookie(token)
    response.cookies.set(cookie)

    return response
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
