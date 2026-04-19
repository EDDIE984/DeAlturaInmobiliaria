import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function getAgentId(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('agents').select('id').eq('email', email).maybeSingle()
  return data?.id ?? null
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const agentId = await getAgentId(session.email)
  if (!agentId) return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })

  const { searchParams } = new URL(req.url)

  const now = new Date()
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const defaultTo = now.toISOString()

  const from = searchParams.get('from') ?? defaultFrom
  const to = searchParams.get('to') ?? defaultTo

  const { data: leads } = await supabaseAdmin
    .from('leads')
    .select('id, resultado')
    .eq('assigned_agent_id', agentId)

  const totalLeads = leads?.length ?? 0
  const ventas = leads?.filter((l) => l.resultado === 'VENTA').length ?? 0
  const noVentas = leads?.filter((l) => l.resultado === 'NO_VENTA').length ?? 0
  const tasaConversion = ventas + noVentas > 0
    ? Math.round((ventas / (ventas + noVentas)) * 1000) / 10
    : 0

  const leadIds = leads?.map((l) => l.id) ?? []

  if (leadIds.length === 0) {
    return NextResponse.json({
      total_leads: 0,
      ventas: 0,
      no_ventas: 0,
      sin_gestionar: 0,
      tasa_conversion: 0,
      contactos_periodo: 0,
      seguimientos_pendientes: 0,
    })
  }

  const { data: todasGestiones } = await supabaseAdmin
    .from('lead_seguimientos')
    .select('lead_id, tipo, fecha')
    .in('lead_id', leadIds)

  const leadsConGestion = new Set((todasGestiones ?? []).map((g) => g.lead_id))
  const sinGestionar = leadIds.filter((id) => !leadsConGestion.has(id)).length

  const contactosPeriodo = (todasGestiones ?? []).filter(
    (g) => g.tipo === 'CONTACTO' && g.fecha >= from && g.fecha <= to
  ).length

  const ahora = new Date().toISOString()
  const seguimientosPendientes = (todasGestiones ?? []).filter(
    (g) => g.tipo === 'SEGUIMIENTO' && g.fecha > ahora
  ).length

  return NextResponse.json({
    total_leads: totalLeads,
    ventas,
    no_ventas: noVentas,
    sin_gestionar: sinGestionar,
    tasa_conversion: tasaConversion,
    contactos_periodo: contactosPeriodo,
    seguimientos_pendientes: seguimientosPendientes,
  })
}
