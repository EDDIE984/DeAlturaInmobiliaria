import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return null
  return session
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const { name, email, phone, active, frio } = await request.json()
  const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : ''
  const normalizedPhone = typeof phone === 'string' ? phone.trim() : ''

  if (!name) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  }

  if (!normalizedEmail) {
    return NextResponse.json({ error: 'El correo es requerido para sincronizar el usuario vinculado' }, { status: 400 })
  }

  if (!normalizedPhone) {
    return NextResponse.json({ error: 'El teléfono es requerido para sincronizar el usuario vinculado' }, { status: 400 })
  }

  const { data: existingAgent, error: existingAgentError } = await supabaseAdmin
    .from('agents')
    .select('email')
    .eq('id', id)
    .maybeSingle()

  if (existingAgentError) {
    return NextResponse.json({ error: existingAgentError.message }, { status: 500 })
  }

  if (!existingAgent) {
    return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })
  }

  const oldEmail = existingAgent.email ? existingAgent.email.toLowerCase().trim() : ''

  const { data, error } = await supabaseAdmin
    .from('agents')
    .update({
      name,
      email: normalizedEmail,
      phone: normalizedPhone,
      active,
      frio,
    })
    .eq('id', id)
    .select('id, name, email, phone, active, frio, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const password_hash = await bcrypt.hash(normalizedPhone, 12)

  const { data: userByNewEmail, error: userByNewEmailError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (userByNewEmailError) {
    return NextResponse.json({ error: userByNewEmailError.message }, { status: 500 })
  }

  let targetUserId = userByNewEmail?.id ?? null

  if (!targetUserId && oldEmail) {
    const { data: userByOldEmail, error: userByOldEmailError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', oldEmail)
      .maybeSingle()

    if (userByOldEmailError) {
      return NextResponse.json({ error: userByOldEmailError.message }, { status: 500 })
    }

    targetUserId = userByOldEmail?.id ?? null
  }

  if (targetUserId) {
    const { error: updateUserError } = await supabaseAdmin
      .from('users')
      .update({
        email: normalizedEmail,
        name,
        role: 'user',
        is_active: data.active,
        password_hash,
      })
      .eq('id', targetUserId)

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

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params

  const { error } = await supabaseAdmin.from('agents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
