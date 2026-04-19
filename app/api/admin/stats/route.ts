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

  const { data: leads } = await supabaseAdmin
    .from('leads')
    .select('id, resultado, classification, source, created_at')
    .gte('created_at', from)
    .lte('created_at', to)

  const allLeads = leads ?? []
  const leadIds = allLeads.map((l) => l.id)

  const ventas = allLeads.filter((l) => l.resultado === 'VENTA').length
  const noVentas = allLeads.filter((l) => l.resultado === 'NO_VENTA').length
  const tasaConversion =
    ventas + noVentas > 0
      ? Math.round((ventas / (ventas + noVentas)) * 1000) / 10
      : 0

  const { data: gestiones } = leadIds.length > 0
    ? await supabaseAdmin
        .from('lead_seguimientos')
        .select('lead_id, tipo, fecha')
        .in('lead_id', leadIds)
    : { data: [] }

  const leadsConGestion = new Set((gestiones ?? []).map((g) => g.lead_id))
  const sinGestionar = leadIds.filter((id) => !leadsConGestion.has(id)).length

  const ahora = new Date().toISOString()
  const seguimientosPendientes = (gestiones ?? []).filter(
    (g) => g.tipo === 'SEGUIMIENTO' && g.fecha > ahora
  ).length

  const byDay: Record<string, number> = {}
  allLeads.forEach((l) => {
    const day = l.created_at.split('T')[0]
    byDay[day] = (byDay[day] || 0) + 1
  })
  const leads_por_dia = Object.entries(byDay)
    .map(([fecha, count]) => ({ fecha, count }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const byClasificacion: Record<string, number> = {}
  allLeads.forEach((l) => {
    const c = l.classification || 'sin clasificar'
    byClasificacion[c] = (byClasificacion[c] || 0) + 1
  })
  const leads_por_clasificacion = Object.entries(byClasificacion).map(
    ([clasificacion, count]) => ({ clasificacion, count })
  )

  const byFuente: Record<string, number> = {}
  allLeads.forEach((l) => {
    const s = l.source || 'sin fuente'
    byFuente[s] = (byFuente[s] || 0) + 1
  })
  const leads_por_fuente = Object.entries(byFuente)
    .map(([fuente, count]) => ({ fuente, count }))
    .sort((a, b) => b.count - a.count)

  const byResultado: Record<string, number> = { VENTA: 0, NO_VENTA: 0, Pendiente: 0 }
  allLeads.forEach((l) => {
    if (l.resultado === 'VENTA') byResultado.VENTA++
    else if (l.resultado === 'NO_VENTA') byResultado.NO_VENTA++
    else byResultado.Pendiente++
  })
  const leads_por_resultado = Object.entries(byResultado).map(
    ([resultado, count]) => ({ resultado, count })
  )

  return NextResponse.json({
    total_leads: allLeads.length,
    ventas,
    no_ventas: noVentas,
    tasa_conversion: tasaConversion,
    sin_gestionar: sinGestionar,
    seguimientos_pendientes: seguimientosPendientes,
    leads_por_dia,
    leads_por_clasificacion,
    leads_por_fuente,
    leads_por_resultado,
  })
}
