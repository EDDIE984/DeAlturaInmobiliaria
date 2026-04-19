import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const now = new Date()
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const defaultTo = now.toISOString()
  const from = searchParams.get('from') ?? defaultFrom
  const to = searchParams.get('to') ?? defaultTo

  const { data: agentsRaw } = await supabaseAdmin
    .from('agents')
    .select('id, name')
    .eq('active', true)
    .order('name')

  const { data: leadsRaw } = await supabaseAdmin
    .from('leads')
    .select('id, resultado, assigned_agent_id')
    .gte('created_at', from)
    .lte('created_at', to)

  const allLeads = leadsRaw ?? []
  const leadIds = allLeads.map((l) => l.id)

  const { data: gestoinesRaw } = leadIds.length > 0
    ? await supabaseAdmin
        .from('lead_seguimientos')
        .select('lead_id, tipo, fecha')
        .in('lead_id', leadIds)
    : { data: [] }

  const allGestiones = gestoinesRaw ?? []
  const ahora = new Date().toISOString()

  const agents = (agentsRaw ?? [])
    .map((agent) => {
      const agentLeads = allLeads.filter((l) => l.assigned_agent_id === agent.id)
      const agentLeadIds = new Set(agentLeads.map((l) => l.id))
      const agentGestiones = allGestiones.filter((g) => agentLeadIds.has(g.lead_id))

      const ventas = agentLeads.filter((l) => l.resultado === 'VENTA').length
      const noVentas = agentLeads.filter((l) => l.resultado === 'NO_VENTA').length
      const tasaConversion =
        ventas + noVentas > 0
          ? Math.round((ventas / (ventas + noVentas)) * 1000) / 10
          : 0

      const leadsConGestion = new Set(agentGestiones.map((g) => g.lead_id))
      const sinGestionar = agentLeads.filter((l) => !leadsConGestion.has(l.id)).length
      const seguimientosPendientes = agentGestiones.filter(
        (g) => g.tipo === 'SEGUIMIENTO' && g.fecha > ahora
      ).length

      return {
        id: agent.id,
        name: agent.name,
        total_leads: agentLeads.length,
        ventas,
        no_ventas: noVentas,
        tasa_conversion: tasaConversion,
        sin_gestionar: sinGestionar,
        seguimientos_pendientes: seguimientosPendientes,
      }
    })
    .sort((a, b) => b.ventas - a.ventas)

  return NextResponse.json({ agents })
}
