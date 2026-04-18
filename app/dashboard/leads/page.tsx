'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Search, Users2 } from 'lucide-react'

interface Lead {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  classification: string | null
  source: string | null
  zone_interest: string | null
  created_at: string
}

const CLASSIFICATION_COLORS: Record<string, string> = {
  caliente: 'bg-red-100 text-red-700 border-red-200',
  tibio: 'bg-orange-100 text-orange-700 border-orange-200',
  frio: 'bg-blue-100 text-blue-700 border-blue-200',
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/dashboard/leads')
      .then((r) => r.json())
      .then((data) => { setLeads(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

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
                  <TableHead>Zona interés</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Creado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                      {search ? 'Sin resultados' : 'No tienes leads asignados aún'}
                    </TableCell>
                  </TableRow>
                ) : filtered.map((l) => (
                  <TableRow key={l.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/leads/${l.id}`} className="hover:text-blue-600">
                        {l.name ?? '—'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{l.phone ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{l.email ?? '—'}</TableCell>
                    <TableCell>{classificationBadge(l.classification)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{l.zone_interest ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{l.source ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(l.created_at)}</TableCell>
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
