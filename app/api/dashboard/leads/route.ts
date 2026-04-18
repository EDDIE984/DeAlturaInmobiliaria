import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function getAgentId(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('agents').select('id').eq('email', email).maybeSingle()
  return data?.id ?? null
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const agentId = await getAgentId(session.email)
  if (!agentId) return NextResponse.json([])

  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('assigned_agent_id', agentId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
