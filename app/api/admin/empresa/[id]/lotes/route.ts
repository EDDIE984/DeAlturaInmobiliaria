import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return null
  return session
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('lots')
    .select('*')
    .eq('integration_id', id)
    .order('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const { id } = await params
  const body = await request.json()
  const { data, error } = await supabaseAdmin
    .from('lots')
    .insert({ ...body, integration_id: Number(id) })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
