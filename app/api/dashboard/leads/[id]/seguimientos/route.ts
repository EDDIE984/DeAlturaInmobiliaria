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

  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('id', id)
    .eq('assigned_agent_id', agentId)
    .maybeSingle()

  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('lead_seguimientos')
    .select('*')
    .eq('lead_id', id)
    .order('fecha', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const agentId = await getAgentId(session.email)
  if (!agentId) return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })

  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('id', id)
    .eq('assigned_agent_id', agentId)
    .maybeSingle()

  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

  const body = await req.json()
  const { tipo, fecha, observaciones, resultado } = body

  if (!tipo || !fecha) {
    return NextResponse.json({ error: 'tipo y fecha son requeridos' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('lead_seguimientos')
    .insert({ lead_id: id, tipo, fecha, observaciones: observaciones ?? null, agent_id: agentId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (resultado === 'VENTA' || resultado === 'NO_VENTA') {
    await supabaseAdmin.from('leads').update({ resultado }).eq('id', id)
  }

  return NextResponse.json(data, { status: 201 })
}
