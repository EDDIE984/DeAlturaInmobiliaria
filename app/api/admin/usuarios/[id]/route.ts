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
  const { email, password, name, role, is_active } = await request.json()

  const { data: existingUser, error: existingUserError } = await supabaseAdmin
    .from('users')
    .select('id, email, role')
    .eq('id', id)
    .maybeSingle()

  if (existingUserError) {
    return NextResponse.json({ error: existingUserError.message }, { status: 500 })
  }

  if (!existingUser) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}
  if (email) updates.email = email.toLowerCase().trim()
  if (name !== undefined) updates.name = name
  if (role) updates.role = role
  if (is_active !== undefined) updates.is_active = is_active
  if (password) updates.password_hash = await bcrypt.hash(password, 12)

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, email, name, role, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const oldEmail = existingUser.email?.toLowerCase().trim() ?? ''
  const newEmail = data.email?.toLowerCase().trim() ?? oldEmail
  const resultingRole = (data.role ?? existingUser.role ?? 'user').toLowerCase()

  const shouldSyncAgent = resultingRole === 'user' && (oldEmail !== newEmail || name !== undefined || is_active !== undefined)

  if (shouldSyncAgent) {
    let query = supabaseAdmin
      .from('agents')
      .update({
        email: newEmail,
        name: data.name ?? null,
        active: data.is_active,
      })

    if (oldEmail && oldEmail !== newEmail) {
      query = query.or(`email.eq.${oldEmail},email.eq.${newEmail}`)
    } else {
      query = query.eq('email', newEmail)
    }

    const { error: syncAgentError } = await query
    if (syncAgentError) {
      return NextResponse.json({ error: syncAgentError.message }, { status: 500 })
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params

  if (id === session.id) {
    return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('users').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
