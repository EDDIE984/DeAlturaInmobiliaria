import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return null
  return session
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ loteId: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const { loteId } = await params
  const body = await request.json()
  const { data, error } = await supabaseAdmin
    .from('lots')
    .update(body)
    .eq('id', loteId)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ loteId: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const { loteId } = await params
  const { error } = await supabaseAdmin.from('lots').delete().eq('id', loteId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
