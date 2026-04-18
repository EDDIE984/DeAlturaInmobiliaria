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
  if (!agentId) return NextResponse.json([])

  // verify lead belongs to this agent
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('id, remotejid')
    .eq('id', id)
    .eq('assigned_agent_id', agentId)
    .single()

  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
  if (!lead.remotejid) return NextResponse.json([])

  // conversations linked via leads.remotejid = conversations.phone
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('phone', lead.remotejid)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
