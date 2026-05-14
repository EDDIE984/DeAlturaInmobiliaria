import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return null
  return session
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params

  const { data: seguimientos, error } = await supabaseAdmin
    .from('lead_seguimientos')
    .select('id, tipo, fecha, observaciones, agent_id, created_at')
    .eq('lead_id', id)
    .order('fecha', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = seguimientos ?? []
  if (rows.length === 0) return NextResponse.json([])

  const agentIds = Array.from(new Set(rows.map((r) => r.agent_id).filter(Boolean))) as string[]
  const { data: agents } = await supabaseAdmin
    .from('agents')
    .select('id, name')
    .in('id', agentIds)

  const agentNameById = new Map<string, string>()
  for (const agent of agents ?? []) {
    agentNameById.set(agent.id, agent.name ?? '—')
  }

  const payload = rows.map((seg) => ({
    ...seg,
    agent_name: agentNameById.get(seg.agent_id) ?? '—',
  }))

  return NextResponse.json(payload)
}
