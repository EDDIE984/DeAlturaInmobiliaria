'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Users2, TrendingUp, Clock, ArrowRight } from 'lucide-react'

interface Lead {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  classification: string | null
  source: string | null
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

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/leads')
      .then((r) => r.json())
      .then((data) => { setLeads(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  const byClassification = leads.reduce<Record<string, number>>((acc, l) => {
    const key = l.classification ?? 'Sin clasificar'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const recent = leads.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm">Resumen de tus leads asignados</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Cargando...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total leads</CardDescription>
                <CardTitle className="text-3xl">{leads.length}</CardTitle>
              </CardHeader>
              <CardContent><Users2 className="h-4 w-4 text-muted-foreground" /></CardContent>
            </Card>

            {Object.entries(byClassification).map(([label, count]) => {
              const key = label.toLowerCase()
              const colorMap: Record<string, string> = {
                caliente: 'text-red-600',
                tibio: 'text-orange-500',
                frio: 'text-blue-600',
              }
              return (
                <Card key={label}>
                  <CardHeader className="pb-2">
                    <CardDescription>{label}</CardDescription>
                    <CardTitle className={`text-3xl ${colorMap[key] ?? ''}`}>{count}</CardTitle>
                  </CardHeader>
                  <CardContent><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Leads recientes</CardTitle>
                <CardDescription>Últimos 5 leads asignados</CardDescription>
              </div>
              <Link href="/dashboard/leads" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recent.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No tienes leads asignados aún
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Clasificación</TableHead>
                      <TableHead>Fuente</TableHead>
                      <TableHead><Clock className="h-3.5 w-3.5" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map((l) => (
                      <TableRow key={l.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <Link href={`/dashboard/leads/${l.id}`} className="hover:text-blue-600">
                            {l.name ?? '—'}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{l.phone ?? '—'}</TableCell>
                        <TableCell>{classificationBadge(l.classification)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{l.source ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(l.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
