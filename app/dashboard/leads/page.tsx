'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Users2, ClipboardList, X } from 'lucide-react'

interface Lead {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  classification: string | null
  source: string | null
  zone_interest: string | null
  resultado: string | null
  created_at: string
}

const CLASSIFICATION_COLORS: Record<string, string> = {
  caliente: 'bg-red-100 text-red-700 border-red-200',
  tibio: 'bg-orange-100 text-orange-700 border-orange-200',
  frio: 'bg-blue-100 text-blue-700 border-blue-200',
}

const RESULTADO_COLORS: Record<string, string> = {
  VENTA: 'bg-green-100 text-green-700 border-green-200',
  NO_VENTA: 'bg-red-100 text-red-700 border-red-200',
}

function classificationBadge(classification: string | null) {
  const key = (classification ?? '').toLowerCase()
  const cls = CLASSIFICATION_COLORS[key] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {classification ?? '—'}
    </span>
  )
}

function resultadoBadge(resultado: string | null) {
  if (!resultado) return <span className="text-muted-foreground text-xs">—</span>
  const cls = RESULTADO_COLORS[resultado] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  const label = resultado === 'VENTA' ? 'Venta' : 'No venta'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface ModalGestionProps {
  lead: Lead
  onClose: () => void
  onSaved: () => void
}

function ModalGestion({ lead, onClose, onSaved }: ModalGestionProps) {
  const [tipo, setTipo] = useState<'CONTACTO' | 'SEGUIMIENTO'>('CONTACTO')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 16))
  const [observaciones, setObservaciones] = useState('')
  const [resultado, setResultado] = useState<'VENTA' | 'NO_VENTA' | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/dashboard/leads/${lead.id}/seguimientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          fecha: new Date(fecha).toISOString(),
          observaciones: observaciones || null,
          resultado: resultado || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al guardar')
        return
      }
      onSaved()
      onClose()
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="font-semibold text-base">Registrar gestión</h3>
            <p className="text-sm text-muted-foreground">{lead.name ?? lead.phone ?? '—'}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Tipo de gestión</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'CONTACTO' | 'SEGUIMIENTO')}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="CONTACTO">Fecha de contacto</option>
              <option value="SEGUIMIENTO">Fecha de seguimiento</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Fecha</label>
            <input
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              placeholder="Notas sobre la gestión..."
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Resultado del lead</label>
            <select
              value={resultado}
              onChange={(e) => setResultado(e.target.value as 'VENTA' | 'NO_VENTA' | '')}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Sin definir</option>
              <option value="VENTA">Venta</option>
              <option value="NO_VENTA">No venta</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [gestionandoLead, setGestionandoLead] = useState<Lead | null>(null)

  function fetchLeads() {
    fetch('/api/dashboard/leads')
      .then((r) => r.json())
      .then((data) => { setLeads(Array.isArray(data) ? data : []); setLoading(false) })
  }

  useEffect(() => { fetchLeads() }, [])

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase()
    return (
      (l.name ?? '').toLowerCase().includes(q) ||
      (l.phone ?? '').includes(q) ||
      (l.email ?? '').toLowerCase().includes(q) ||
      (l.classification ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {gestionandoLead && (
        <ModalGestion
          lead={gestionandoLead}
          onClose={() => setGestionandoLead(null)}
          onSaved={fetchLeads}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground text-sm">Tus leads asignados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-xs">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total leads</CardDescription>
            <CardTitle className="text-3xl">{leads.length}</CardTitle>
          </CardHeader>
          <CardContent><Users2 className="h-4 w-4 text-muted-foreground" /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre, teléfono, email o clasificación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Cargando leads...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Clasificación</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Zona interés</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                      {search ? 'Sin resultados' : 'No tienes leads asignados aún'}
                    </TableCell>
                  </TableRow>
                ) : filtered.map((l) => (
                  <TableRow key={l.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/leads/${l.id}`} className="hover:text-blue-600">
                        {l.name ?? '—'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{l.phone ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{l.email ?? '—'}</TableCell>
                    <TableCell>{classificationBadge(l.classification)}</TableCell>
                    <TableCell>{resultadoBadge(l.resultado)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{l.zone_interest ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{l.source ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(l.created_at)}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => setGestionandoLead(l)}
                        title="Registrar gestión"
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ClipboardList className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
