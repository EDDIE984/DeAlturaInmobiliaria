import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('agents')
    .select('id, name, email, phone, active, frio, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { name, email, phone, active, frio } = await request.json()
  const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : ''
  const normalizedPhone = typeof phone === 'string' ? phone.trim() : ''

  if (!name) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  }

  if (!normalizedEmail) {
    return NextResponse.json({ error: 'El correo es requerido para crear el usuario vinculado' }, { status: 400 })
  }

  if (!normalizedPhone) {
    return NextResponse.json({ error: 'El teléfono es requerido para crear el usuario vinculado' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('agents')
    .insert({
      name,
      email: normalizedEmail,
      phone: normalizedPhone,
      active: active ?? true,
      frio: frio ?? false,
    })
    .select('id, name, email, phone, active, frio, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const password_hash = await bcrypt.hash(normalizedPhone, 12)

  const { data: existingUser, error: findUserError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (findUserError) {
    return NextResponse.json({ error: findUserError.message }, { status: 500 })
  }

  if (existingUser) {
    const { error: updateUserError } = await supabaseAdmin
      .from('users')
      .update({
        name,
        role: 'user',
        is_active: data.active,
        password_hash,
      })
      .eq('id', existingUser.id)

    if (updateUserError) {
      return NextResponse.json({ error: updateUserError.message }, { status: 500 })
    }
  } else {
    const { error: insertUserError } = await supabaseAdmin
      .from('users')
      .insert({
        email: normalizedEmail,
        name,
        role: 'user',
        is_active: data.active,
        password_hash,
      })

    if (insertUserError) {
      return NextResponse.json({ error: insertUserError.message }, { status: 500 })
    }
  }

  return NextResponse.json(data, { status: 201 })
}
