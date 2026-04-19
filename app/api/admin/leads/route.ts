import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

interface LeadRow {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  classification: string | null
  source: string | null
  zone_interest: string | null
  resultado: string | null
  created_at: string
  assigned_agent_id: string | null
  remotejid: string | null
}

interface SeguimientoRow {
  id: string
  lead_id: string
  tipo: 'CONTACTO' | 'SEGUIMIENTO'
  fecha: string
  observaciones: string | null
  agent_id: string
  created_at: string
}

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data: leads, error: leadsError } = await supabaseAdmin
    .from('leads')
    .select('id, name, phone, email, classification, source, zone_interest, resultado, created_at, assigned_agent_id, remotejid')
    .order('created_at', { ascending: false })

  if (leadsError) return NextResponse.json({ error: leadsError.message }, { status: 500 })
  const leadRows = (leads ?? []) as LeadRow[]

  if (leadRows.length === 0) {
    return NextResponse.json([])
  }

  const leadIds = leadRows.map((lead) => lead.id)
  const assignedAgentIds = Array.from(
    new Set(leadRows.map((lead) => lead.assigned_agent_id).filter(Boolean))
  ) as string[]

  const [agentsResult, seguimientosResult] = await Promise.all([
    assignedAgentIds.length > 0
      ? supabaseAdmin
        .from('agents')
        .select('id, name')
        .in('id', assignedAgentIds)
      : Promise.resolve({ data: [], error: null }),
    supabaseAdmin
      .from('lead_seguimientos')
      .select('id, lead_id, tipo, fecha, observaciones, agent_id, created_at')
      .in('lead_id', leadIds)
      .order('fecha', { ascending: false }),
  ])

  if (agentsResult.error) return NextResponse.json({ error: agentsResult.error.message }, { status: 500 })
  if (seguimientosResult.error) return NextResponse.json({ error: seguimientosResult.error.message }, { status: 500 })

  const agentNameById = new Map<string, string>()
  for (const agent of agentsResult.data ?? []) {
    agentNameById.set(agent.id, agent.name ?? '—')
  }

  const seguimientoRows = (seguimientosResult.data ?? []) as SeguimientoRow[]
  const seguimientoCountByLead = new Map<string, number>()
  const latestSeguimientoByLead = new Map<string, SeguimientoRow>()
  const seguimientoAgentIds = new Set<string>()

  for (const seg of seguimientoRows) {
    seguimientoCountByLead.set(seg.lead_id, (seguimientoCountByLead.get(seg.lead_id) ?? 0) + 1)
    if (!latestSeguimientoByLead.has(seg.lead_id)) {
      latestSeguimientoByLead.set(seg.lead_id, seg)
    }
    if (seg.agent_id) seguimientoAgentIds.add(seg.agent_id)
  }

  if (seguimientoAgentIds.size > 0) {
    const { data: seguimientoAgents, error: seguimientoAgentsError } = await supabaseAdmin
      .from('agents')
      .select('id, name')
      .in('id', Array.from(seguimientoAgentIds))

    if (seguimientoAgentsError) {
      return NextResponse.json({ error: seguimientoAgentsError.message }, { status: 500 })
    }

    for (const agent of seguimientoAgents ?? []) {
      agentNameById.set(agent.id, agent.name ?? '—')
    }
  }

  const payload = leadRows.map((lead) => {
    const latestSeguimiento = latestSeguimientoByLead.get(lead.id)

    return {
      ...lead,
      assigned_agent_name: lead.assigned_agent_id ? (agentNameById.get(lead.assigned_agent_id) ?? '—') : null,
      seguimiento_count: seguimientoCountByLead.get(lead.id) ?? 0,
      latest_seguimiento: latestSeguimiento
        ? {
          id: latestSeguimiento.id,
          tipo: latestSeguimiento.tipo,
          fecha: latestSeguimiento.fecha,
          observaciones: latestSeguimiento.observaciones,
          agent_id: latestSeguimiento.agent_id,
          agent_name: agentNameById.get(latestSeguimiento.agent_id) ?? '—',
        }
        : null,
      has_chat: Boolean(lead.remotejid),
    }
  })

  return NextResponse.json(payload)
}