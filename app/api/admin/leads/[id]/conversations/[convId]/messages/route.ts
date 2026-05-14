import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return null
  return session
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; convId: string }> }
) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params

  const { data: lead, error: leadError } = await supabaseAdmin
    .from('leads')
    .select('id, remotejid')
    .eq('id', id)
    .maybeSingle()

  if (leadError) return NextResponse.json({ error: leadError.message }, { status: 500 })
  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
  if (!lead.remotejid) return NextResponse.json([])

  const { data, error } = await supabaseAdmin
    .from('conversations_detail')
    .select('id, humano, chatbot, created_at')
    .eq('remotejid', lead.remotejid)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
