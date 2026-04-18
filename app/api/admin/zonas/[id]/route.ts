import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return null
  return session
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  const { data, error } = await supabaseAdmin
    .from('zones')
    .update({
      integration_id: body.integration_id ? Number(body.integration_id) : null,
      zone_id: body.zone_id || null,
      name: body.name || null,
      description: body.description || null,
      characteristics: body.characteristics ?? [],
      google_maps_url: body.google_maps_url || null,
      images: body.images ?? [],
      size_m2: body.size_m2 ? Number(body.size_m2) : null,
      price: body.price ? Number(body.price) : null,
      monthly_payment: body.monthly_payment ? Number(body.monthly_payment) : null,
      lot_id: body.lot_id || null,
    })
    .eq('id', id)
    .select('id, integration_id, zone_id, name, description, characteristics, google_maps_url, images, size_m2, price, monthly_payment, lot_id, integrations(project_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const { error } = await supabaseAdmin.from('zones').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
