'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Users2, TrendingUp, Clock, ArrowRight, CheckCircle2, XCircle, AlertCircle, PhoneCall, CalendarClock, Percent } from 'lucide-react'

interface Lead {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  classification: string | null
  source: string | null
  created_at: string
}

interface AgentStats {
  total_leads: number
  ventas: number
  no_ventas: number
  sin_gestionar: number
  tasa_conversion: number
  contactos_periodo: number
  seguimientos_pendientes: number
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

function toDateInput(iso: string) {
  return iso.slice(0, 10)
}

function startOfMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AgentStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [from, setFrom] = useState(toDateInput(startOfMonth()))
  const [to, setTo] = useState(toDateInput(new Date().toISOString()))

  useEffect(() => {
    fetch('/api/dashboard/leads')
      .then((r) => r.json())
      .then((data) => { setLeads(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  useEffect(() => {
    setStatsLoading(true)
    const fromISO = new Date(from).toISOString()
    const toISO = new Date(to + 'T23:59:59').toISOString()
    fetch(`/api/dashboard/stats?from=${fromISO}&to=${toISO}`)
      .then((r) => r.json())
      .then((data) => { setStats(data?.error ? null : data); setStatsLoading(false) })
  }, [from, to])

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
          {/* Clasificación chatbot — se mantiene */}
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

          {/* Gestión del agente */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-semibold text-base">Gestión del agente</h3>
                <p className="text-sm text-muted-foreground">Resultados y actividad comercial</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-muted-foreground">Desde</label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-muted-foreground">Hasta</label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {statsLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Cargando estadísticas...</div>
            ) : stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Ventas</CardDescription>
                    <CardTitle className="text-3xl text-green-600">{stats.ventas}</CardTitle>
                  </CardHeader>
                  <CardContent><CheckCircle2 className="h-4 w-4 text-green-500" /></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>No ventas</CardDescription>
                    <CardTitle className="text-3xl text-red-600">{stats.no_ventas}</CardTitle>
                  </CardHeader>
                  <CardContent><XCircle className="h-4 w-4 text-red-500" /></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Sin gestionar</CardDescription>
                    <CardTitle className="text-3xl text-gray-500">{stats.sin_gestionar}</CardTitle>
                  </CardHeader>
                  <CardContent><AlertCircle className="h-4 w-4 text-muted-foreground" /></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Conversión</CardDescription>
                    <CardTitle className="text-3xl text-blue-600">{stats.tasa_conversion}%</CardTitle>
                  </CardHeader>
                  <CardContent><Percent className="h-4 w-4 text-blue-400" /></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Contactos</CardDescription>
                    <CardTitle className="text-3xl text-yellow-600">{stats.contactos_periodo}</CardTitle>
                  </CardHeader>
                  <CardContent><PhoneCall className="h-4 w-4 text-yellow-500" /></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Seguimientos pendientes</CardDescription>
                    <CardTitle className="text-3xl text-orange-600">{stats.seguimientos_pendientes}</CardTitle>
                  </CardHeader>
                  <CardContent><CalendarClock className="h-4 w-4 text-orange-400" /></CardContent>
                </Card>
              </div>
            ) : null}
          </div>

          {/* Leads recientes */}
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
