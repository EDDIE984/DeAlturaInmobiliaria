import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('lots')
    .select('id, integration_id, lot_id, zone, features, available, google_maps_url, images, integrations(project_name)')
    .order('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { integration_id, lot_id, zone, features, available, google_maps_url, images } = await request.json()

  const { data, error } = await supabaseAdmin
    .from('lots')
    .insert({
      integration_id: integration_id ? Number(integration_id) : null,
      lot_id: lot_id || null,
      zone: zone || null,
      features: features ?? [],
      available: available ?? true,
      google_maps_url: google_maps_url || null,
      images: images ?? [],
    })
    .select('id, integration_id, lot_id, zone, features, available, google_maps_url, images, integrations(project_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
