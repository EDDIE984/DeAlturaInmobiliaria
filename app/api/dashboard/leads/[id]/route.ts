import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function getAgentId(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('agents').select('id').eq('email', email).maybeSingle()
  return data?.id ?? null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const agentId = await getAgentId(session.email)
  if (!agentId) return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('id', id)
    .eq('assigned_agent_id', agentId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
  return NextResponse.json(data)
}
